"use client";

import { useEffect } from "react";
import { useActiveTargetId, useAppDispatch } from "@/features/app/hooks";
import { MISSIONS } from "./data";
import { MissionNode } from "./MissionNode";

/**
 * Renders the orbital ring from data. Nothing here knows how many missions
 * exist — adding one is an edit to `data.ts` and nothing else.
 *
 * INVARIANT: this <ul> must NOT create a stacking context. No `opacity`,
 * `transform`, `filter`, `isolation` or numeric `z-index`, and never a
 * `motion.ul` with an animated opacity. Depth ordering depends on each <li>'s
 * z-index competing directly with the spacecraft's inside the world-origin
 * div's stacking context. Give this element any grouping property and the whole
 * ring silently sorts as one block.
 *
 * With the camera behind the vehicle the ship holds the nearest station, so it
 * always wins that comparison — but the nodes still have to sort correctly
 * against EACH OTHER, and they ride four different orbits now, so a far node
 * passing behind a near one is a visible part of the depth read.
 *
 * The container also carries a `pointerleave` safety net: if the pointer exits
 * the window quickly, or a node unmounts while hovered, the node's own
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
      className="absolute top-0 left-0 h-0 w-0 list-none"
      onPointerLeave={() => dispatch({ type: "target/pointer", id: null })}
    >
      {MISSIONS.map((mission, index) => (
        <MissionNode
          key={mission.id}
          mission={mission}
          index={index}
          isActive={mission.id === activeTargetId}
        />
      ))}
    </ul>
  );
}
