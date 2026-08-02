import type { CSSProperties } from "react";
import { derivePlacement } from "@/features/missions/placement";

/**
 * The orbital plane, drawn as a navigation instrument.
 *
 * This layer is what turns "six panels arranged in a circle" into "missions
 * orbiting a command centre". If it is too faint, the spatial premise of the
 * whole deck collapses and a visitor reads the layout as an arbitrary
 * arrangement. So the populated rings are deliberately the brightest non-text
 * elements on screen after the ship, and they carry real instrument furniture:
 * graduated ticks, cardinal bearing markers, and a slow sweep.
 *
 * Everything is a plain CSS ellipse. `border-radius: 50%` on a non-square box
 * is exact, so no SVG geometry and no measurement: dimensions come from
 * `--orbit-radius` and `--orbit-tilt`, the same pair that positions the mission
 * nodes. One source of truth means the rings can never drift out of alignment
 * with the nodes sitting on them.
 *
 * This component is a child of <PlaneSurface>, so its origin is the CENTRE of
 * the ellipse — not the spacecraft, which rides the near arc one standoff
 * below.
 */

/**
 * Ring scale relative to `--orbit-radius`, with its own weight.
 *
 * The four `populated: true` values MUST match the `ring` values in
 * missions/data.ts. A mission whose orbit has no drawn ring looks like a
 * positioning bug; a drawn ring with nothing on it looks like decoration. The
 * two faint extras exist only to keep the field from ending abruptly at the
 * outermost mission.
 */
const RINGS = [
  { scale: 0.34, opacity: 0.24, populated: true }, // ORION
  { scale: 0.66, opacity: 0.2, populated: true }, // NEXUS
  { scale: 0.8, opacity: 0.2, populated: true }, // ECHO, DATAFLOW
  { scale: 1.0, opacity: 0.26, populated: true }, // AURORA, FORGE
  // Unpopulated, and deliberately reaching PAST the spacecraft's standoff of
  // 1.5 so an arc still sweeps around and below the hull. Without them the
  // plane would appear to stop dead at the outermost mission, and the ship
  // would read as floating behind a disc rather than sitting inside a field
  // that continues past it.
  { scale: 1.34, opacity: 0.07, populated: false },
  { scale: 1.74, opacity: 0.04, populated: false },
] as const;

/** Minor graduations every 7.5deg, major every 45deg. */
const TICKS = Array.from({ length: 48 }, (_, i) => {
  const theta = i * 7.5;
  return { theta, placement: derivePlacement(theta), major: theta % 45 === 0 };
});

/**
 * Cardinal bearing markers.
 *
 * LETTERS, NOT DEGREES, AND E IS ON THE LEFT. The deck is viewed from behind
 * the vehicle looking along its heading, so the compass reads as it would from
 * that seat: north ahead, east to port, west to starboard. Anyone who has
 * looked at a nav display will register the orientation without being told, and
 * it is the cheapest possible reinforcement that the camera is behind the ship
 * rather than above the plane.
 *
 * South is deliberately absent — it falls on the ship's own station, where the
 * hull would cover it anyway.
 */
const BEARINGS = [
  { theta: 0, label: "N" },
  { theta: 90, label: "W" },
  { theta: 270, label: "E" },
].map(({ theta, label }) => ({ theta, label, placement: derivePlacement(theta) }));

function ellipse(scale: number): CSSProperties {
  return {
    width: `calc(var(--orbit-radius) * ${2 * scale})`,
    height: `calc(var(--orbit-radius) * var(--orbit-tilt) * ${2 * scale})`,
  };
}

function project(sx: number, sy: number): string {
  return (
    "translate(" +
    `calc(var(--orbit-radius) * ${sx}), ` +
    `calc(var(--orbit-radius) * var(--orbit-tilt) * ${sy})` +
    ") translate(-50%, -50%)"
  );
}

export function OrbitGuides() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0">
      {/* Atmospheric floor: implies the plane is a lit surface, not a wireframe
          floating in a void. */}
      <div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          ...ellipse(3.1),
          background:
            "radial-gradient(closest-side, rgb(96 132 178 / 0.13), rgb(70 100 140 / 0.05) 52%, transparent 76%)",
        }}
      />

      {/* Radar sweep.
          This element is a CIRCLE of diameter 2R, not an ellipse. The keyframe
          rotates it and only then applies scaleY(--orbit-tilt), so the sweep
          arm rotates in circle space and the whole thing is squashed to the
          deck's ellipse afterwards. Squashing the element first and rotating it
          second would spin the ellipse itself, which looks like a wobbling
          plate rather than a sweep. */}
      <div
        className="deck-sweep absolute top-0 left-0 rounded-[50%]"
        style={{
          width: "calc(var(--orbit-radius) * 2)",
          height: "calc(var(--orbit-radius) * 2)",
        }}
      >
        <div
          className="h-full w-full rounded-[50%]"
          style={{
            background:
              "conic-gradient(from 0deg, rgb(125 156 188 / 0.15), transparent 34%, transparent 100%)",
            maskImage: "radial-gradient(closest-side, transparent 58%, black 72%, black 100%)",
          }}
        />
      </div>

      {RINGS.map(({ scale, opacity }) => (
        <div
          key={scale}
          className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white"
          style={{
            ...ellipse(scale),
            opacity,
            // The near arc reads brighter than the far arc. A mask gradient
            // buys that depth cue without a filter and without splitting the
            // ring into two elements.
            maskImage: "linear-gradient(to bottom, rgb(0 0 0 / 0.18), rgb(0 0 0 / 1))",
          }}
        />
      ))}

      {/* Graduations on the outermost populated ring. Evenly spaced instrument
          scale — they deliberately do not align with mission angles, so they
          read as a measuring device rather than as node markers. */}
      {TICKS.map(({ theta, placement, major }) => (
        <div
          key={theta}
          className="absolute top-0 left-0 bg-white"
          style={{
            height: 1,
            width: major ? 9 : 4,
            opacity: (major ? 0.3 : 0.14) * (0.35 + placement.depth * 0.65),
            transform: `${project(placement.sx, placement.sy)} rotate(${placement.radialAngle - 90}deg)`,
          }}
        />
      ))}

      {/* Cardinal bearings, set just outside the outermost populated ring. */}
      {BEARINGS.map(({ theta, placement, label }) => (
        <div
          key={theta}
          className="text-t3 tracking-label absolute top-0 left-0 font-mono text-[10px]"
          style={{
            opacity: 0.55 + placement.depth * 0.45,
            transform: project(placement.sx * 1.13, placement.sy * 1.13),
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
