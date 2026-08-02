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
    <div
      aria-hidden="true"
      className="deck-md:scale-75 deck-sm:scale-50 relative"
      style={{ width: SHIP_PIXELS, height: SHIP_PIXELS }}
    >
      <motion.div className="absolute inset-0" style={{ rotate: bank }}>
        <motion.div className="absolute inset-0" style={{ scaleX: flip }}>
          {Array.from({ length: FRAME_COUNT }, (_, index) => (
            <Frame key={index} index={index} yaw={yaw} />
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
