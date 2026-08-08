"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

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
  const length = `calc(var(--orbit-radius) * ${range})`;

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

          Two layers rather than one: the 1px thread carries the reading, and a
          3px blurred copy underneath carries the bloom. `filter: blur` on a 1px
          element would blur the thread itself into a grey smear — putting the
          glow on its own wider element leaves the thread crisp. */}
      <div
        className="absolute bottom-0 left-0 w-[3px] transition-[opacity,height] duration-500 ease-out"
        style={{
          height: length,
          opacity: engaged ? 0.55 : 0,
          transform: "translateX(-1px)",
          filter: "blur(2.5px)",
          background:
            "repeating-linear-gradient(to top, rgb(255 77 77 / 0.9) 0 3px, transparent 3px 9px)",
          maskImage: "linear-gradient(to top, transparent, #000 26%, #000)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-px transition-[opacity,height] duration-500 ease-out"
        style={{
          height: length,
          opacity: engaged ? 1 : 0,
          background:
            "repeating-linear-gradient(to top, rgb(255 77 77) 0 3px, transparent 3px 9px)",
          maskImage:
            "linear-gradient(to top, transparent, rgb(0 0 0 / 0.2) 26%, rgb(0 0 0 / 0.68) 78%, #000)",
        }}
      />
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
            bottom: `calc(var(--orbit-radius) * ${range * at})`,
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
        style={{ bottom: length, opacity: engaged ? 1 : 0 }}
      >
        <motion.div
          className="absolute top-0 left-0"
          style={{ rotate: useTransform(rotation, (value) => -value) }}
        >
          <span
            className="absolute top-0 left-0 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45"
            style={{
              background: "rgb(255 77 77)",
              boxShadow: "0 0 10px rgb(255 77 77 / 0.85)",
            }}
          />
          <span
            className="absolute top-0 left-0 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rotate-45 border"
            style={{ borderColor: "rgb(255 77 77 / 0.55)" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
