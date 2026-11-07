import test from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  searchRides,
  decideRequest,
  rideView,
  createDemoApi,
} from "./demo.js";
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
