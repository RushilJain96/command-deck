"use client";

import { useEffect } from "react";
import {
  useFollowValue,
  useMotionValue,
  useTransform,
  useVelocity,
  type MotionValue,
} from "framer-motion";
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
export interface ShipRotation {
  /** Hull heading. */
  readonly rotation: MotionValue<number>;
  /**
   * Exhaust heading. Chases the same unwrapped target through a slacker spring,
   * so it trails the hull by a few frames and settles after it. Deriving it
   * from the same source rather than from `rotation` keeps the lag constant
   * instead of compounding two springs in series.
   */
  readonly plume: MotionValue<number>;
  /**
   * Roll into the turn, in degrees, derived from how fast the hull is currently
   * swinging.
   *
   * THIS IS WHAT GIVES THE SHIP MASS. A sprite that changes heading and nothing
   * else reads as a cursor being dragged: it has orientation but no inertia,
   * because every part of it arrives at once. A real airframe rolls into the
   * turn first, carries the bank through it, and levels out after the heading
   * has settled — so the roll leads on the way in and trails on the way out.
   *
   * Velocity gives that for free and for the right reason: it peaks mid-turn,
   * crosses zero exactly when the heading stops changing, and — because the
   * heading spring is deliberately underdamped — briefly reverses as the hull
   * settles, which produces a small counter-roll on arrival. That overshoot is
   * the single most convincing part of the effect, and it is not authored.
   */
  readonly bank: MotionValue<number>;
}

/**
 * Degrees of roll at full deflection, and the angular speed (deg/sec) that
 * reaches it.
 *
 * Kept small on purpose. The frames are rendered yaw-only, so this rolls a 2D
 * image — past about 8deg the illusion breaks and it reads as the whole picture
 * tilting rather than the aircraft banking.
 */
const BANK_MAX = 7;
const BANK_AT = 150;

export function useShipRotation(targetTheta: number | null): ShipRotation {
  const preset = useMotionPreset("shipRotation");
  const lagPreset = useMotionPreset("plumeLag");
  const bankPreset = useMotionPreset("shipBank");

  // Continuous, unwrapped heading. Grows past 360 or below 0 by design.
  const unwrappedTarget = useMotionValue(0);
  const rotation = useFollowValue(unwrappedTarget, preset);
  const plume = useFollowValue(unwrappedTarget, lagPreset);

  // Raw angular velocity is spiky — it inherits every frame-to-frame jitter in
  // the spring. Smoothing it through a second spring is what turns it from a
  // measurement into a motion, and lets the roll settle on its own timescale
  // rather than snapping to zero the instant the heading stops.
  const angularVelocity = useVelocity(rotation);
  const smoothed = useFollowValue(angularVelocity, bankPreset);

  // Turning starboard raises the heading, so a positive rate rolls the hull
  // clockwise — right wing down, into the turn. Clamped, because a fast flick
  // across the deck would otherwise produce a roll the frames cannot support.
  const bank = useTransform(smoothed, (rate) => {
    const deflection = (rate / BANK_AT) * BANK_MAX;
    return Math.max(-BANK_MAX, Math.min(BANK_MAX, deflection));
  });

  useEffect(() => {
    if (targetTheta === null) return;
    unwrappedTarget.set(nearestEquivalentAngle(unwrappedTarget.get(), targetTheta));
  }, [targetTheta, unwrappedTarget]);

  return { rotation, plume, bank };
}
