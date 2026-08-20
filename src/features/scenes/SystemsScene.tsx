"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { SystemsConsole } from "@/features/systems/SystemsConsole";

/**
 * The second real scene.
 *
 * THIN BY DESIGN. Everything visual is <SystemsConsole> under `features/systems`;
 * what lives here is the two things that are about being a SCENE rather than
 * about being a console — resetting the camera on arrival, and the way out.
 *
 * THE CAMERA IS RESET RATHER THAN IGNORED. This scene mounts no <CameraRig>, so
 * nothing here reads the rig's MotionValues; but the deck may have been left
 * leaning in on a locked target, and those values persist across the scene swap.
 * Returning to a deck that is still pushed in from a hover three scenes ago is
 * the kind of state leak that only shows up much later. Effect only — `reset`
 * mutates MotionValues, which must never happen during render.
 *
 * ESCAPE RETURNS TO THE DECK, matching <ProjectScene>. The top bar's mode
 * selector is live now, so this is a second way out rather than the only one —
 * but a full-frame scene that traps a keyboard user until they find a 200px
 * segment with the mouse is not one this project should ship.
 */
export function SystemsScene() {
  const camera = useCamera();
  const dispatch = useAppDispatch();

  useEffect(() => {
    camera.reset();
  }, [camera]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;
      dispatch({ type: "scene/enter", scene: { id: "command-deck" } });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return <SystemsConsole />;
}
