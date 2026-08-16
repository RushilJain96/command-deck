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
  /**
   * The sub-solar highlight — where the sphere turns toward the key light.
   *
   * ONE STEP UP FROM `albedo`, IN THE SAME HUE, and that restraint is the whole
   * point. The disc gradient needs a brighter stop to have any form at all, but
   * the warning above is specific: an early pass ran these two stops higher and
   * the near planetoid became the brightest object on the deck, brighter than the
   * spacecraft. So these sit around 12% relative luminance against the albedos'
   * 2-3% — enough that a sphere is unmistakably a sphere, far short of anything
   * that competes with the hull.
   *
   * Per-material rather than one shared slate, or the palette collapses: iron,
   * ochre, rust and verdigris would all highlight to the same blue-grey and the
   * bodies would stop being different rocks.
   */
  readonly lit: string;
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

  /**
   * Atmospheric haze, in CSS pixels of blur. For the most distant bodies only.
   *
   * A real optical effect at the wrong scale — nothing a few hundred kilometres
   * away is blurred by intervening space. It is here because it does what
   * distance does to a small object in a frame: removes its edge. A crisp 8px
   * disc and a crisp 40px disc read as the same distance at different sizes; the
   * blurred one reads as further away. Keep it to a single pixel and to bodies
   * under about 12px, or it stops looking like distance and starts looking like
   * a mistake.
   */
  readonly blur?: number;

  /**
   * A tilted ring system. `tilt` is degrees, `spread` is the ring's outer
   * diameter as a multiple of the body's own.
   */
  readonly rings?: {
    readonly tilt: number;
    readonly spread: number;
    readonly color: string;
  };
}

/**
 * Muted enough that none of them can be mistaken for `--signal`, which is
 * reserved for the operator's current target and appears nowhere else. These
 * read as hue differences between rocks, not as coloured lights.
 *
 * THE DISCS ARE DARK AND THE RIMS ARE NOT, and that split is deliberate. A body
 * is mostly area, and area is what lifts a black frame — an early pass ran these
 * albedos two stops higher and the near planetoid became the brightest object on
 * the deck, brighter than the spacecraft. The rim is a hairline, so it costs
 * almost nothing in total light and it is the layer carrying the
 * three-dimensionality. Dropping the disc and keeping the rim buys back the
 * black without flattening a single body.
 *
 * THE ALBEDOS NOW CARRY HUE AT THE SAME LUMINANCE, WHICH IS THE WHOLE TRICK.
 * The bodies read as "completely black" not because they were too dark but
 * because they were too NEUTRAL — #1a1714 is a grey with a rumour of brown in
 * it, and at 2% of white nobody sees the brown. #0a192f is a slate blue anyone
 * can name, and its relative luminance is 23.4 against the old 23.3. It is not
 * one stop brighter. It is the same value with somewhere to be.
 *
 * That is why the warning above still stands unchanged: the thing that lifted
 * the frame last time was VALUE, and none of these moved. Saturation is free.
 *
 * The rims read as the light of wherever the body is — cool white for the ice
 * bodies, amber for the one warm body, violet for the two cool outliers. They
 * used to be pulled toward a cyan key light on the theory that a rim should match
 * the deck's own light; that key light is gone and so is the cyan, but the warm
 * and violet outliers stay, because bodies differing FROM each other is what
 * makes the backdrop read as a system of distinct objects.
 */
const IRON = { albedo: "#0a192f", lit: "#1e2f4a", rim: "rgb(170 200 225)" };
const REGOLITH = { albedo: "#101a26", lit: "#25313f", rim: "rgb(150 200 240)" };
const OCHRE = { albedo: "#1c1710", lit: "#332a1e", rim: "rgb(255 158 100)" };
const RUST = { albedo: "#1b1220", lit: "#332039", rim: "rgb(187 154 247)" };
const STEEL = { albedo: "#0b1826", lit: "#1f3245", rim: "rgb(120 190 235)" };
const VERDIGRIS = { albedo: "#0c1c1a", lit: "#20342f", rim: "rgb(140 220 210)" };
const VIOLET = { albedo: "#141024", lit: "#2a2340", rim: "rgb(187 154 247)" };
const CARBON = { albedo: "#0a0f18", lit: "#1c2534", rim: "rgb(130 170 210)" };

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
     The nearest body. Gibbous rather than full, so the terminator falls across
     the visible face and the form is legible.

     IT USED TO BE A 34vmin GIANT CROPPED BY THE TOP-RIGHT CORNER, and cropping
     genuinely was what sold its size — an object fully inside the frame reads as
     an object placed in a picture, where one running off two edges reads as
     larger than the frame. That trick is abandoned here, for a reason worth
     recording so nobody reinstates it:

     A CROPPED BODY NEEDS A FREE EDGE, AND THIS DECK HAS NONE. Chrome occupies
     all four: the top bar, the dock, the instrument rail down the left and the
     cluster up the right. Cropping only works where the body is large enough to
     reach past that chrome into open frame — and at that size, on the right, it
     became the second-largest object on screen sitting on the ship's starboard
     flank, where it beat the vehicle for attention. Shrunk, it disappears behind
     whichever panel it is nearest. There is no size that solves both.

     So it is a body INSIDE the field instead, in the clear gap between the Echo
     Relay and Orion callouts — which is where the reference composition keeps
     its one visible planet, and at roughly the same size.

     NOTE `left`/`top` ARE THE BOX'S CORNER, NOT ITS CENTRE (see <BodyView>).
     A first attempt at y: -14% put the entire disc above the viewport. */
  {
    id: "planetoid-iron",
    ...IRON,
    /* THE ICE GIANT. Down from 12vmin to 7vmin — 42% off the diameter, which is
       two thirds off the AREA, and area is what "visually heavy" measures. At
       12vmin it was the largest single object in the frame after the hull and it
       sat inside the ring system rather than behind it. Background decor should
       lose an argument with the foreground without having to be moved out of
       the way. */
    x: "34%",
    y: "14%",
    size: "7vmin",
    az: 285,
    el: 24,
    rimO: 0.62,
    /* EVERY BACKDROP BODY LOST ANOTHER ~18% OF ITS OPACITY IN THIS PASS.
       Not its size — that was the previous pass, and there is a floor on it. The
       lever left is how much of the void shows through, and it is the better one
       for "recede" anyway: a smaller body is a nearer small thing, a fainter one
       is the same thing further away. Note the rim opacities are UNCHANGED, so
       what recedes is the mass while the lit limb holds — which is what distance
       actually does to a body catching light. */
    opacity: 0.41,
    parallax: 0.03,
    spin: 0,
    craters: makeCraters(0x1207, 34, 3.5, 15),
  },

  /* ----------------------------------------------------------------- MID --
     Two bodies that turn, slow enough that the motion is only visible if you
     stop and watch — a full rotation takes between four and seven minutes.

     WAS THREE, AND THEY WERE ALL LOW. Together with the far and distant tiers
     they put nine objects across the bottom half of the frame, which is the half
     the ship, its plume and the field's bright near arc already occupy. The
     backdrop is meant to be what the deck sits IN; below the horizon it was
     competing with what the deck IS. `moon-regolith-b` (3%/84%) went entirely
     and `moon-regolith-a` moved to the upper right. */
  {
    id: "giant-banded",
    ...OCHRE,
    // The warm accent. OCHRE is now the only amber body on the deck, which is
    // why this one keeps its bands and spots: it is the one place warm colour
    // appears, so it should have something to show.
    x: "20%",
    y: "58%",
    size: "52px",
    az: 62,
    el: 26,
    rimO: 0.55,
    opacity: 0.41,
    parallax: 0.09,
    spin: 0.016,
    bands: GIANT_BANDS,
    spots: makeCraters(0x6a17, 4, 9, 20),
  },
  {
    id: "moon-regolith-a",
    ...REGOLITH,
    x: "90%",
    y: "18%",
    size: "42px",
    // The ringed one. Small enough that the rings read as an ornament rather
    // than as a second orbital system competing with the deck's own.
    rings: { tilt: -22, spread: 2.4, color: "rgb(180 200 220 / 0.25)" },
    az: 48,
    el: 30,
    rimO: 0.66,
    opacity: 0.43,
    parallax: 0.12,
    spin: 0.019,
    craters: makeCraters(0x2c04, 26, 4, 17),
  },
  /* ------------------------------------------------------------------ FAR --
     Two coloured bodies, static, both crescent, with azimuths on opposite
     hemispheres so their lit edges point different ways.

     `far-rust` (22%/80%) and `far-violet` (36%/91%) were removed with the same
     reasoning as the mid tier: both sat along the bottom edge, under the plume.
     `far-rust` carried the note about why a 34px crescent gets no craters —
     below ~40px, or at any strong phase, the crescent is the whole story. That
     rule still governs everything in this tier and the one below it. */
  {
    id: "far-steel",
    ...STEEL,
    x: "76%",
    y: "56%",
    size: "15px",
    az: 232,
    el: 14,
    rimO: 0.8,
    opacity: 0.41,
    parallax: 0.18,
    spin: 0,
  },
  /* `far-verdigris` (94%/13%) went with `d2` (93%/37%). Moving `moon-regolith-a`
     up to 90%/18% put five objects into one corner — those two, the moon, and
     both relays — which is the same crowding this pass removed from the bottom,
     just relocated. Thinning a busy region by moving something into a quiet one
     only works if you then look at the region you moved it to. */

  /* -------------------------------------------------------------- DISTANT --
     Four specks, 10-16px, crescent only. At this size there is no room for
     surface detail, so the phase is doing all the work — and it is exactly what
     separates these from the star field they sit among. A full bright dot is a
     star; a dot with a dark limb is an object.

     Was eight. The four that went (`d4` 30%/69%, `d5` 48%/88%, `d6` 88%/79%,
     `d8` 79%/93%) were the four below the horizon; the four that stayed are all
     above it. Halving the tier is not a loss here — at 10px these read as
     texture, and the difference between four and eight pieces of texture is
     nothing next to the difference between a clear lower frame and a busy one. */
  /* THE DISTANT TIER TAKES A SMALLER CUT THAN THE REST — roughly a third rather
     than 45%. These are already near the floor at which a crescent stops being a
     crescent: the note in the FAR tier puts that at about 8px, below which the
     lit sliver is a single antialiased pixel and the body reads as a slightly
     dim star. Halving them would have deleted the tier rather than shrunk it.

     They carry a 1px blur instead, which buys the same recession by removing the
     edge rather than the area. */
  { id: "d1", ...CARBON, x: "5%", y: "30%", size: "8px", az: 140, el: 20, rimO: 0.85, opacity: 0.37, parallax: 0.2, spin: 0, blur: 2 },
  { id: "d3", ...REGOLITH, x: "69%", y: "10%", size: "9px", az: 118, el: 30, rimO: 0.8, opacity: 0.39, parallax: 0.17, spin: 0, blur: 2 },
  // VIOLET rather than a second CARBON: with the tier halved, two of the four
  // survivors were the same material, and four specks is few enough that a
  // repeat reads as a repeat.
  { id: "d7", ...VIOLET, x: "14%", y: "48%", size: "10px", az: 133, el: 6, rimO: 0.78, opacity: 0.41, parallax: 0.16, spin: 0, blur: 2 },
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
    // Reindexed 4 -> 3 when FIELD.rings went 6 -> 5. `Celestials` CLAMPS an
    // out-of-range index to the outermost ring instead of erroring, so a stale
    // index here does not fail — it silently parks two bodies on one track.
    ring: 3,
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
    // Back out to 5 now that the field carries seven tracks rather than five.
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
    // 3 -> 2, keeping the original inner-to-outer order: rust, verdigris,
    // steel, regolith.
    ring: 2,
    theta: 44,
    size: "16px",
    az: 158,
    el: 30,
    rimO: 0.88,
    opacity: 0.55,
    spin: 0,
  },

  /* ------------------------------------------------------------- TRAFFIC --
     Six more, all small, all static, spread so that every ring carries at
     least two and no two on the same ring sit within 60deg of each other.

     THE FOUR ABOVE WERE ENOUGH TO MAKE THE POINT AND NOT ENOUGH TO MAKE THE
     PATTERN. One body on a track reads as an object that happens to be there;
     several reads as a populated orbit, which is the difference between a
     diagram with a decoration on it and a system with things in it. The cost is
     nothing — these are CSS-positioned discs off the same custom properties the
     mission nodes use, with no craters at this size (see the note in the FAR
     tier: below ~40px the phase is the whole story).

     They are deliberately UNLIT-LOOKING — low `opacity`, high `rimO`. A body on
     a ring competing with the ring's own beads would turn the field back into
     texture, which is what the whole containment pass was undoing. These are
     meant to be found, not seen. */
  {
    id: "track-carbon-a",
    ...CARBON,
    ring: 0,
    theta: 126,
    size: "11px",
    az: 210,
    el: 16,
    rimO: 0.9,
    opacity: 0.5,
    spin: 0,
  },
  {
    id: "track-ochre",
    ...OCHRE,
    ring: 1,
    theta: 74,
    size: "13px",
    az: 84,
    el: -12,
    rimO: 0.86,
    opacity: 0.52,
    spin: 0,
  },
  {
    id: "track-steel-b",
    ...STEEL,
    ring: 2,
    theta: 232,
    size: "14px",
    az: 302,
    el: 22,
    rimO: 0.84,
    opacity: 0.54,
    spin: 0,
  },
  {
    id: "track-violet",
    ...VIOLET,
    ring: 3,
    theta: 158,
    size: "12px",
    az: 128,
    el: -6,
    rimO: 0.88,
    opacity: 0.5,
    spin: 0,
  },
  {
    id: "track-iron",
    ...IRON,
    ring: 3,
    theta: 318,
    size: "17px",
    az: 24,
    el: 28,
    rimO: 0.8,
    opacity: 0.56,
    spin: 0,
  },
  {
    id: "track-rust-b",
    // The outermost track. Nothing else rides 1.55, and an empty outer ring
    // reads as the edge of a drawing rather than the edge of a system.
    ...RUST,
    ring: 6,
    theta: 96,
    size: "15px",
    az: 194,
    el: 10,
    rimO: 0.85,
    opacity: 0.52,
    spin: 0,
  },
];
