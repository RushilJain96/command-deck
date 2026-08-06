"use client";

import { motion, type MotionValue } from "framer-motion";

/**
 * The propulsion system.
 *
 * A plume is not a shape behind a ship — it is a column of gas leaving a set of
 * nozzles at a known place, expanding, cooling and diffusing along a known axis.
 * Everything below is built from that description rather than from "orange
 * gradient", which is why it has structure a gradient cannot have: the nozzles
 * are where the model's nozzles are, the hot end is at the throat because that is
 * where combustion happens, and the column necks before it spreads because an
 * underexpanded nozzle does exactly that.
 *
 * THE NOZZLE POSITIONS ARE MEASURED, NOT DRAWN BY EYE. Connected-component scan
 * of the saturated-red bell apertures in `public/ship/yaw-00.webp`, converted
 * into this viewBox's units. The model has SIX bells in three symmetric pairs,
 * not the three the previous plume assumed, and none of the three old jet roots
 * (-11.5, 0, +11.5) sat on a bell at all — the mains are 2.9 units outboard of
 * where the flame was coming from. That mismatch is most of why the exhaust read
 * as stuck on rather than emitted.
 *
 * To re-measure after a re-render, threshold `public/ship/yaw-00.webp` for
 * a > 150 && r > 120 && r-g > 60 && r-b > 60, label connected components, and
 * convert pixel coordinates with `(px / width - 0.5) * 152`.
 *
 * LAYER ORDER IS BACK TO FRONT, AND EACH LAYER HAS ONE JOB:
 *
 *   spill        light thrown FORWARD onto the hull's underside
 *   envelope     the cool diffuse boundary — widest, faintest, blurred
 *   shroud       the warm mid-field, where the merged column still holds shape
 *   column       the merged supersonic core, waisted then expanding
 *   jets         per-nozzle cores, distinct while the flows are still separate
 *   shocks       three Mach nodes on the axis
 *   throats      the apertures themselves, hottest and smallest
 *
 * That ordering is what produces depth: every layer is partially covered by a
 * brighter, tighter one, so the eye reads a volume with an interior instead of a
 * stack of transparencies.
 *
 * ON THE PALETTE RULE: `--signal` red is reserved for the operator's current
 * target. This is the one sanctioned exception, and it is not really an exception
 * — an engine is a physical light source, not a status colour, and it reads as
 * one precisely because it is never flat red. The temperature ramp runs
 * white-hot at the throat to deep red at the tip, and it is the WHITE that keeps
 * the plume from being confused with a target highlight.
 */

/**
 * Bell apertures in hull units, measured off the render. Each pair is
 * symmetric about the axis; only the starboard half is listed because the plume
 * mirrors it.
 *
 * `y` is the exit plane and `r` the aperture radius. The mains sit LOWER (more
 * aft) and are visibly larger, which is why they are the only pair given a full
 * jet — six full plumes would be noise, and a vehicle whose verniers burn as hard
 * as its mains is not a vehicle anyone designed.
 */
const BELL = {
  main: { x: 14.4, y: 27.9, r: 2.05 },
  outboard: { x: 19.5, y: 24.2, r: 1.48 },
  centre: { x: 2.0, y: 24.0, r: 1.34 },
} as const;

/** Every bell, port and starboard, for the throat glows. */
const THROATS = [
  { ...BELL.main, x: -BELL.main.x, main: true },
  { ...BELL.main, main: true },
  { ...BELL.outboard, x: -BELL.outboard.x, main: false },
  { ...BELL.outboard, main: false },
  { ...BELL.centre, x: -BELL.centre.x, main: false },
  { ...BELL.centre, main: false },
];

/**
 * The merged column's outline.
 *
 * WAISTED ON PURPOSE. The two main flows leave their bells 28.8 units apart,
 * converge onto the axis, and only then spread. So the silhouette narrows before
 * it widens, which is the shape of a real underexpanded plume and the single
 * cheapest cue that this is gas under pressure rather than a cone. A straight
 * taper — the previous polygon — is the shape of a spotlight beam, and it reads
 * as one.
 *
 * `tip` is where the column fades out, `waist` the half-width at the merge
 * plane, `mouth` the half-width at the tip.
 */
function column(tip: number, waist: number, mouth: number): string {
  const x0 = BELL.main.x + 2.4; // outer lip of the main bell bank
  const y0 = BELL.main.y;
  const merge = y0 + (tip - y0) * 0.34;
  return [
    `M ${-x0} ${y0}`,
    `C ${-x0 - 0.6} ${y0 + 7}, ${-waist - 2.5} ${merge - 6}, ${-waist} ${merge}`,
    `C ${-waist + 0.8} ${merge + 12}, ${-mouth + 1.5} ${tip - 14}, ${-mouth} ${tip}`,
    `L ${mouth} ${tip}`,
    `C ${mouth - 1.5} ${tip - 14}, ${waist - 0.8} ${merge + 12}, ${waist} ${merge}`,
    `C ${waist + 2.5} ${merge - 6}, ${x0 + 0.6} ${y0 + 7}, ${x0} ${y0}`,
    "Z",
  ].join(" ");
}

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
  /** Rendered size in px, matching the hull. */
  size: number;
}) {
  // Thrust setting. Engaged runs longer and slightly wider; the difference is
  // deliberately small, because a deck that visibly throttles up on hover is
  // reacting rather than operating.
  // A COLLIMATED COLUMN, NOT A CONE. Efficient engines throw a narrow, nearly
  // parallel jet; width is what makes exhaust read as a spotlight beam. The
  // extent is held close to the previous plume's on purpose — the space under the
  // ship is compositionally tuned — so the slenderness has to come from the
  // width, which is why these are well under half the bell bank's span.
  const tip = engaged ? 104 : 78;
  const waist = engaged ? 7.6 : 6.6;
  const mouth = engaged ? 10.2 : 8.6;
  const ease = "transition-all duration-700 ease-out";

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 origin-top-left"
      style={{ rotate: rotation }}
    >
      <svg
        width={size}
        height={size}
        viewBox="-76 -76 152 152"
        className="deck-md:scale-75 deck-sm:scale-50 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        <defs>
          {/* TEMPERATURE ALONG THE AXIS, not opacity along the axis. Each stop
              is a colour the gas actually is at that distance: white at the
              throat, gold as it expands, orange as it cools, deep red at the
              boundary of visibility. Painting one hue and ramping alpha is what
              produced a flat translucent triangle. */}
          {/* THE WHITE IS A SLIVER, NOT A RANGE.
              Every one of these ramps spends most of its length in the oranges
              and reds, with the pale end confined to the first few percent — the
              gas is only white-hot inside the bell. Letting cream run a third of
              the way down (the first attempt) stacks layer on layer toward white
              and produces a pale beam that outshines the hull, which fails the
              brief's own test: if the effect reads before the spacecraft, it is
              too strong. Alphas are correspondingly low; there are seven layers
              here and they composite. */}
          <linearGradient id="pl-column" x1="0" y1="26" x2="0" y2={tip} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffdcb0" stopOpacity="0.52" />
            <stop offset="0.12" stopColor="#ffb166" stopOpacity="0.4" />
            <stop offset="0.36" stopColor="#fb833a" stopOpacity="0.24" />
            <stop offset="0.66" stopColor="#d94620" stopOpacity="0.1" />
            <stop offset="1" stopColor="#8f1404" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="pl-shroud" x1="0" y1="26" x2="0" y2={tip + 8} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffab72" stopOpacity="0.17" />
            <stop offset="0.42" stopColor="#e2551f" stopOpacity="0.095" />
            <stop offset="1" stopColor="#8f1404" stopOpacity="0" />
          </linearGradient>

          {/* The cool diffuse boundary. Radial, because the outermost gas has
              lost its direction — it is scattering, not flowing. */}
          <radialGradient id="pl-envelope">
            <stop offset="0" stopColor="#f2612f" stopOpacity="0.115" />
            <stop offset="0.5" stopColor="#c53314" stopOpacity="0.045" />
            <stop offset="1" stopColor="#8f1404" stopOpacity="0" />
          </radialGradient>

          {/* Per-nozzle core: hottest at the aperture, gone within a few units. */}
          <linearGradient id="pl-jet" x1="0" y1="26" x2="0" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff4e0" stopOpacity="0.62" />
            <stop offset="0.24" stopColor="#ffc98c" stopOpacity="0.36" />
            <stop offset="0.62" stopColor="#ff8a3e" stopOpacity="0.14" />
            <stop offset="1" stopColor="#e8531c" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="pl-throat">
            <stop offset="0" stopColor="#fffdf8" stopOpacity="0.9" />
            <stop offset="0.34" stopColor="#ffd7a0" stopOpacity="0.46" />
            <stop offset="1" stopColor="#ff7a2c" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="pl-spill">
            <stop offset="0" stopColor="#ff8f52" stopOpacity="0.3" />
            <stop offset="1" stopColor="#e8431c" stopOpacity="0" />
          </radialGradient>

          {/* Shock nodes get a GRADIENT, not a blur. They are ~3 units tall and
              `pl-soft` blurs at stdDeviation 3.4, which needs roughly 10 units of
              margin — far more than any sane filter region on a box that size,
              so the blur came back clipped and the nodes rendered as faint
              rectangles. A radial falloff gives the same softness with no region
              to overflow, and costs no filter pass. */}
          <radialGradient id="pl-node">
            <stop offset="0" stopColor="#ffdcaa" stopOpacity="1" />
            <stop offset="0.55" stopColor="#ffc184" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ff9448" stopOpacity="0" />
          </radialGradient>

          {/* EDGE TREATMENT, IN TWO PARTS AND BOTH RESTRAINED.
              A low-frequency displacement breaks the vector edge so the boundary
              is not a curve anyone can trace, and a small blur keeps it from
              resolving into detail. `scale` is 2.2 — the previous 7 was large
              enough to read as turbulence, which is a different and much noisier
              statement than "this edge is gas". Region kept tight: a
              displacement map over a large area is genuinely expensive. */}
          <filter id="pl-edge" x="-35%" y="-8%" width="170%" height="122%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.032" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="1.1" />
          </filter>

          <filter id="pl-soft" x="-45%" y="-15%" width="190%" height="140%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
        </defs>

        {/* 1. HULL SPILL. Light that comes from somewhere has to land on
               something: this is the engine illuminating the ship's own
               underside, and it is the layer that makes the plume belong to the
               vehicle rather than start below it. Sits ACROSS the bell bank,
               so it reads as all six apertures lighting the hull. */}
        <ellipse
          cx="0"
          cy={BELL.main.y - 3}
          rx={engaged ? 23 : 20}
          ry={engaged ? 9 : 7.5}
          fill="url(#pl-spill)"
          className={ease}
          style={{ opacity: engaged ? 0.7 : 0.5 }}
        />

        {/* 2. ENVELOPE — the widest, faintest thing here. Bright sources scatter
               into the medium around them and the scatter is always far larger
               than the source, so this is deliberately enormous and almost
               invisible. Blurred rather than sharp-edged: it has no boundary. */}
        <ellipse
          cx="0"
          cy={BELL.main.y + tip * 0.42}
          rx={engaged ? 30 : 24}
          ry={engaged ? 50 : 38}
          fill="url(#pl-envelope)"
          filter="url(#pl-soft)"
          className={`plume-drift ${ease}`}
          style={{ opacity: engaged ? 0.95 : 0.62 }}
        />

        {/* 3. SHROUD — the warm mid-field. Same outline as the column but wider
               and softer, so the column appears to have a cooler sheath around
               it instead of an edge. This is the layer doing most of the
               volume work. */}
        <path
          d={column(tip + 14, waist + 5.5, mouth + 7)}
          fill="url(#pl-shroud)"
          filter="url(#pl-soft)"
          className={ease}
        />

        {/* 4. COLUMN — the merged supersonic core. Carries the edge treatment,
               because this is the only boundary in the plume sharp enough for
               irregularity to be legible on. */}
        <path d={column(tip, waist, mouth)} fill="url(#pl-column)" filter="url(#pl-edge)" className={ease} />

        {/* 5. PER-NOZZLE JETS, over the distance the flows are still separate.
               They vanish before the merge plane — distinct roots are what say
               "this assembly has engines", but distinct all the way down would
               say "these engines never merge", which no cluster does.

               THE CENTRE PAIR IS DRAWN TOO, AND IT IS NOT DECORATION. With only
               the mains lit, the two jets sit at +/-14.4 while the column has
               already necked to +/-7 — so the bright parts were at the outer
               EDGES with a dark trough between them, and the plume read as two
               stripes rather than one body. The centre bells are firing; letting
               them fill the axis is both what the model shows and what makes the
               merge legible. Shorter and dimmer than the mains, because they
               are smaller nozzles. */}
        {[
          { cx: -BELL.main.x, k: 1 },
          { cx: BELL.main.x, k: 1 },
          { cx: -BELL.centre.x, k: 0.62 },
          { cx: BELL.centre.x, k: 0.62 },
        ].map(({ cx, k }) => (
          <ellipse
            key={cx}
            cx={cx}
            cy={(k === 1 ? BELL.main.y : BELL.centre.y) + (engaged ? 8 : 6.5) * k}
            rx={(engaged ? 2.1 : 1.8) * k}
            ry={(engaged ? 9.5 : 7.5) * k}
            fill="url(#pl-jet)"
            className={ease}
            style={{ opacity: k === 1 ? 1 : 0.8 }}
          />
        ))}

        {/* 6. MACH NODES. Supersonic exhaust standing-waves into a row of bright
               diamonds, spaced further apart and fainter as the flow loses
               energy. It is the one detail that reads unmistakably as a real
               engine rather than a stylised flame, and it costs three ellipses.
               Kept well under the brightness of the throats so it registers as
               internal structure rather than as decoration. */}
        {/* WIDE AND FLAT, NOT ROUND. Round nodes at legible opacity read as a
               row of beads suspended in the plume — an artifact, not structure.
               Flattened to the column's width and taken down to the edge of
               visibility, they instead register as periodic brightening of the
               core, which is what a shock train actually looks like. If you can
               count them without looking for them, they are too strong. */}
        {[
          { y: 0.3, s: 1, o: 0.3 },
          { y: 0.48, s: 0.8, o: 0.18 },
          { y: 0.63, s: 0.58, o: 0.09 },
        ].map((node) => (
          <ellipse
            key={node.y}
            cx="0"
            cy={BELL.main.y + (tip - BELL.main.y) * node.y}
            rx={waist * 1.15 * node.s}
            ry={2.2 * node.s}
            fill="url(#pl-node)"
            className={ease}
            style={{ opacity: engaged ? node.o : node.o * 0.66 }}
          />
        ))}

        {/* 7. THROATS. Last, so nothing is drawn over them: the apertures are the
               brightest points in the whole system and they sit exactly on the
               model's bells. This is what answers "where does the thrust begin". */}
        {THROATS.map((bell, index) => (
          <ellipse
            key={index}
            cx={bell.x}
            cy={bell.y}
            rx={bell.r * (bell.main ? 1.55 : 1.3)}
            ry={bell.r * (bell.main ? 1.2 : 1.05)}
            fill="url(#pl-throat)"
            className={ease}
            style={{ opacity: bell.main ? (engaged ? 0.92 : 0.74) : engaged ? 0.44 : 0.3 }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
