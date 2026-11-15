import { useEffect, useRef } from "react";
import {
  TRAIL_LIFETIME,
  avoidObstacle,
  cabWaypoint,
  stepCab,
  takeDelayedTarget,
  trailOpacity,
} from "./cursorCabMotion";

export default function CursorCab() {
  const overlayRef = useRef(null);
  const cabRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const overlay = overlayRef.current;
    const canvas = trailRef.current;
    const context = canvas.getContext("2d");
    let frame = 0;
    let lastFrame = 0;
    let history = [];
    let cab = null;
    let target = null;
    let trail = [];
    const loginCard = document.querySelector(".login-card");

    function boundaries() {
      const bounds = loginCard?.getBoundingClientRect();
      return {
        viewport: {
          left: 36,
          top: 36,
          right: window.innerWidth - 36,
          bottom: window.innerHeight - 36,
        },
        // A rotating cab fits inside a 32px radius; add breathing room as well.
        obstacle: bounds
          ? {
              left: bounds.left - 36,
              top: bounds.top - 36,
              right: bounds.right + 36,
              bottom: bounds.bottom + 36,
            }
          : null,
      };
    }

    function hide() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      cab = null;
      target = null;
      history = [];
      trail = [];
      overlay.classList.remove("is-active");
      context?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    function resize() {
      hide();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function paintCab() {
      cabRef.current.style.transform = `translate3d(${cab.x - 26}px, ${cab.y - 17}px, 0) rotate(${cab.angle}rad)`;
    }

    function paintTrail(now) {
      trail = trail.filter((segment) => now - segment.at < TRAIL_LIFETIME);
      if (!context) return;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.lineWidth = 1.8;
      context.lineCap = "round";
      context.save();
      const bounds = loginCard?.getBoundingClientRect();
      if (bounds) {
        context.beginPath();
        context.rect(0, 0, window.innerWidth, window.innerHeight);
        context.rect(
          bounds.left - 8,
          bounds.top - 8,
          bounds.width + 16,
          bounds.height + 16,
        );
        context.clip("evenodd");
      }
      for (const segment of trail) {
        context.strokeStyle = `rgba(255, 170, 91, ${trailOpacity(now - segment.at)})`;
        for (const side of [-1, 1]) {
          const track = (position) => ({
            x:
              position.x -
              Math.cos(position.angle) * 19 -
              Math.sin(position.angle) * side * 9,
            y:
              position.y -
              Math.sin(position.angle) * 19 +
              Math.cos(position.angle) * side * 9,
          });
          const from = track(segment.from);
          const to = track(segment.to);
          context.beginPath();
          context.moveTo(from.x, from.y);
          context.lineTo(to.x, to.y);
          context.stroke();
        }
      }
      context.restore();
    }

    function animate(now) {
      frame = 0;
      const seconds = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
      lastFrame = now;
      const delayed = takeDelayedTarget(history, now);
      if (delayed) target = delayed;
      const { obstacle, viewport } = boundaries();
      cab = { ...cab, ...avoidObstacle(cab, obstacle, viewport) };
      let moving = false;
      if (target) {
        const previous = cab;
        const goal = avoidObstacle(target, obstacle, viewport);
        const waypoint = cabWaypoint(cab, goal, obstacle, viewport);
        cab = stepCab(cab, waypoint, seconds);
        moving =
          waypoint !== previous &&
          Math.hypot(goal.x - cab.x, goal.y - cab.y) > 0.5;
        if (Math.hypot(cab.x - previous.x, cab.y - previous.y) > 0.1) {
          trail.push({ from: previous, to: cab, at: now });
        }
      }
      paintCab();
      paintTrail(now);
      if (history.length || moving || trail.length) {
        frame = window.requestAnimationFrame(animate);
      } else {
        lastFrame = 0;
      }
    }

    function move(event) {
      if (
        !pointer.matches ||
        reducedMotion.matches ||
        event.pointerType === "touch"
      ) {
        hide();
        return;
      }
      // Park just beside the pointer so the cab never obscures the current control.
      history.push({
        x: event.clientX - 30,
        y: event.clientY + 28,
        at: performance.now(),
      });
      if (!cab) {
        cab = {
          x: 56,
          y: Math.max(24, window.innerHeight - 56),
          angle: -Math.PI / 2,
        };
        const { obstacle, viewport } = boundaries();
        cab = { ...cab, ...avoidObstacle(cab, obstacle, viewport) };
        paintCab();
      }
      overlay.classList.add("is-active");
      if (!frame) frame = window.requestAnimationFrame(animate);
    }

    function leave(event) {
      if (!event.relatedTarget) hide();
    }

    resize();
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave);
    document.addEventListener("scroll", hide, { passive: true, capture: true });
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("resize", resize);
    window.addEventListener("blur", hide);
    pointer.addEventListener("change", hide);
    reducedMotion.addEventListener("change", hide);
    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("scroll", hide, true);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", hide);
      pointer.removeEventListener("change", hide);
      reducedMotion.removeEventListener("change", hide);
    };
  }, []);

  return (
    <div className="cursor-cab-overlay" ref={overlayRef} aria-hidden="true">
      <canvas className="cursor-cab-trail" ref={trailRef} />
      <svg className="cursor-cab" ref={cabRef} viewBox="0 0 52 34" fill="none">
        <rect
          x="9"
          y="2"
          width="10"
          height="5"
          rx="2"
          fill="#161515"
          stroke="#75604b"
        />
        <rect
          x="34"
          y="2"
          width="10"
          height="5"
          rx="2"
          fill="#161515"
          stroke="#75604b"
        />
        <rect
          x="9"
          y="27"
          width="10"
          height="5"
          rx="2"
          fill="#161515"
          stroke="#75604b"
        />
        <rect
          x="34"
          y="27"
          width="10"
          height="5"
          rx="2"
          fill="#161515"
          stroke="#75604b"
        />
        <path
          d="M8 6H40C46 6 49 10 49 17S46 28 40 28H8C4 28 2 24 2 17S4 6 8 6Z"
          fill="#f6a347"
          stroke="#ffd394"
          strokeWidth="1.2"
        />
        <path
          d="M17 8H32L36 11V23L32 26H17L13 23V11L17 8Z"
          fill="#322720"
          stroke="#b96e30"
        />
        <path
          d="M32 10L35 12V22L32 24V10ZM16 10V24L13.5 22V12L16 10Z"
          fill="#93b6ba"
          fillOpacity=".8"
        />
        <rect x="19" y="10" width="11" height="14" rx="2" fill="#ffd080" />
        <path d="M20 11H29M20 23H29" stroke="#fff0c5" strokeWidth="1.2" />
        <text
          x="24.5"
          y="18.8"
          textAnchor="middle"
          fontSize="4.2"
          fontWeight="800"
          fontFamily="sans-serif"
          fill="#4d2a16"
        >
          TAXI
        </text>
        <path
          d="M46 10V13M46 21V24"
          stroke="#fff3c7"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M5 10V13M5 21V24"
          stroke="#c64f2b"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M39 9V25M9 9V25" stroke="#c07832" strokeOpacity=".7" />
        <path
          d="M27 5V3M27 29V31"
          stroke="#ffd394"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
