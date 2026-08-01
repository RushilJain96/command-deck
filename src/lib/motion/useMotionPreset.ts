"use client";

import { useReducedMotion, type FollowValueOptions } from "framer-motion";
import { INSTANT, SPRING, type SpringPresetName } from "./springs";

/**
 * Resolves a named preset against the user's reduced-motion preference.
 *
 * Hydration-safe by construction: `useReducedMotion()` returns `null` on the
 * server and a boolean on the client's first render, so the two disagree. That
 * is harmless here because the result only ever feeds animation *options* —
 * never markup, className or a MotionValue's initial value — so the rendered
 * DOM is byte-identical either way. Never branch rendered output on this hook.
 *
 * Note that the underlying hook reads the media query once at mount and does
 * not live-update, despite what its docstring claims.
 */
export function useMotionPreset(name: SpringPresetName): FollowValueOptions {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion ? INSTANT : SPRING[name];
}
