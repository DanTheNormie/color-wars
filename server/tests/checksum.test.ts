import { expect, test, describe } from "vitest";
import { RoomState, PlayerState, TerritoryState } from "@color-wars/shared/src/types/RoomState";
import { checksum } from "@color-wars/shared/src/checksum";

describe("Checksum Determinism", () => {
    test("deterministic regardless of player insertion order", () => {
        const state1 = new RoomState("room1");
        const state2 = new RoomState("room1");

        const p1 = new PlayerState("p1", "Alice");
        const p2 = new PlayerState("p2", "Bob");

        // Alice then Bob
        state1.game.players.set("p1", p1);
        state1.game.players.set("p2", p2);

        // Bob then Alice
        state2.game.players.set("p2", p2);
        state2.game.players.set("p1", p1);

        expect(checksum(state1)).toBe(checksum(state2));
    });

    test("deterministic regardless of territory ownership insertion order", () => {
        const state1 = new RoomState("room1");
        const state2 = new RoomState("room1");

        // t1:p1 then t2:p2
        state1.game.territoryOwnership.set("t1", new TerritoryState("p1"));
        state1.game.territoryOwnership.set("t2", new TerritoryState("p2"));

        // t2:p2 then t1:p1
        state2.game.territoryOwnership.set("t2", new TerritoryState("p2"));
        state2.game.territoryOwnership.set("t1", new TerritoryState("p1"));

        expect(checksum(state1)).toBe(checksum(state2));
    });

    test("deterministic regardless of object property order in nested structures", () => {
        const state1 = new RoomState("room1");
        const state2 = new RoomState("room1");

        const p1 = new PlayerState("p1", "Alice");
        const p2 = new PlayerState("p1", "Alice");

        // Add cards in the same order but ensure the objects themselves are stringified deterministically
        p1.cards.push("card1", "card2");
        p2.cards.push("card1", "card2");

        state1.game.players.set("p1", p1);
        state2.game.players.set("p1", p2);

        // Modify a secondary property to ensure they are the same
        state1.game.activePlayerId = "p1";
        state2.game.activePlayerId = "p1";

        expect(checksum(state1)).toBe(checksum(state2));
    });

    test("deterministic hashing with players having different field initialization order (conceptually)", () => {
        const state1 = new RoomState("room1");
        const state2 = new RoomState("room1");

        const p1 = new PlayerState("p1", "Alice");
        p1.money = 1000;
        p1.color = "red";

        const p2 = new PlayerState("p1", "Alice");
        // Different "logical" order of field updates
        p2.color = "red";
        p2.money = 1000;

        state1.game.players.set("p1", p1);
        state2.game.players.set("p1", p2);

        expect(checksum(state1)).toBe(checksum(state2));
    });
});
