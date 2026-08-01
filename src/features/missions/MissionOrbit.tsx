"use client";

import { useEffect } from "react";
import { useActiveTargetId, useAppDispatch } from "@/features/app/hooks";
import { MISSION_SLOTS } from "./data";
import { MissionNode } from "./MissionNode";

/**
 * Renders the orbital ring from data. Nothing here knows how many missions
 * exist — adding a slot is an edit to `data.ts` and nothing else.
 *
 * The container carries a `pointerleave` safety net: if the pointer exits the
 * window quickly, or a node unmounts while hovered, the node's own
 * `pointerleave` may never fire and the target would stay latched.
 */
export function MissionOrbit() {
  const dispatch = useAppDispatch();
  const activeTargetId = useActiveTargetId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "target/clear" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <ul
      aria-label="Mission slots"
      className="absolute left-0 top-0 h-0 w-0 list-none"
      onPointerLeave={() => dispatch({ type: "target/pointer", id: null })}
    >
      {MISSION_SLOTS.map((mission) => (
        <MissionNode
          key={mission.id}
          mission={mission}
          isActive={mission.id === activeTargetId}
        />
      ))}
    </ul>
  );
}
