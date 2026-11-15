import test from "node:test";
import assert from "node:assert/strict";
import {
  FOLLOW_DELAY,
  TRAIL_LIFETIME,
  avoidObstacle,
  cabWaypoint,
  stepCab,
  takeDelayedTarget,
  trailOpacity,
} from "./cursorCabMotion.js";

test("continuous pointer movement follows positions one second later without waiting for a pause", () => {
  const history = Array.from({ length: 21 }, (_, index) => ({
    x: index * 20,
    y: 200,
    at: index * 100,
  }));
  assert.equal(FOLLOW_DELAY, 1000);
  assert.equal(takeDelayedTarget(history, 999), null);
  assert.equal(takeDelayedTarget(history, 1000).x, 0);
  assert.equal(takeDelayedTarget(history, 1500).x, 100);
  assert.equal(takeDelayedTarget(history, 2000).x, 200);
  assert.equal(takeDelayedTarget(history, 3000).x, 400);
  assert.equal(history.length, 0);
});

const viewport = { left: 36, top: 36, right: 1164, bottom: 764 };
// These bounds include clearance for the entire rotating cab.
const obstacle = { left: 600, top: 200, right: 1000, bottom: 600 };
const inside = (point, box) =>
  point.x > box.left &&
  point.x < box.right &&
  point.y > box.top &&
  point.y < box.bottom;

test("cursor positions inside the login box park the cab outside it", () => {
  for (const target of [
    { x: 601, y: 400 },
    { x: 800, y: 400 },
    { x: 999, y: 599 },
  ]) {
    const parked = avoidObstacle(target, obstacle, viewport);
    assert.equal(inside(parked, obstacle), false);
    assert.ok(parked.x >= viewport.left && parked.x <= viewport.right);
    assert.ok(parked.y >= viewport.top && parked.y <= viewport.bottom);
  }
});

test("the cab drives around the login box from every side instead of crossing it", () => {
  const routes = [
    [
      { x: 500, y: 400 },
      { x: 1100, y: 400 },
    ],
    [
      { x: 1100, y: 400 },
      { x: 500, y: 400 },
    ],
    [
      { x: 800, y: 100 },
      { x: 800, y: 700 },
    ],
    [
      { x: 800, y: 700 },
      { x: 800, y: 100 },
    ],
    [
      { x: 500, y: 100 },
      { x: 1100, y: 700 },
    ],
    [
      { x: 500, y: 400 },
      { x: 800, y: 400 },
    ],
  ];
  for (const [start, target] of routes) {
    let cab = { ...start, angle: 0 };
    for (let frame = 0; frame < 1500; frame++) {
      const waypoint = cabWaypoint(cab, target, obstacle, viewport);
      const next = stepCab(cab, waypoint, 1 / 60);
      // Check the whole travelled segment, not just frame endpoints.
      for (let part = 0; part <= 10; part++) {
        const point = {
          x: cab.x + ((next.x - cab.x) * part) / 10,
          y: cab.y + ((next.y - cab.y) * part) / 10,
        };
        assert.equal(inside(point, obstacle), false);
      }
      cab = next;
    }
    const goal = avoidObstacle(target, obstacle, viewport);
    assert.ok(Math.hypot(cab.x - goal.x, cab.y - goal.y) < 0.5);
  }
});

test("a login card near the viewport edge keeps detours on screen", () => {
  const edgeObstacle = { ...obstacle, right: 1200 };
  let cab = { x: 800, y: 100, angle: 0 };
  const target = { x: 800, y: 700 };
  for (let frame = 0; frame < 1500; frame++) {
    cab = stepCab(
      cab,
      cabWaypoint(cab, target, edgeObstacle, viewport),
      1 / 60,
    );
    assert.equal(inside(cab, edgeObstacle), false);
    assert.ok(cab.x >= viewport.left && cab.x <= viewport.right);
    assert.ok(cab.y >= viewport.top && cab.y <= viewport.bottom);
  }
  assert.ok(Math.hypot(cab.x - target.x, cab.y - target.y) < 0.5);
});

test("the cab advances gradually without jumping to the cursor or overshooting", () => {
  let cab = { x: 40, y: 500, angle: 0 };
  const target = { x: 600, y: 80 };
  for (let frame = 0; frame < 600; frame++) {
    const next = stepCab(cab, target, 1 / 60);
    const previousDistance = Math.hypot(target.x - cab.x, target.y - cab.y);
    const distance = Math.hypot(target.x - next.x, target.y - next.y);
    assert.ok(distance <= previousDistance);
    assert.ok(Math.hypot(next.x - cab.x, next.y - cab.y) <= 3.6);
    if (frame === 0) assert.ok(distance > 690);
    cab = next;
  }
  assert.ok(Math.hypot(target.x - cab.x, target.y - cab.y) < 0.5);
});

test("easing takes the same time on 30, 60 and 144 Hz displays", () => {
  const positions = [30, 60, 144].map((rate) => {
    let cab = { x: 0, y: 0, angle: 0 };
    for (let frame = 0; frame < rate; frame++) {
      cab = stepCab(cab, { x: 80, y: 60 }, 1 / rate);
    }
    return cab;
  });
  for (const cab of positions) {
    assert.ok(Math.abs(cab.x - positions[0].x) < 0.001);
    assert.ok(Math.abs(cab.y - positions[0].y) < 0.001);
  }
});

test("turning across the angle boundary uses the short direction", () => {
  const cab = { x: 0, y: 0, angle: Math.PI - 0.01 };
  const next = stepCab(cab, { x: -100, y: -1 }, 1 / 60);
  assert.ok(next.angle > cab.angle);
  assert.ok(next.angle - cab.angle < 0.01);
  const parked = { x: 0, y: 0, angle: 0 };
  assert.deepEqual(stepCab(parked, { x: 0, y: 0 }, 1 / 60), parked);
});

test("the trail fades monotonically and disappears after its lifetime", () => {
  assert.ok(trailOpacity(0) > trailOpacity(TRAIL_LIFETIME / 2));
  assert.ok(trailOpacity(TRAIL_LIFETIME / 2) > 0);
  assert.equal(trailOpacity(TRAIL_LIFETIME), 0);
  assert.equal(trailOpacity(TRAIL_LIFETIME * 2), 0);
});
