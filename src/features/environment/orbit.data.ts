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
   * Ring count.
   *
   * SIX, ACROSS THE SAME 0.16-2.6 BAND. Nine rings over this span crowded the
   * middle of the field — the gaps in the dense inner half fell below the width
   * of the halo, so adjacent rings bled into each other and the whole core read
   * as one bright mass rather than as separate tracks. Six over the same extent
   * gives every ring room for its own halo, which is what makes them read as
   * distinct orbits rather than as texture.
   */
  rings: 6,
  seed: 0x51e11a,

  /**
   * The band the rings occupy, in units of --orbit-radius.
   *
   * The system is normalised so its outermost ring is 1 and then remapped into
   * this band, which keeps the inner rings clear of each other no matter how the
   * growth terms are tuned.
   *
   * THE OUTER FIGURE RUNS OFF THE SCREEN, DELIBERATELY. SHIP_STANDOFF puts the
   * spacecraft 1.20 below the plane's centre, so a field that stopped at 1.0
   * ended above the hull and the vehicle read as parked in front of a picture of
   * it. At 2.6 the outer rings leave the frame entirely on every side, which is
   * the difference between a diagram of a system and being inside one — you
   * never see the edge of the thing you are flying in.
   *
   * The inner figure is tight on purpose: a dense core is most of what makes the
   * field converge rather than spreading evenly across the frame.
   */
  innerRing: 0.16,
  outerRing: 2.6,

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

  /** Bright-to-dim ratio around each ring, and the floor the dim parts hold. */
  contrast: 0.05,
  ember: 0.34,

  /** Per-layer levels. */
  core: 1,
  halo: 1,
  atmosphere: 0.61,
  /** Atmospheric radius. */
  reach: 0.6,
  /** Inward drift off each arc. */
  leak: 0.67,

  /** 0 is a true blue, 1 a blue-white. */
  hue: 0.33,
} as const;

export interface FieldRing {
  /** Radius as a fraction of --orbit-radius. */
  readonly base: number;
  readonly harmonics: readonly { k: number; a: number; p: number }[];
  readonly phase: number;
  readonly weight: number;
}

/**
 * Radii grow geometrically with a widening step plus a scatter term, then the
 * whole set is normalised and remapped into `innerRing`..1.
 */
function buildRings(): FieldRing[] {
  const random = mulberry32(FIELD.seed);
  // Mutable while the progression is being built; frozen into `FieldRing` on
  // the way out, once the normalise-and-remap pass has settled every radius.
  const rings: { base: number; harmonics: FieldRing["harmonics"]; phase: number; weight: number }[] =
    [];
  let r = 1;

  for (let i = 0; i < FIELD.rings; i++) {
    // Drawn even at zero irregularity: these calls advance the generator, and
    // the ring spacing below depends on where it lands.
    const raw = [
      { k: 1, a: random() * 2 - 1, p: random() * TAU },
      { k: 2, a: random() * 2 - 1, p: random() * TAU },
      { k: 3, a: (random() * 2 - 1) * 0.6, p: random() * TAU },
    ];
    const total = raw.reduce((sum, h) => sum + Math.abs(h.a), 0) || 1;

    rings.push({
      base: r,
      harmonics: raw.map((h) => ({ ...h, a: h.a / total })),
      phase: random() * 1000,
      weight: 0.66 + random() * 0.34,
    });

    r *= 1.12 + random() * (0.06 + FIELD.scatter * 0.34) + i * (0.02 + FIELD.spread * 0.05);
  }

  const outer = rings[rings.length - 1].base;
  for (const ring of rings) ring.base /= outer;
  const inner = rings[0].base;
  const span = 1 - inner || 1;
  return rings.map((ring) => ({
    ...ring,
    base:
      FIELD.innerRing + ((ring.base - inner) / span) * (FIELD.outerRing - FIELD.innerRing),
  }));
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
  // The near arc carries about twice the far one. This is the only cue that the
  // ring is a plane lying away from the viewer rather than a shape on glass.
  const near = (1 - Math.cos(t)) / 2;
  a *= (0.34 + 0.66 * near) * ring.weight;
  return { a, lit, dens };
}

/**
 * BLUE AT EVERY SCALE, AND NEVER CYAN.
 *
 * One base hue; the core is mixed a third of the way to white and the
 * atmosphere a little deeper. Because the mixes travel along the blue-to-white
 * axis rather than around the colour wheel, saturation falls as brightness
 * rises — which is the actual difference between cold light in thin particles
 * and an LED strip.
 */
const BASE_STOPS = [
  [64, 124, 240],
  [96, 146, 238],
  [132, 170, 234],
  [168, 194, 234],
  [200, 216, 240],
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
