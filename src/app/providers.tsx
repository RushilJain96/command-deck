"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AppProvider } from "@/features/app/AppProvider";
import { CameraProvider } from "@/features/camera/CameraProvider";

/**
 * `reducedMotion="user"` governs the DECLARATIVE path only — `animate`,
 * `whileHover` and friends on motion components. It is not read by
 * `useSpring`/`useFollowValue`, so every imperatively-driven value swaps its
 * own options via `useMotionPreset`. Both halves are required for full
 * reduced-motion coverage.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <CameraProvider>{children}</CameraProvider>
      </AppProvider>
    </MotionConfig>
  );
}
