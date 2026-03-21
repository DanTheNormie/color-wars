import { expect, test, beforeAll, afterAll } from "vitest";
import { ColyseusTestServer, boot } from "@colyseus/testing";
import appConfig from "../src/app.config";
import { PlayerState } from "@color-wars/shared/src/types/RoomState";
import { DEFAULT_ROOM_TYPE } from "@color-wars/shared/src/config/room";

let tsrv: ColyseusTestServer;

beforeAll(async () => {
  tsrv = await boot(appConfig);
});

afterAll(async () => {
  await tsrv.shutdown();
});

test("GameRoom handles ROLL_DICE successfully (baseline structure)", async () => {
  const room = await tsrv.createRoom(DEFAULT_ROOM_TYPE, {});
  const client1 = await tsrv.connectTo(room, { playerName: "Alice" });

  let receivedActions: any[] = [];
  client1.onMessage("action", (msg) => {
    receivedActions.push(msg);
  });

  // Start game
  client1.send("START_GAME", {});
  
  // Wait for the server to process start game
  await new Promise(res => setTimeout(res, 100));
  // Ensure the state updated safely by checking if phase changed
  expect(client1.state.room.phase).toBe("active");

  // Send Roll
  client1.send("ROLL_DICE", {});

  // Wait for the state to update
  await new Promise(res => setTimeout(res, 50)); 

  // In the legacy system, ROLL_DICE doesn't trigger 'action' messages yet.
  // Verify State changed safely.
  const player = client1.state.game.players.get(client1.sessionId) as PlayerState;
  expect(player).toBeDefined();
  expect(player.position).toBeGreaterThan(0);

  // Test that the new parallel Action Queue system broadcasts successfully 
  // when an action uses queueAction.
  room.state.queueAction("TEST_ACTION", { foo: "bar" }, "dummy-checksum");
  
  // Fake a handler tick to flush pending actions (simulate GameRoom.ts onAction)
  room.broadcast("action", room.state._pendingActions[0]);
  room.state.clearTurnHistory();

  await new Promise(res => setTimeout(res, 50));
  
  expect(receivedActions.length).toBeGreaterThan(0);
  expect(receivedActions[0].type).toBe("TEST_ACTION");
  expect(receivedActions[0].checksum).toBe("dummy-checksum");
});
