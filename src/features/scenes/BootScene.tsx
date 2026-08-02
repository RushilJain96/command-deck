"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAppDispatch } from "@/features/app/hooks";
import { useCamera } from "@/features/camera/CameraProvider";
import { Emblem } from "@/features/chrome/Emblem";

const BOOT_DURATION_MS = 1500;

/**
 * Framing the deck arrives from. The camera pulls back to 1 on handoff.
 *
 * Kept modest: with full-size mission panels on the ring, a hard crop would
 * pull back through a large scale range and read as a zoom effect rather than
 * the deck settling into place.
 */
const BOOT_ZOOM = 1.22;

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
    <div className="flex h-full w-full flex-col items-center justify-center gap-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Emblem size={44} />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="text-t3 font-mono text-[10px] tracking-[0.4em] uppercase"
      >
        Initializing command deck
      </motion.p>

      {/* A single hairline filling for the duration of the boot. It is the only
          progress affordance, and it doubles as the skip cue: once it lands,
          the deck arrives. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative h-px w-40 overflow-hidden bg-white/10"
      >
        <motion.div
          className="bg-signal absolute inset-y-0 left-0"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: BOOT_DURATION_MS / 1000, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
