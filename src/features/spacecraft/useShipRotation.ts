"use client";

import { useEffect } from "react";
import { useAnimationFrame, useMotionValue, useReducedMotion, type MotionValue } from "framer-motion";
import { nearestEquivalentAngle } from "@/lib/math/angle";
import { FLIGHT } from "@/lib/motion/springs";

/**
 * The spacecraft's attitude controller.
 *
 * Steers the hull toward `targetTheta` (degrees clockwise from screen-up), always
 * taking the short way around. A `null` target means "hold current heading" — the
 * ship keeps the bearing it was last given rather than snapping back to north,
 * which would read as the vehicle being yanked every time the pointer leaves a
 * node.
 *
 * WHY THIS IS AN INTEGRATOR AND NOT A SPRING. See the note on FLIGHT in
 * springs.ts for the reasoning; the short version is that a spring's rate is
 * proportional to remaining error, so it is fastest at the instant it departs and
 * slowest as it arrives. That is the signature of an easing curve. A vehicle
 * under attitude control builds rate against an acceleration limit, holds a
 * cruise rate, and sheds it on a profile computed to reach the target with zero
 * rate — so the fast part is the MIDDLE. Everything about the perceived weight
 * comes from that reordering.
 *
 * ALL THREE OUTPUTS ARE INTEGRATED IN ONE PASS. The bank and the exhaust used to
 * be separate springs stacked on the heading, which meant three independent
 * second-order systems whose phase relationship depended on how far the ship
 * happened to be turning. Deriving all three from one state update makes the
 * coordination exact and turn-size-independent, which is what "coordinated" has
 * to mean if it means anything.
 *
 * MOTIONVALUE DISCIPLINE. Every `get`/`set` below happens inside the animation
 * frame callback or an effect — never during render. MotionValues are mutable
 * external state and the React Compiler is entitled to memoise this component and
 * never re-read them. That is also why the controller's own state (heading, rate)
 * lives in MotionValues rather than refs: reading `ref.current` during render
 * trips `react-hooks/refs`, which is active here.
 */
export interface ShipRotation {
  /** Hull heading, degrees. */
  readonly rotation: MotionValue<number>;
  /**
   * Exhaust heading. A fixed-time lag on the hull's ACTUAL heading, so the plume
   * trails by a constant few frames instead of by an amount that grows with the
   * size of the turn.
   */
  readonly plume: MotionValue<number>;
  /**
   * Roll into the turn, degrees.
   *
   * Driven by the COMMANDED rate rather than the achieved one, so the roll leads
   * the heading on entry and trails it on exit. A bank that is merely
   * proportional to current rate arrives and leaves exactly with the turn, which
   * reads as the whole image rotating rather than as a vehicle banking into it.
   */
  readonly bank: MotionValue<number>;
}

/** Never integrate a stall. A backgrounded tab returns multi-second deltas. */
const MAX_STEP_MS = 64;

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

export function useShipRotation(targetTheta: number | null): ShipRotation {
  const shouldReduceMotion = useReducedMotion();

  // Commanded heading. Continuous and unwrapped — grows past 360 or below 0 by
  // design, so a turn from 350 to 10 travels +20 rather than -340.
  const command = useMotionValue(0);

  const rotation = useMotionValue(0);
  const plume = useMotionValue(0);
  const bank = useMotionValue(0);
  /** Angular rate, deg/s. The controller's only hidden state. */
  const rate = useMotionValue(0);

  useEffect(() => {
    if (targetTheta === null) return;
    // Unwrap against the last COMMANDED heading, never the live one: the vehicle
    // may be mid-slew, and unwrapping against a moving value can flip the chosen
    // direction when the pointer crosses several nodes quickly.
    command.set(nearestEquivalentAngle(command.get(), targetTheta));
  }, [targetTheta, command]);

  useAnimationFrame((_, deltaMs) => {
    const goal = command.get();

    if (shouldReduceMotion) {
      // Reduced motion has to be handled HERE. `<MotionConfig reducedMotion>`
      // only reaches the declarative animate/whileHover path, and this loop is
      // neither — the preference would otherwise be silently ignored, which is
      // the same trap `useSpring` falls into and the reason `useMotionPreset`
      // exists for the camera.
      if (rotation.get() !== goal) {
        rotation.set(goal);
        plume.set(goal);
        rate.set(0);
        bank.set(0);
      }
      return;
    }

    const dt = Math.min(deltaMs, MAX_STEP_MS) / 1000;
    if (dt <= 0) return;

    const heading = rotation.get();
    const error = goal - heading;
    const magnitude = Math.abs(error);
    const current = rate.get();

    // On station: snap the residue away so the loop can go quiet, rather than
    // hunting a hundredth of a degree forever.
    if (
      magnitude < FLIGHT.arriveDeg &&
      Math.abs(current) < FLIGHT.arriveRate &&
      Math.abs(plume.get() - goal) < FLIGHT.arriveDeg &&
      Math.abs(bank.get()) < FLIGHT.arriveDeg
    ) {
      if (heading !== goal) {
        rotation.set(goal);
        plume.set(goal);
        rate.set(0);
        bank.set(0);
      }
      return;
    }

    // COMMANDED RATE. Outside the band this is the fastest rate from which the
    // vehicle can still stop exactly on target; inside it, a proportional law
    // that actually converges. `FLIGHT.gain` is derived so the two agree at the
    // boundary and the handoff has no kink.
    const commandedRate =
      magnitude <= FLIGHT.band
        ? error * FLIGHT.gain
        : Math.sign(error) * Math.min(FLIGHT.maxRate, Math.sqrt(2 * FLIGHT.decel * magnitude));

    // RATE IS SLEW-LIMITED, WHICH IS WHERE THE MASS COMES FROM. The vehicle
    // cannot adopt a new rate instantly; it has to accelerate into it. Building
    // rate is limited by `accel`; shedding it draws on the larger
    // `brakeAuthority`, which is the reserve that lets the controller erase the
    // one-frame lag behind its own deceleration curve.
    const slowing = Math.abs(commandedRate) < Math.abs(current);
    const authority = (slowing ? FLIGHT.brakeAuthority : FLIGHT.accel) * dt;
    const next = current + clamp(commandedRate - current, authority);

    // THE VEHICLE MAY NEVER ROTATE PAST ITS TARGET IN A SINGLE STEP. Everything
    // above is a continuous-time plan being run at whatever cadence the browser
    // grants; on a long frame the planned step can exceed what remains. Clamping
    // the applied step to the residual error makes zero overshoot a property of
    // the integrator rather than a hope about the tuning, at any frame rate.
    // When it engages, the rate is rewritten to what was actually achieved so the
    // bank and the next frame both see the truth.
    const planned = next * dt;
    const applied = Math.abs(planned) > magnitude ? error : planned;
    if (applied !== planned) rate.set(applied / dt);
    else rate.set(next);
    rotation.set(heading + applied);

    // First-order lags, exponential so they are frame-rate independent. A naive
    // `value += (target - value) * k` with fixed k changes its time constant
    // whenever the frame rate does, which makes the ship feel different on a
    // 120Hz panel.
    const bankTarget = clamp(commandedRate / FLIGHT.bankAt, 1) * FLIGHT.bankMax;
    bank.set(bank.get() + (bankTarget - bank.get()) * (1 - Math.exp(-dt / FLIGHT.bankTau)));
    plume.set(plume.get() + (rotation.get() - plume.get()) * (1 - Math.exp(-dt / FLIGHT.plumeTau)));
  });

  return { rotation, plume, bank };
}
