"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLockedTargetId } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { CameraRig } from "@/features/camera/CameraRig";
import { DeckFrame } from "@/features/environment/DeckFrame";
import { OrbitalBodies } from "@/features/environment/Celestials";
import { OrbitGuides } from "@/features/environment/OrbitGuides";
import { OrbitPlane, PlaneSurface } from "@/features/environment/OrbitPlane";
import { Starfield } from "@/features/environment/Starfield";
import { CommandHud } from "@/features/hud/CommandHud";
import { MissionOrbit } from "@/features/missions/MissionOrbit";
import { DECK_BIAS, ORBIT_TILT, SHIP_Z_INDEX } from "@/features/missions/placement";
import { Spacecraft } from "@/features/spacecraft/Spacecraft";
import { ARRIVAL } from "./arrival";

/**
 * The home state.
 *
 * THE CAMERA SITS BEHIND AND BELOW THE VEHICLE, looking forward into the
 * orbital plane. That single decision shapes the whole composition: the ship
 * holds the near station on the ring rather than the centre of it, the plane
 * opens out ahead and above, and the hull only ever swings through the forward
 * hemisphere. Everything the deck says about being something you fly rather
 * than something you scroll follows from it.
 *
 * Composition order is the layer order, back to front:
 *
 *   screen  (void)          pure black. No backdrop layer is rendered at all.
 *   screen  Starfield       parallax layers, one body, orbital hardware —
 *                           OUTSIDE the rig so they lag the camera
 *   world   CameraRig       everything belonging to the deck itself, biased
 *                           down the frame so the ship rides low
 *             OrbitPlane    publishes --orbit-tilt / --ship-standoff, origin
 *                           at the SHIP
 *               PlaneSurface  lifted to the plane's centre
 *                 field       the orbital light, painted to a canvas
 *                 bodies      the rocks riding those rings
 *                 missions    callouts, positioned by the plane's geometry
 *               ship        at the world origin, frontmost
 *   screen  DeckFrame       instrument housing
 *   screen  CommandHud      readouts
 *
 * Everything outside <CameraRig> is screen space and must stay that way. A
 * transform ancestor becomes the containing block for fixed descendants, opens
 * a stacking context, and scales panels with the camera.
 *
 * The persistent top bar and dock are NOT here — they are siblings of
 * <SceneHost> in page.tsx so they survive scene transitions.
 */
export function CommandDeckScene() {
  const camera = useCamera();
  const lockedTargetId = useLockedTargetId();

  useEffect(() => {
    // Ease back from the boot framing. The camera's zoom spring is deliberately
    // slack, so this reads as a vehicle coming to rest rather than a UI
    // transition finishing.
    camera.reset();
  }, [camera]);

  useEffect(() => {
    // Camera breathing: committing to a mission pushes in by a little over one
    // percent. Far too small to read as a zoom, which is the point — it lands
    // at the tail of the hover sequence and registers as the deck leaning in,
    // not as a transition. Effects only; `moveTo` mutates MotionValues.
    camera.moveTo({ zoom: lockedTargetId === null ? 1 : 1.014 });
  }, [camera, lockedTargetId]);

  return (
    <>
      {/* <DeepSpace> stays stood down. The ground is `--void`, pure black, and
          nothing paints a backdrop onto it. */}
      <Starfield />

      <CameraRig bias={DECK_BIAS * ORBIT_TILT}>
        <OrbitPlane>
          <PlaneSurface>
            {/* THE FIELD IS THE FIRST THING IN THE PLANE, so every mission
                callout and the spacecraft paint over it without either needing
                a z-index to say so. That ordering IS the composition: the field
                is the surface the deck is arranged on, the vehicle flies above
                it, and the callouts are instruments held above both. */}
            <motion.div
              className="absolute top-0 left-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: ARRIVAL.field, ease: "easeOut" }}
            >
              <OrbitGuides />
            </motion.div>

            {/* Bodies riding the field's own rings. Above the light, below the
                callouts — traffic on the tracks rather than scenery behind
                them. */}
            <motion.div
              className="absolute top-0 left-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: ARRIVAL.field + 0.25, ease: "easeOut" }}
            >
              <OrbitalBodies />
            </motion.div>

            <MissionOrbit />
          </PlaneSurface>

          {/* The explicit z-index is load-bearing. Animating `opacity` makes
              this wrapper a stacking context, which groups every one of the
              ship's layers together — so the group itself has to carry the
              ship's z-band to stay in front of the mission nodes. */}
          <motion.div
            className="absolute top-0 left-0"
            style={{ zIndex: SHIP_Z_INDEX }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: ARRIVAL.ship, ease: "easeOut" }}
          >
            <Spacecraft />
          </motion.div>
        </OrbitPlane>
      </CameraRig>

      <DeckFrame />
      <CommandHud />
    </>
  );
}
