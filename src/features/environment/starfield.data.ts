/**
 * THE REGION OF SPACE THE COMMAND CENTRE OPERATES IN.
 *
 * This is world-building, not decoration. Every object listed here answers one
 * question — why is it here? — and anything that could not answer it was
 * removed. The environment's job is to establish that the deck is somewhere
 * specific: an occupied orbit, close to a large body, inside a network somebody
 * else built. It must do that entirely in peripheral vision. A visitor should
 * see the spacecraft and the missions first and only later notice that the
 * space around them is populated.
 *
 * Deterministic tables, evaluated ONCE at module load. Calling Math.random()
 * while rendering is not merely a hydration mismatch here — it is a
 * react-hooks/purity violation under the compiler-backed lint rules this project
 * runs, so it fails `npm run lint`. Seeding at module scope makes server and
 * client derive byte-identical markup by construction, which is why no
 * `suppressHydrationWarning` appears anywhere in this feature.
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
  /** Percentage across the layer, 0-100. Maps linearly — see <StarLayerView>. */
  readonly x: number;
  readonly y: number;
  /** Diameter in CSS pixels. Never below 1, for the reason on STAR_TIERS. */
  readonly d: number;
  readonly o: number;
  /** Space-separated rgb triple, so the halo can reuse it with an alpha. */
  readonly tint: string;
  /** The brightest few, which get a tight point-spread. */
  readonly halo: boolean;
  /**
   * One of the two red tints. Drives a wider, stronger point-spread — see the
   * halo note in <StarLayerView>. Derived here rather than re-parsed from
   * `tint` at render time, because the renderer should not have to know which
   * strings in the palette count as warm.
   */
  readonly warm: boolean;
}

/**
 * COSMIC DUST — the third kind of thing in the sky, after stars and hardware.
 *
 * Soft-edged motes several times the size of a star and an order of magnitude
 * fainter. They are not lights and must never read as one: a star is a point
 * that emits, a mote is a speck of matter catching what the plane's cyan source
 * is putting out. That difference is carried entirely by the EDGE — these are
 * radial gradients that fade to nothing, where every star on the deck is a hard
 * disc. A 5px hard disc at low opacity looks like a dim star; a 5px soft one
 * looks like dust.
 *
 * Deliberately few. Their job is to give the empty stretches of the frame
 * something between "star" and "void" so the eye reads volume rather than a
 * black plane with dots on it, and thirty is enough to do that. Many more and
 * the sky starts to look foggy, which is what <SpaceHaze> is already for at a
 * much larger scale.
 */
export interface DustMote {
  readonly x: number;
  readonly y: number;
  /** Diameter in CSS pixels. */
  readonly d: number;
  readonly o: number;
  readonly tint: string;
  /** Seconds for one drift cycle, and its offset, so no two move together. */
  readonly dur: number;
  readonly delay: number;
}

export interface StarLayer {
  /** Fraction of camera movement this layer echoes. Larger = nearer. */
  readonly parallax: number;
  readonly stars: readonly Star[];
}

/**
 * Star colours, in the proportion a real field has them.
 *
 * Overwhelmingly white, a few cool blue-whites, fewer warm ones. A field of
 * uniformly white dots reads as noise; this much variance reads as sky and is
 * still below the threshold at which anyone would describe the stars as
 * coloured.
 *
 * Stored as bare rgb triples so a star's halo can be written in the star's own
 * colour with a different alpha.
 */
const TINTS = [
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "255 255 255",
  "205 222 255",
  "205 222 255",
  "222 232 255",
  "255 232 208",
  // THE RED ONES. Two entries in twenty is 10% of the field, and that is the
  // whole budget — a sky where you notice the red stars has too many. They earn
  // their place by being the only warm thing in a composition that is otherwise
  // blue, white and teal, so a handful of them carries further than a fair share
  // would suggest.
  "255 172 142",
  "255 138 112",
];

/** Index into TINTS at or above which a star counts as warm. */
const WARM_TINT_FROM = 14;

/**
 * SIZE AND BRIGHTNESS PER DEPTH — and the floor of 1px is the important part.
 *
 * The previous field was drawn as SVG circles in a 100x100 viewBox, and 86 of
 * the 150 dust-layer stars came out UNDER ONE PIXEL ACROSS. A sub-pixel circle
 * does not render as a small star; it renders as a fraction of a pixel's worth
 * of antialiasing, which is a grey smudge you cannot quite see. That, and not
 * the opacity, is why the sky looked empty.
 *
 * So every star is now at least a whole pixel and carries real brightness. That
 * sounds like it should lift the black and it does not, because the thing that
 * lifts a black frame is LIT AREA, not per-pixel value. All 324 stars together
 * cover about 570 square pixels of a 1.44-million-pixel frame — four
 * hundredths of one percent. They can be genuinely luminous points and the
 * ground stays at zero, which is exactly the brief: small lights of their own,
 * pitch black preserved.
 *
 * Brightness is COUPLED TO SIZE through one magnitude roll, because that is how
 * stars work — a brighter star reads bigger. `pow(u, 2.6)` makes the
 * distribution steep, so the overwhelming majority sit at the smallest size and
 * a handful stand out, which is roughly how real magnitudes fall. An even
 * spread of sizes looks mechanical.
 */
interface StarTier {
  readonly seed: number;
  readonly count: number;
  readonly parallax: number;
  /** Diameter range in CSS pixels. */
  readonly dMin: number;
  readonly dRange: number;
  readonly oMin: number;
  readonly oRange: number;
}

/**
 * 468 STARS. THIS COUNT HAS NOW GONE 324 -> 196 -> 468, AND BOTH MOVES WERE
 * RIGHT FOR THE FRAME THEY WERE MADE IN.
 *
 * At 324 the backdrop read as texture rather than distance: there was no dark
 * between the lights for the eye to rest in. Cutting to 196 fixed that — while
 * the orbital field still ran off every edge of the frame and filled it. Once
 * the field was contained to a bounded ellipse and the corners went to black,
 * the same 196 stars were spread over a frame with far more empty space in it,
 * and the sky went from restful to bare.
 *
 * The lesson worth keeping is that star COUNT is not an independent variable.
 * It is set against how much of the frame everything else is occupying, so it
 * has to be re-judged whenever the field's extent changes — which is exactly the
 * thing that changed twice here.
 *
 * The distribution is untouched, and that is what makes 468 safe: `pow(u, 2.6)`
 * keeps the overwhelming majority at the 1px floor, so more than doubling the
 * count roughly doubles a lit area that was four hundredths of one percent of
 * the frame. The ground stays at zero. What actually increases is the number of
 * FAINT stars, which is the part of a real sky that makes it read as deep.
 *
 * 468 -> 1404. TRIPLED, AND THE ARGUMENT ABOVE IS EXACTLY WHY IT IS SAFE TO DO.
 * The reasoning that justified 468 is a rule, not a number: lit area scales with
 * count while the steep magnitude curve holds, and it does — the four tiers are
 * scaled by the same factor, so the shape of the distribution is identical and
 * only its density changes. Three times four hundredths of one percent is still
 * roughly a tenth of one percent of the frame.
 *
 * It was also re-judged against the thing the note says to re-judge it against:
 * the field's extent. The void was darkened hard in the same pass — the central
 * radial pulled in, the haze halved, the ring atmosphere more than halved — so
 * there is now considerably MORE empty frame than when 468 was chosen, which is
 * the precise condition under which that note says the count must go up.
 */
const STAR_TIERS: readonly StarTier[] = [
  { seed: 0xc0ffee, count: 732, parallax: 0.025, dMin: 1, dRange: 0.9, oMin: 0.2, oRange: 0.2 },
  { seed: 0x5eed42, count: 396, parallax: 0.055, dMin: 1, dRange: 1.1, oMin: 0.26, oRange: 0.26 },
  { seed: 0xbadf00d, count: 186, parallax: 0.1, dMin: 1.1, dRange: 1.4, oMin: 0.34, oRange: 0.32 },
  { seed: 0x1337a5, count: 90, parallax: 0.17, dMin: 1.2, dRange: 2, oMin: 0.44, oRange: 0.48 },
];

/**
 * A REAL SKY IS CLUMPY, AND THAT IS THE WHOLE POINT OF THIS FUNCTION.
 *
 * Uniform random placement is what makes a star field look procedural. It has no
 * clusters and no voids, so every region has roughly the same density — which
 * the eye reads as an even texture, i.e. as generated. The give-away is not that
 * the stars are random; it is that they are TOO evenly random.
 *
 * So each layer is built in two passes. Most stars are drawn near a handful of
 * cluster seeds with a falloff, which produces loose associations the way real
 * ones form together. The rest are scattered as field stars so the clusters do
 * not read as blobs. Then whole regions are cut out — see VOIDS — because
 * genuinely empty sky is as much a feature of the real thing as the stars are,
 * and the brief asks for it explicitly.
 *
 * Brightness follows a steep distribution: `pow(r, 3)` means the overwhelming
 * majority are at the limit of visibility and a handful are notably brighter,
 * which is roughly how magnitudes actually fall. A flat distribution looks
 * mechanical.
 */
interface Region {
  x: number;
  y: number;
  r: number;
}

/**
 * Regions deliberately left empty.
 *
 * The first is fixed and is the important one: a wide clearing over the middle
 * of the frame, where the spacecraft, the orbital plane and the bearing vector
 * all compete for attention. Stars there are pure noise behind the one thing the
 * composition is about. The rest are scattered per layer, so the sky has voids
 * that are nothing to do with the interface — which is what stops the central
 * clearing reading as a hole cut for the UI.
 */
/**
 * A layer spans 124% of the viewport (`-inset-[12%]`), so the visible window is
 * 9.7%-90.3% of this coordinate space and the viewport's centre lands on 50.
 * The spacecraft sits a little below that, hence 58 rather than 50.
 *
 * SMALLER THAN IT WAS, because it used to be doing damage invisibly. The old SVG
 * cropped the field to y 5-51 of 100, so a void at y 54 r 21 was eating the
 * bottom third of everything that could actually be seen while looking innocuous
 * in the data. With the crop gone the clearing does what it is meant to: it
 * keeps stars off the hull and off the bearing vector, and nothing else.
 */
const WORKING_VOID: Region = { x: 50, y: 58, r: 16 };

function buildLayer(tier: StarTier): StarLayer {
  const { seed, count, parallax, dMin, dRange, oMin, oRange } = tier;
  const random = mulberry32(seed);

  const clusters: Region[] = Array.from({ length: 5 }, () => ({
    x: random() * 100,
    y: random() * 100,
    r: 5 + random() * 9,
  }));

  const voids: Region[] = [
    WORKING_VOID,
    ...Array.from({ length: 3 }, () => ({
      x: random() * 100,
      y: random() * 100,
      r: 11 + random() * 13,
    })),
  ];

  const inside = (x: number, y: number, region: Region) =>
    Math.hypot(x - region.x, y - region.y) < region.r;

  const stars: Star[] = [];
  // Bounded: rejection sampling against voids can in principle spin, and a
  // module-load infinite loop is a blank page with no error.
  for (let attempt = 0; attempt < count * 24 && stars.length < count; attempt++) {
    let x: number;
    let y: number;

    if (random() < 0.52) {
      const cluster = clusters[Math.floor(random() * clusters.length)];
      const angle = random() * Math.PI * 2;
      // Concentrated toward the seed rather than filling its circle evenly, so a
      // cluster has a core instead of an edge.
      const distance = Math.pow(random(), 1.8) * cluster.r;
      x = cluster.x + Math.cos(angle) * distance;
      y = cluster.y + Math.sin(angle) * distance;
    } else {
      x = random() * 100;
      y = random() * 100;
    }

    if (x < 0 || x > 100 || y < 0 || y > 100) continue;
    if (voids.some((region) => inside(x, y, region))) continue;

    // One magnitude roll drives size AND brightness, so bigger is brighter.
    const magnitude = Math.pow(random(), 2.6);
    const roll = random();
    const tintIndex = Math.floor(roll * TINTS.length);
    const warm = tintIndex >= WARM_TINT_FROM;

    stars.push({
      x,
      y,
      d: +(dMin + magnitude * dRange).toFixed(2),
      o: +(oMin + magnitude * oRange).toFixed(3),
      tint: TINTS[tintIndex],
      warm,
      /**
       * Halo — the bloom that makes a star read as SHINING rather than as a lit
       * pixel. Nearer layers only, and normally only the top of their magnitude
       * range, which is about a dozen stars in the whole sky.
       *
       * WARM STARS CLEAR A LOWER BAR (0.72 -> 0.46) BECAUSE THEY HAVE TO. A red
       * point at 60% brightness against a black sky is a dim red dot; the same
       * point with a bloom around it is a red giant. White stars do not need the
       * help — they sit at the top of the value range already, and their colour
       * is the sky's default, so a white star is read as a star at any size. The
       * whole reason the warm ones are in the palette is to be noticed, and at
       * 10% of the field they are rare enough that blooming more of them does
       * not make the sky glow.
       */
      halo: parallax >= 0.1 && magnitude > (warm ? 0.32 : 0.72),
    });
  }

  return { parallax, stars };
}

/**
 * Four depths. Density falls and brightness rises as layers come closer, so
 * parallax separates them into visibly distinct planes rather than one field
 * sliding at different speeds.
 */
export const STAR_LAYERS: readonly StarLayer[] = STAR_TIERS.map(buildLayer);

/**
 * The dust field. Built from its own mulberry32 stream so adding or removing a
 * mote cannot re-roll the stars — the same reason every star tier carries its
 * own seed.
 *
 * NO CLUSTERING AND NO VOID REJECTION, unlike the stars. Dust has no reason to
 * gather where stars do, and the central working void exists to keep the area
 * behind the ship and the bearing vector clear of small bright points. These are
 * neither small nor bright, and a few of them drifting behind the hull is the
 * one place the effect actually reads.
 */
const DUST_PARALLAX = 0.075;

export const DUST: readonly DustMote[] = (() => {
  const random = mulberry32(0xd057);
  return Array.from({ length: 30 }, () => {
    // Squared roll, so most motes sit at the small end and a few are broad.
    const size = Math.pow(random(), 2);
    return {
      x: random() * 100,
      y: random() * 100,
      d: +(3 + size * 3).toFixed(2),
      o: +(0.05 + size * 0.07).toFixed(3),
      tint: random() < 0.62 ? "170 195 220" : "150 190 225",
      // 40-95s. Long enough that nothing is ever caught moving.
      dur: +(40 + random() * 55).toFixed(1),
      delay: +(random() * -60).toFixed(1),
    };
  });
})();

export { DUST_PARALLAX };

export type StructureKind = "relay" | "beacon" | "array" | "truss" | "hulk";

export interface Structure {
  readonly id: string;
  /** One line on why this object is in the scene. Not rendered — it is a rule. */
  readonly purpose: string;
  readonly kind: StructureKind;
  readonly x: string;
  readonly y: string;
  readonly scale: number;
  readonly tilt: number;
  readonly parallax: number;
  readonly opacity: number;
  /**
   * Optional downlink toward the deck: length in px, bearing in degrees
   * clockwise from screen-up.
   */
  readonly downlink?: { length: number; bearing: number };
}

/**
 * ORBITAL INFRASTRUCTURE — seven objects, and every one of them has a reason.
 *
 * The test each had to pass: if this were deleted, would the scene lose an idea?
 * Anything that only made the frame busier was cut, which is how the previous
 * fourteen pieces of scattered debris were removed — they were texture pretending
 * to be world-building, and "randomly scattered" is the opposite of what makes a
 * place feel inhabited.
 *
 * Together they say four things:
 *
 *   SOMEBODY BUILT THIS   two relays and an array. There is a network here, the
 *                         deck is a node on it, and it did not build itself.
 *   IT IS SURVEYED        two beacons on opposing flanks. A marked orbit is a
 *                         used orbit.
 *   VEHICLES COME AND GO  a docking truss. The spacecraft came from somewhere
 *                         and can return to it.
 *   IT HAS A HISTORY      one dead hulk, unlit, tumbling. This is the object that
 *                         does the most work for the least ink: infrastructure
 *                         that still functions says the place is operational,
 *                         but wreckage says it has been operational for a long
 *                         time.
 *
 * PLACEMENT IS ALL PERIPHERAL. Every one sits in the outer band of the frame,
 * clear of the callout field and well away from the spacecraft. Parallax runs
 * 0.12 to 0.30 — nearer than every star layer (max 0.17) and nearer still than
 * the body at 0.03 — so the depth ladder from deep sky to local hardware is
 * carried by how much each thing moves, not by how big it is drawn.
 *
 * NOTHING HERE IS ANIMATED. The one moving element in the void is the packet on
 * the relay's downlink, which predates this pass and belongs to the comms link
 * rather than to the hardware.
 */
export const STRUCTURES: readonly Structure[] = [
  {
    id: "relay-primary",
    purpose: "The deck talks to someone. This is who.",
    kind: "relay",
    x: "80%",
    y: "13%",
    scale: 1.15,
    tilt: -16,
    parallax: 0.22,
    opacity: 0.62,
    // Angled down and to the left, toward the deck's centre of mass.
    downlink: { length: 300, bearing: 213 },
  },
  {
    id: "relay-distant",
    purpose: "The network continues past the frame; the primary is not the edge of it.",
    kind: "relay",
    x: "92%",
    y: "28%",
    scale: 0.52,
    tilt: 9,
    parallax: 0.12,
    opacity: 0.38,
  },
  {
    id: "array-power",
    purpose: "Something has to power the relays. Infrastructure implies more infrastructure.",
    kind: "array",
    x: "17%",
    y: "7%",
    scale: 0.9,
    tilt: 12,
    parallax: 0.18,
    opacity: 0.52,
  },
  /* FOUR MORE STOOD HERE: a pair of beacons at 19%/56% and 81%/62%, a docking
     truss at 91%/92% and a derelict hulk at 26%/86%.
   *
   * Each was individually justified — the beacons marked the plane's axis, the
   * truss said the ship came from somewhere, the hulk said the place had been
   * operational for years. All true, and all of it argued for ADDING one more
   * object without anyone ever counting the total. Seven pieces of hardware plus
   * sixteen bodies plus 324 stars is not a backdrop, it is a second subject.
   *
   * The three that remain are the three above the horizon and the three that
   * form one idea rather than four separate ones: a relay, the relay it talks
   * past, and the array powering them. The bottom corners are now empty, and
   * empty is what makes the frame read as space rather than as a diagram of it.
   */
];
