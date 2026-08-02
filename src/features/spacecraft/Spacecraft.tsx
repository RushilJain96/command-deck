"use client";

import { motion, type MotionValue } from "framer-motion";
import { useActiveTargetId } from "@/features/app/hooks";
import { getMissionById } from "@/features/missions/data";
import { SHIP_Z_INDEX } from "@/features/missions/placement";
import { BearingVector } from "./BearingVector";
import { ExhaustPlume } from "./ExhaustPlume";
import { ShipGeometry } from "./ShipGeometry";
import { SPRITE_ENABLED } from "./shipFrames";
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
 *   outer   targeting rotation  (imperative MotionValue, zero re-renders)
 *   middle  idle drift          (declarative, so MotionConfig covers it)
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

  return (
    <>
      {/* GROUND CONTACT, IN TWO PARTS. A single soft blob under a hovering
          object reads as a smudge, because real contact shadows have two
          components with different falloffs: a wide, soft ambient occlusion
          that says "something large is above this surface", and a much tighter,
          darker core directly beneath it that says exactly HOW FAR above. Drop
          the core and the object floats at an indeterminate height; drop the
          spread and it looks stuck to the floor.

          Both offset DOWN-LEFT of the hull, opposite the upper-right key. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 rounded-[50%]"
        style={{
          zIndex: SHIP_Z_INDEX - 3,
          width: "calc(var(--orbit-radius) * 0.86)",
          height: "calc(var(--orbit-radius) * var(--orbit-tilt) * 0.86)",
          transform: "translate(-53%, -36%)",
          // Softer and wider than it was: the falloff now starts earlier and
          // ends later, so there is no visible edge to the shadow at all.
          background: "radial-gradient(closest-side, rgb(0 0 0 / 0.52), rgb(0 0 0 / 0.2) 44%, transparent 82%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 rounded-[50%]"
        style={{
          zIndex: SHIP_Z_INDEX - 2,
          width: "calc(var(--orbit-radius) * 0.38)",
          height: "calc(var(--orbit-radius) * var(--orbit-tilt) * 0.38)",
          transform: "translate(-56%, -30%)",
          background: "radial-gradient(closest-side, rgb(0 0 0 / 0.82), rgb(0 0 0 / 0.34) 50%, transparent 80%)",
        }}
      />

      {/* Ambient pool, offset UP-RIGHT toward the key light.
          Raised about 20% from where it sat, because this is the deck's
          FOCAL LIGHT: the eye goes to the brightest region of a dark frame, and
          that region has to be the spacecraft. Still well under the level where
          it would flatten the hull — diffuse fill lifts a form uniformly and
          stops the key describing it, which is why this is a pool ON THE FLOOR
          rather than more light on the ship. */}
      <div
        aria-hidden="true"
        className="deck-respire pointer-events-none absolute top-0 left-0 rounded-[50%]"
        style={{
          zIndex: SHIP_Z_INDEX - 1,
          width: "calc(var(--orbit-radius) * 1.34)",
          height: "calc(var(--orbit-radius) * var(--orbit-tilt) * 1.34)",
          transform: "translate(-46%, -56%)",
          background:
            "radial-gradient(closest-side, rgb(158 192 232 / 0.174), rgb(120 150 190 / 0.05) 46%, transparent 74%)",
        }}
      />

      {/* Engine wash spilling onto the plane behind the ship. Rotates with the
          LAGGED heading so the light on the floor swings in after the hull. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 origin-top-left"
        style={{ zIndex: SHIP_Z_INDEX - 1, rotate: plume }}
      >
        <div
          className="absolute top-0 left-0 rounded-[50%] transition-opacity duration-700"
          style={{
            width: "calc(var(--orbit-radius) * 0.5)",
            height: "calc(var(--orbit-radius) * var(--orbit-tilt) * 0.9)",
            transform: "translate(-50%, -6%)",
            opacity: engaged ? 0.5 : 0.22,
            background:
              "radial-gradient(closest-side, rgb(255 59 48 / 0.30), rgb(255 59 48 / 0.07) 48%, transparent 76%)",
          }}
        />
      </motion.div>

      <div className="absolute top-0 left-0" style={{ zIndex: SHIP_Z_INDEX }}>
        <BearingVector
          rotation={rotation}
          engaged={engaged}
          range={activeMission?.placement.range ?? 1}
        />
      </div>

      {/* Exhaust, layered by temperature rather than by alpha. */}
      <div className="absolute top-0 left-0" style={{ zIndex: SHIP_Z_INDEX }}>
        <ExhaustPlume rotation={plume} engaged={engaged} size={SHIP_PIXELS} />
      </div>

      <div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
        style={{ zIndex: SHIP_Z_INDEX }}
      >
        <motion.div
          animate={{ rotate: [-1.1, 1.1] }}
          transition={{
            duration: 9,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {/* Breathing. Scale rather than translation — the ship must hold
              the centre, and a 1.5% pulse reads as "powered" without ever
              looking like movement. */}
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
