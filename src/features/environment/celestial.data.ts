/**
 * THE BODIES IN THIS REGION OF SPACE.
 *
 * Sixteen of them, and none is a flat disc. Every one is built from four stacked
 * layers whose order is the whole model:
 *
 *   albedo    the material's own colour, unlit
 *   surface   craters or latitudinal bands painted on that material
 *   shade     the lighting: sub-solar falloff, terminator, limb darkening
 *   rim       backscatter on the SHADOW limb
 *
 * The lighting sits ABOVE the surface on purpose. Paint craters over a finished
 * gradient and they stay bright on the night side, which is the single clearest
 * tell that a "planet" is a circle with decals on it.
 *
 * THE BACKSCATTER RIM IS THE ONE THAT MATTERS. A hairline of light on the dark
 * edge, opposite the key. A flat disc has no edge that can catch light from
 * behind it, so a lit dark rim can only be read as curvature — it does more for
 * the three-dimensionality than the crater detail does.
 *
 * EACH BODY CARRIES ITS OWN SUN ANGLE, which looks like a violation of the
 * deck's one-key-light rule and is not. The sun is shared; what differs is each
 * body's PHASE ANGLE — where it sits relative to that sun along its own orbit.
 * A body between the viewer and the sun shows a thin crescent; one on the far
 * side shows a gibbous disc. So the lit fraction and the crescent's orientation
 * vary per body because their positions do, which is also why they must not all
 * face the same way: a dozen identically-lit crescents is a pattern, and a
 * pattern is the thing that makes a sky look generated.
 *
 * Deterministic at module load, like everything else in this feature — server
 * and client derive byte-identical markup and nothing flashes on hydration.
 */

/** mulberry32 — small, fast, and good enough for scattering craters. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEG = Math.PI / 180;

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Unit vector toward this body's sun, in view space: +x right, +y up, +z toward
 * the viewer.
 *
 * `z` is what sets the phase. Positive means the sun is in front of the body and
 * you see a gibbous disc; negative means it is behind, and you get a crescent
 * whose thinness grows with |z|. The sign of `x` decides which side that
 * crescent falls on.
 */
export function sunVector(az: number, el: number): Vec3 {
  const a = az * DEG;
  const e = el * DEG;
  return {
    x: Math.cos(e) * Math.sin(a),
    y: Math.sin(e),
    z: Math.cos(e) * Math.cos(a),
  };
}

export interface Crater {
  readonly lat: number;
  readonly lon: number;
  /** Angular radius as a percentage of the disc. */
  readonly r: number;
  /** Per-crater depth variation, 0.55-1. */
  readonly v: number;
}

export function makeCraters(seed: number, count: number, minR: number, maxR: number): Crater[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    // asin of a uniform sample gives an even distribution over the SPHERE
    // rather than over latitude, which would crowd the poles.
    lat: Math.asin(random() * 2 - 1) * 0.86,
    lon: random() * Math.PI * 2,
    r: minR + Math.pow(random(), 1.8) * (maxR - minR),
    v: 0.55 + random() * 0.45,
  }));
}

export interface Band {
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly c: string;
}

/**
 * Latitudinal bands, as very wide flat ellipses clipped by the disc.
 *
 * Because each ellipse is wider than the body, the disc crops it to exactly the
 * width of that latitude — so bands narrow toward the poles on their own,
 * without any of them being drawn curved.
 */
const GIANT_BANDS: readonly Band[] = [
  { y: 24, w: 130, h: 13, c: "rgb(255 234 202 / 0.05)" },
  { y: 40, w: 134, h: 9, c: "rgb(0 0 0 / 0.2)" },
  { y: 55, w: 134, h: 16, c: "rgb(255 226 188 / 0.06)" },
  { y: 71, w: 128, h: 10, c: "rgb(0 0 0 / 0.22)" },
  { y: 83, w: 118, h: 10, c: "rgb(255 234 202 / 0.035)" },
];

export interface Body {
  readonly id: string;
  /** Placement of the disc's top-left corner, as viewport percentages. */
  readonly x: string;
  readonly y: string;
  /** Diameter. Any CSS length. */
  readonly size: string;
  /** This body's own sun angle — see the note on phase at the top of the file. */
  readonly az: number;
  readonly el: number;
  readonly albedo: string;
  readonly rim: string;
  readonly rimO: number;
  readonly opacity: number;
  readonly parallax: number;
  /** Radians per second. 0 is static, which is most of them. */
  readonly spin: number;
  readonly craters?: readonly Crater[];
  readonly bands?: readonly Band[];
  /**
   * Storm ovals. Same spherical projection as craters, but drawn as soft tinted
   * patches with no shadow — gas has no relief to cast one.
   *
   * THEY EXIST SO THE GIANT CAN VISIBLY TURN. Latitudinal bands are symmetric
   * about the polar axis, so a banded body rotating about that axis looks
   * completely static no matter how fast it spins. Something off-axis has to
   * ride the surface for the rotation to read at all, which is exactly why the
   * one feature everybody can name on Jupiter is a spot.
   */
  readonly spots?: readonly Crater[];
}

/**
 * Muted enough that none of them can be mistaken for `--signal`, which is
 * reserved for the operator's current target and appears nowhere else. These
 * read as hue differences between rocks, not as coloured lights.
 *
 * THE DISCS ARE DARK AND THE RIMS ARE NOT, and that split is deliberate. A body
 * is mostly area, and area is what lifts a black frame — the first pass ran
 * these albedos two stops higher and the near planetoid became the brightest
 * object on the deck, brighter than the spacecraft. The rim is a hairline, so it
 * costs almost nothing in total light and it is the layer carrying the
 * three-dimensionality. Dropping the disc and keeping the rim buys back the
 * black without flattening a single body.
 */
const IRON = { albedo: "#1a1714", rim: "rgb(232 212 190)" };
const REGOLITH = { albedo: "#1c2028", rim: "rgb(190 210 244)" };
const OCHRE = { albedo: "#191713", rim: "rgb(228 206 172)" };
const RUST = { albedo: "#1d1413", rim: "rgb(238 198 186)" };
const STEEL = { albedo: "#131a24", rim: "rgb(182 208 244)" };
const VERDIGRIS = { albedo: "#131c1a", rim: "rgb(188 226 214)" };
const VIOLET = { albedo: "#17151f", rim: "rgb(206 200 240)" };
const CARBON = { albedo: "#101319", rim: "rgb(160 184 220)" };

/**
 * PLACEMENT AVOIDS THE CALLOUT BAND.
 *
 * At every tier the mission field occupies roughly the middle of the frame, so
 * the bodies live in the margins: the top-right corner above the callouts, the
 * two open lanes either side of the spacecraft, and the strip along the bottom.
 *
 * Where one does end up behind a callout it is simply occluded — <Starfield> is
 * a sibling of <CameraRig> and precedes it in the DOM with no z-index on either,
 * so every mission card paints over every body by construction. That is the
 * correct read anyway: the card is an instrument in the cockpit, the body is a
 * rock a thousand kilometres away.
 */
export const BODIES: readonly Body[] = [
  /* ---------------------------------------------------------------- NEAR --
     One large body, cropped by two edges of the top-right corner. Cropping is
     what sells the size: an object fully inside the frame reads as an object
     placed in a picture, where one running off two edges reads as far larger
     than the frame. Gibbous rather than full, so the terminator falls across
     the visible face and the form is legible. */
  {
    id: "planetoid-iron",
    ...IRON,
    x: "82%",
    y: "-9%",
    size: "34vmin",
    az: 285,
    el: 24,
    rimO: 0.62,
    opacity: 0.5,
    parallax: 0.03,
    spin: 0,
    craters: makeCraters(0x1207, 34, 3.5, 15),
  },

  /* ----------------------------------------------------------------- MID --
     Three bodies that turn. Spread to three different quadrants so they never
     read as a set, and slow enough that the motion is only visible if you stop
     and watch — a full rotation takes between four and seven minutes. */
  {
    id: "giant-banded",
    ...OCHRE,
    x: "20%",
    y: "58%",
    size: "92px",
    az: 62,
    el: 26,
    rimO: 0.55,
    opacity: 0.5,
    parallax: 0.09,
    spin: 0.016,
    bands: GIANT_BANDS,
    spots: makeCraters(0x6a17, 4, 9, 20),
  },
  {
    id: "moon-regolith-a",
    ...REGOLITH,
    x: "63%",
    y: "76%",
    size: "76px",
    az: 48,
    el: 30,
    rimO: 0.66,
    opacity: 0.52,
    parallax: 0.12,
    spin: 0.019,
    craters: makeCraters(0x2c04, 26, 4, 17),
  },
  {
    id: "moon-regolith-b",
    ...REGOLITH,
    x: "3%",
    y: "84%",
    size: "62px",
    az: 312,
    el: 22,
    rimO: 0.62,
    opacity: 0.46,
    parallax: 0.14,
    spin: -0.014,
    craters: makeCraters(0x2c05, 22, 4, 16),
  },

  /* ------------------------------------------------------------------ FAR --
     Four coloured bodies, static, all crescent. Azimuths are deliberately
     scattered across both hemispheres so the lit edges point four different
     ways. */
  {
    id: "far-rust",
    ...RUST,
    x: "22%",
    y: "80%",
    size: "34px",
    az: 128,
    el: 18,
    rimO: 0.76,
    opacity: 0.52,
    parallax: 0.16,
    spin: 0,
    // NO CRATERS, DELIBERATELY. This body is a strong crescent, so only about
    // one in ten of its craters ever falls on the lit sliver — and a single
    // crater on a 34px disc reads as a blemish rather than as terrain. Below
    // roughly 40px, or at any strong phase, the crescent is the whole story.
  },
  {
    id: "far-steel",
    ...STEEL,
    x: "76%",
    y: "56%",
    size: "27px",
    az: 232,
    el: 14,
    rimO: 0.8,
    opacity: 0.5,
    parallax: 0.18,
    spin: 0,
  },
  {
    id: "far-verdigris",
    ...VERDIGRIS,
    x: "94%",
    y: "13%",
    size: "31px",
    az: 152,
    el: -10,
    rimO: 0.78,
    opacity: 0.48,
    parallax: 0.15,
    spin: 0,
  },
  {
    id: "far-violet",
    ...VIOLET,
    x: "36%",
    y: "91%",
    size: "23px",
    az: 205,
    el: 26,
    rimO: 0.8,
    opacity: 0.46,
    parallax: 0.19,
    spin: 0,
  },

  /* -------------------------------------------------------------- DISTANT --
     Eight specks, 9-16px, crescent only. At this size there is no room for
     surface detail, so the phase is doing all the work — and it is exactly what
     separates these from the star field they sit among. A full bright dot is a
     star; a dot with a dark limb is an object. */
  { id: "d1", ...CARBON, x: "5%", y: "30%", size: "12px", az: 140, el: 20, rimO: 0.85, opacity: 0.5, parallax: 0.2, spin: 0 },
  { id: "d2", ...STEEL, x: "93%", y: "37%", size: "10px", az: 224, el: -6, rimO: 0.9, opacity: 0.48, parallax: 0.22, spin: 0 },
  { id: "d3", ...REGOLITH, x: "69%", y: "10%", size: "14px", az: 118, el: 30, rimO: 0.8, opacity: 0.52, parallax: 0.17, spin: 0 },
  { id: "d4", ...RUST, x: "30%", y: "69%", size: "9px", az: 248, el: 12, rimO: 0.9, opacity: 0.46, parallax: 0.24, spin: 0 },
  { id: "d5", ...VERDIGRIS, x: "48%", y: "88%", size: "13px", az: 166, el: -18, rimO: 0.82, opacity: 0.5, parallax: 0.21, spin: 0 },
  { id: "d6", ...VIOLET, x: "88%", y: "79%", size: "11px", az: 200, el: 34, rimO: 0.86, opacity: 0.47, parallax: 0.23, spin: 0 },
  { id: "d7", ...CARBON, x: "14%", y: "48%", size: "16px", az: 133, el: 6, rimO: 0.78, opacity: 0.54, parallax: 0.16, spin: 0 },
  { id: "d8", ...OCHRE, x: "79%", y: "93%", size: "10px", az: 258, el: 20, rimO: 0.88, opacity: 0.45, parallax: 0.25, spin: 0 },
];

/**
 * BODIES THAT RIDE THE FIELD ITSELF.
 *
 * These are not part of the backdrop. They sit ON an orbit, in world space,
 * positioned by the same `--orbit-radius` and `--orbit-tilt` the mission nodes
 * use — so they hold their place on a ring at every viewport size without a
 * single measurement.
 *
 * WHY THEY ARE WORTH THE EXTRA MACHINERY. A body floating in the backdrop is
 * scenery; a body sitting on a lit track is traffic. It is the one thing that
 * makes the field read as a system with things moving in it rather than as a
 * beautiful diagram — and it costs a ring index and an angle.
 *
 * `ring` indexes FIELD_RINGS, so these follow the orbits wherever the field's
 * spacing is retuned — but the indices themselves have to stay inside the ring
 * count. <PlaneBodyView> clamps an out-of-range one to the outermost track,
 * which fails silently by stacking two bodies on one ring rather than by
 * throwing, so check them whenever `FIELD.rings` changes. `theta` is degrees clockwise from screen-up, the same
 * convention as everything else on the deck.
 */
export interface PlaneBody extends Omit<Body, "x" | "y" | "parallax"> {
  /** Index into FIELD_RINGS. */
  readonly ring: number;
  /** Degrees clockwise from screen-up. */
  readonly theta: number;
}

export const PLANE_BODIES: readonly PlaneBody[] = [
  {
    id: "track-steel",
    ...STEEL,
    ring: 4,
    theta: 118,
    size: "26px",
    az: 138,
    el: 16,
    rimO: 0.8,
    opacity: 0.62,
    spin: 0,
  },
  {
    id: "track-rust",
    ...RUST,
    ring: 1,
    theta: 293,
    size: "19px",
    az: 226,
    el: -8,
    rimO: 0.85,
    opacity: 0.58,
    spin: 0,
  },
  {
    id: "track-regolith",
    ...REGOLITH,
    ring: 5,
    theta: 208,
    size: "31px",
    az: 62,
    el: 24,
    rimO: 0.7,
    opacity: 0.6,
    spin: 0.012,
    craters: makeCraters(0x7a11, 14, 5, 18),
  },
  {
    id: "track-verdigris",
    ...VERDIGRIS,
    ring: 3,
    theta: 44,
    size: "16px",
    az: 158,
    el: 30,
    rimO: 0.88,
    opacity: 0.55,
    spin: 0,
  },
];
