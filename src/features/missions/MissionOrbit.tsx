"use client";

import { useEffect } from "react";
import { useActiveTargetId, useAppDispatch } from "@/features/app/hooks";
import { MISSIONS } from "./data";
import { MissionNode } from "./MissionNode";

/**
 * The six missions in the order the eye meets them, left to right.
 *
 * NOT ROSTER ORDER. `data.ts` is authored as a hero followed by the flanks it
 * balances against, which is the right way to write the file and the wrong way to
 * walk it: pressing right and watching the lock jump from centre to back-left to
 * top is not navigation, it is a shuffle. Arrow keys are a SPATIAL control, so
 * they have to follow the arrangement on screen.
 *
 * Ties on `x` are broken by `y`. ORION and DATAFLOW both sit at exactly twelve
 * o'clock (sin 0 = 0), so without a second key their relative order would depend
 * on sort stability — the two centre cards would swap places between engines.
 *
 * Computed once at module scope: the roster is static, and doing this per render
 * would be work repeated on every pointer move.
 */
const SCREEN_ORDER = [...MISSIONS].sort((a, b) => a.x - b.x || a.y - b.y);

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

  /**
   * DECK KEYBOARD. Three keys, and all three act on state that already exists —
   * no new targeting slot. Arrow keys drive the LOCK, which is the slot that
   * means "chosen deliberately"; pointer and focus still outrank it, so moving
   * the mouse over a card shows that card without destroying the keyboard
   * selection underneath.
   *
   * `activeTargetId` rather than the lock itself is the cursor, so pressing right
   * while hovering a card steps from THAT card. Anything else means the visible
   * selection jumps somewhere unrelated on the first press.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Modified chords belong to the browser and the OS. Ctrl+ArrowRight is a
      // word jump, Cmd+Enter is "open in new tab" — quietly eating either is the
      // kind of thing that makes an interface feel like it has taken the machine
      // hostage.
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const el = event.target as HTMLElement | null;
      const inField = el?.closest?.("input, textarea, select, [contenteditable='true']");
      if (inField) return;

      if (event.key === "Escape") {
        dispatch({ type: "target/clear" });
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        // Stops the arrow from also scrolling whatever scroll container it lands
        // in. The deck does not scroll, but a nested one could.
        event.preventDefault();

        const step = event.key === "ArrowRight" ? 1 : -1;
        const current = SCREEN_ORDER.findIndex((m) => m.id === activeTargetId);
        // No selection yet: enter the row from whichever end the key implies,
        // rather than always starting at index 0 and making left-arrow feel dead.
        const next =
          current === -1
            ? step === 1
              ? 0
              : SCREEN_ORDER.length - 1
            : (current + step + SCREEN_ORDER.length) % SCREEN_ORDER.length;

        dispatch({ type: "target/lock", id: SCREEN_ORDER[next].id });
        return;
      }

      if (event.key === "Enter") {
        // A focused control owns its own Enter. Without this, tabbing to a
        // mission card and pressing Enter would both click the card AND launch,
        // and tabbing to a footer link would launch instead of following it.
        if (el?.closest?.("a, button")) return;

        // Nothing chosen yet: Enter takes the hero, so the advertised key always
        // does something on a deck the visitor has not touched.
        const id = activeTargetId ?? SCREEN_ORDER.find((m) => m.tier === "hero")?.id;
        if (!id) return;

        event.preventDefault();
        dispatch({ type: "scene/enter", scene: { id: "project", missionId: id } });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, activeTargetId]);

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
