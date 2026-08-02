"use client";

import { useLockedTargetId } from "@/features/app/hooks";
import { getMissionById } from "@/features/missions/data";
import { STATUS_LABEL, STATUS_TONE } from "@/features/missions/types";
import { cn } from "@/lib/cn";
import { HudCaption, HudDivider, HudHeadline, HudPanel, HudRow } from "./HudPanel";

/**
 * The mission the operator has committed to by selecting it.
 *
 * Reads LockedTargetContext, NOT the active target. That distinction is the
 * whole reason Sprint 1 split targeting into pointer/focus/lock slots: this
 * panel must hold steady while the pointer wanders across the deck. Wire it to
 * the active target instead and it flickers on every hover, which is precisely
 * the behaviour the split exists to prevent.
 */
export function ActiveMissionPanel() {
  const mission = getMissionById(useLockedTargetId());

  return (
    <HudPanel label="Active Mission" className="w-60">
      {mission ? (
        <>
          <HudHeadline>{mission.title}</HudHeadline>
          <HudCaption>{mission.summary}</HudCaption>
          <HudDivider />
          <div>
            <HudRow label="Codename">{mission.codename}</HudRow>
            <HudRow
              label="Stage"
              tone={mission.status === "DEPLOYED" ? "nominal" : mission.status === "IN_DEVELOPMENT" ? "caution" : "default"}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5",
                    STATUS_TONE[mission.status].dot,
                    mission.status !== "PLANNED" && "signal-blink",
                  )}
                />
                {STATUS_LABEL[mission.status]}
              </span>
            </HudRow>
          </div>
        </>
      ) : (
        <div>
          <p className="text-t3 tracking-micro font-mono text-[12px] leading-none">
            STANDING BY
          </p>
          <p className="text-t3/70 mt-2.5 text-[11px] leading-[1.5]">
            Select a mission to lock it for review.
          </p>
        </div>
      )}
    </HudPanel>
  );
}
