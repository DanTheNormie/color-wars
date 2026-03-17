// src/actions/ActionFactory.ts
import type { ActionData } from "@color-wars/shared/src/types/turnActionRegistry";
import type { IExecutable } from "./core";
import { HexHop, IncrMoney, RollDice, DecrMoney, AddCard, DrawCardsAction, ResolveSelectionAction, BuyTerritoryAction, SellTerritoryAction, ShiftTrackAction, UpdateActivePlayer } from "./actions";

export class ActionFactory {
  static create(data: ActionData): IExecutable {
    switch (data.type) {
      case 'MOVE_PLAYER':
        return new HexHop(data);

      case 'ROLL_DICE':
        return new RollDice(data);

      case 'INCR_MONEY':
        return new IncrMoney(data);

      case 'DECR_MONEY':
        return new DecrMoney(data);

      case 'DRAW_3_REWARD_CARDS':
        return new DrawCardsAction(data);

      case 'SELECT_CARD':
        return new ResolveSelectionAction(data);

      case 'ADD_CARD':
        return new AddCard(data);

      case 'BUY_TERRITORY':
        return new BuyTerritoryAction(data);

      case 'SELL_TERRITORY':
        return new SellTerritoryAction(data);

      case 'SHIFT_TRACK':
        return new ShiftTrackAction(data);

      case 'UPDATE_ACTIVE_PLAYER':
        return new UpdateActivePlayer(data);

      default:
        throw new Error(`Unknown Action Type, unable to create action: ${JSON.stringify(data)}`);
    }
  }
}
