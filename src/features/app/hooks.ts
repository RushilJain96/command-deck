"use client";

import { useContext } from "react";
import { AppDispatchContext, AppStateContext } from "./AppProvider";
import { selectActiveTargetId, type AppState } from "./state";

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (state === null) throw new Error("useAppState must be used within <AppProvider>");
  return state;
}

export function useAppDispatch() {
  const dispatch = useContext(AppDispatchContext);
  if (dispatch === null) throw new Error("useAppDispatch must be used within <AppProvider>");
  return dispatch;
}

/** The mission currently being aimed at, resolved across pointer/focus/lock. */
export function useActiveTargetId() {
  return selectActiveTargetId(useAppState());
}
