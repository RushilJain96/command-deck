import { planeDivisor } from "@/features/missions/placement";
import { FIELD_RINGS, FIELD_TILT } from "./orbit.data";

/**
 * A tracking segment running the innermost orbit — the deck's one piece of
 * literal motion on the plane.
 *
 * WHY THIS IS NOT DRAWN INTO THE FIELD CANVAS. <OrbitGuides> paints once, on
 * mount and on resize, and everything about it is built on that: it stamps
 * thousands of additive points into a downscaled buffer and upscales, which is
 * affordable exactly because it happens a handful of times in a session. Making
 * a segment travel around a ring there would mean repainting the whole field
 * every frame — several orders of magnitude more work, to move one dash.
 *
 * A stroked SVG path with an animated `stroke-dashoffset` produces the same read
 * on the compositor, costs nothing per frame, and stays in step with the canvas
 * because it is generated from the same projection: the same `planeDivisor`, the
 * same `FIELD_TILT`, the same ring radius. If the field's geometry is retuned
 * this follows it automatically.
 *
 * THE ONE ANIMATED THING ON THE PLANE, AND IT REPLACES ANOTHER ONE. globals.css
 * records that a radar sweep used to live here and was removed with the orbital
 * pass, on the grounds that the field's variation should be carried by a static
 * lighting model rather than by movement. That still holds for the FIELD. This
 * is not the field — it is a single dashed segment on one ring, which is the
 * difference between a surface that animates and an instrument that reports.
 *
 * VIEWBOX UNITS: 1000 = one `--orbit-radius`. The element is sized in `calc()`
 * off that variable and the viewBox spans 2000, so the whole path rescales with
 * the deck without a single measurement.
 */
const TAU = Math.PI * 2;
const SCALE = 1000;

/** The innermost ring, projected, as an SVG path in viewBox units. */
function ringPath(ringIndex: number, samples = 240): string {
  const ring = FIELD_RINGS[ringIndex];
  let d = "";
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * TAU;
    const divisor = planeDivisor(ring.base, Math.cos(t));
    const x = ((ring.base * Math.sin(t)) / divisor) * SCALE;
    const y = ((-ring.base * Math.cos(t) * FIELD_TILT) / divisor) * SCALE;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${d}Z`;
}

/**
 * Ring 1, not ring 0.
 *
 * Ring 0 (0.22) is a structural ring — it exists to give the field a dense core
 * and nothing rides it. Ring 1 (0.34) is ORION's orbit, the innermost track any
 * mission actually occupies. A tracking segment should be tracking something,
 * and running it on an empty ring makes it decoration that happens to move.
 */
const TRACE = ringPath(1);

export function OrbitTrace() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 overflow-visible"
      style={{
        width: "calc(var(--orbit-radius) * 2)",
        height: "calc(var(--orbit-radius) * 2)",
      }}
      viewBox={`${-SCALE} ${-SCALE} ${SCALE * 2} ${SCALE * 2}`}
      fill="none"
    >
      {/*
       * `vectorEffect="non-scaling-stroke"` so the line stays a hairline at every
       * deck size. Without it the stroke is in user units, which means it scales
       * with --orbit-radius — 2px at 1920 becomes half a pixel on a phone, where
       * it disappears entirely.
       *
       * The dash pattern is NOT in that exemption: dash lengths are measured
       * along the path, so they scale with the orbit and the segment stays the
       * same fraction of the ring at every size. That is the behaviour you want
       * — a tracking segment is a portion of an orbit, not a fixed number of
       * pixels.
       */}
      <path
        d={TRACE}
        // Neutral, not accented. This segment says "this orbit is being tracked",
        // which the flow animation already carries; painting it in the system red
        // would make it a second target indicator competing with the bearing beam
        // for the same job.
        stroke="rgb(205 220 235 / 0.45)"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="90 340"
        className="trace-flow"
      />
    </svg>
  );
}
