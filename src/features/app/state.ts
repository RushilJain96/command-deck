import { HERO_MISSION_ID } from "@/features/missions/data";
import type { MissionId } from "@/features/missions/types";

/**
 * Scenes are a serializable discriminated union. That is the only concession
 * Sprint 1 makes to future URL-syncing — no router scaffolding is built now,
 * but this shape can be mapped to and from a path without changing callers.
 */
export type Scene =
  | { id: "boot" }
  | { id: "command-deck" }
  | { id: "project"; missionId: MissionId };

export type SceneId = Scene["id"];

export interface AppState {
  scene: Scene;
  /**
   * Targeting is tracked as three independent slots rather than one "active"
   * field, because pointer, keyboard and click are genuinely concurrent inputs.
   * Collapsing them into one value produces flicker (a mouse leaving node A
   * clearing node B's keyboard focus) and sticky targets on touch, where
   * `pointerenter` fires with no matching `pointerleave`.
   */
  pointerTargetId: MissionId | null;
  focusTargetId: MissionId | null;
  lockedTargetId: MissionId | null;
}

export type AppAction =
  | { type: "boot/complete" }
  | { type: "scene/enter"; scene: Scene }
  | { type: "target/pointer"; id: MissionId | null }
  | { type: "target/focus"; id: MissionId | null }
  | { type: "target/lock"; id: MissionId | null }
  | { type: "target/clear" };

export const initialAppState: AppState = {
  scene: { id: "boot" },
  pointerTargetId: null,
  focusTargetId: null,
  // The deck rests on its hero rather than on nothing — see HERO_MISSION_ID.
  // Set HERE rather than in an effect on the deck scene, so the first paint is
  // already correct: an effect would render one untargeted frame and then light
  // the card, which reads as a glitch on arrival and is a hydration mismatch
  // waiting to happen.
  lockedTargetId: HERO_MISSION_ID,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "boot/complete":
      // Idempotent: the skip affordance and the timer can both fire.
      if (state.scene.id !== "boot") return state;
      return { ...state, scene: { id: "command-deck" } };

    case "scene/enter":
      // Changing scene must not leave a stale target pointing at a node that
      // is no longer mounted.
      return {
        ...state,
        scene: action.scene,
        pointerTargetId: null,
        focusTargetId: null,
      };

    case "target/pointer":
      if (state.pointerTargetId === action.id) return state;
      return { ...state, pointerTargetId: action.id };

    case "target/focus":
      if (state.focusTargetId === action.id) return state;
      return { ...state, focusTargetId: action.id };

    case "target/lock":
      if (state.lockedTargetId === action.id) return state;
      return { ...state, lockedTargetId: action.id };

    case "target/clear":
      return { ...state, pointerTargetId: null, focusTargetId: null, lockedTargetId: null };

    default:
      return state;
  }
}

/**
 * Precedence: a live pointer beats keyboard focus, which beats a prior lock.
 * Deriving this rather than storing it is what makes "the previous target
 * deselects cleanly" a property of the model instead of an emergent behaviour.
 */
export function selectActiveTargetId(state: AppState): MissionId | null {
  return state.pointerTargetId ?? state.focusTargetId ?? state.lockedTargetId;
}
