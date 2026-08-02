"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScene } from "@/features/app/hooks";
import { SCENE_REGISTRY } from "./registry";

/**
 * Swaps scenes without browser navigation.
 *
 * `mode="sync"` (the default), NOT `"wait"`. `wait` unmounts the outgoing scene
 * before mounting the incoming one, leaving a gap with nothing on screen — that
 * contradicts the spatial continuity the product spec asks for, and would have
 * to be undone for Sprint 3's cross-scene camera moves. With `sync` both scenes
 * are briefly mounted and stacked, so a transition can carry motion across them.
 *
 * The keyed `motion.div` wrapper lives HERE rather than inside each scene. If a
 * scene's own root were a fragment or a plain div, its exit animation would
 * silently no-op and it would disappear instantly. Centralising the wrapper
 * means a new scene cannot get this wrong.
 */
export function SceneHost() {
  const scene = useScene();
  const Scene = SCENE_REGISTRY[scene.id];

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={scene.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, zIndex: 1 }}
        // The outgoing scene must stop intercepting pointer events while it
        // fades, otherwise it swallows hovers meant for the incoming one.
        exit={{ opacity: 0, pointerEvents: "none", zIndex: 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <Scene />
      </motion.div>
    </AnimatePresence>
  );
}
