"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { useActiveTargetId } from "@/features/app/hooks";
import { getMissionById } from "@/features/missions/data";
import { SHIP_Z_INDEX } from "@/features/missions/placement";
import { BearingVector } from "./BearingVector";
import { ExhaustPlume } from "./ExhaustPlume";
import { ShipGeometry } from "./ShipGeometry";
import { SPRITE_ENABLED, plumeScreenAngle } from "./shipFrames";
import { ShipSprite } from "./ShipSprite";
import { SHIP_PIXELS } from "./shipFrames";
import { useShipRotation } from "./useShipRotation";

/**
 * The spacecraft sits at the world origin and only ever rotates — it must never
 * translate. When the ship needs reframing, the camera moves.
 *
 * That origin now sits half an orbit BEYOND the outermost mission ring (see
 * SHIP_STANDOFF), so the vehicle is a foreground object looking into the field
 * rather than a marker standing in the middle of it. It is unconditionally the
 * frontmost thing on the deck, and nothing can pass in front of it.
 *
 * LIGHTING MODEL: one key light from the UPPER RIGHT, plus the engine as a
 * secondary source below.
 *
 * The direction is not arbitrary and not negotiable — every distant body in
 * `starfield.data.ts` is lit from `74% 28%`, and the hull's own shade falls on
 * the port side, which is the same statement. Until this rewrite the contact
 * shadow and the ambient pool were offset for a key light from the upper LEFT,
 * so the floor and the object were lit from opposite sides. That is the kind of
 * error nobody can name on sight; it just makes the ship look pasted onto the
 * background instead of standing in the scene. If you move the key light, move
 * all four: the planets, the hull shading, the contact shadow, and the pool.
 *
 * Motion channels are on separate nested elements because one element has one
 * `rotate` and one `scale`:
 *
 *   outer   targeting attitude  (imperative MotionValue, zero re-renders)
 *   inner   breathing           (declarative scale, near-imperceptible)
 */
export function Spacecraft() {
  const activeMission = getMissionById(useActiveTargetId());
  const engaged = activeMission !== undefined;

  // AIM AT THE PROJECTED POSITION, MEASURED FROM THE SHIP — NOT AT THETA.
  //
  // Two corrections are baked into `screenAngle`: the plane is an ellipse, so
  // squashing moves each node's apparent direction; and the ship rides one
  // standoff below the plane's centre, so a bearing taken from the centre is
  // wrong by tens of degrees for anything close. Feeding raw `theta` here
  // points the hull at empty space.
  const { rotation, plume, bank } = useShipRotation(activeMission?.placement.screenAngle ?? null);

  // EVERYTHING BOLTED TO THE HULL RIDES THIS, NOT `plume` DIRECTLY.
  //
  // `plume` is the lagged TRUE bearing, and the hull is never drawn at the true
  // bearing — `renderYaw` compresses it to keep the ship in its hero pose. Feeding
  // the raw value to the exhaust pointed the flame up to 45deg away from the
  // engine bells at the flanks of the deck, which is what made the propulsion read
  // as a separate object following the ship. `plumeScreenAngle` round-trips
  // through the same compression the sprite uses, so the exhaust and the engine
  // wash are oriented by the heading the hull is ACTUALLY drawn facing.
  //
  // The lag is untouched: this is a pure function of the already-lagged value, so
  // the exhaust still trails the hull by exactly the frames `plumeLag` gives it.
  const exhaustHeading = useTransform(plume, plumeScreenAngle);

  return (
    <>
      {/* THE CONTACT SHADOWS ARE GONE TOO, AND FOR A REASON THAT IS EASY TO MISS.
          Two black ellipses on a black ground are not merely invisible — they
          are drawn INSIDE the camera rig, so they occlude the star field behind
          them and cut a starless patch out of the sky around the hull. A shadow
          with no surface to fall on becomes a hole in space. Back with the plane.

          THE AMBIENT POOL AND THE ENGINE WASH ARE GONE FOR THE SAME REASON.
          TOGETHER WITH THE PLANE.
          Both were light cast ONTO THE ORBITAL SURFACE — a diffuse pool under
          the hull and a red spill thrown backwards from the nozzles. With the
          platform stood down there is no surface for either of them to land on,
          so they stopped being reflected light and became two glowing ellipses
          floating in a vacuum, which is the single most artificial thing a dark
          scene can contain. Light needs something to fall on.
          They come back with the plane. Nothing else about the ship changed. */}

      <div className="absolute top-0 left-0" style={{ zIndex: SHIP_Z_INDEX }}>
        <BearingVector
          rotation={rotation}
          engaged={engaged}
          range={activeMission?.placement.range ?? 1}
        />
      </div>

      {/* Exhaust, layered by temperature rather than by alpha. */}
      <div className="absolute top-0 left-0" style={{ zIndex: SHIP_Z_INDEX }}>
        <ExhaustPlume rotation={exhaustHeading} engaged={engaged} size={SHIP_PIXELS} />
      </div>

      <div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        style={{ zIndex: SHIP_Z_INDEX }}
      >
        {/* THE IDLE ATTITUDE SWAY IS GONE, AND FOR TWO REASONS.

            It rotated the HULL ONLY. The exhaust is a sibling of this element,
            not a child, so a +/-1.1deg sway rocked the ship against its own
            plume forever — a permanent low-grade version of exactly the
            detachment the propulsion pass existed to remove.

            And a vehicle holding attitude does not wander off it. Continuous
            unforced rotation is the one motion on this deck that could not be
            explained by anything the ship was doing, which is the definition of
            an animation rather than a behaviour.

            Breathing stays: it is a SCALE, so it neither desyncs the exhaust nor
            claims the ship is turning, and a 1.5% pulse reads as "powered"
            without ever looking like movement. */}
        <motion.div
          animate={{ scale: [1, 1.015] }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          <ShipHull rotation={rotation} bank={bank} engaged={engaged} />
        </motion.div>
      </div>
    </>
  );
}

/**
 * The hull itself, in whichever representation is currently wired.
 *
 * The two paths differ in more than fidelity, which is why this switch exists
 * rather than a swapped import:
 *
 *   VECTOR   authored nose-up and ROTATED on screen by the heading. Legitimate
 *            because a stylised shape carries no baked viewpoint.
 *   SPRITE   pre-rendered at fixed yaw steps and INDEXED by the heading. The
 *            frame already contains the orientation, so rotating it again would
 *            double the turn and tip the hull onto its side.
 *
 * Both consume the identical MotionValue, so the bearing vector, the exhaust
 * plume and the hull stay in agreement under either. Everything outside this
 * component — plume, engine wash, contact shadow, ambient pool — is shared and
 * needs no knowledge of which path is live.
 */
function ShipHull({
  rotation,
  bank,
  engaged,
}: {
  rotation: MotionValue<number>;
  bank: MotionValue<number>;
  engaged: boolean;
}) {
  if (SPRITE_ENABLED) {
    return <ShipSprite rotation={rotation} bank={bank} />;
  }

  return (
    <motion.div style={{ rotate: rotation }}>
      <ShipGeometry engaged={engaged} />
    </motion.div>
  );
}
