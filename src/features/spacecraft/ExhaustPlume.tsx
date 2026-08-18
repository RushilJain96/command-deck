"use client";

import { motion, type MotionValue } from "framer-motion";

/**
 * The propulsion system.
 *
 * A plume is not a shape behind a ship — it is gas leaving a set of nozzles at a
 * known place, expanding, cooling and diffusing along a known axis. What follows
 * is built from that description rather than from "orange gradient".
 *
 * REBUILT AS THREE BLENDED LAYERS. THE PREVIOUS VERSION HAD SEVEN AND THAT WAS
 * THE PROBLEM.
 *
 * It ran spill, envelope, shroud, column, jets, shocks and throats — each one
 * individually justified, each one modelling something a real plume does, and
 * the note above them claimed the ordering "produces depth: every layer is
 * partially covered by a brighter, tighter one". The reasoning was sound and the
 * result was not: seven translucent oranges compositing at alpha 0.1-0.5 do not
 * resolve into a volume with an interior, they average into a shapeless wash.
 * The eye cannot decompose seven near-identical hues; it integrates them.
 *
 * Three layers with a large VALUE gap between them read as structure, because
 * structure is contrast and not count:
 *
 *   bloom   wide, deep red, soft — the halo the plume throws into space
 *   flame   tighter, amber, longer — the body of the exhaust
 *   cores   one per bell, white-hot, tiny — where combustion actually is
 *
 * `mix-blend-mode: screen` is what makes them add rather than stack. Alpha
 * compositing darkens as it layers (each pass multiplies the backdrop by
 * 1-alpha); screen brightens toward white where layers meet, which is how
 * emitted light behaves and the reason the cores stay white where the flame
 * crosses them instead of turning muddy orange.
 *
 * ELONGATION IS ON THE GRADIENT, NOT THE BOX. Each layer is
 * `radial-gradient(ellipse 50% 100% at 50% 0%, ...)` in a tall box: the gradient
 * is anchored at the top edge — the exit plane — and reaches full height. A
 * circular gradient in a tall box gives a sphere of light with a gap under it,
 * which is the tell that a plume was drawn rather than emitted.
 *
 * THE NOZZLE POSITIONS ARE MEASURED, NOT DRAWN BY EYE. Connected-component scan
 * of the saturated-red bell apertures in `public/ship/yaw-00.webp`, converted
 * into hull units. The model has SIX bells in three symmetric pairs, not the
 * three an earlier plume assumed, and none of that version's jet roots sat on a
 * bell at all — the mains are 2.9 units outboard of where the flame was coming
 * from. That mismatch is most of why the exhaust read as stuck on rather than
 * emitted, and it is why this data survived the rewrite when nothing else did.
 *
 * To re-measure after a re-render, threshold `public/ship/yaw-00.webp` for
 * a > 150 && r > 120 && r-g > 60 && r-b > 60, label connected components, and
 * convert pixel coordinates with `(px / width - 0.5) * 152`.
 *
 * ON THE PALETTE RULE: red is the deck's system accent. This is not an instance
 * of it — an engine is a physical light source, not a status colour, and it
 * reads as one precisely because it is never flat red. The ramp runs white at
 * the throat to deep red at the tip, and it is the WHITE that keeps the plume
 * from being confused with a targeting cue.
 */

/**
 * Bell apertures in hull units, measured off the render. Each pair is symmetric
 * about the axis; only the starboard half is listed because the plume mirrors it.
 *
 * `y` is the exit plane and `r` the aperture radius. The mains sit LOWER (more
 * aft) and are visibly larger, which is why they get the biggest cores — a
 * vehicle whose verniers burn as hard as its mains is not a vehicle anyone
 * designed.
 */
const BELL = {
  main: { x: 14.4, y: 27.9, r: 2.05 },
  outboard: { x: 19.5, y: 24.2, r: 1.48 },
  centre: { x: 2.0, y: 24.0, r: 1.34 },
} as const;

/** Every bell, port and starboard. */
const THROATS = [
  { ...BELL.main, x: -BELL.main.x, main: true },
  { ...BELL.main, main: true },
  { ...BELL.outboard, x: -BELL.outboard.x, main: false },
  { ...BELL.outboard, main: false },
  { ...BELL.centre, x: -BELL.centre.x, main: false },
  { ...BELL.centre, main: false },
];

/**
 * THREE PLUME COLUMNS, ONE PER VISIBLE NOZZLE GROUP.
 *
 * The bloom and the flame used to be ONE wide gradient spanning the whole bell
 * bank, with the six measured cores dotted along its top edge. Every part of
 * that was individually defensible and the result was a single blob: at 52 units
 * across, the bloom is wider than the gap between the bells, so it filled the
 * spaces BETWEEN the nozzles as brightly as the nozzles themselves. The cores
 * were the only thing saying "six apertures", and they are an order of magnitude
 * smaller than the wash that drowned them.
 *
 * Three columns, each with its own bloom and flame, put the dark gaps back. The
 * gap between two jets is not an absence of drawing — it is the thing that makes
 * them two jets.
 *
 * The x positions are derived from the MEASURED bells, not picked: port and
 * starboard sit at the midpoint of their main/outboard pair, the centre column
 * on the axis. So the columns stay welded to the apertures if the hull is ever
 * re-rendered and re-measured.
 *
 * THE CENTRE RUNS LONGEST AND HOTTEST because it is fed by the mains. Outer
 * columns are 82% of its length and splay 2.5deg outward, which is what a nozzle
 * cluster does — the jets diverge because they are canted for thrust-vector
 * authority, and parallel jets read as a printed pattern.
 */
const COLUMNS = [
  { x: -(BELL.main.x + BELL.outboard.x) / 2, tilt: 2.5, reach: 0.82, heat: 0.86 },
  { x: 0, tilt: 0, reach: 1, heat: 1 },
  { x: (BELL.main.x + BELL.outboard.x) / 2, tilt: -2.5, reach: 0.82, heat: 0.86 },
] as const;

/**
 * The hull-unit coordinate system this file has always used: the sprite spans
 * 152 units across its full width, so one unit is `size / 152` CSS pixels.
 * Keeping the geometry in units means the measured bell positions stay valid at
 * every responsive tier without a second set of numbers.
 */
const UNITS = 152;

/** Exit plane — the shallowest bell, where every layer starts. */
const EXIT_Y = 23.6;

export function ExhaustPlume({
  rotation,
  engaged,
  size,
}: {
  /**
   * Lagged heading, ALREADY COMPRESSED to the hull's rendered yaw by
   * `plumeScreenAngle`. Rotating by the raw bearing detaches the flame from the
   * bells at the flanks of the deck — see the note on that function.
   */
  rotation: MotionValue<number>;
  engaged: boolean;
  size: number;
}) {
  const u = size / UNITS;

  // Throttle. Deliberately small: a deck that visibly throttles up on hover is
  // reacting rather than operating. Length carries almost all of it, because
  // thrust reads as velocity and velocity reads as length.
  // WIDTHS ARE THE THING THAT MAKES THIS READ AS THRUST RATHER THAN FOG, and
  // the first pass at this rewrite still had them too generous. An efficient
  // engine throws a narrow, nearly parallel jet; width is what turns exhaust
  // into a spotlight beam. The bell bank spans 39 units, so the flame at 22 sits
  // comfortably INSIDE it and the bloom at 52 only just past it.
  // 84/112 -> 28/40, AND THIS IS A CONSEQUENCE OF `SHIP_PIXELS` RATHER THAN A
  // CHANGE OF MIND ABOUT THRUST. The length is in hull units, so it scales with
  // the sprite: when the ship went 444 -> 577 to match the reference, an already
  // long plume grew with it to roughly 330px and ran straight down through the
  // launch prompt and into the footer. The reference draws a SHORT, bright flame
  // contained near the bells — an engine holding station, not one accelerating —
  // and a plume that reaches the bottom of the frame is claiming the second.
  //
  // The throttle ratio is unchanged at about 1.43:1, so hovering still reads as
  // the same small step up it did before.
  // 28/40 -> 56/80. Doubled, on the brief. The short plume was correct against
  // the reference still and wrong against the deck in motion: at 28 units the
  // three jets were stubs under a 335px hull and the ship read as parked rather
  // than as holding station under thrust. The reference is one frame; this thing
  // is looked at for minutes.
  //
  // It reaches past <LaunchPrompt> at most viewports, which is fine and is why
  // the layout solver has never modelled the plume — it is a light source, not
  // an obstacle, and it runs BEHIND the prompt's own fill.
  const len = (engaged ? 80 : 56) * u;
  // PER-COLUMN widths, not bank-wide. The old 52/22 spanned the whole cluster;
  // these are sized so three of them sit inside the 39-unit bell bank with dark
  // air between, which is the entire difference between three jets and one wash.
  const bloomW = (engaged ? 23 : 20) * u;
  const flameW = (engaged ? 9.5 : 8) * u;

  const ease = "transition-all duration-700 ease-out";

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ rotate: rotation }}
    >
      <div
        // No tier multiplier — see <ShipSprite>. The plume must scale with
        // the hull, and the hull no longer scales on its own.
        className="absolute top-0 left-0"
        style={{ width: 0, height: 0 }}
      >
        {/* LAYERS 1 & 2 — BLOOM AND FLAME, PER COLUMN.
            Each column is its own rotated frame so the outer two can splay
            without dragging the centre with them. `transformOrigin: top` puts
            the pivot at the EXIT PLANE — rotating about the middle would swing
            the jet root off its nozzle, which is the one place a plume must
            never move. */}
        {COLUMNS.map((col) => (
          <div
            key={col.x}
            className="absolute top-0 left-0"
            style={{
              transform: `translateX(${col.x * u}px) rotate(${col.tilt}deg)`,
              transformOrigin: `0 ${EXIT_Y * u}px`,
            }}
          >
            {/* Outer bloom: the light this jet throws into the space around it.
                The only layer that drifts — a diffuse boundary is where hot gas
                mixes with what surrounds it, so it is the one part of a
                steady-state engine with any business moving. */}
            <div
              className={`plume-drift absolute mix-blend-screen ${ease}`}
              style={{
                left: -bloomW / 2,
                top: EXIT_Y * u,
                width: bloomW,
                height: len * 1.18 * col.reach,
                // 0.3/0.12 -> 0.55/0.26, and the falloff pushed 70% -> 84%. The
                // bloom is what the eye reads as "burning" — the flame layer
                // gives the jet its shape, this gives it its heat — and at 0.3
                // over a true-black void it was contributing almost nothing.
                background:
                  "radial-gradient(ellipse 50% 100% at 50% 0%," +
                  `rgb(255 110 25 / ${0.55 * col.heat}) 0%,` +
                  `rgb(230 45 10 / ${0.26 * col.heat}) 42%, transparent 84%)`,
                filter: `blur(${2.2 * u}px)`,
              }}
            />
            {/* Mid flame: the body of the jet, and the layer that carries its
                SHAPE — hence the harder falloff. Pure white at the throat before
                it ramps through amber, so each column reads as its own stream of
                superheated gas rather than as a slice of a shared orange field. */}
            <div
              className={`absolute mix-blend-screen ${ease}`}
              style={{
                left: -flameW / 2,
                top: EXIT_Y * u,
                width: flameW,
                height: len * col.reach,
                // The amber and orange stops lifted with the bloom (0.72 -> 0.85,
                // 0.36 -> 0.58) and the tail pushed 82% -> 92%, so a jet twice as
                // long does not simply fade out halfway down its own length. The
                // white throat is untouched: it was already at 0.95 and it is what
                // keeps the flame reading as combustion rather than as a glow.
                background:
                  "radial-gradient(ellipse 50% 100% at 50% 0%," +
                  `rgb(255 255 255 / ${0.95 * col.heat}) 0%,` +
                  `rgb(255 222 150 / ${0.85 * col.heat}) 14%,` +
                  `rgb(255 132 30 / ${0.58 * col.heat}) 40%, transparent 92%)`,
                filter: `blur(${1 * u}px)`,
              }}
            />
          </div>
        ))}

        {/* LAYER 3 — CORES, ONE PER BELL. White at the aperture and gone within a
            few units, because that is the whole extent of the region actually at
            combustion temperature.

            These are what make the engine read as SIX nozzles rather than one
            vent. They are also the smallest elements here by an order of
            magnitude — the value gap between a 4-unit white core and a 62-unit
            red bloom is what the previous seven-layer version had no room for. */}
        {THROATS.map((bell, index) => {
          const w = bell.r * (bell.main ? 3.4 : 2.8) * u;
          const h = bell.r * (bell.main ? 15 : 9) * u * (engaged ? 1 : 0.72);
          return (
            <div
              key={index}
              className={`absolute mix-blend-screen ${ease}`}
              style={{
                left: bell.x * u - w / 2,
                top: bell.y * u,
                width: w,
                height: h,
                background:
                  "radial-gradient(ellipse 50% 100% at 50% 0%," +
                  "rgb(255 255 255 / 1) 0%, rgb(255 230 150 / 0.8) 30%, transparent 100%)",
                filter: `blur(${0.5 * u}px)`,
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
