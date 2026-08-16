"use client";

import { useEffect } from "react";
import { useAppDispatch, useScene } from "@/features/app/hooks";
import { MISSIONS } from "@/features/missions/data";

/**
 * Placeholder shell. Portfolio content belongs to a later sprint, and the
 * launch/warp transition that should reach this scene is not built — what exists
 * here is the destination, so the scene union has a third member and the deck's
 * Enter key has somewhere to go.
 *
 * IT HAS A WAY BACK, and that is the part that is not placeholder. The deck now
 * advertises "PRESS ENTER TO LAUNCH", and an advertised control that strands the
 * visitor on a dead-end screen is worse than one that does nothing: the top bar's
 * segments are still inert, so without this handler Escape and the browser's back
 * button would be the only exits and neither is discoverable. The scene names the
 * mission it was entered for and says how to leave.
 */
export function ProjectScene() {
  const dispatch = useAppDispatch();
  const scene = useScene();
  const missionId = scene.id === "project" ? scene.missionId : null;
  const mission = MISSIONS.find((m) => m.id === missionId);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key !== "Escape") return;
      dispatch({ type: "scene/enter", scene: { id: "command-deck" } });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <p className="text-t3 tracking-label font-mono text-[10px] uppercase">Project Scene</p>

      {mission && (
        <p className="text-t1 text-[28px] leading-none font-medium tracking-[-0.015em]">
          {mission.title}
        </p>
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: "scene/enter", scene: { id: "command-deck" } })}
        className="border-panel-edge bg-panel text-t3 hover:text-t1 tracking-micro focus-visible:ring-signal/70 rounded-[3px] border px-4 py-2 font-mono text-[11px] uppercase outline-none transition-colors duration-200 focus-visible:ring-2"
      >
        Esc — return to deck
      </button>
    </div>
  );
}
