/**
 * THE ORBITAL FIELD — geometry and illumination.
 *
 * The field is not drawn as strokes. It is a chain of small luminous points
 * whose density makes the path, rendered at THREE SCALES that are composited
 * additively:
 *
 *   CORE        a hard thread, a few pixels wide. The sharpest thing on the
 *               deck after the spacecraft, and the only layer with a definite
 *               edge anywhere.
 *   HALO        a soft band peaking immediately off the thread and gone within
 *               about forty pixels.
 *   ATMOSPHERE  a very large, very faint scatter that dissolves into the void.
 *
 * Two falloffs at very different rates is what reads as light travelling
 * through thin particles rather than as a glow. A single falloff — however
 * carefully tuned — always reads as an LED strip, which is what four earlier
 * versions of this file did.
 *
 * EVERY NUMBER IN `FIELD` WAS SET BY EYE against a live control panel and then
 * transcribed here. They are not derived from anything and there is no formula
 * to re-derive them from; if the field needs to change, change them and look at
 * it. The one thing to preserve is the RELATIONSHIP between the three scales:
 * the core must stay the brightest peak and the atmosphere the widest spread,
 * or the illumination stops reading as scattering.
 *
 * Deterministic at module load, like everything else in this feature.
 */

import { ORBIT_TILT } from "@/features/missions/placement";

/** mulberry32 — small, fast, and good enough for spacing a ring system. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a || 1e-6));
  return t * t * (3 - 2 * t);
};
const mix = (a: readonly number[], b: readonly number[], f: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * f));

export const FIELD = {
  /**
   * Ring count. DESCRIPTIVE NOW, NOT GENERATIVE — the radii are listed in
   * TRACK_RADII below and this simply reports how many there are. It is kept
   * because other files reason about it: `Celestials` clamps plane-body ring
   * indices against `FIELD_RINGS.length`, and the halo-width note in
   * <OrbitGuides> is written in terms of ring spacing.
   *
   * SEVEN, UP FROM FIVE, AND THE OLD CROWDING RULE STILL APPLIES. A ring needs
   * room either side of it or adjacent rings bleed into one mass. What changed
   * is the budget: with the halo pass off, the only thing that has width is the
   * 2.7px core bead, so rings can sit far closer than they could when each one
   * carried a 40px scattering glow. The tightest gap in the new set is
   * 0.22 -> 0.34, which is 56px at R=470 and comfortably clear.
   */
  rings: 7,
  seed: 0x51e11a,

  /**
   * The band the rings occupy, in units of --orbit-radius.
   *
   * The system is normalised so its outermost ring is 1 and then remapped into
   * this band, which keeps the inner rings clear of each other no matter how the
   * growth terms are tuned.
   *
   * THE FIELD HAS AN EDGE NOW. IT DID NOT, AND THAT WAS THE PROBLEM.
   *
   * This was 2.6, chosen so the outer rings left the frame on every side — "the
   * difference between a diagram of a system and being inside one; you never see
   * the edge of the thing you are flying in." That is a real idea and it was
   * executed properly. It is also the wrong idea for this deck, and it is why
   * the composition read as crowded rather than as vast: a frame with rings
   * running through all four corners has no empty space left, and space reads as
   * space because of the emptiness, not because of what is drawn in it. Every
   * other symptom — the field feeling busy, the mission callouts fighting the
   * background, the eye having nowhere to rest — followed from this one number.
   *
   * 1.55 is not arbitrary. The constraint is SHIP_STANDOFF = 1.20: the field has
   * to reach PAST the hull or the ship reads as parked in front of a picture of
   * a plane. At 1.55 the outermost ring crosses 0.35 * R * tilt below the ship's
   * origin — through the lower half of the hull — so the vehicle interrupts the
   * ring and the plane visibly continues past it on both sides. That is the
   * payoff `placement.ts` describes; at 2.6 it came from some middle ring and
   * the outer ones were merely off-screen.
   *
   * The inner figure is tight on purpose: a dense core is most of what makes the
   * field converge rather than spreading evenly across the frame. 0.22 rather
   * than 0.16 only because the innermost ring at 0.16 sat inside the halo of the
   * one outside it once the band contracted.
   */
  innerRing: 0.22,
  outerRing: 1.55,

  /**
   * Shape and spacing. All three are effectively OFF right now, which is a
   * deliberate result rather than an unfinished state: with the field this
   * luminous, irregular rings read as a swirl and even a little spacing noise
   * reads as a mistake. The machinery stays because the values were arrived at
   * by moving them, and because zeroing them still consumes the same random
   * draws — changing that would re-roll the spacing that was signed off.
   */
  irregularity: 0,
  spread: 0,
  scatter: 0.02,

  /**
   * Bright-to-dim ratio around each ring, and the floor the dim parts hold.
   *
   * THE RINGS ARE STRINGS OF LIGHTS NOW, AND `ember` IS WHAT MAKES THE GAPS.
   * It was 0.34, with the note: "Dim stretches fall to `ember` and hold there.
   * They never reach zero: a hard cut is a dashed line, and a dashed line is a
   * drawing." The instinct was right and the value was too cautious — at 0.34 no
   * part of a ring ever drops below a third of full, so the density variation
   * read as a slight shimmer along a continuous thread rather than as separate
   * lights. The ring was a drawn line either way; it was just a smooth one.
   *
   * At 0.10 the dim stretches fall close enough to the void to break the thread,
   * and because the density function is a sum of four sines the breaks arrive at
   * irregular intervals and with soft ends — which is the difference between a
   * string of lights and a dashed stroke. The old warning still stands as a
   * limit: take `ember` to 0 and the ends go hard, and it reads as a dash
   * pattern again.
   *
   * `contrast` rises with it because it sets FIELD_CUT, the threshold the
   * density is measured against. Raising `ember` alone would just dim the whole
   * ring; raising both is what widens the gap between the lit and unlit runs.
   */
  contrast: 0.17,
  ember: 0.13,

  /**
   * Per-layer levels.
   *
   * HALO IS OFF. It was a 5-40px scattering glow hugging every thread, and it
   * is the single thing most responsible for the field reading as drawn rather
   * than as points of light — a bead with a glow welded to it is a stroke with a
   * soft edge, however it was composited. Killing it costs the two-falloff
   * scattering model the pass was built for, and the field is better without it:
   * the core beads carry the ring, and `atmosphere` still supplies the wide,
   * shapeless region-of-space term that keeps the plane from looking like line
   * art on black.
   *
   * The pass is skipped entirely at this value (see `FIELD.halo > 0.001` in
   * <OrbitGuides>), so this also buys back the fill it used to cost.
   */
  /**
   * `core` IS A GAIN, NOT A CEILING — per-stamp alpha is clamped to 1 after it
   * multiplies in. It went 1 -> 2.2 in the same pass that switched the halo off,
   * and that is not a coincidence: the halo was contributing most of the field's
   * actual luminance, and the first attempt at bead rings kept `core` at 1 and
   * produced a plane that had the right STRUCTURE and was almost invisible.
   *
   * Above 1 the brightest beads saturate — they land on the palette's core
   * colour at full opacity — while the mid-range ones lift proportionally. That
   * is the correct shape for this: a string of lights should have lights in it
   * that are simply ON, and a gain that only ever approaches full is a gain that
   * makes everything grey.
   */
  /**
   * 2.6 -> 1.5, AND THE ATMOSPHERE WITH IT. The rings are threads of light, and
   * at a 2.6 bead gain they were reading as thick lit cables — bright enough
   * that the field's cyan was bleeding across the middle of the frame and doing
   * as much to lift the void off black as the aurora was. 1.5 still saturates
   * the brightest beads (anything above 1 does), so the strings still have
   * lights that are simply ON; what goes is the width of the halo around each.
   */
  core: 1.5,
  halo: 0,
  /**
   * 0.34 -> 0.16. This is the wide, soft glow each arc throws sideways, and it
   * is the single largest contributor to the blue haze — it covers far more area
   * than the beads do, so its alpha counts for more than its value suggests.
   */
  atmosphere: 0.16,
  /** Atmospheric radius. */
  reach: 0.6,
  /** Inward drift off each arc. */
  leak: 0.67,

  /**
   * 0 is a true blue, 1 a blue-white.
   *
   * 0.55, up from 0.33. The saturated end of the ramp reads as a coloured line
   * — an LED strip laid in a circle — and colour is the wrong thing for this
   * layer to be carrying: the rings are structure, and structure should sit
   * behind the missions rather than compete with them for the eye. Moving up
   * the ramp desaturates without dimming, because the stops travel blue -> white
   * rather than around the wheel.
   */
  hue: 0.55,
} as const;

export interface FieldRing {
  /** Radius as a fraction of --orbit-radius. */
  readonly base: number;
  readonly harmonics: readonly { k: number; a: number; p: number }[];
  readonly phase: number;
  readonly weight: number;
}

/**
 * THE DRAWN TRACKS ARE THE MISSION ORBITS. THEY DID NOT USED TO BE.
 *
 * The radii here were generated: a geometric progression with a widening step
 * and a scatter term, normalised and remapped into `innerRing`..`outerRing`.
 * That produced a handsome, entirely decorative set — 0.22, 0.457, 0.722, 1.128,
 * 1.55 — which had nothing to do with the radii the six missions actually ride
 * (0.34, 0.66, 0.80, 1.00). The two sets never coincided, so every mission
 * anchor floated in the gap between two tracks.
 *
 * Nobody notices that while the anchors are 5px grey diamonds. It becomes the
 * whole problem the moment they are luminous waypoints, because a waypoint is a
 * claim that something is ON a track. A glowing marker sitting sixty pixels off
 * the nearest ring is a claim the picture immediately contradicts.
 *
 * SO THE FIELD SNAPPED TO THE MISSIONS, NOT THE MISSIONS TO THE FIELD. The other
 * direction was available and is much worse: mission radii feed `REACH`, which
 * sets `--orbit-radius`, which the layout solver clears across 31 viewports.
 * Moving them to land on decorative rings would have re-opened a solved layout
 * to fix a cosmetic mismatch. The rings are the free variable here; the roster
 * is not.
 *
 * STRUCTURAL RINGS FILL THE REST. Four mission tracks alone would leave the
 * field with a hole inside 0.34 and nothing past 1.00 — and the outer band is
 * what reaches past the hull so the vehicle interrupts the plane. Three more
 * carry that: one inside, two outside.
 *
 * The generator is kept and still runs, because it is what produces the
 * harmonics, the phase and the per-ring weight that stop the rings looking
 * identical. Only the RADII are now given rather than derived.
 */
const MISSION_TRACKS = [0.34, 0.66, 0.8, 1.0] as const;
const STRUCTURAL_TRACKS = [0.22, 1.28, 1.55] as const;

const TRACK_RADII: readonly number[] = [...MISSION_TRACKS, ...STRUCTURAL_TRACKS].sort(
  (a, b) => a - b,
);

function buildRings(): FieldRing[] {
  const random = mulberry32(FIELD.seed);
  const rings: { base: number; harmonics: FieldRing["harmonics"]; phase: number; weight: number }[] =
    [];

  for (const base of TRACK_RADII) {
    // Drawn even at zero irregularity: these calls advance the generator, and
    // the phase and weight below depend on where it lands.
    const raw = [
      { k: 1, a: random() * 2 - 1, p: random() * TAU },
      { k: 2, a: random() * 2 - 1, p: random() * TAU },
      { k: 3, a: (random() * 2 - 1) * 0.6, p: random() * TAU },
    ];
    const total = raw.reduce((sum, h) => sum + Math.abs(h.a), 0) || 1;

    rings.push({
      base,
      harmonics: raw.map((h) => ({ ...h, a: h.a / total })),
      phase: random() * 1000,
      weight: 0.66 + random() * 0.34,
    });
  }

  const inner = TRACK_RADII[0];
  const span = TRACK_RADII[TRACK_RADII.length - 1] - inner || 1;
  return rings.map((ring) => {
    const t = (ring.base - inner) / span;
    /**
     * EDGE FADE. The outermost ring has to dissolve, not stop.
     *
     * While the field ran to 2.6 this was unnecessary: the viewport cut it, and
     * a ring that leaves the frame never has to explain where it ends. A field
     * with a visible edge does. Without this the last ring terminates at full
     * weight in open black, which is the one thing that would make a bounded
     * field look like a bounded IMAGE.
     *
     * Flat across the inner 62% so the core keeps its density, then down to a
     * third of weight at the rim. `weight` is otherwise an uncorrelated per-ring
     * jitter, which is why this multiplies it rather than replacing it — the
     * rings should still not be uniform, they should just get quieter outward.
     */
    const fade = 1 - smoothstep(0.62, 1, t) * 0.66;
    // `base` is NOT remapped any more. It is the track radius, exactly, because
    // four of these have to land on mission anchors to the pixel — a remap would
    // move them off by however much the band's endpoints happen to differ.
    return { ...ring, weight: ring.weight * fade };
  });
}

export const FIELD_RINGS: readonly FieldRing[] = buildRings();

export function radiusAt(ring: FieldRing, t: number): number {
  if (FIELD.irregularity === 0) return ring.base;
  let m = 1;
  for (const h of ring.harmonics) m += h.a * FIELD.irregularity * Math.cos(h.k * t + h.p);
  return ring.base * m;
}

/**
 * Density along a ring. Four sine terms on INTEGER frequencies, so the pattern
 * closes seamlessly at the wrap — a non-integer term leaves a visible seam at
 * twelve o'clock that no amount of blending hides.
 */
export function densityAt(ring: FieldRing, t: number): number {
  const s = ring.phase;
  let d =
    Math.sin(2 * t + s) +
    0.72 * Math.sin(3 * t + s * 1.7) +
    0.5 * Math.sin(5 * t + s * 2.3) +
    0.34 * Math.sin(8 * t + s * 3.1);
  d /= 2.56;
  return clamp01((d + 1) / 2);
}

/** Threshold the density is measured against. */
export const FIELD_CUT = 0.08 + FIELD.contrast * 0.6;

export interface FieldLight {
  /** Level at this point, 0-1, before any per-layer gain. */
  readonly a: number;
  /** How far above the dim floor this point sits. */
  readonly lit: number;
  readonly dens: number;
}

export function lightAt(ring: FieldRing, t: number): FieldLight {
  const dens = densityAt(ring, t);
  const lit = smoothstep(FIELD_CUT, FIELD_CUT + 0.32, dens);
  // Dim stretches fall to `ember` and hold there. They never reach zero: a hard
  // cut is a dashed line, and a dashed line is a drawing.
  let a = FIELD.ember + (1 - FIELD.ember) * lit;
  /**
   * THE NEAR ARC CARRIES FOUR AND A HALF TIMES THE FAR ONE.
   *
   * This is the only cue that the ring is a plane lying away from the viewer
   * rather than a shape on glass, and it was set at 0.34/0.66 — a 2.9:1 ratio,
   * which is not enough to read as recession. At that ratio the far arc is only
   * a little dimmer than the near one, so six concentric ellipses of nearly even
   * weight resolve as what they literally are: circles drawn on the screen.
   *
   * At 0.18/0.82 the far arc fell close to the ember floor and the eye stopped
   * being able to complete the ellipse without effort — which is exactly what
   * happens looking across a real plane, and is what makes the near arc read as
   * passing in FRONT of the ship rather than around it.
   *
   * BACKED OFF TO 0.28 WHEN THE HALO WENT. 0.18 was measured against a field
   * whose threads still carried a scattering glow, and that glow was doing the
   * work of keeping the far arc present while this term pushed it down. With
   * only bare beads left, 0.18 took the far side under the threshold of being
   * seen at all — and a ring you cannot complete is not a receding ring, it is
   * half a ring.
   *
   * NOW 0.14, WHICH IS A 7:1 RATIO, AND THIS TERM HAS BEEN RAISED THREE TIMES.
   *
   * That history is the useful part of this note. It went 0.34 -> 0.18 -> 0.24
   * -> 0.14, and every move but one was upward, because "the rings look flat"
   * kept coming back after each round of tuning that was not this number. The
   * lesson: front-to-back attenuation is the ONLY cue that a ring is a plane
   * seen at an angle rather than a circle on glass, and the amount of it needed
   * to read as recession is far more than looks right in isolation. A far arc
   * that seems too dim when you stare at it is about correct when you are
   * looking at the composition.
   *
   * 0.14 puts the back of a ring at roughly a seventh of the front, which is the
   * 10%/80% relationship a spec asked for in endpoints rather than in slope.
   * The bloom pass is what makes it survivable — it keeps the bright beads on
   * the far arc present even as the average falls, so the ring can still be
   * completed by eye without being anything like as bright as the near side.
   *
   * The floor is somewhere near 0.10. Below that the far arc stops being dim and
   * starts being absent, and a ring you cannot complete at all is not a receding
   * ring — it is an arc.
   */
  const near = (1 - Math.cos(t)) / 2;
  a *= (0.14 + 0.86 * near) * ring.weight;
  return { a, lit, dens };
}

/**
 * CYAN-TINTED SLATE. THIS FILE USED TO SAY "BLUE AT EVERY SCALE, AND NEVER
 * CYAN", AND THAT RULE IS NOW DELIBERATELY RETIRED.
 *
 * The old reasoning: mixes that travel the blue-to-white axis lose saturation as
 * they gain brightness, which is the difference between cold light in thin
 * particles and an LED strip — and cyan is the direction an LED strip lies in.
 * That argument was sound while nothing else in the frame was cyan. It is not
 * sound now, because <PlaneAurora> puts a cyan source at the middle of the plane
 * and the rings are the thing that source is lighting. A ring lit by a cyan glow
 * that stays pure blue is not disciplined, it is disconnected.
 *
 * The safeguard the old rule existed to provide is kept by other means: the core
 * still mixes most of the way to WHITE, so the brightest beads desaturate as
 * they brighten and never sit at full-chroma cyan. What shifts is the base and
 * the atmosphere — the dim end — which is where a tint reads as a medium rather
 * than as a neon.
 */
const BASE_STOPS = [
  [40, 130, 200],
  [64, 150, 210],
  [90, 160, 200],
  [140, 190, 220],
  [200, 224, 240],
];

function palette(h: number) {
  const i = Math.min(BASE_STOPS.length - 1, Math.floor(h * (BASE_STOPS.length - 1)));
  const j = Math.min(BASE_STOPS.length - 1, i + 1);
  const f = h * (BASE_STOPS.length - 1) - i;
  const base = mix(BASE_STOPS[i], BASE_STOPS[j], f);
  return {
    core: mix(base, [255, 255, 255], 0.34).join(","),
    halo: mix(base, [255, 255, 255], 0.04).join(","),
    atmos: mix(base, [58, 104, 196], 0.42).join(","),
  };
}

export const FIELD_PALETTE = palette(FIELD.hue);

/**
 * How far the canvas reaches past the outermost ring, in pixels.
 *
 * The atmosphere is a fixed pixel radius rather than a fraction of the orbit,
 * so the margin has to be a pixel constant too — scale it with the radius and
 * the halo gets clipped on small viewports and wastes fill on large ones.
 */
export const FIELD_MARGIN = 210;

export const FIELD_TILT = ORBIT_TILT;
