"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { ContactConsole } from "@/features/contact/ContactConsole";

export function ContactScene() {
  const camera = useCamera();
  const dispatch = useAppDispatch();

  useEffect(() => {
    camera.reset();
  }, [camera]);

  /**
   * Plain Escape, unlike the terminal's two-stage version.
   *
   * That scene needed a first stage because it owns a text field a reader could be
   * mid-thought in. Nothing here takes typed input — the one control that is not a
   * link copies an address — so Escape can mean what it means on every other
   * console: go back to Mission Control.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;
      dispatch({ type: "scene/enter", scene: { id: "command-deck" } });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return <ContactConsole />;
}
