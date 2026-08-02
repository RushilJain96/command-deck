/**
 * Deterministic environment tables, evaluated ONCE at module load.
 *
 * Calling Math.random() while rendering is not merely a hydration mismatch
 * here — it is a react-hooks/purity violation under the compiler-backed lint
 * rules this project runs, so it fails `npm run lint`. Seeding at module scope
 * makes the server and client derive byte-identical markup by construction,
 * which is why no `suppressHydrationWarning` appears anywhere in this feature.
 */

/** mulberry32 — small, fast, and good enough for scattering points. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Star {
  /** Percentage across the layer, 0-100. */
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly o: number;
  /** A few stars carry a faint colour cast, as real fields do. */
  readonly tint: string;
}

export interface StarLayer {
  /** Fraction of camera movement this layer echoes. Larger = nearer. */
  readonly parallax: number;
  readonly stars: readonly Star[];
}

// Overwhelmingly white with a scattering of warm and cool casts. A field of
// uniformly white dots reads as noise; a small amount of variance reads as sky.
const TINTS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#cfe0ff", "#ffe6cc", "#dbe7ff"];

/**
 * Pushes a uniform 0-1 sample toward the edges of the range.
 *
 * The centre of the viewport is where the spacecraft, the ring and the bearing
 * line all compete for attention, and stars there are pure noise behind them.
 * Weighting density outward keeps the middle clean while making the frame feel
 * fuller at its margins — the field reads as denser overall without adding a
 * single star where it would be read as clutter.
 */
function edgeBiased(sample: number): number {
  const centred = sample * 2 - 1; // -1..1
  const pushed = Math.sign(centred) * Math.pow(Math.abs(centred), 0.62);
  return (pushed + 1) / 2;
}

function buildLayer(seed: number, count: number, parallax: number, maxR: number): StarLayer {
  const random = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const roll = random();
    stars.push({
      x: edgeBiased(random()) * 100,
      y: edgeBiased(random()) * 100,
      // Cubed so most stars are tiny and a handful are notably brighter —
      // a flat distribution looks mechanical.
      r: 0.18 + Math.pow(random(), 3) * maxR,
      o: 0.12 + random() * (parallax * 2.4),
      tint: TINTS[Math.floor(roll * TINTS.length)],
    });
  }
  return { parallax, stars };
}

/**
 * Four depths. Density falls and brightness rises as layers come closer, so
 * parallax separates them into visibly distinct planes rather than one field
 * sliding at different speeds.
 */
export const STAR_LAYERS: readonly StarLayer[] = [
  buildLayer(0xc0ffee, 220, 0.025, 0.35), // dust
  buildLayer(0x5eed42, 110, 0.055, 0.55),
  buildLayer(0xbadf00d, 46, 0.1, 0.85),
  buildLayer(0x1337a5, 16, 0.17, 1.25), // foreground, brightest
];

export interface Planet {
  readonly id: string;
  /** Percentage of the viewport. */
  readonly x: string;
  readonly y: string;
  readonly size: string;
  /** Direction light arrives from, as a CSS gradient position. */
  readonly light: string;
  readonly body: string;
  readonly rim: string;
  readonly parallax: number;
  readonly opacity: number;
}

/**
 * Two distant bodies. They exist to give the void a sense of scale and to stop
 * the composition being perfectly symmetrical — both sit off-centre and are
 * partly cropped by the viewport, which is what makes them read as very large
 * and very far away rather than as circles placed on a background.
 *
 * A hard limb (the circular edge) plus a terminator is what makes a shape read
 * as a planet. Without the hard edge it is just a gradient.
 */
export const PLANETS: readonly Planet[] = [
  {
    id: "gas-giant",
    x: "-16%",
    y: "40%",
    size: "48vmin",
    // Lit from the upper right, matching the deck's key light. All three bodies
    // agree on the light direction; a scene where they disagree reads as
    // clip-art even when nobody can say why.
    light: "74% 28%",
    body: "#1b2432",
    rim: "rgb(150 185 235 / 0.30)",
    parallax: 0.035,
    opacity: 0.85,
  },
  {
    id: "moon",
    x: "82%",
    y: "-10%",
    size: "18vmin",
    light: "68% 30%",
    body: "#252c36",
    rim: "rgb(210 220 240 / 0.26)",
    parallax: 0.07,
    opacity: 0.72,
  },
  {
    id: "far-moon",
    x: "26%",
    y: "84%",
    size: "9vmin",
    light: "70% 26%",
    body: "#1d232b",
    rim: "rgb(180 200 230 / 0.18)",
    parallax: 0.05,
    opacity: 0.5,
  },
];

export interface Satellite {
  readonly id: string;
  readonly x: string;
  readonly y: string;
  /** Degrees, purely visual attitude. */
  readonly tilt: number;
  readonly scale: number;
  readonly parallax: number;
  /**
   * Optional downlink toward the deck: length in px, bearing in degrees
   * clockwise from screen-up.
   *
   * EXACTLY ONE SATELLITE GETS THIS. The void was beautiful and completely
   * generic — nothing in it implied anybody else was out there. A single faint
   * beam with traffic moving along it says the deck is a node in a network
   * rather than an object alone in space, which is a whole premise for the cost
   * of two divs. A second one would turn a signature into a texture.
   */
  readonly downlink?: { length: number; bearing: number };
}

/**
 * Two tiny craft in the far field.
 *
 * They exist entirely for scale: a planet alone could be any size, but a
 * recognisably artificial object next to it establishes that the scene is
 * enormous. Kept beneath conscious notice — a handful of hairlines each.
 */
export const SATELLITES: readonly Satellite[] = [
  {
    id: "sat-a",
    x: "71%",
    y: "26%",
    tilt: -18,
    scale: 1,
    parallax: 0.1,
    // Angled down and to the left, toward the deck's centre of mass.
    downlink: { length: 300, bearing: 213 },
  },
  { id: "sat-b", x: "17%", y: "68%", tilt: 24, scale: 0.72, parallax: 0.13 },
];
