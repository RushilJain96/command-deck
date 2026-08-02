"use client";

import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { MissionId } from "@/features/missions/types";
import {
  appReducer,
  initialAppState,
  selectActiveTargetId,
  type AppAction,
  type Scene,
} from "./state";

/**
 * State is published as several PRIMITIVE-valued contexts rather than one
 * object.
 *
 * The reducer returns a new state object on every accepted action, so a single
 * context would re-render every consumer on every pointer move. Splitting by
 * value means a context only notifies when its own value actually changes, and
 * primitives compare by identity for free.
 *
 * This is where Sprint 1's pointer/focus/lock split finally pays off: the
 * transient TARGET readout and the persistent ACTIVE MISSION panel read
 * different contexts, so hovering around the deck no longer disturbs the
 * latter.
 */
export const SceneContext = createContext<Scene | null>(null);
export const ActiveTargetContext = createContext<MissionId | null>(null);
export const LockedTargetContext = createContext<MissionId | null>(null);

/** Stable for the provider's lifetime — dispatch-only consumers never re-render. */
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <SceneContext.Provider value={state.scene}>
      <ActiveTargetContext.Provider value={selectActiveTargetId(state)}>
        <LockedTargetContext.Provider value={state.lockedTargetId}>
          <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
        </LockedTargetContext.Provider>
      </ActiveTargetContext.Provider>
    </SceneContext.Provider>
  );
}
