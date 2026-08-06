import type { FollowValueOptions } from "framer-motion";

/**
 * Named motion presets. Components must never inline magic spring numbers —
 * the feel of the whole app is tuned from this file.
 *
 * Do not mix the two spring option families: `bounce`/`duration` are silently
 * overridden whenever `stiffness`, `damping` or `mass` are present.
 */
export const SPRING = {
  /** Camera translation across the world. */
  cameraPan: { type: "spring", stiffness: 90, damping: 22, mass: 1 },
  /**
   * Camera zoom. Deliberately slack — the arrival at the deck should feel like
   * a vehicle settling into position, and a stiff spring reads as a UI
   * transition rather than as coming to rest somewhere.
   */
  cameraZoom: { type: "spring", stiffness: 46, damping: 20, mass: 1.25 },
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

/**
 * ATTITUDE CONTROL LIMITS FOR THE SPACECRAFT.
 *
 * NOT A SPRING, AND THAT IS THE POINT. The hull used to chase its bearing on a
 * second-order spring, which is a perfectly good way to animate a number and a
 * poor way to fly a vehicle: a spring's rate is proportional to how far it still
 * has to go, so the ship left instantly at full speed and crept the last few
 * degrees. Read as motion, that is an interpolation easing out — the thing the
 * eye identifies as UI rather than as flight.
 *
 * A vehicle under attitude control does the opposite. It has a maximum slew rate
 * it will not exceed and a maximum angular acceleration it can apply, so it
 * BUILDS rate, HOLDS it across the bulk of the turn, and sheds it on a computed
 * deceleration profile that arrives at the target with zero rate. Same
 * destination, same order of magnitude of time, completely different reading:
 * mass at the start, authority in the middle, precision at the end.
 *
 * The deceleration profile is the classic time-optimal one — the fastest rate
 * from which the vehicle can still stop exactly on target is
 * `sqrt(2 * decel * error)`, so commanding `min(maxRate, that)` yields a
 * trapezoidal slew with NO overshoot by construction. Nothing here needs to be
 * damped, because nothing here is ever given the chance to oscillate.
 *
 * DECEL IS HIGHER THAN ACCEL ON PURPOSE. Easing into a turn and braking out of
 * it more firmly is what makes an arrival read as commanded rather than as
 * coasting to a halt. The asymmetry is small enough that nobody sees it
 * directly; they just report that the ship "stops where it means to".
 */
export const FLIGHT = {
  /** Cruise slew rate, deg/s. The flat top of the trapezoid. */
  maxRate: 165,
  /** Angular acceleration entering a turn, deg/s^2. Lower = heavier. */
  accel: 620,
  /**
   * Deceleration used to PLAN the approach — the curve the controller aims to
   * fly, not the most it can do.
   */
  decel: 560,
  /**
   * Maximum rate-of-change while slowing, deg/s^2. DELIBERATELY LARGER THAN
   * `decel`, and this margin is the whole reason arrivals are clean.
   *
   * The deceleration profile is exact only for continuous control. Sampled once
   * a frame, the achieved rate lags the commanded one by up to `decel * dt` —
   * about 9 deg/s at 60Hz but 36 deg/s if a frame takes 64ms — and a vehicle
   * travelling faster than its own braking curve allows will pass the target.
   * Measured at 4.8deg of overshoot on a 66deg turn before this existed.
   *
   * Planning against 560 while retaining 900 of authority means the controller
   * is always holding brake in reserve to erase that lag. Real guidance systems
   * size this margin the same way and for the same reason.
   */
  brakeAuthority: 900,
  /**
   * Inside this many degrees the controller switches from the deceleration
   * profile to a plain proportional law.
   *
   * REQUIRED FOR SETTLING, not a nicety. `sqrt` has infinite slope at zero, so
   * near the target the commanded rate stays large enough to step clean over the
   * arrival window every frame and the ship hunts around the bearing forever at
   * about a tenth of a degree. Invisible, but it never settles and it never lets
   * the frame loop go quiet.
   */
  band: 3,
  /**
   * Proportional gain inside the band, 1/s. Derived, not chosen:
   * `sqrt(2 * decel * band) / band` makes the commanded rate continuous across
   * the handoff. Pick it freely and there is a visible kink in the approach.
   */
  gain: Math.sqrt(2 * 560 * 3) / 3,
  /** Below both of these the vehicle is considered on station and snaps. */
  arriveDeg: 0.05,
  arriveRate: 0.8,

  /**
   * Roll, in degrees at full deflection, and the slew rate that earns it.
   *
   * SEVEN CAME DOWN TO FOUR. The frames are rendered yaw-only, so this rolls a
   * 2D image; past a few degrees it stops reading as an airframe banking and
   * starts reading as the picture tilting. Four is under the threshold at which
   * anyone can name it and still enough to make a turn feel coordinated, which
   * is the whole brief for this channel.
   */
  bankMax: 4,
  bankAt: 120,
  /**
   * Roll lag, seconds. The bank chases the COMMANDED rate rather than the actual
   * one, so it leads the heading slightly on the way in and trails it on the way
   * out — roll first, heading follows, level out last, which is the order a real
   * airframe does it in.
   */
  bankTau: 0.13,
  /**
   * Exhaust lag, seconds. A first-order lag on the hull's ACTUAL heading, so the
   * plume trails by a fixed time rather than by an amount that varies with turn
   * size. During cruise that resolves to a constant offset of `tau * rate`,
   * which is exactly the read wanted: the nose stabilises first and the exhaust
   * swings in behind it.
   */
  plumeTau: 0.085,
} as const;
