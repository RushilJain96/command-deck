"use client";

import { motion, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import { useCamera } from "./CameraProvider";

/**
 * Projects world space onto the viewport.
 *
 * THE TRANSFORM MUST STAY NESTED. Framer Motion serializes transforms in a
 * fixed key order (`x`, `y`, ... `scale`, `rotate`), so putting all three on a
 * single element yields `translate(-C) scale(Z)`, which maps a world point p to
 * `Z*p - C`. A camera at world position C with zoom Z requires `Z*(p - C)`.
 * Those agree only at Z = 1, so a single-element rig looks correct until the
 * first zoom and then drifts off-centre. Nesting scale outside translate
 * composes to the correct mapping at every zoom level.
 *
 * Both layers animate on the compositor and are driven by MotionValues, so
 * camera movement costs zero React renders.
 *
 * INVARIANT: screen-space UI (HUD, dock, glassmorphic panels) must be a SIBLING
 * of this component, never a child. A transformed ancestor becomes the
 * containing block for `position: fixed` descendants, opens a new stacking
 * context, and scales `backdrop-filter` blur radii.
 */
export function CameraRig({ children }: { children: ReactNode }) {
  const camera = useCamera();

  // The rig renders the inverse of the camera's world position.
  const panX = useTransform(camera.x, (value) => -value);
  const panY = useTransform(camera.y, (value) => -value);

  return (
    <motion.div className="absolute inset-0 origin-center" style={{ scale: camera.zoom }}>
      <motion.div className="absolute inset-0" style={{ x: panX, y: panY }}>
        {/* World origin: a zero-size anchor at the viewport centre. Every world
            child positions itself relative to this point. */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0">{children}</div>
      </motion.div>
    </motion.div>
  );
}
