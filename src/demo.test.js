import test from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  searchRides,
  decideRequest,
  rideView,
  createDemoApi,
} from "./demo.js";
import {
  CAMPUS,
  KMC_CAMPUS,
  ROUTES,
  isToCampus,
  routeEndpoints,
} from "./routes.js";
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test("matching includes exactly 60 minutes and excludes 60 minutes plus one second", () => {
  const d = seed();
  const base = d.rides[0].flightAt;
  d.rides = d.rides.slice(0, 1);
  assert.equal(
    searchRides(
      d,
      99,
      new Date(new Date(base).getTime() + 3600000).toISOString(),
      "Airport",
    ).length,
    1,
  );
  assert.equal(
    searchRides(
      d,
      99,
      new Date(new Date(base).getTime() + 3601000).toISOString(),
      "Airport",
    ).length,
    0,
  );
  assert.equal(searchRides(d, 99, base, "Different airport").length, 0);
});
test("only the host can accept and acceptance never exceeds capacity", () => {
  const d = seed();
  d.rides[0].capacity = 3;
  d.requests.push(
    { id: 100, rideId: 1, studentId: 2, status: "PENDING" },
    { id: 101, rideId: 1, studentId: 3, status: "PENDING" },
  );
  assert.throws(() => decideRequest(d, 100, 2, true), /creator/);
  decideRequest(d, 100, 1, true);
  assert.equal(rideView(d, d.rides[0], 2).occupied, 3);
  assert.throws(() => decideRequest(d, 101, 1, true), /full/);
  assert.equal(d.requests.find((q) => q.id === 101).status, "PENDING");
});
test("airport-to-campus matching keeps the route and the inclusive one-hour arrival window", () => {
  const d = seed();
  const inbound = d.rides.find((r) => r.destination === CAMPUS);
  const at = (offset) =>
    new Date(new Date(inbound.flightAt).getTime() + offset).toISOString();
  d.rides.push({ ...inbound, id: 10, origin: "Other airport" });
  for (const offset of [-3600000, 0, 3600000]) {
    assert.deepEqual(
      searchRides(d, 99, at(offset), CAMPUS, " airport ").map((r) => r.id),
      [inbound.id],
    );
  }
  for (const offset of [-3600001, 3600001, 86400000]) {
    assert.deepEqual(searchRides(d, 99, at(offset), CAMPUS, "Airport"), []);
  }
  assert.ok(
    searchRides(d, 99, inbound.flightAt, "Airport").every(
      (r) => r.destination === "Airport",
    ),
  );
  inbound.capacity = 1;
  assert.deepEqual(searchRides(d, 99, inbound.flightAt, CAMPUS, "Airport"), []);
});
test("demo creates return rides with pickup after arrival and preserves the route on requests", async () => {
  const api = createDemoApi(memory(), memory());
  await api.sendOtp("+919000000101");
  await api.verifyOtp("123456");
  const arrival = new Date(Date.now() + 86400000);
  const body = {
    origin: " Mangalore Airport ",
    destination: CAMPUS,
    flightAt: arrival.toISOString(),
    pickupAt: new Date(+arrival + 1800000).toISOString(),
    capacity: 4,
    notes: "Meet at arrivals",
  };
  await assert.rejects(
    api.create({ ...body, pickupAt: new Date(+arrival - 1000).toISOString() }),
    /after your flight arrival/,
  );
  const ride = await api.create(body);
  assert.equal(ride.origin, "Mangalore Airport");
  assert.equal(
    (await api.search(body.flightAt, CAMPUS, "Mangalore Airport"))[0].id,
    ride.id,
  );
  await api.logout();
  await api.sendOtp("+919000000102");
  await api.verifyOtp("123456");
  const request = await api.join(ride.id);
  assert.equal(request.origin, "Mangalore Airport");
  assert.equal(request.destination, CAMPUS);
  assert.equal((await api.requests())[0].origin, "Mangalore Airport");
});
test("existing demo rides without an origin still match campus-to-airport searches", () => {
  const d = seed();
  delete d.rides[0].origin;
  assert.ok(
    searchRides(d, 99, d.rides[0].flightAt, "Airport").some(
      (r) => r.id === 1 && r.origin === CAMPUS,
    ),
  );
});
test("simplified posting requires capacity and supports all four routes without pickup or notes", async () => {
  const storage = memory();
  const api = createDemoApi(storage, memory());
  await api.sendOtp("+919000000101");
  await api.verifyOtp("123456");
  const flightAt = new Date(Date.now() + 86400000).toISOString();
  const body = { ...routeEndpoints(false), flightAt, capacity: 3 };
  for (const capacity of [undefined, null, 0, 1, 9, "3"]) {
    await assert.rejects(api.create({ ...body, capacity }), /capacity/);
  }
  await assert.rejects(
    api.create({
      ...body,
      flightAt: new Date(Date.now() - 1000).toISOString(),
    }),
    /future/,
  );
  for (const route of ROUTES) {
    const ride = await api.create({ ...body, ...route });
    assert.equal(ride.pickupAt, null);
    assert.equal(ride.notes, "");
    assert.ok(
      (await api.search(flightAt, route.destination, route.origin)).some(
        (r) => r.id === ride.id,
      ),
    );
    await api.logout();
    await api.sendOtp("+919000000102");
    await api.verifyOtp("123456");
    const request = await api.join(ride.id);
    assert.equal(request.origin, route.origin);
    assert.equal(request.destination, route.destination);
    await api.logout();
    await api.sendOtp("+919000000101");
    await api.verifyOtp("123456");
    await api.decide(request.id, true);
    assert.equal((await api.mine()).find((r) => r.id === ride.id).occupied, 2);
    const data = JSON.parse(storage.getItem("campus-cab-demo-v1"));
    data.rides.find((r) => r.id === ride.id).flightAt = new Date(
      Date.now() - 1000,
    ).toISOString();
    storage.setItem("campus-cab-demo-v1", JSON.stringify(data));
    assert.ok(
      !(await api.search(flightAt, route.destination, route.origin)).some(
        (r) => r.id === ride.id,
      ),
    );
  }
});
test("KMC matching isolates each campus and direction within the one-hour window", async () => {
  const api = createDemoApi(memory(), memory());
  await api.sendOtp("+919000000101");
  await api.verifyOtp("123456");
  const flightAt = new Date(Date.now() + 2 * 86400000).toISOString();
  const rides = [];
  for (const route of ROUTES) {
    rides.push(
      await api.create({
        origin: ` ${route.origin.toLowerCase()} `,
        destination: ` ${route.destination.toLowerCase()} `,
        flightAt,
        capacity: 4,
      }),
    );
  }
  for (const [index, route] of ROUTES.entries()) {
    for (const offset of [-3600000, 0, 3600000]) {
      const at = new Date(+new Date(flightAt) + offset).toISOString();
      assert.deepEqual(
        (await api.search(at, route.destination, route.origin)).map(
          (r) => r.id,
        ),
        [rides[index].id],
      );
    }
    for (const offset of [-3600001, 3600001]) {
      const at = new Date(+new Date(flightAt) + offset).toISOString();
      assert.deepEqual(
        await api.search(at, route.destination, route.origin),
        [],
      );
    }
    const toCampus = isToCampus(route);
    assert.equal(isToCampus(rides[index]), toCampus);
    assert.equal(
      toCampus ? rides[index].destination : rides[index].origin,
      toCampus ? route.destination : route.origin,
    );
    await assert.rejects(
      api.create({
        ...route,
        flightAt,
        pickupAt: new Date(
          +new Date(flightAt) + (toCampus ? -1000 : 1000),
        ).toISOString(),
        capacity: 4,
      }),
      /pickup/,
    );
  }
  for (const origin of [CAMPUS, KMC_CAMPUS]) {
    for (const destination of [CAMPUS, KMC_CAMPUS]) {
      await assert.rejects(
        api.create({ origin, destination, flightAt, capacity: 4 }),
        /Choose a route/,
      );
    }
  }
});
test("phone login, profile requirement, request, approval, and notification across accounts", async () => {
  const api = createDemoApi(memory(), memory());
  await api.sendOtp("+919999999999");
  await assert.rejects(api.verifyOtp("000000"));
  const me = await api.verifyOtp("123456");
  await assert.rejects(api.mine(), /profile/);
  await api.profile({ name: "Test Student", blockNumber: "B-4" });
  await api.join(1);
  await assert.rejects(api.join(1), /already/);
  assert.equal((await api.requests())[0].status, "PENDING");
  await api.logout();
  await api.sendOtp("+919000000101");
  await api.verifyOtp("123456");
  const q = (await api.requests()).find((q) => q.student.id === me.id);
  await api.decide(q.id, true);
  await api.logout();
  await api.sendOtp("+919999999999");
  await api.verifyOtp("123456");
  assert.equal((await api.requests())[0].status, "ACCEPTED");
  assert.match((await api.notices())[0].message, /accepted/);
  assert.equal((await api.mine())[0].occupied, 3);
});
test("cancelled rides disappear from My rides after reload while other rides remain", async () => {
  const storage = memory();
  const session = memory();
  const api = createDemoApi(storage, session);
  await api.sendOtp("+919000000101");
  await api.verifyOtp("123456");
  const other = await api.create({
    ...routeEndpoints(false),
    flightAt: new Date(Date.now() + 86400000).toISOString(),
    capacity: 3,
  });
  assert.ok((await api.mine()).some((r) => r.id === 1));
  await api.cancel(1);
  assert.deepEqual(
    (await api.mine()).map((r) => r.id),
    [other.id],
  );
  const reloaded = createDemoApi(storage, session);
  assert.deepEqual(
    (await reloaded.mine()).map((r) => r.id),
    [other.id],
  );
  await reloaded.logout();
  await reloaded.sendOtp("+919000000104");
  await reloaded.verifyOtp("123456");
  assert.ok(!(await reloaded.mine()).some((r) => r.id === 1));
  assert.equal(
    (await reloaded.requests()).find((q) => q.rideId === 1).status,
    "CANCELLED",
  );
  assert.ok(
    (await reloaded.notices()).some((n) => /cancelled/.test(n.message)),
  );
});
