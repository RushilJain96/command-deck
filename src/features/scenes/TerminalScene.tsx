"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { TerminalConsole } from "@/features/terminal/TerminalConsole";

export function TerminalScene() {
  const camera = useCamera();
  const dispatch = useAppDispatch();

  useEffect(() => {
    camera.reset();
  }, [camera]);

  const leave = useCallback(
    () => dispatch({ type: "scene/enter", scene: { id: "command-deck" } }),
    [dispatch],
  );

  /**
   * ESCAPE IS TWO-STAGE HERE, AND ONLY HERE.
   *
   * Every other scene treats Escape as "leave". That rule cannot survive contact
   * with a text field: a reader mid-command who reaches for Escape to clear their
   * thinking would be thrown out of the console, losing the session — which is the
   * single most annoying thing a terminal can do.
   *
   * The reference's own shortcut bar names the first stage: ESC = Focus Navigation.
   * So the first press releases the caret to the top bar, and a second press —
   * with nothing focused to release — leaves for Mission Control. Both meanings
   * are true, in the order a reader would want them.
   *
   * IT TESTS `document.activeElement` RATHER THAN RELYING ON PROPAGATION. The input
   * could call `stopPropagation` and keep this handler from firing, and that does
   * work — React's synthetic event stops the native one, so it never reaches
   * `window`. It is also invisible: the rule would live as an absence in a keydown
   * branch two files away, and the next person to add a window-level shortcut would
   * have no way to know why theirs does not fire. Asking who has focus states the
   * condition where the decision is made.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;

      const active = document.activeElement;
      if (active instanceof HTMLElement && active.dataset.terminalInput === "true") {
        active.blur();
        return;
      }
      leave();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leave]);

  return <TerminalConsole onExit={leave} />;
}
