import { useEffect, useRef } from "react";

const surfaces = [
  ".button:not(:disabled)",
  ".icon-button:not(:disabled)",
  ".side-nav > button",
  ".login-card",
  ".step",
  ".ride-card",
  ".search-panel",
  ".request-card",
  ".sidebar-promo",
  ".modal",
].join(", ");

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const glow = glowRef.current;
    let frame = 0;
    let latestPointer;
    let activeSurface = null;

    function clearSurface() {
      if (!activeSurface) return;
      activeSurface.removeAttribute("data-cursor-glow");
      activeSurface.style.removeProperty("--mouse-x");
      activeSurface.style.removeProperty("--mouse-y");
      activeSurface = null;
    }

    function hide() {
      window.cancelAnimationFrame(frame);
      frame = 0;
      glow.classList.remove("is-active");
      clearSurface();
    }

    function paint() {
      frame = 0;
      const { x, y, target } = latestPointer;
      glow.style.transform = `translate3d(${x - 110}px, ${y - 110}px, 0)`;
      glow.classList.add("is-active");

      const surface = target.closest(surfaces);
      if (surface !== activeSurface) {
        clearSurface();
        activeSurface = surface;
      }
      if (!activeSurface) return;

      const bounds = activeSurface.getBoundingClientRect();
      activeSurface.style.setProperty("--mouse-x", `${x - bounds.left}px`);
      activeSurface.style.setProperty("--mouse-y", `${y - bounds.top}px`);
      activeSurface.setAttribute("data-cursor-glow", "active");
    }

    function move(event) {
      if (
        !pointer.matches ||
        reducedMotion.matches ||
        event.pointerType === "touch" ||
        !(event.target instanceof Element)
      ) {
        hide();
        return;
      }
      latestPointer = {
        x: event.clientX,
        y: event.clientY,
        target: event.target,
      };
      if (!frame) frame = window.requestAnimationFrame(paint);
    }

    function leave(event) {
      if (!event.relatedTarget) hide();
    }

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave);
    document.addEventListener("scroll", hide, { passive: true, capture: true });
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    pointer.addEventListener("change", hide);
    reducedMotion.addEventListener("change", hide);

    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("scroll", hide, true);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
      pointer.removeEventListener("change", hide);
      reducedMotion.removeEventListener("change", hide);
    };
  }, []);

  return <div className="cursor-glow" ref={glowRef} aria-hidden="true" />;
}
