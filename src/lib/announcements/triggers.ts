/**
 * Trigger hooks: when should a single announcement actually mount in its placement?
 *
 * Each hook returns a boolean ("ready"). Provider mounts placement renderers
 * unconditionally; renderers consult the appropriate hook to decide visibility.
 */
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import type { Trigger, Announcement, Placement } from "./schemas";
import { pathMatches } from "./targeting";

export function useDelay(ms: number | undefined): boolean {
  const [ready, setReady] = useState(!ms || ms <= 0);
  useEffect(() => {
    if (!ms || ms <= 0) {
      setReady(true);
      return;
    }
    const t = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return ready;
}

export function useScrollPercent(percent: number | undefined): boolean {
  const target = percent ?? 50;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => {
      const doc = document.documentElement;
      const height = doc.scrollHeight - window.innerHeight;
      if (height <= 0) {
        setReady(true);
        return;
      }
      const pct = (window.scrollY / height) * 100;
      if (pct >= target) {
        setReady(true);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [target]);
  return ready;
}

export function useIdle(seconds: number | undefined): boolean {
  const target = (seconds ?? 30) * 1000;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: number;
    const reset = () => {
      window.clearTimeout(timer);
      if (!ready) {
        timer = window.setTimeout(() => setReady(true), target);
      }
    };
    const events = ["mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [target, ready]);
  return ready;
}

/**
 * Exit-intent: mouse leaves through the top edge (desktop) OR scrolls up
 * quickly past a threshold (mobile/touch fallback).
 */
export function useExitIntent(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastScrollY = window.scrollY;
    let lastScrollT = Date.now();

    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) setReady(true);
    };
    const onScroll = () => {
      const now = Date.now();
      const dy = window.scrollY - lastScrollY;
      const dt = now - lastScrollT;
      // Fast upward scroll near top of page = touch exit-intent proxy
      if (dy < -50 && dt < 300 && window.scrollY < 200) {
        setReady(true);
      }
      lastScrollY = window.scrollY;
      lastScrollT = now;
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return ready;
}

export function useRouteMatch(patterns: string[] | undefined): boolean {
  const location = useLocation();
  if (!patterns || patterns.length === 0) return true;
  return patterns.some((p) => pathMatches(p, location.pathname));
}

/**
 * Resolve the effective trigger for (announcement, placement): per-placement
 * presentation.trigger overrides row-level trigger.
 */
export function resolveTrigger(a: Announcement, placement: Placement): Trigger {
  const perPlace = a.presentation?.[placement]?.trigger;
  return perPlace ?? a.trigger ?? { type: "on_load" };
}

/**
 * Single hook combining all trigger types. Returns true once the trigger fires.
 *
 * NOTE: The hooks below run unconditionally to satisfy React's rules of hooks;
 * only the relevant value is returned based on `trigger.type`.
 */
export function useTriggerReady(a: Announcement, placement: Placement): boolean {
  const trigger = resolveTrigger(a, placement);
  const delayReady = useDelay(trigger.type === "delay" ? trigger.value : 0);
  const scrollReady = useScrollPercent(trigger.type === "scroll_percent" ? trigger.value : undefined);
  const idleReady = useIdle(trigger.type === "idle" ? trigger.value : undefined);
  const exitReady = useExitIntent();
  const routeReady = useRouteMatch(a.page_rules?.include);

  switch (trigger.type) {
    case "on_load":
      return true;
    case "delay":
      return delayReady;
    case "scroll_percent":
      return scrollReady;
    case "idle":
      return idleReady;
    case "exit_intent":
      return exitReady;
    case "route_match":
      return routeReady;
    default:
      return true;
  }
}

// Memo callback to keep dependency arrays stable.
export const noopCallback = () => {};
export const _useCallback = useCallback;
