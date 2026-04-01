// network.ts
import { Client, type Room, getStateCallbacks } from "@colyseus/sdk";
import { wsEndpoint } from "../serverConfig";
import { RoomState } from "@color-wars/shared";
import type { ClientMessages, ServerMessages, ClientActionType, ServerActionType, PlayerJoinPayload, QueuedAction, RoomPhase, PlayerState, TurnPhase, MapID } from "@color-wars/shared";
import { DEFAULT_ROOM_TYPE } from "@color-wars/shared";
import { GameEventBus } from "./GameEventBus";
import { ActionQueue } from "@/actions/core";
import { ActionFactory } from "@/actions/ActionFactory";
import { type ActionData, isActionType, TURN_ACTION_REGISTRY } from "@color-wars/shared";
import { validateOrThrow } from "@color-wars/shared";
import { type ActionContext } from "@color-wars/shared";
// network.types.ts
export type NetworkState = "disconnected" | "connecting" | "connected" | "reconnecting" | "degraded" | "desynced" | "closing" | "zombie";

class Network {
  private state: NetworkState = "disconnected";
  private client = new Client(wsEndpoint);
  private room: Room<RoomState> | null = null;
  private stateChangeCallbacks: (() => void)[] = [];

  public actionQueue: ActionQueue = new ActionQueue();
  private lastPlayedActionID: number = -1;

  async quickMatch(options: PlayerJoinPayload) {
    if (this.room) return this.room;
    if (this.state == "reconnecting" || this.state == "connecting") throw new Error("already connecting");
    this.setState("connecting");
    const room = await this.client.create<RoomState>(DEFAULT_ROOM_TYPE, options);
    return this.registerRoom(room);
  }

  async joinRoom(roomId: string, options: PlayerJoinPayload) {
    if (this.room) return this.room;
    if (this.state == "reconnecting" || this.state == "connecting") throw new Error("already connecting");
    this.setState("connecting");
    try {
      const room = await this.client.joinById<RoomState>(roomId, options);
      return this.registerRoom(room);
    } catch (error) {
      this.setState("disconnected");
      console.error(error);
      throw new Error("failed to connect");
    }
  }

  async reconnect(reconnectionToken: string) {
    if (this.room) return this.room;
    if (this.state == "reconnecting" || this.state == "connecting") throw new Error("already connecting");
    this.setState("reconnecting");
    try {
      const room = await this.client.reconnect(reconnectionToken);
      return this.registerRoom(room);
    } catch (error) {
      this.setState("disconnected");
      console.error(error);
      throw new Error("failed to connect");
    }
  }

  private registerRoom(room: Room<RoomState>) {
    if (this.room) this.room.removeAllListeners();
    this.room = room;
    this.attachRoomListeners();

    return this.room;
  }

  private attachRoomListeners() {
    console.log("Attaching room listeners");
    if (!this.room) throw new Error("Not connected");

    // this.onMessage("PING", ({ serverT1 }) => {
    //   this.send("PONG", { serverT1, clientT2: Date.now() });
    // });

    this.onMessage("RELAY_MESSAGE", (message) => {
      GameEventBus.emit("RELAY_MESSAGE", message);
    });

    this.onMessage("ACCELERATE_DICE", ({}) => {
      GameEventBus.emit("ACCELERATE_DICE", {});
    });

    this.onMessage("RAGDOLL_DICE", ({}) => {
      GameEventBus.emit("RAGDOLL_DICE", {});
    });

    this.onMessage("action", (queuedAction) => {
      this.handleQueuedAction(queuedAction);
    });

    this.room.onStateChange.once((state) => {
      if (!this.room?.roomId) return;
      this.setState("connected");
      GameEventBus.emit("FULL_SEND", state);
      const sessionId = this.room.sessionId;
      const currentPlayer = state.game.players.get(sessionId);
      if (currentPlayer) {
        GameEventBus.emit("UPDATE_CURRENT_PLAYER", { player: currentPlayer });
      }

      //state change listeners
      if (!this.room) return;
      const $ = getStateCallbacks(this.room);

      this.stateChangeCallbacks.push(
        $(this.room.state.game).players.onAdd((player: any, playerId: string) => {
          GameEventBus.emit("UPDATE_PLAYER", { id: playerId, player });
          this.stateChangeCallbacks.push(
            $(player).listen("hasRolled", (hasRolledDice: boolean) => {
              GameEventBus.emit("UPDATE_PLAYER_ROLLED_DICE", { id: playerId, hasRolledDice });
            }),
            $(player).listen("hasBoughtTerritoryThisRound", (hasBoughtTerritoryThisRound: boolean) => {
              GameEventBus.emit("UPDATE_PLAYER_HAS_BOUGHT_TERRITORY_THIS_ROUND", { id: playerId, hasBoughtTerritoryThisRound });
            }),
            $(player).listen("hasSabotagedThisRound", (hasSabotagedThisRound: boolean) => {
              GameEventBus.emit("UPDATE_PLAYER_HAS_SABOTAGED_THIS_ROUND", { id: playerId, hasSabotagedThisRound });
            }),
          );
        }),
        $(this.room.state.game).players.onRemove((_:any, playerId: string) => {
          GameEventBus.emit("REMOVE_PLAYER", { id: playerId });
        }),
        $(this.room.state.game).activeTrades.onAdd((trade: any, tradeId: string) => {
          GameEventBus.emit("ADD_TRADE", { id: tradeId, trade: trade.toJSON() });
          this.stateChangeCallbacks.push(
            $(trade).onChange(() => {
              GameEventBus.emit("UPDATE_TRADE", { id: tradeId, trade: trade.toJSON() });
            })
          );
        }),
        $(this.room.state.game).activeTrades.onRemove((_: any, tradeId: string) => {
          GameEventBus.emit("REMOVE_TRADE", { id: tradeId });
        }),
        // $(this.room.state).playersPings.onChange((ping, playerId) => {
        //   // GameEventBus.emit("UPDATE_PLAYER_PING", { id: playerId, ping });
        // }),
        $(this.room.state.room).listen("phase", (newPhase: RoomPhase) => {
          GameEventBus.emit("UPDATE_ROOM_PHASE", { phase: newPhase });
          this.room!.state.game.players.forEach((player: PlayerState) => {
            GameEventBus.emit("UPDATE_PLAYER", { id: player.id, player });
          });
        }),
        // $(this.room.state).turnActionHistory.onAdd((action) => {
        //   this.handleActionHistory(action);
        // }),
        $(this.room.state.room).listen("leaderId", (newValue: string) => {
          GameEventBus.emit("UPDATE_ROOM_LEADER", { id: newValue });
        }),
        $(this.room.state.game).listen('turnPhase', (newValue: TurnPhase) => {
          GameEventBus.emit('UPDATE_TURN_PHASE', {turnPhase: newValue})
        }),
        $(this.room.state).listen('mapID', (newValue: MapID) => {
          GameEventBus.emit("CHANGE_MAP_ID", {mapID: newValue})
        })
      );
    });
    this.room.onError((code, message) => {
      console.log("[network] error ", { code, message });
    });
    this.room.onLeave((code, message) => {
      console.log("[network] leave", { code, message });

      this.leave();
      if (code == 1006) {
        //GameEventBus.emit("REQUEST_RECONNECT", undefined);
      } else {
        GameEventBus.emit("KICKED", { reason: message });
      }
    });
  }

  send<K extends ClientActionType>(type: K, payload: ClientMessages[K]) {
    if (!this.room) {
      throw new Error("Network not connected: send() unavailable");
    }
    const senderId = this.room.sessionId;
    const ctx = { senderId, ...payload } as ActionContext<K>;
    const state = this.room.state.toJSON();
    try{
      validateOrThrow(type, state, ctx);
    }catch(err: any){
      GameEventBus.emit("TOAST", {content: err.message, type: "error"})
      return;
    }
    
    this.room.send(type, payload);
  }

  onMessage<K extends ServerActionType>(type: K, handler: (payload: ServerMessages[K]) => void) {
    if (!this.room) {
      throw new Error("Network not connected: handle() unavailable");
    }
    const off = this.room.onMessage(type, handler);
    return off; // Return the cleanup function
  }

  private removeAllStateChangeCallbacks() {
    this.stateChangeCallbacks.forEach((fn) => fn());
    this.stateChangeCallbacks = [];
  }
  async leave(reason: "auto" | "manual" | "kicked" | "disconnect" = "auto") {
    if (!this.room) return;
    this.setState("closing");
    const room = this.room;

    console.log("[network] leaving room:", room.roomId, "reason:", reason);

    try {
      // 1. Stop all incoming events immediately
      room.removeAllListeners();
      this.removeAllStateChangeCallbacks();

      // 2. Inform server (if still connected)
      if (room.connection.isOpen) {
        await room.leave();
      }
    } catch (err) {
      console.warn("[network] leave failed:", err);
    }

    // 3. Hard reset local networking
    this.room = null;
    this.lastPlayedActionID = -1;
    this.actionQueue.clear("kill");
    this.setState("disconnected");
    GameEventBus.emit("RESET_STATE", {});

    console.log("[network] leave cleanup complete");
  }
  private setState(state: NetworkState) {
    if (this.state === state) return;
    this.state = state;
    GameEventBus.emit("UPDATE_NETWORK_STATE", { state });
  }


  private handleQueuedAction(queuedAction: QueuedAction) {
    // Skip if we've already processed this action (based on sequence number)
    if (this.lastPlayedActionID >= queuedAction.sequence) return;

    // Calculate playback mode based on timestamp delay
    const mode = this.getPlaybackModeFromTimestamp(queuedAction.serverTimestamp);

    if (mode === "skip") {
      // Hard desync detected - trigger recovery
      console.warn("Hard desync detected, triggering state recovery");
      this.handleDesyncRecovery();
      return;
    } else if (mode === "fast") {
      this.setSpeed(2);
    } else {
      this.restoreSpeed();
    }

    // Decode and create action
    const parsed = this.decodeQueuedAction(queuedAction);
    if (!parsed) {
      console.error("Failed to parse queued action for playback:", queuedAction);
      return;
    }

    const executable = ActionFactory.create(parsed);
    this.actionQueue.enqueue(executable);

    // Update pointer for skip/fast logic
    this.lastPlayedActionID = queuedAction.sequence;
  }

  private getPlaybackModeFromTimestamp(timestamp: number): "normal" | "fast" | "skip" {
    const delay = Date.now() - timestamp;
    if (delay < 2000) return "normal";
    if (delay < 10000) return "fast";
    return "skip";
  }

  private handleDesyncRecovery() {
    // Clear the action queue and reset tracking
    this.actionQueue.clear("kill");
    this.lastPlayedActionID = -1;

    // Request a full state update by triggering a reconnection
    // This will cause the server to send the full state again via FULL_SEND
    console.log("Triggering reconnection for full state recovery");

    // Leave current room to trigger reconnection
    this.leave("manual");

    // Emit event to show reconnecting status
    GameEventBus.emit("UPDATE_NETWORK_STATE", { state: "reconnecting" });
  }

  private setSpeed(multiplier: number) {
    GameEventBus.emit("UPDATE_ANIMATION_SPEED", {
      speedMultiplier: multiplier,
    });
  }

  private restoreSpeed() {
    GameEventBus.emit("UPDATE_ANIMATION_SPEED", { speedMultiplier: 1 });
  }

  // private playActionInstantly(queuedAction: QueuedAction) {
  //   // Create action data compatible with ActionFactory
  //   const actionData: ActionData = {
  //     id: queuedAction.sequence,
  //     timestamp: queuedAction.serverTimestamp,
  //     type: queuedAction.type,
  //     payload: queuedAction.payload
  //   };

  //   const executable = ActionFactory.create(actionData);
  //   const handle = executable.execute();
  //   handle.complete(); // jump animation to end immediately
  // }

  private decodeQueuedAction(queuedAction: QueuedAction): ActionData | null {
    if (!isActionType(queuedAction.type)) return null;

    const type = queuedAction.type;

    let payload: unknown;
    try {
      payload = JSON.parse(JSON.stringify(queuedAction.payload)); // Deep copy to avoid reference issues
    } catch {
      return null;
    }

    return {
      id: queuedAction.sequence,
      timestamp: queuedAction.serverTimestamp,
      type,
      payload: payload as typeof TURN_ACTION_REGISTRY[typeof type],
    } as ActionData;
  }

  getRoom() {
    if (!this.room) throw new Error("Not connected");
    return this.room;
  }
}


export const network = new Network();
