"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { screenAngleToWorldYaw } from "@/features/missions/placement";
import {
  FRAME_COUNT,
  FRAME_PIXELS,
  SHIP_CAMERA_TILT,
  SHIP_PIXELS,
  frameBlend,
  frameSrc,
  renderYaw,
} from "./shipFrames";

/**
 * The pre-rendered hull.
 *
 * Takes the SAME MotionValue that drives the bearing vector, so the two can
 * never disagree — but uses it as an INDEX rather than as a rotation. See
 * `shipFrames.ts` for why.
 *
 * Every frame is mounted at once and all but two are at zero opacity. That
 * sounds wasteful and is the cheap option: the alternative is swapping `src`,
 * which decodes on the main thread mid-turn and flashes. Sixteen decoded images
 * cost a few megabytes of GPU memory once, and the crossfade afterwards is pure
 * compositor work.
 *
 * NO REACT RENDERS ON THE HOT PATH. Opacity, the mirror flip and the bank are
 * MotionValues bound through `style`, so a ship swinging across the deck costs
 * zero reconciliation — the same discipline the rest of the deck follows.
 */
/**
 * HULL GRADE — a small lift on top of a render that now carries its own key.
 *
 * THIS USED TO DO FAR MORE, AND IT HAD TO STOP. It was written when the frames
 * were flat: the render script's `view_transform = "Standard"` assignment sat
 * after a `return` and never ran, so every sprite shipped through Blender's
 * default AgX with a soft key and a bright fill, and the hull genuinely needed
 * `brightness(1.16) contrast(1.24)` to read as metal.
 *
 * The frames are now lit for the job — hard key, cut fill, deep occlusion, AgX
 * with a contrast look, rendered at the locked 43.4deg camera. Leaving the old
 * grade on top double-graded them. Measured on the deck, that clipped 9.66% OF
 * THE HULL TO PURE WHITE — the panel lines, nacelle shading and dorsal detail
 * the new lighting pass exists to produce, erased by the composite that was
 * meant to rescue them.
 *
 *   grade                 clipped   peak   mean
 *   1.16 / 1.24 / 0.78     9.66%     255    201
 *   1.06 / 1.10 / 0.86     0.00%     236    175   <- shipped
 *   1.00 / 1.04 / 0.90     0.00%     217    162
 *   none                   0.00%     213    160
 *
 * What is left is deliberately small. A touch of brightness and contrast still
 * helps the ship hold the frame as the deck's focal point against pure black,
 * and the mild desaturation keeps the hull from competing with `--signal` red on
 * a locked target. Anything more is taking detail out of the render to add
 * nothing.
 *
 * IF THE FRAMES ARE EVER RE-RENDERED, RE-CHECK THIS. The two are coupled: a
 * change to the rig in `scripts/render-ship-frames.py` moves the headroom this
 * grade is spending.
 *
 * NOW BELOW UNITY — 0.88, DOWN FROM 1.06, WITH CONTRAST UP TO 1.18.
 *
 * The table above measures against PURE BLACK, and the note under it says the
 * lift exists so the ship "holds the frame as the deck's focal point against
 * pure black". The frame is no longer pure black: there is a lit cyan plane, an
 * aurora at its middle and a hazy sky, and against all that a hull graded up
 * read as a studio model on a lightbox — brightly and evenly lit from nowhere
 * the scene contains.
 *
 * Dropping below 1.0 cannot clip, so the clipping column stops being the
 * constraint and the mean becomes the thing to watch: 175 -> roughly 145, a 17%
 * drop. The contrast lift is what stops that reading as a flat grey ship — it
 * pushes the panel crevices down faster than the lit faces, so what is lost is
 * ambient fill and what survives is the render's own key.
 */
const SHIP_GRADE = "brightness(0.88) contrast(1.18) saturate(0.86)";

/**
 * ENGINE UNDERCAST — the hull's own exhaust, caught on its underside.
 *
 * The rim gradient behind the hull already turns warm at the bottom, but that is
 * a BACKLIGHT: it silhouettes the trailing edges and puts no light on any
 * surface facing the viewer. This is the other half — light landing on the lower
 * fins and nacelles from the plume directly beneath them.
 *
 * Masked by the frame itself, exactly like the rim, so it can only ever fall on
 * hull and never on the transparent film around it. `screen` blending because
 * this is light being ADDED to a lit surface; `multiply` or a plain overlay
 * would darken the midtones it lands on, which is the opposite of what a
 * reflection does.
 *
 * Confined to the bottom quarter. Above 70% the plume is behind the airframe
 * and cannot illuminate anything facing forward, and a warm wash across the
 * whole hull would undo the dimming the grade above just applied.
 */
const UNDERCAST_GRADIENT =
  "linear-gradient(180deg," +
  "transparent 0%," +
  "transparent 70%," +
  "rgb(255 122 60 / 0.15) 86%," +
  "rgb(255 92 48 / 0.28) 100%)";

/**
 * BACKLIGHT — a tiny blue source behind the vehicle, built WITHOUT A FILTER.
 *
 * The obvious implementation is `drop-shadow`: it traces the alpha channel, so
 * it follows the silhouette through every yaw step for free. It is not used, and
 * the reason is a judgement rather than a measurement — I could not get a clean
 * one. A blur convolution over a 444px box holding sixteen stacked images, whose
 * two visible frames change opacity on every frame of a turn, is a known cost on
 * a real GPU; but an A/B in headless software rasterisation came back with the
 * BASELINE slower than the filtered build (95ms p95 against 79ms), which means
 * the harness could not resolve a difference either way. Rather than ship a blur
 * on the strength of numbers that prove nothing, the rim is built the way the
 * compositor is cheapest at regardless of hardware.
 *
 * WHICH IS: a slightly larger copy of the silhouette drawn behind the hull,
 * coloured by a gradient and cut out with `mask-image` pointed at the frame
 * itself. Masking is a per-pixel composite rather than a convolution, and it
 * still follows the exact silhouette of whichever frame is showing — so wing
 * edges, engine housing and rear fins all catch it, at every yaw, with no second
 * source of truth to keep in sync.
 *
 * THE GRADIENT IS WHAT STOPS IT LOOKING LIKE AN OUTLINE. A flat colour scaled up
 * behind a sprite is a sticker border. Running it brightest along the top and
 * falling away toward the engines means the rim is strongest on the surfaces
 * actually turned toward a source behind and above the vehicle.
 *
 * IT HAS TO REACH THE WINGS. The first gradient was spent by 62% of the frame
 * height and the wings sit between 55% and 75% — so the one edge the brief calls
 * out specifically was the one edge getting almost nothing. It now carries real
 * weight to three quarters of the way down.
 */
const RIM_SCALE = 1.016;

/**
 * The hull is not centred in its frame: measured off the alpha, the silhouette
 * spans 0.333-0.703 vertically. Scaling about the box centre would therefore
 * slide the rim off the nose. This is the silhouette's own centroid.
 */
const RIM_ORIGIN = "50% 51.8%";

/**
 * The backlight behind the hull, and it is TWO light sources, not one ramp.
 *
 * It used to run cool blue from top to bottom, which was correct when the deck
 * had one light in it. The deck now has two, and they are on opposite sides of
 * this vehicle: the orbital plane's cyan source is ahead and above, and the
 * ship's own engines are directly below. A hull between them does not catch a
 * single colour — it catches the plane's cool light on its leading edges and
 * engine red along its trailing ones, and the crossover happens across the middle
 * of the airframe.
 *
 * That is why the stops turn over at 46%: above it the rim is the plane, below
 * it the rim is the exhaust. Getting this wrong in the other direction — red on
 * top, cool below — would put the engine light in front of the ship, which is
 * the sort of error nobody can name and everybody feels.
 *
 * The warm end is deliberately weaker than the cool end (0.45 against 0.9). The
 * engines are close but small; the plane is distant but enormous.
 */
const RIM_GRADIENT =
  "linear-gradient(180deg," +
  "rgb(196 216 234 / 0.9) 0%," +
  "rgb(168 192 214 / 0.78) 24%," +
  "rgb(166 166 190 / 0.55) 46%," +
  "rgb(220 112 92 / 0.45) 68%," +
  "rgb(255 92 72 / 0.26) 86%," +
  "transparent 100%)";

export function ShipSprite({
  rotation,
  bank,
}: {
  rotation: MotionValue<number>;
  /** Roll into the turn, degrees. See `useShipRotation`. */
  bank: MotionValue<number>;
}) {
  // Un-project the apparent bearing into the yaw the FRAMES were rendered at.
  //
  // Through SHIP_CAMERA_TILT, not ORBIT_TILT. The hull is rendered from a higher
  // elevation than the plane, so the yaw that *looks* like a given bearing is
  // not the yaw that would produce it on the plane. Using the plane's tilt here
  // would leave the nose pointing several degrees off its own bearing vector at
  // the extremes — the one error on this deck a viewer can actually check, by
  // eye, against a line that is right there.
  //
  // Then COMPRESSED through `renderYaw`. The hull deliberately turns less far
  // than it aims — see SHIP_YAW_LIMIT. The bearing vector still points exactly
  // at the target, so nothing about the deck's accuracy depends on the hull
  // matching it degree for degree; the ship only has to lean convincingly.
  const yaw = useTransform(rotation, (screenAngle) =>
    renderYaw(screenAngleToWorldYaw(screenAngle, SHIP_CAMERA_TILT)),
  );

  // Port turns are starboard frames mirrored. The flip happens at yaw 0, where
  // the two are identical, so it can never be seen.
  const flip = useTransform(yaw, (value) => (value < 0 ? -1 : 1));

  return (
    // THREE ELEMENTS, THREE TRANSFORM CHANNELS — the same rule the camera rig
    // and the mission housings follow, and for the same reason: everything here
    // compiles to `transform`, so co-locating any two means one silently wins.
    //
    //   outer   responsive tier scale  (Tailwind class)
    //   middle  bank                   (MotionValue, degrees)
    //   inner   mirror                 (MotionValue, +/-1)
    //
    // The bank sits OUTSIDE the mirror deliberately. It is derived from the
    // heading's velocity, which is already a screen-space quantity, so it must
    // not be flipped with the frames — mirroring it would roll the hull out of
    // its turn on one side and into it on the other.
    //
    // The mirror must have NO transition. It is a step function — at yaw 0 the
    // port and starboard frames are identical, so an instant flip is invisible.
    // Animating it squashes the hull through scaleX(0) and it flips like a card.
    //
    // The rim sits BEHIND the hull and is scaled up by roughly one percent, so
    // the only part of it ever visible is the couple of pixels peeking past the
    // silhouette. See RIM_SCALE.
    <div
      aria-hidden="true"
      // 0.75/0.50 -> 0.58/0.34, WHICH HOLDS THE NARROW TIERS WHERE THEY WERE.
      // `SHIP_PIXELS` went 444 -> 577 to match the reference at `lg`, and these
      // multipliers took the increase with it — the layout solver found the
      // consequence immediately: a 433px hull at `md` ran through AURORA and
      // FORGE at every checked viewport, and at `sm` it sank into the dock. The
      // reference is a wide-deck composition and says nothing about a phone.
      // 577*0.58 = 335 and 577*0.34 = 196, against the 333 and 222 these tiers
      // drew before, so the narrow decks are unchanged by a measurement that was
      // never about them.
      className="deck-md:scale-[0.58] deck-sm:scale-[0.34] relative"
      style={{ width: SHIP_PIXELS, height: SHIP_PIXELS }}
    >
      <motion.div className="absolute inset-0" style={{ rotate: bank }}>
        <motion.div className="absolute inset-0" style={{ scaleX: flip }}>
          <div
            className="absolute inset-0"
            style={{ transform: `scale(${RIM_SCALE})`, transformOrigin: RIM_ORIGIN }}
          >
            {Array.from({ length: FRAME_COUNT }, (_, index) => (
              <RimFrame key={index} index={index} yaw={yaw} />
            ))}
          </div>

          <div className="absolute inset-0" style={{ filter: SHIP_GRADE }}>
            {Array.from({ length: FRAME_COUNT }, (_, index) => (
              <Frame key={index} index={index} yaw={yaw} />
            ))}
          </div>

          {/* Engine light on the underside. AFTER the graded hull, so it is not
              dimmed by the grade — a reflection is light arriving at the surface,
              not part of the surface's own exposure. */}
          {Array.from({ length: FRAME_COUNT }, (_, index) => (
            <UndercastFrame key={index} index={index} yaw={yaw} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * One rendered yaw step.
 *
 * Its own component so the `useTransform` is a single call at a fixed position
 * rather than a hook inside a loop — the frame count is a module constant, but
 * hooks in a loop are the kind of thing that stops being true the moment
 * somebody makes the count dynamic.
 */
/**
 * One frame of the rim, cut from the frame's own alpha.
 *
 * Crossfades on exactly the same weights as the hull, so the rim and the hull
 * are never showing different silhouettes.
 */
function RimFrame({ index, yaw }: { index: number; yaw: MotionValue<number> }) {
  const opacity = useTransform(yaw, (value) => {
    const { lower, upper, blend } = frameBlend(value);
    if (index === lower) return 1 - blend;
    if (index === upper) return blend;
    return 0;
  });

  const mask = `url(${frameSrc(index)}) center / 100% 100% no-repeat`;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ opacity, background: RIM_GRADIENT, mask, WebkitMask: mask }}
    />
  );
}

/**
 * One frame of the engine undercast, cut from the same alpha as the hull.
 *
 * Identical crossfade weights to <Frame> and <RimFrame> — all three have to show
 * the same silhouette on every intermediate yaw, or the ship grows a coloured
 * fringe mid-turn.
 *
 * `mix-blend-mode: screen`, because this is light ARRIVING at a surface: screen
 * adds where normal compositing replaces, so the lower hull gains exposure
 * rather than being tinted toward orange.
 *
 * IF THIS EVER RENDERS AS A FLAT SILHOUETTE, SUSPECT THE RENDERER BEFORE THE
 * CODE. Chrome's pure software rasteriser (`--disable-gpu`) draws this whole
 * subtree — sixteen masked layers inside a transformed, filtered group — as an
 * untextured blob with only the rim and this undercast surviving. It is correct
 * on the GPU path, correct under SwiftShader, and correct in every real browser
 * tested. A screenshot harness that passes `--disable-gpu` will report a bug
 * that does not exist, and it cost a full debugging pass here before the
 * difference was isolated by rendering the same page both ways.
 */
function UndercastFrame({ index, yaw }: { index: number; yaw: MotionValue<number> }) {
  const opacity = useTransform(yaw, (value) => {
    const { lower, upper, blend } = frameBlend(value);
    if (index === lower) return 1 - blend;
    if (index === upper) return blend;
    return 0;
  });

  const mask = `url(${frameSrc(index)}) center / 100% 100% no-repeat`;

  return (
    <motion.div
      className="absolute inset-0 mix-blend-screen"
      style={{ opacity, background: UNDERCAST_GRADIENT, mask, WebkitMask: mask }}
    />
  );
}

function Frame({ index, yaw }: { index: number; yaw: MotionValue<number> }) {
  const opacity = useTransform(yaw, (value) => {
    const { lower, upper, blend } = frameBlend(value);
    if (index === lower) return 1 - blend;
    if (index === upper) return blend;
    return 0;
  });

  return (
    <motion.img
      src={frameSrc(index)}
      alt=""
      width={FRAME_PIXELS}
      height={FRAME_PIXELS}
      // Eager: these are the hero object, and the scene they belong to only
      // mounts after the boot sequence has already covered the download.
      loading="eager"
      decoding="async"
      draggable={false}
      className="absolute inset-0 h-full w-full select-none"
      style={{ opacity }}
    />
  );
}
