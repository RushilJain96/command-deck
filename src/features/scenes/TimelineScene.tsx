"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { TimelineConsole } from "@/features/timeline/TimelineConsole";

export function TimelineScene() {
  const camera = useCamera();
  const dispatch = useAppDispatch();

  useEffect(() => {
    camera.reset();
  }, [camera]);

  /** Plain Escape — nothing here takes typed input, so it means what it means on
      every console but the terminal: back to Mission Control. */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;
      dispatch({ type: "scene/enter", scene: { id: "command-deck" } });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return <TimelineConsole />;
}
