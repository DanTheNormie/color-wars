import { create } from "zustand";
import { devtools, persist, combine, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { network } from "@/lib/managers/network";
import type {
  DiceStateMode,
  PlainStateOf,
  PlayerState,
  RoomState,
  GameState,
  RoomPhase,
  TurnPhase,
  TileState,
  PlayerStatus,
  DevelopmentType,
  MapID
} from "@color-wars/shared";
import type { TerritoryId } from "@/types/map";
import { useNetworkStore } from "./networkStore";
import { GameEventBus } from "@/lib/managers/GameEventBus";

const DEFAULT_PLAYER_NAME = "Commander";
type ActionState = 'resolving_action' | 'idle' | 'awaiting_action_result'

interface LocalRoom {
  playerName: string;
  roomId: string | null;
  reconnectionToken: string | null;
}

interface StoreState {
  room: Partial<LocalRoom>;
  currentPlayer: PlainStateOf<PlayerState>;
  state: PlainStateOf<RoomState>;
  isSpectator: boolean;
  actionState: ActionState
  showDiceRollMessage: boolean;
  winnerId: string | null;
  rehydrated: boolean;
}

export const useStore = create(
  subscribeWithSelector(
    devtools(
      persist(
        immer(
          combine(
            {
              room: {
                playerName: DEFAULT_PLAYER_NAME,
                roomId: null,
                reconnectionToken: null,
              },
              currentPlayer: {},
              isSpectator: false,
              state: {
                playersPings: {},
              },
              actionState: 'idle',
              showDiceRollMessage: false,
              winnerId: null,
              rehydrated: false,
            } as StoreState,
            (set, get) => ({
              setHasBoughtTerritoryThisRound: (playerId: string, hasBought: boolean) => {
                set((z) => {
                  z.state.game.players[playerId].hasBoughtTerritoryThisRound = hasBought
                })
              },
              setDiceTrack: (diceTrack: TileState[]) => {
                set((z) => {
                  z.state.game.diceTrack = diceTrack
                })
              },
              updatePlayerStatus: (playerId: string, status: PlayerStatus) => {
                set((z) => {
                  z.state.game.players[playerId].status = status
                })
              },
              declareBackruptcy: () => {
                try {
                  network.send('DECLARE_BANKRUPTCY', {})
                } catch (err) {
                  console.log(err)
                }
              },
              setShowDiceRollMessage: (show: boolean) => {
                set((z) => {
                  z.showDiceRollMessage = show
                })
              },
              setPlayerName: (name: string) => {
                set((z) => {
                  z.room ??= {};
                  z.room.playerName = name;
                });
              },
              setActionState: (state: ActionState) => {
                set((z) => {
                  z.actionState = state
                })
              },
              setPlayerPing: (playerId: string, ping: number) => {
                set((z) => {
                  z.state ??= {} as PlainStateOf<RoomState>;
                  z.state.playersPings ??= {};
                  z.state.playersPings[playerId] = ping;
                });
              },
              removePlayerPing: (playerId: string) => {
                set((z) => {
                  delete z.state.playersPings[playerId];
                });
              },
              setPlayer: (playerId: string, player: PlainStateOf<PlayerState>) => {
                set((z) => {
                  z.state ??= {} as PlainStateOf<RoomState>;
                  z.state.game ??= {} as PlainStateOf<GameState>;
                  z.state.game.players ??= {};
                  z.state.game.players[playerId] = player;
                });
              },
              setCurrentPlayer: (player: PlainStateOf<PlayerState>) => {
                set((z) => {
                  z.currentPlayer = player || ({} as PlainStateOf<PlayerState>);
                });
              },
              removePlayer: (playerId: string) => {
                set((z) => {
                  delete z.state.game.players[playerId];
                });
              },
              quickMatch: async () => {
                console.log("[sessionStore] quickMatch started");
                const { room: localRoom } = get();
                try {
                  const payloadName = localRoom.playerName?.trim() ?? DEFAULT_PLAYER_NAME;

                  const room = await network.quickMatch({ playerName: payloadName });
                  set((z) => {
                    z.room.roomId = room.roomId;
                    z.room.reconnectionToken = room.reconnectionToken;
                  });
                  return room.roomId;
                } catch (error) {
                  console.log(error);
                  throw error;
                }
              },
              joinRoom: async (roomId: string) => {
                console.log("[sessionStore] joinRoom started");
                const { room: localRoom } = get();
                try {
                  const payloadName = localRoom.playerName?.trim() ?? DEFAULT_PLAYER_NAME;
                  const room = await network.joinRoom(roomId, { playerName: payloadName });
                  set((z) => {
                    z.room.roomId = room.roomId;
                    z.room.reconnectionToken = room.reconnectionToken;
                  });
                  return room.roomId;
                } catch (error) {
                  console.log(error);
                  throw error;
                }
              },
              setRoomLeader: (playerId: string) => {
                set((z) => {
                  z.state.room.leaderId = playerId
                })
              },
              accelerateDice: () => {
                set((z) => {
                  z.state.game.diceState.mode = 'ACCELERATING'
                })
              },
              ragdollDice: () => {
                set((z) => {
                  z.state.game.diceState.mode = 'RAGDOLLING'
                })
              },
              updateRoomPhase: (phase: RoomPhase) => {
                set((z) => {
                  z.state.room.phase = phase
                })
              },
              rollDiceTo: (die1: number, die2: number) => {
                set((z) => {
                  console.log('called rollDiceTo from: ', z.state.game.diceState.mode)
                  z.state.game.diceState.mode = 'ROLLINGTOFACE'
                  z.state.game.diceState.rollTo = [die1, die2]
                })
              },
              setActivePlayer: (playerId: string) => {
                set((z) => {
                  z.state.game.activePlayerId = playerId
                })
              },
              updateTurnPhase: (turnPhase: TurnPhase) => {
                set((z) => {
                  z.state.game.turnPhase = turnPhase
                  if (turnPhase == 'awaiting-roll') {
                    z.showDiceRollMessage = false
                  }
                })
              },
              tryAutoReconnect: async () => {
                console.log('calling reconnect')
                const { room } = get();
                if (!room.roomId || !room.reconnectionToken) return false;

                if (
                  useNetworkStore.getState().state == "connected" ||
                  useNetworkStore.getState().state == "reconnecting"
                )
                  return true;

                try {
                  const localRoom = await network.reconnect(room.reconnectionToken);

                  set((z) => {
                    z.room.roomId = localRoom.roomId;
                    z.room.reconnectionToken = localRoom.reconnectionToken;
                  });
                  return true;
                } catch (error) {
                  if (error instanceof Error) {
                    console.error(error);
                    if (error?.message == "already connecting") return true;
                  }
                  set((z) => {
                    z.room.roomId = null;
                    z.room.reconnectionToken = null;
                  });
                  //clearSession();
                  return false;
                }
              },
              updatePlayerMoney: (playerId: string, amount: number) => {
                set((z) => {
                  z.state.game.players[playerId].money = amount
                })
              },
              addPlayerCard: (playerId: string, cardId: string) => {
                set((z) => {
                  const player = z.state?.game?.players?.[playerId];
                  if (player) {
                    player.cards ??= [];
                    player.cards.push(cardId);
                  }
                });
              },
              addPlayerCards: (playerId: string, cards: string[]) => {
                set((z) => {
                  const player = z.state?.game?.players?.[playerId];
                  if (player) {
                    player.cards ??= [];
                    player.cards.push(...cards);
                  }
                });
              },
              updateTerritoryOwnership: (territoryId: string, ownerId: string | null, buildingType: DevelopmentType = "BASE") => {
                set((z) => {
                  z.state.game.territoryOwnership ??= {};
                  if (ownerId) {
                    z.state.game.territoryOwnership[territoryId] = {
                      ownerId,
                      buildingType
                    };
                  } else {
                    delete z.state.game.territoryOwnership[territoryId];
                  }
                })
              },
              updatePlayerRolledDice: (playerId: string, hasRolledDice: boolean) => {

                set((z) => {
                  z.state.game.players[playerId].hasRolled = hasRolledDice
                })
              },
              startGame: () => {
                try {
                  network.send("START_GAME", {});
                } catch (error) {
                  console.warn("Unable to start game", error);
                }
              },
              leaveGame: async () => {
                try {
                  await network.leave("manual");
                } catch (error) {
                  console.warn("Unable to leave game", error);
                }
              },
              sendDiceMode: (mode: "acc" | "rag" | "roll") => {
                try {
                  console.log("sending ", mode);
                  if (mode == "acc") network.send("ACCELERATE_DICE", {});
                  else if (mode == "rag") network.send("RAGDOLL_DICE", {});
                  else if (mode == "roll") {
                    network.send("ROLL_DICE", {});
                    GameEventBus.emit('UPDATE_ACTION_STATE', { state: 'awaiting_action_result' })
                  }
                } catch (error) {
                  console.error("[rollDice] Error sending rollDice message:", error);
                }
              },
              endTurn: () => {
                try {
                  network.send("END_TURN", {});
                } catch (error) {
                  console.warn("Unable to end turn", error);
                }
              },
              buyTerritory: (territoryId: TerritoryId) => {
                if (!territoryId) return;
                try {
                  network.send('BUY_TERRITORY', { territoryID: territoryId })
                  //GameEventBus.emit('UPDATE_ACTION_STATE', { state: 'awaiting_action_result' })
                } catch (error) {
                  console.warn("Unable to purchase territory", error);
                }
              },
              sellTerritory: (territoryId: TerritoryId) => {
                if (!territoryId) return;
                try {
                  network.send('SELL_TERRITORY', { territoryID: territoryId })
                  //GameEventBus.emit('UPDATE_ACTION_STATE', { state: 'awaiting_action_result' })
                } catch (error) {
                  console.warn("Unable to purchase territory", error);
                }
              },
              sendUpgradeTerritoryIntent: (territoryId: string, buildingType: DevelopmentType) => {
                if (!territoryId) return;
                try {
                  // set((z) => {
                  //   z.state.game.territoryOwnership[territoryId].buildingType = buildingType
                  // })
                  network.send('UPGRADE_TERRITORY', { territoryID: territoryId, buildingType })
                } catch (error) {
                  console.warn("Unable to upgrade territory", error);
                }
              },
              sendDowngradeTerritoryIntent: (territoryId: string) => {
                if (!territoryId) return;
                try {
                  // set((z) => {
                  //   z.state.game.territoryOwnership[territoryId].buildingType = "BASE"
                  // })
                  network.send('DOWNGRADE_TERRITORY', { territoryID: territoryId })
                } catch (error) {
                  console.warn("Unable to downgrade territory", error);
                }
              },
              upgradeTerritory: (territoryId: string, buildingType: DevelopmentType) => {
                if (!territoryId) return;
                try {
                  set((z) => {
                    z.state.game.territoryOwnership[territoryId].buildingType = buildingType
                  })
                  //network.send('UPGRADE_TERRITORY', { territoryID: territoryId, buildingType })
                } catch (error) {
                  console.warn("Unable to upgrade territory", error);
                }
              },
              downgradeTerritory: (territoryId: string) => {
                if (!territoryId) return;
                try {
                  set((z) => {
                    z.state.game.territoryOwnership[territoryId].buildingType = "BASE"
                  })
                  //network.send('DOWNGRADE_TERRITORY', { territoryID: territoryId })
                } catch (error) {
                  console.warn("Unable to downgrade territory", error);
                }
              },

              selectCard: (cardID: string) => {
                if (!cardID) return;
                try {
                  network.send('SELECT_CARD', { cardID: cardID })
                  GameEventBus.emit('UPDATE_ACTION_STATE', { state: 'awaiting_action_result' })
                } catch (error) {
                  console.warn("Unable to purchase territory", error);
                }
              },
              toggleReady: () => {
                try {
                  //network.room?.send('toggleReady')
                } catch (error) {
                  console.warn("Unable to toggle ready", error);
                }
              },
              kickPlayer: (playerId: string) => {
                try {
                  network.send('KICK_PLAYER', { playerId, reason: 'GTFO' })
                } catch (err) {
                  console.warn('unable to do action: kick player', playerId)
                }
              },
              reset: () => set(useStore.getInitialState()),
              setDiceState: (mode: DiceStateMode, rollTo: number[]) => {
                set((z) => {
                  z.state.game.diceState.mode = mode;
                  z.state.game.diceState.rollTo = rollTo;
                });
              },
              setMapID: (mapID: MapID) => {
                try {
                  network.send('CHANGE_MAP', { mapID })
                } catch (err) {
                  console.warn('unable to do action: change map', mapID)
                }
              },
              setWinnerId: (winnerId: string) => {
                set((z) => {
                  z.winnerId = winnerId;
                });
              },
              shiftDiceTrack: (direction: "forward" | "backward") => {
                try {
                  network.send("SHIFT_TRACK", { direction });
                } catch (error) {
                  console.warn("Unable to shift track", error);
                }
              },
              sendProposeTrade: (payload: any) => {
                try {
                  network.send("PROPOSE_TRADE", payload);
                } catch (error) {
                  console.warn("Unable to propose trade", error);
                }
              },
              sendAcceptTrade: (tradeId: string) => {
                try {
                  network.send("ACCEPT_TRADE", { tradeId });
                } catch (error) {
                  console.warn("Unable to accept trade", error);
                }
              },
              sendDeclineTrade: (tradeId: string) => {
                try {
                  network.send("DECLINE_TRADE", { tradeId });
                } catch (error) {
                  console.warn("Unable to decline trade", error);
                }
              },
              sendCancelTrade: (tradeId: string) => {
                try {
                  network.send("CANCEL_TRADE", { tradeId });
                } catch (error) {
                  console.warn("Unable to cancel trade", error);
                }
              },
              addTrade: (id: string, trade: PlainStateOf<any>) => {
                set((z) => {
                  z.state.game.activeTrades ??= {};
                  z.state.game.activeTrades[id] = trade;
                });
              },
              removeTrade: (id: string) => {
                set((z) => {
                  if (z.state.game.activeTrades) {
                    delete z.state.game.activeTrades[id];
                  }
                });
              },
              updateTrade: (id: string, trade: PlainStateOf<any>) => {
                set((z) => {
                  if (z.state.game.activeTrades) {
                    z.state.game.activeTrades[id] = trade;
                  }
                });
              },
            }),
          ),
        ),
        {
          name: "room-cache",
          partialize: (state) => ({
            room: state.room,
          }),
          onRehydrateStorage: (state) => {
            state.rehydrated = true
          }
        },
      ),
      { name: "GameStore" },
    ),
  )
)
