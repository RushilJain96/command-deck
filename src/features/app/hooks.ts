"use client";

import { useContext } from "react";
import type { MissionId } from "@/features/missions/types";
import {
  ActiveTargetContext,
  AppDispatchContext,
  LockedTargetContext,
  SceneContext,
} from "./AppProvider";
import type { Scene } from "./state";

export function useScene(): Scene {
  const scene = useContext(SceneContext);
  if (scene === null) throw new Error("useScene must be used within <AppProvider>");
  return scene;
}

export function useAppDispatch() {
  const dispatch = useContext(AppDispatchContext);
  if (dispatch === null) throw new Error("useAppDispatch must be used within <AppProvider>");
  return dispatch;
}

/**
 * The mission currently being aimed at, resolved across pointer/focus/lock.
 * Changes on every hover — read it only where that is genuinely wanted.
 */
export function useActiveTargetId(): MissionId | null {
  return useContext(ActiveTargetContext);
}

/**
 * The mission the operator has committed to. Deliberately unaffected by hover,
 * so a persistent readout does not flicker as the pointer crosses the deck.
 */
export function useLockedTargetId(): MissionId | null {
  return useContext(LockedTargetContext);
}
