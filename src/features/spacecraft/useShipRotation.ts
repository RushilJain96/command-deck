"use client";

import { useEffect } from "react";
import { useFollowValue, useMotionValue, type MotionValue } from "framer-motion";
import { nearestEquivalentAngle } from "@/lib/math/angle";
import { useMotionPreset } from "@/lib/motion/useMotionPreset";

/**
 * Springs the ship's heading toward `targetTheta` (degrees clockwise from
 * screen-up), always taking the short way around.
 *
 * A `null` target means "hold current heading". The ship keeps facing wherever
 * it was last aimed rather than snapping back to north, which would read as the
 * ship being yanked every time the pointer leaves a node.
 *
 * The accumulator is a MotionValue rather than a ref for two reasons:
 *
 *  1. Reading `ref.current` during render violates `react-hooks/refs`, which is
 *     active here via eslint-config-next's compiler-backed rule set, and is a
 *     genuine hazard under the React Compiler.
 *  2. `useFollowValue`/`useSpring` only honour `skipInitialAnimation` on the
 *     MotionValue-source branch; with a plain number source the flag is
 *     silently ignored.
 *
 * Unwrapping is accumulated against the last committed *target*, never against
 * the spring's live value: the spring overshoots, and an overshoot past the
 * target would flip the chosen direction when switching nodes mid-flight.
 */
export function useShipRotation(targetTheta: number | null): MotionValue<number> {
  const preset = useMotionPreset("shipRotation");

  // Continuous, unwrapped heading. Grows past 360 or below 0 by design.
  const unwrappedTarget = useMotionValue(0);
  const rotation = useFollowValue(unwrappedTarget, preset);

  useEffect(() => {
    if (targetTheta === null) return;
    unwrappedTarget.set(nearestEquivalentAngle(unwrappedTarget.get(), targetTheta));
  }, [targetTheta, unwrappedTarget]);

  return rotation;
}
