"use client";

import { motion, type MotionValue } from "framer-motion";

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
      <div
        className="absolute bottom-0 left-0 w-px transition-[opacity,height] duration-500 ease-out"
        style={{
          height: length,
          opacity: engaged ? 1 : 0,
          background:
            "linear-gradient(to top, transparent, rgb(255 59 48 / 0.10) 26%, rgb(255 59 48 / 0.34) 78%, rgb(255 59 48 / 0.5))",
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
    </motion.div>
  );
}
