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
import { OrbitTrace } from "@/features/environment/OrbitTrace";
import { PlaneAurora } from "@/features/environment/PlaneAurora";
import { SpaceHaze } from "@/features/environment/SpaceHaze";
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
          nothing paints a backdrop onto it.

          ITS VIGNETTE WAS RECONSIDERED FOR THIS PASS AND REJECTED ON THE
          EVIDENCE. The plan was to revive two of its six layers — the vignette
          and the ship bloom — to darken the frame's corners. But the corners
          were only ever bright because the field ran through them at
          `outerRing: 2.6`; containing it to 1.55 and thinning the scatter took
          the corners to black on their own, so the vignette now has nothing left
          to do that has not already been done.

          It would also cost something real. `DeepSpace` records that 0.93 there
          erased the outermost rings and 0.90 was the value that did not — and
          that was measured against rings at FULL weight running off the frame.
          The outermost ring now carries a 0.34 edge fade and sits at ~58% of the
          gradient's extent, where even 0.90 lands about 0.37 of black on it.
          The margin the old note was protecting is gone; the same number that
          was safe then would erase the ring now.

          The ship bloom is a separate question and belongs with the floor light
          cone, so the two get tuned together rather than one pre-empting the
          other. */}

      {/* Gas, first and furthest. Behind the stars because it is behind them:
          a cloud you can see stars through is the correct way round, and the
          inverse was already caught once in <Starfield>. */}
      <SpaceHaze />
      <Starfield />

      <CameraRig bias={DECK_BIAS * ORBIT_TILT}>
        <OrbitPlane>
          <PlaneSurface>
            {/* The haze the rings converge into. BEFORE <OrbitGuides>, so the
                threads sit on top of their own glow rather than under it — the
                light is the medium the rings hang in, not a wash over them. */}
            <motion.div
              className="absolute top-0 left-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.8, delay: ARRIVAL.field, ease: "easeOut" }}
            >
              <PlaneAurora />
            </motion.div>

            {/* THE FIELD IS THE FIRST LIT THING IN THE PLANE, so every mission
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

            {/* The tracking segment. Above the field's own light so it reads as
                something running ON the innermost track, below the bodies and
                the callouts so it never crosses in front of them. */}
            <motion.div
              className="absolute top-0 left-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: ARRIVAL.field + 0.4, ease: "easeOut" }}
            >
              <OrbitTrace />
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
