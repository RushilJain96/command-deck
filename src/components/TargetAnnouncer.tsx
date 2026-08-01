"use client";

import { useActiveTargetId } from "@/features/app/hooks";
import { getMissionById } from "@/features/missions/data";

/**
 * The entire targeting interaction is conveyed visually by a rotating ship,
 * which is worth nothing to a screen reader. This mirrors the active target
 * into the accessibility tree.
 *
 * Lives in screen space, outside the camera rig.
 */
export function TargetAnnouncer() {
  const mission = getMissionById(useActiveTargetId());

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {mission ? `Targeting mission slot ${mission.label}, ${mission.status}` : "No target"}
    </p>
  );
}
