"use client";

import { motion } from "framer-motion";
import { useActiveTargetId } from "@/features/app/hooks";
import { getMissionById } from "@/features/missions/data";
import { IDLE_DRIFT } from "@/lib/motion/springs";
import { ShipGeometry } from "./ShipGeometry";
import { useShipRotation } from "./useShipRotation";

/**
 * The spacecraft sits at the world origin and only ever rotates — it must never
 * translate. When the camera needs to reframe the ship, the camera moves.
 *
 * Targeting rotation and idle drift are on SEPARATE nested elements. One
 * element has one `rotate` channel; summing the two by hand would mean
 * reimplementing the spring in userland, and would also hide the idle drift
 * from `<MotionConfig reducedMotion>`, which only governs the declarative
 * `animate` path.
 */
export function Spacecraft() {
  const activeTargetId = useActiveTargetId();
  const activeMission = getMissionById(activeTargetId);

  // With the ship at the world origin, the heading to a mission is exactly that
  // mission's theta — no measurement, correct on first paint, resize-immune.
  // `null` holds the last heading instead of snapping back to north.
  const rotation = useShipRotation(activeMission?.theta ?? null);

  return (
    <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
      {/* Targeting rotation: imperative, spring-driven, zero re-renders. */}
      <motion.div style={{ rotate: rotation }}>
        {/* Idle drift: declarative, so MotionConfig's reduced-motion handling
            applies automatically. */}
        <motion.div
          animate={{ rotate: [...IDLE_DRIFT.rotate] }}
          transition={{ ...IDLE_DRIFT.transition }}
        >
          <ShipGeometry engaged={activeMission !== undefined} />
        </motion.div>
      </motion.div>
    </div>
  );
}
