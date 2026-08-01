"use client";

import { useFollowValue, useMotionValue, type MotionValue } from "framer-motion";
import { createContext, useContext, type ReactNode } from "react";
import { useMotionPreset } from "@/lib/motion/useMotionPreset";

export interface CameraTarget {
  x?: number;
  y?: number;
  zoom?: number;
}

export interface Camera {
  /** Animated camera position in world space, in CSS pixels. */
  readonly x: MotionValue<number>;
  readonly y: MotionValue<number>;
  readonly zoom: MotionValue<number>;
  /**
   * Springs the camera toward a new world pose.
   *
   * Call from effects and event handlers ONLY. This mutates MotionValues, which
   * is external state the React Compiler is entitled to assume never changes
   * during render.
   */
  moveTo(target: CameraTarget): void;
  /**
   * Places the camera with no animation, cancelling any in-flight move.
   *
   * Use when a scene needs to establish its starting framing — springing *into*
   * an establishing shot would animate the camera the wrong way first. Same
   * calling restriction as `moveTo`.
   */
  jumpTo(target: CameraTarget): void;
  reset(): void;
}

/** Explicitly widened to `number` — `as const` here would infer literal types
 *  and pin the MotionValues to a single value. */
export const DEFAULT_POSE: Required<CameraTarget> = { x: 0, y: 0, zoom: 1 };

const CameraContext = createContext<Camera | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const panPreset = useMotionPreset("cameraPan");
  const zoomPreset = useMotionPreset("cameraZoom");

  // Targets are set imperatively; the exposed values are the springs that
  // chase them. Nothing here is React state, so camera motion never re-renders.
  const targetX = useMotionValue(DEFAULT_POSE.x);
  const targetY = useMotionValue(DEFAULT_POSE.y);
  const targetZoom = useMotionValue(DEFAULT_POSE.zoom);

  const x = useFollowValue(targetX, panPreset);
  const y = useFollowValue(targetY, panPreset);
  const zoom = useFollowValue(targetZoom, zoomPreset);

  const camera: Camera = {
    x,
    y,
    zoom,
    moveTo(target) {
      if (target.x !== undefined) targetX.set(target.x);
      if (target.y !== undefined) targetY.set(target.y);
      if (target.zoom !== undefined) targetZoom.set(target.zoom);
    },
    jumpTo(target) {
      // Move the source and the follower together, so the follower has nothing
      // left to chase and no animation is scheduled.
      if (target.x !== undefined) {
        targetX.set(target.x);
        x.jump(target.x);
      }
      if (target.y !== undefined) {
        targetY.set(target.y);
        y.jump(target.y);
      }
      if (target.zoom !== undefined) {
        targetZoom.set(target.zoom);
        zoom.jump(target.zoom);
      }
    },
    reset() {
      targetX.set(DEFAULT_POSE.x);
      targetY.set(DEFAULT_POSE.y);
      targetZoom.set(DEFAULT_POSE.zoom);
    },
  };

  return <CameraContext.Provider value={camera}>{children}</CameraContext.Provider>;
}

export function useCamera(): Camera {
  const camera = useContext(CameraContext);
  if (camera === null) throw new Error("useCamera must be used within <CameraProvider>");
  return camera;
}
