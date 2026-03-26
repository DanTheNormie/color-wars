import type { PlayerState, TileState, TurnPhase, RoomState} from "@color-wars/shared";
import xxh from "xxhashjs"

export interface checksumState {
    diceState: [number, number];
    players: PlayerState[];
    activePlayerId: string;
    turnPhase: TurnPhase;
    diceTrack: TileState[];
    mapOwnership: [string, string][];
}

export function checksum(state: RoomState): string {
    // Sort players by ID for determinism
    const players = Array.from(state.game.players.values()).sort((a, b) => a.id.localeCompare(b.id));

    // Sort territory ownership by territory ID for determinism
    const mapOwnership: [string, string][] = [];
    state.game.territoryOwnership.forEach((territoryState, territoryId) => {
        mapOwnership.push([territoryId, territoryState.ownerId]);
    });
    mapOwnership.sort((a, b) => a[0].localeCompare(b[0]));

    const checksumState: checksumState = {
        diceState: state.game.diceState.rollTo.toArray() as [number, number],
        players: players,
        activePlayerId: state.game.activePlayerId,
        turnPhase: state.game.turnPhase,
        diceTrack: state.game.diceTrack.toArray(),
        mapOwnership: mapOwnership,
    };

    return xxh.h32(stableStringify(checksumState), 0x9747b28c).toString();
}

/**
 * A simple deterministic JSON stringify that sorts object keys.
 */
function stableStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }

    if (Array.isArray(obj)) {
        return '[' + obj.map(stableStringify).join(',') + ']';
    }

    // For Schema objects or plain objects, sort keys
    const keys = Object.keys(obj).sort();
    const result = keys.map((key) => {
        const value = (obj as any)[key];
        // Skip undefined values to match JSON.stringify behavior
        if (value === undefined) return null;
        return `${JSON.stringify(key)}:${stableStringify(value)}`;
    }).filter(v => v !== null);

    return '{' + result.join(',') + '}';
}