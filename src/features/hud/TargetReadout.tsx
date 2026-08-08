"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useActiveTargetId } from "@/features/app/hooks";
import { getMissionById } from "@/features/missions/data";
import { STATUS_LABEL } from "@/features/missions/types";
import { HudDivider, HudHeadline, HudPanel, HudRow } from "./HudPanel";

/**
 * Transient readout for whatever the operator is currently pointing at.
 *
 * Reads ActiveTargetContext, so it updates on every hover — which is exactly
 * what it is for. The persistent <ActiveMissionPanel> reads a different context
 * precisely so it does NOT do this.
 *
 * BEARING AND RANGE ARE THE SAME NUMBERS THE SHIP IS FLYING. Both come straight
 * off the mission's placement record — the identical `screenAngle` that drives
 * the hull's rotation and the identical `range` that sets the bearing vector's
 * length. That is the point of showing them: a readout that agreed with nothing
 * on screen would be set dressing, whereas one whose bearing you can check
 * against the nose of the ship is an instrument.
 */
export function TargetReadout() {
  const mission = getMissionById(useActiveTargetId());

  return (
    <HudPanel label="Target" side="right" className="deck-sm:w-full w-52">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mission?.id ?? "none"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          {mission ? (
            <>
              <HudHeadline>{mission.title}</HudHeadline>
              <HudDivider />
              <div>
                <HudRow label="Designator" tone="signal">
                  {mission.label}
                </HudRow>
                <HudRow label="Bearing" tone="telemetry">
                  {formatBearing(mission.placement.screenAngle)}
                </HudRow>
                <HudRow label="Range" tone="telemetry">
                  {mission.placement.range.toFixed(2)} R
                </HudRow>
                <HudRow label="Orbit">{mission.placement.ring.toFixed(2)}</HudRow>
                <HudRow label="State">{STATUS_LABEL[mission.status]}</HudRow>
              </div>
            </>
          ) : (
            <div>
              <p className="text-t3 tracking-micro font-mono text-[12px] leading-none">NO TARGET</p>
              <p className="text-t3/70 mt-2.5 text-[11px] leading-[1.5]">
                Point at a mission node to acquire.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </HudPanel>
  );
}

/**
 * Compass bearing, 000-359.
 *
 * `screenAngle` is signed — the ship turns left through negative degrees — but
 * a bearing readout that shows -067 is not a bearing, it is a rotation. Wrap
 * into the positive range and pad, the way any nav display would.
 */
function formatBearing(angle: number): string {
  const wrapped = ((Math.round(angle) % 360) + 360) % 360;
  return `${String(wrapped).padStart(3, "0")}°`;
}
