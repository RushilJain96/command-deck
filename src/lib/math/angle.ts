/**
 * The only place trigonometry lives.
 *
 * ANGLE CONVENTION — every angle in this app is:
 *   - in DEGREES (never radians)
 *   - measured CLOCKWISE from screen-up (12 o'clock)
 *
 * This is chosen to match CSS `rotate()` and Framer Motion's `rotate` exactly,
 * which are both clockwise-positive. Because the spacecraft SVG is authored
 * nose-up, a mission's theta can be fed straight into `rotate` with no offset
 * constant. If you find yourself adding a "nose offset" fudge factor, the
 * convention has been broken somewhere.
 */

export interface Point {
  x: number;
  y: number;
}

const DEG_PER_RAD = 180 / Math.PI;

/**
 * Angle from `from` to `to`, in this module's convention.
 *
 * Note the deliberately swapped and negated arguments to `atan2`. The standard
 * `atan2(dy, dx)` is counter-clockwise from the +x axis in a y-up space; screen
 * space is y-down and we measure clockwise from -y, so `atan2(dx, -dy)` is the
 * direct equivalent. Do not "fix" this to the textbook form.
 *
 * The spacecraft sits at the world origin in Sprint 1, so a mission's angle is
 * simply its own theta and this function is not needed on the hover path. It
 * exists for when the ship leaves the origin.
 */
export function angleTo(from: Point, to: Point): number {
  return Math.atan2(to.x - from.x, -(to.y - from.y)) * DEG_PER_RAD;
}

/**
 * Signed shortest rotation from `from` to `to`, in the range (-180, 180].
 *
 * An exact 180 degree opposition maps to -180, so the tie is broken
 * deterministically and the ship always turns the same way rather than
 * jittering between the two equally-short paths.
 */
export function shortestDelta(from: number, to: number): number {
  return (((to - from + 180) % 360) + 360) % 360 - 180;
}

/**
 * The representation of `target` that is closest to `current` on the number
 * line, so a spring animating from `current` takes the short way around.
 *
 * Feeding raw angles to a spring makes 350deg -> 10deg travel -340deg the long
 * way. Accumulating through this function instead yields a continuous,
 * unwrapped value (which may grow past 360 or below 0 — that is intended and
 * safe at float64 precision).
 *
 * `current` must be the last committed *target*, not the spring's live value:
 * spring overshoot can push the live value past the target and flip the chosen
 * direction mid-flight when hovering between nodes quickly.
 */
export function nearestEquivalentAngle(current: number, target: number): number {
  return current + shortestDelta(current, target);
}
