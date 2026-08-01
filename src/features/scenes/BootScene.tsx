"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";

const BOOT_DURATION_MS = 1500;

/** Framing the deck arrives from. The camera pulls back to 1 on handoff. */
const BOOT_ZOOM = 1.6;

/**
 * Holds briefly, then hands off to the Command Deck.
 *
 * Auto-advance is skippable by any key or click, and stays well under the
 * five-second threshold in WCAG 2.2.2 so it never becomes a timed barrier.
 *
 * This scene is also what proves the camera rig works: pulling back from a
 * tight framing exercises pan and zoom together, which is the exact code path
 * where a transform-order error would hide until Sprint 3.
 */
export function BootScene() {
  const dispatch = useAppDispatch();
  const camera = useCamera();

  useEffect(() => {
    // jumpTo, not moveTo: the tight framing is where the shot STARTS. Springing
    // into it would zoom in and then back out again.
    camera.jumpTo({ zoom: BOOT_ZOOM });

    const complete = () => dispatch({ type: "boot/complete" });
    const timer = window.setTimeout(complete, BOOT_DURATION_MS);

    window.addEventListener("keydown", complete);
    window.addEventListener("pointerdown", complete);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", complete);
      window.removeEventListener("pointerdown", complete);
    };
  }, [camera, dispatch]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="font-mono text-xs tracking-[0.35em] text-zinc-500 uppercase"
      >
        Initializing
      </motion.p>
    </div>
  );
}
