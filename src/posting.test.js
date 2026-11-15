import test from "node:test";
import assert from "node:assert/strict";
import { createDemoApi, seed } from "./demo.js";
import { ROUTES } from "./routes.js";
import { prepareCabPost } from "./posting.js";

const memory = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
function testApi() {
  const storage = memory();
  storage.setItem(
    "campus-cab-demo-v1",
    JSON.stringify({ ...seed(), rides: [], requests: [] }),
  );
  return createDemoApi(storage, memory());
}
async function login(api, phone) {
  await api.sendOtp(phone);
  return api.verifyOtp("123456");
}
const flightAt = new Date(Date.now() + 3 * 86400000).toISOString();
const draft = { ...ROUTES[0], flightAt, capacity: 4, notes: "Main gate" };

test("posting offers same-route cabs at both hour boundaries, including across midnight", async () => {
  const api = testApi();
  await login(api, "+919000000101");
  const at = new Date(flightAt);
  at.setUTCHours(0, 15, 0, 0);
  const flights = [-3600001, -3600000, 3600000, 3600001].map((offset) =>
    new Date(+at + offset).toISOString(),
  );
  const ids = [];
  for (const route of ROUTES) {
    const rides = [];
    for (const flight of flights) {
      rides.push(await api.create({ ...draft, ...route, flightAt: flight }));
    }
    ids.push(rides.slice(1, 3).map((ride) => ride.id));
  }
  const user = await login(api, "+919000000102");
  for (const [index, route] of ROUTES.entries()) {
    const result = await prepareCabPost(api, user.id, {
      ...draft,
      ...route,
      flightAt: at.toISOString(),
    });
    assert.deepEqual(
      new Set(result.matches.map((ride) => ride.id)),
      new Set(ids[index]),
    );
    assert.equal(result.ride, undefined);
  }
  assert.deepEqual(await api.mine(), []);
});

test("requesting a suggested cab sends a pending request without posting the draft", async () => {
  const api = testApi();
  await login(api, "+919000000101");
  const existing = await api.create(draft);
  const user = await login(api, "+919000000102");
  const { matches } = await prepareCabPost(api, user.id, draft);
  assert.deepEqual(
    matches.map((ride) => ride.id),
    [existing.id],
  );
  const request = await api.join(matches[0].id);
  assert.equal(request.status, "PENDING");
  assert.deepEqual(await api.mine(), []);
  await login(api, "+919000000101");
  const incoming = (await api.requests()).find((q) => q.id === request.id);
  assert.equal(incoming.incoming, true);
  assert.equal(incoming.student.id, user.id);
  assert.equal((await api.mine()).length, 1);
});

test("declining suggestions posts the saved draft with all its details", async () => {
  const api = testApi();
  await login(api, "+919000000101");
  await api.create(draft);
  const user = await login(api, "+919000000102");
  const { matches } = await prepareCabPost(api, user.id, draft);
  assert.equal(matches.length, 1);
  assert.deepEqual(await api.mine(), []);
  const posted = await api.create(draft);
  assert.equal(posted.creator.id, user.id);
  for (const key of [
    "origin",
    "destination",
    "flightAt",
    "capacity",
    "notes",
  ]) {
    assert.equal(posted[key], draft[key]);
  }
  assert.equal((await api.mine()).length, 1);
  assert.deepEqual(await api.requests(), []);
});

test("no eligible matches posts directly, excluding own, requested, full and cancelled cabs", async () => {
  const api = testApi();
  await login(api, "+919000000101");
  const requested = [];
  for (let i = 0; i < 3; i++) requested.push(await api.create(draft));
  const cancelled = await api.create(draft);
  await api.cancel(cancelled.id);
  const full = await api.create({ ...draft, capacity: 2 });
  await login(api, "+919000000103");
  const fullRequest = await api.join(full.id);
  const user = await login(api, "+919000000102");
  const requests = [];
  for (const ride of requested) requests.push(await api.join(ride.id));
  await api.create(draft);
  await login(api, "+919000000101");
  await api.decide(fullRequest.id, true);
  await api.decide(requests[1].id, true);
  await api.decide(requests[2].id, false);
  await login(api, "+919000000102");
  const result = await prepareCabPost(api, user.id, draft);
  assert.equal(result.matches, undefined);
  assert.equal(result.ride.creator.id, user.id);
  assert.equal(
    (await api.mine()).filter((r) => r.creator.id === user.id).length,
    2,
  );
});

test("failed matching and invalid flight times never post a cab", async () => {
  let writes = 0;
  const api = {
    search: async () => {
      throw Error("Cannot reach the server.");
    },
    create: async () => {
      writes++;
    },
  };
  await assert.rejects(prepareCabPost(api, 1, draft), /Cannot reach/);
  for (const flightAt of [
    "invalid",
    new Date(Date.now() - 1000).toISOString(),
  ]) {
    await assert.rejects(
      prepareCabPost(api, 1, { ...draft, flightAt }),
      /future/,
    );
  }
  assert.equal(writes, 0);
});
