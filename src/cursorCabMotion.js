export const FOLLOW_DELAY = 1000;
export const TRAIL_LIFETIME = 1500;

export function takeDelayedTarget(history, now) {
  let target = null;
  while (history.length && history[0].at <= now - FOLLOW_DELAY) {
    target = history.shift();
  }
  return target;
}

export function avoidObstacle(point, obstacle, viewport) {
  const clamp = (point) => ({
    x: Math.max(viewport.left, Math.min(viewport.right, point.x)),
    y: Math.max(viewport.top, Math.min(viewport.bottom, point.y)),
  });
  const target = clamp(point);
  if (!obstacle || !inside(target, obstacle)) return target;
  const alternatives = [
    { x: obstacle.left - 1, y: target.y },
    { x: obstacle.right + 1, y: target.y },
    { x: target.x, y: obstacle.top - 1 },
    { x: target.x, y: obstacle.bottom + 1 },
  ]
    .map(clamp)
    .filter((point) => !inside(point, obstacle));
  return (
    alternatives.sort(
      (a, b) =>
        Math.hypot(a.x - target.x, a.y - target.y) -
        Math.hypot(b.x - target.x, b.y - target.y),
    )[0] ?? target
  );
}

function inside(point, box) {
  return (
    point.x > box.left &&
    point.x < box.right &&
    point.y > box.top &&
    point.y < box.bottom
  );
}

function crossesObstacle(from, to, box) {
  let enter = 0;
  let exit = 1;
  for (const [axis, min, max] of [
    ["x", box.left, box.right],
    ["y", box.top, box.bottom],
  ]) {
    const delta = to[axis] - from[axis];
    if (Math.abs(delta) < 0.000001) {
      if (from[axis] <= min || from[axis] >= max) return false;
    } else {
      const a = (min - from[axis]) / delta;
      const b = (max - from[axis]) / delta;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
    }
    if (enter >= exit) return false;
  }
  return enter < 1 && exit > 0;
}

// Find a short route around the padded login card, including when the pointer
// crosses from one side to the other. Every leg stays inside the viewport.
export function cabWaypoint(cab, pointer, obstacle, viewport) {
  const target = avoidObstacle(pointer, obstacle, viewport);
  if (!obstacle || !crossesObstacle(cab, target, obstacle)) return target;
  const corners = [
    { x: obstacle.left - 1, y: obstacle.top - 1 },
    { x: obstacle.right + 1, y: obstacle.top - 1 },
    { x: obstacle.right + 1, y: obstacle.bottom + 1 },
    { x: obstacle.left - 1, y: obstacle.bottom + 1 },
  ].filter(
    (point) =>
      point.x >= viewport.left &&
      point.x <= viewport.right &&
      point.y >= viewport.top &&
      point.y <= viewport.bottom,
  );
  const points = [cab, target, ...corners];
  const distances = points.map(() => Infinity);
  const previous = [];
  const visited = new Set();
  distances[0] = 0;
  while (visited.size < points.length) {
    let current = -1;
    for (let i = 0; i < points.length; i++) {
      if (
        !visited.has(i) &&
        (current === -1 || distances[i] < distances[current])
      )
        current = i;
    }
    if (!Number.isFinite(distances[current])) return cab;
    if (current === 1) {
      let next = 1;
      while (previous[next] !== 0) next = previous[next];
      return points[next];
    }
    visited.add(current);
    for (let i = 0; i < points.length; i++) {
      if (
        visited.has(i) ||
        crossesObstacle(points[current], points[i], obstacle)
      )
        continue;
      const distance =
        distances[current] +
        Math.hypot(
          points[current].x - points[i].x,
          points[current].y - points[i].y,
        );
      if (distance < distances[i]) {
        distances[i] = distance;
        previous[i] = current;
      }
    }
  }
  return cab;
}

// Time-based easing keeps the cab's pace consistent across display refresh rates.
export function stepCab(cab, target, seconds) {
  const dx = target.x - cab.x;
  const dy = target.y - cab.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.5) return { ...cab, x: target.x, y: target.y };
  const amount = Math.min(
    1 - Math.exp(-1.8 * seconds),
    (210 * seconds) / distance,
  );
  const desiredAngle = Math.atan2(dy, dx);
  const turn = Math.atan2(
    Math.sin(desiredAngle - cab.angle),
    Math.cos(desiredAngle - cab.angle),
  );
  return {
    x: cab.x + dx * amount,
    y: cab.y + dy * amount,
    angle: cab.angle + turn * (1 - Math.exp(-7 * seconds)),
  };
}

export function trailOpacity(age) {
  return 0.45 * Math.max(0, 1 - age / TRAIL_LIFETIME) ** 2;
}
