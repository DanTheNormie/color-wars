import { GameEventBus } from "@/lib/managers/GameEventBus";
import type { ActionHandle } from "@animation/driver/AnimationHandle";
import { useGameLogStore } from "@/stores/gameLogStore";
import type { ActionType, ActionData } from "@color-wars/shared/src/types/turnActionRegistry";

export interface IExecutable {
  execute(): ActionHandle;
}

export abstract class BaseAction<TType extends ActionType> implements IExecutable {
  protected actionId: number;
  protected timestamp: number;
  protected type: TType;
  protected payload: Extract<ActionData, { type: TType }>["payload"];

  constructor(data: Extract<ActionData, { type: TType }>) {
    this.actionId = data.id;
    this.timestamp = data.timestamp;
    this.type = data.type;
    // @ts-expect-error TypeScript cannot infer mapped generic payload
    this.payload = data.payload;
  }

  protected logAction(playerId: string) {
    useGameLogStore.getState().addEntry(this.actionId, this.type, playerId, this.payload, this.timestamp);
  }

  abstract execute(): ActionHandle;
}

export class ActionQueue {
  private queue: IExecutable[] = [];
  private isRunning = false;
  private currentAction: ActionHandle | null = null;

  public enqueue(action: IExecutable) {
    this.queue.push(action);
    GameEventBus.emit('UPDATE_ACTION_STATE', {state:'resolving_action'})
    this.process();
  }

  clear(type: "kill" | "complete") {
    if (this.currentAction) {
      if (type === "kill") {
        this.currentAction.cancel();
      } else {
        this.currentAction.complete();
      }
    }

    if (type === "complete") {
      for (const queued of this.queue) {
        queued.execute().complete();
      }
    }

    this.queue = [];
    this.currentAction = null;
    GameEventBus.emit("UPDATE_ACTION_STATE", { state: "idle" });
  }

  private async process() {
    if (this.isRunning) return;
    if (this.queue.length == 0){ 
      GameEventBus.emit('UPDATE_ANIMATION_SPEED', { speedMultiplier: 1 });
      GameEventBus.emit('UPDATE_ACTION_STATE', {state:'idle'})
      return;
    }

    this.isRunning = true;

    while (this.queue.length > 0) {
      const action = this.queue.shift();
      if (action) {
        try {
          const currentAction = action.execute();
          this.currentAction = currentAction;
          await currentAction.finished;
        } catch (error) {
          console.error("Action Failed: ", error);
        }
      }
    }
    GameEventBus.emit('UPDATE_ANIMATION_SPEED', { speedMultiplier: 1 });
    GameEventBus.emit('UPDATE_ACTION_STATE', {state:'idle'})
    this.isRunning = false;
  }
}



/**
 * Concrete Composite Action
 * Can be used directly as a generic group, or extended for specific sequences.
 */
// export class CompositeAction implements IExecutable {
//   protected subActions: IExecutable[] = [];
//   private mode: "SERIAL" | "PARALLEL" = "SERIAL";

//   /**
//    * Adds an action (Atomic or Composite) to the list.
//    */
//   public add(action: IExecutable): this {
//     this.subActions.push(action);
//     return this;
//   }

//   /**
//    * Sets execution mode to Serial (Sequence).
//    * Actions play one after another.
//    */
//   public runSerial(){
//     this.mode = "SERIAL";
//   }

//   /**
//    * Sets execution mode to Parallel (Batch).
//    * Actions play simultaneously.
//    */
//   public runParallel() {
//     this.mode = "PARALLEL";
//   }

//   /**
//    * Execution Logic
//    */
//   async execute(): Promise<void> {
//     if (this.subActions.length === 0) return;

//     if (this.mode === "SERIAL") {
//       for (const action of this.subActions) {
//         await action.execute();
//       }
//     } else {
//       await Promise.all(this.subActions.map((action) => action.execute()));
//     }
//   }
// }
