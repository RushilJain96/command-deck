import type { FollowValueOptions } from "framer-motion";

/**
 * Named motion presets. Components must never inline magic spring numbers —
 * the feel of the whole app is tuned from this file.
 *
 * Do not mix the two spring option families: `bounce`/`duration` are silently
 * overridden whenever `stiffness`, `damping` or `mass` are present.
 */
export const SPRING = {
  /** Ship swinging to face a target. Weighty, settles without visible wobble. */
  shipRotation: { type: "spring", stiffness: 120, damping: 20, mass: 1.1 },
  /** Camera translation across the world. */
  cameraPan: { type: "spring", stiffness: 90, damping: 22, mass: 1 },
  /** Camera zoom. Slightly tighter than pan so the framing settles first. */
  cameraZoom: { type: "spring", stiffness: 110, damping: 24, mass: 1 },
  /** Small UI affordances: node highlight, focus rings, opacity. */
  ui: { type: "spring", stiffness: 300, damping: 30, mass: 0.6 },
} as const satisfies Record<string, FollowValueOptions>;

export type SpringPresetName = keyof typeof SPRING;

/**
 * Reduced-motion substitute. A zero-duration tween lands on the target value
 * within a single frame, so state stays correct while motion is removed.
 *
 * This is required because `useSpring`/`useFollowValue` do NOT consult
 * `<MotionConfig reducedMotion>` — that context is only read by the declarative
 * `animate`/`whileHover` path on motion components. Any imperatively-driven
 * value must swap its options explicitly.
 */
export const INSTANT = { type: "tween", duration: 0 } as const satisfies FollowValueOptions;

/** Idle drift of the spacecraft. Rotation only — the ship must never translate. */
export const IDLE_DRIFT = {
  rotate: [-1.6, 1.6],
  transition: {
    duration: 7,
    repeat: Infinity,
    repeatType: "mirror",
    ease: "easeInOut",
  },
} as const;
