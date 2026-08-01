"use client";

import { useEffect } from "react";
import { CameraRig } from "@/features/camera/CameraRig";
import { useCamera } from "@/features/camera/CameraProvider";
import { MissionOrbit } from "@/features/missions/MissionOrbit";
import { Spacecraft } from "@/features/spacecraft/Spacecraft";
import { TargetAnnouncer } from "@/components/TargetAnnouncer";

/**
 * The home state. Composes world-space content inside the camera rig and
 * screen-space content outside it.
 *
 * Sprint 2's HUD and navigation dock belong alongside <TargetAnnouncer/> — as
 * siblings of <CameraRig/>, never inside it. See CameraRig's docblock.
 */
export function CommandDeckScene() {
  const camera = useCamera();

  useEffect(() => {
    // Pull back from the boot framing. Camera moves; the ship never translates.
    camera.reset();
  }, [camera]);

  return (
    <>
      <CameraRig>
        <MissionOrbit />
        <Spacecraft />
      </CameraRig>

      <TargetAnnouncer />
    </>
  );
}
