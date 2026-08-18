"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { SHIP_PIXELS } from "./shipFrames";

/**
 * Distance from the sprite box's centre up to the painted nose, in CSS pixels.
 *
 * Measured off the alpha channel and recorded in `shipFrames.ts`: the silhouette
 * spans 0.333-0.703 of the frame vertically, so the nose is 0.167 of the box
 * above its middle. Derived from SHIP_PIXELS rather than written down, so it
 * tracks the hull if the sprite is ever resized.
 */
const NOSE_OFFSET = Math.round(SHIP_PIXELS * (0.5 - 0.333));

/**
 * A hairline running from the spacecraft out to whatever the operator is
 * pointing at.
 *
 * This is the element that makes the deck legible as a system rather than as
 * decoration. Without it the ship is an icon that happens to spin and the
 * panels are cards that happen to sit in a circle; with it, the relationship
 * between them is drawn on screen — the ship is aiming, the ring is a bearing
 * scale, and the panel is the thing being sighted.
 *
 * It shares the SAME MotionValue that rotates the ship, so the two can never
 * disagree: no second spring, no second source of truth, and no extra React
 * renders. The vector inherits the ship's easing for free, which is why it
 * feels attached rather than synchronised.
 *
 * LENGTH IS PER-TARGET. The ship no longer sits at the centre of the plane, so
 * "one orbit radius" is not the distance to anything in particular — missions
 * ride four different rings at ship-relative ranges from 0.57R to 1.08R. The
 * line has to stop AT the target: one that overshoots reads as a beam fired
 * past it, and one that falls short reads as broken. `range` comes from the
 * same placement record that supplied the heading, so the two cannot drift.
 */
export function BearingVector({
  rotation,
  engaged,
  range,
}: {
  rotation: MotionValue<number>;
  engaged: boolean;
  /** Ship-to-target distance, in units of `--orbit-radius`. */
  range: number;
}) {
  /**
   * STOPS AT THE CARD'S BOTTOM EDGE.
   *
   * `range` is already the distance to the card's bottom-MIDDLE, because
   * BEAM_TARGET_DROP aims the whole heading there rather than at the centre. So
   * all that is left here is a small clearance gap, which is what
   * `--card-beam-standoff` now holds.
   *
   * IT USED TO CARRY A `1/cos(bearing)` CORRECTION AND THAT WAS THE WRONG FIX.
   * While the heading pointed at the card's CENTRE, shortening the beam could
   * only walk the tip back along that same line — so on a slanted bearing it
   * exited through the corner facing the ship, not the bottom edge. Measured on
   * FORGE, the tip landed 9px outside the bottom-right corner. Correcting the
   * HEADING removes the problem at its source and this becomes a plain gap.
   *
   * A CSS variable rather than a number because the gap steps by tier while
   * --orbit-radius varies continuously; `calc()` mixes them without JS ever
   * measuring the viewport.
   *
   * `max()` guards the degenerate case: a target closer than the gap collapses
   * the beam to zero rather than inverting it.
   */
  /**
   * THE BEAM STARTS AT THE NOSE, NOT AT THE SHIP'S ANCHOR.
   *
   * This element sits at the spacecraft's world origin, which is the CENTRE of
   * the sprite box — and the sprite carries a lot of transparent margin, so the
   * painted nose is `SHIP_PIXELS * (0.5 - 0.333)` above it. Drawing from the
   * origin meant the lower 96px of every beam was inside the hull, hidden behind
   * a ship that paints over it. On ORION, whose total run is only ~180px because
   * it sits closest of the six, that hid more than half the line and left a stub
   * floating under the card with nothing joining it to the vehicle.
   *
   * Lifting the origin AND shortening by the same amount keeps the tip exactly
   * where it was — on the card's bottom edge — and makes the whole line visible.
   */
  const lift = `${NOSE_OFFSET}px`;
  const length = `max(0px, calc(var(--orbit-radius) * ${range} - var(--card-beam-standoff) - ${lift}))`;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ rotate: rotation }}
    >
      {/* Drawn upward (-y) to match the nose-up ship, then rotated by the same
          heading.
          The gradient is deliberately DIM at the ship end and brightest near
          the target: a line that is hot where it leaves the hull reads as a
          weapon firing, whereas one that emerges faintly and resolves at the
          far end reads as a sight line being taken. Same geometry, completely
          different object.

          The length transition is slower than the fade so that switching
          targets sweeps rather than jumps. */}
      {/* DOTTED, NOT SOLID, AND THE DOTS ARE THE POINT.
          A continuous hairline is a beam — a thing that was fired. A broken one
          is a measurement, which is what a bearing is. The `repeating-linear-
          gradient` runs 3px lit against 6px clear, and the whole pattern is then
          multiplied by the along-length gradient in a mask, so the dots inherit
          the dim-at-the-hull, bright-at-the-target ramp rather than fighting it.

          THE GLOW IS A `drop-shadow`, AND THE NESTING IS WHAT MAKES IT WORK.
          A blurred duplicate of the line underneath was the first approach and
          it produced a soft red bar rather than glowing dashes — blurring a
          dashed pattern fills its own gaps in.

          `drop-shadow` is different in exactly the way that matters: it works
          off the ALPHA CHANNEL, so it traces each dash individually and leaves
          the gaps dark. Every dash gets its own halo and the line reads as a
          chain of lit points rather than a smear.

          But it has to sit INSIDE the mask, not beside it. CSS applies `filter`
          BEFORE `mask`, so a drop-shadow declared on the same element as the
          along-length ramp is computed from the unmasked shape and then clipped
          — which puts full-strength glow at the hull end where the line is
          supposed to be fading out. The wrapper owns the ramp; the inner
          element owns the dashes and their glow. */}
      {/* 3px WIDE AND MOSTLY LIT, UP FROM A 1px HAIRLINE THAT WAS MOSTLY GAP.
          The old ratio — 4px lit against 5px clear — read as a faint dotted
          measurement from any normal viewing distance, which was the intent at
          the time. It is now a beam that is supposed to be visibly ILLUMINATING
          the module at its far end, and light that arrives at a lit surface has
          to be brighter than the thing it lights. 7px lit against 5px clear
          keeps the broken character (so it is still a sight line rather than a
          solid bar) while roughly tripling the emitted area.

          The white-hot core is what sells it as a beam rather than a red line:
          a real emitter clips to white at its centre and falls to its hue at the
          edges, so the cross-gradient runs white through the middle 40%. */}
      <div
        className="absolute left-0 w-[3px] -translate-x-[1px] transition-[opacity,height] duration-500 ease-out"
        style={{
          bottom: lift,
          height: length,
          opacity: engaged ? 1 : 0,
          // THE FADE STARTS MUCH LOWER AND ENDS MUCH HIGHER. It used to run
          // `transparent -> 0.42 at 22% -> 0.85 at 70%`, which meant the bottom
          // fifth of the line was effectively gone — and since the ship-to-ORION
          // range is the shortest on the deck, that fifth was most of the visible
          // beam. What reached the eye was a stub floating under the card with no
          // apparent connection to the hull, which is the opposite of the job.
          //
          // 0.55 at 6% keeps a deliberate softening right at the nose (a beam
          // that starts at full strength on the hull reads as a weapon firing
          // rather than as a sight line being taken) while letting the line
          // actually reach it.
          maskImage:
            "linear-gradient(to top, rgb(0 0 0 / 0.55) 0%, rgb(0 0 0 / 0.8) 6%, #000 40%)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(to top, rgb(255 60 60) 0 7px, transparent 7px 12px)," +
              "linear-gradient(to right, transparent, rgb(255 190 190 / 0.9) 30% 70%, transparent)",
            backgroundBlendMode: "lighten",
            // Four shadows now, and the widest is 34px. `drop-shadow` traces the
            // alpha channel, so each dash keeps its own halo and the gaps stay
            // dark however far the glow is pushed — which is why this can be
            // brightened without the dashes smearing into a solid bar.
            filter:
              "drop-shadow(0 0 4px rgb(255 190 190 / 0.95)) drop-shadow(0 0 12px rgb(255 42 42 / 1))" +
              " drop-shadow(0 0 22px rgb(255 42 42 / 0.75)) drop-shadow(0 0 34px rgb(255 42 42 / 0.45))",
          }}
        />
      </div>
      {/* Range ticks: turn the line into a scale instead of a beam. Positioned
          as fractions of the target range, so they stay evenly distributed
          however near or far the target is. */}
      {[
        { at: 0.5, alpha: 0.22 },
        { at: 0.72, alpha: 0.34 },
        { at: 0.9, alpha: 0.48 },
      ].map(({ at, alpha }) => (
        <div
          key={at}
          className="absolute left-0 h-px w-[5px] transition-[opacity,bottom] duration-500"
          style={{
            bottom: `calc(${lift} + (var(--orbit-radius) * ${range} - var(--card-beam-standoff) - ${lift}) * ${at})`,
            transform: "translateX(-2px)",
            opacity: engaged ? alpha : 0,
            background: "var(--signal)",
          }}
        />
      ))}

      {/* THE RETICLE, AT THE TARGET END OF THE LINE.
          Counter-rotated by the same heading the wrapper applies, so the diamond
          stays square to the SCREEN while the line it terminates swings around
          the deck. Without that it would roll with the bearing and read as a
          decoration welded to the beam rather than as a sight sitting over the
          target.

          A second, larger, unfilled diamond sits behind it — a filled dot says
          "here is a point", a dot inside a ring says "this point is being
          held", which is the difference between a marker and a lock. */}
      <div
        className="absolute left-0 transition-[opacity,bottom] duration-500 ease-out"
        style={{ bottom: `calc(${lift} + ${length})`, opacity: engaged ? 1 : 0 }}
      >
        <motion.div
          className="absolute top-0 left-0"
          style={{ rotate: useTransform(rotation, (value) => -value) }}
        >
          {/* IMPACT BLOOM. The tip now lands ON the card's bottom edge rather
              than at a point in empty space, so what belongs here is the flare
              of a beam meeting a surface — a wide soft pool under a small hot
              core. Painted FIRST so the reticle sits on top of it. */}
          <span
            className="absolute top-0 left-0 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, rgb(255 90 90 / 0.5), rgb(255 42 42 / 0.18) 45%, transparent)",
            }}
          />
          <span
            className="absolute top-0 left-0 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              background: "rgb(255 210 210)",
              boxShadow: "0 0 14px rgb(255 42 42 / 0.95), 0 0 30px rgb(255 42 42 / 0.7)",
            }}
          />
          <span
            className="absolute top-0 left-0 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rotate-45 border"
            style={{ borderColor: "rgb(255 42 42 / 0.7)" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
