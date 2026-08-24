"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { ProjectsConsole } from "@/features/projects/ProjectsConsole";

/**
 * The roster scene: a thin wrapper that resets the rig and owns the way out.
 *
 * THE CAMERA RESET IS NOT OPTIONAL. The deck leaves the rig wherever the last
 * target put it, and this console is a screen-space layout — it renders as a
 * sibling of <CameraRig>, not inside it, so a stale pan would not move the console
 * but WOULD be waiting when the reader goes back to the deck, which arrives
 * off-centre for no reason they can see. Resetting on entry rather than on exit
 * means the deck is always left in a known state by whoever leaves it.
 *
 * ESCAPE GOES BACK TO MISSION CONTROL, matching the systems console and the project
 * stub. The three guards on modifier keys are there so Cmd-Escape and friends still
 * belong to the browser.
 */
export function ProjectsScene() {
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

  return <ProjectsConsole />;
}
