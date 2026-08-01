"use client";

import { createContext, useReducer, type Dispatch, type ReactNode } from "react";
import { appReducer, initialAppState, type AppAction, type AppState } from "./state";

export const AppStateContext = createContext<AppState | null>(null);

/**
 * Dispatch lives in its own context so components that only ever fire actions
 * (mission nodes, the boot skip handler) do not re-render when unrelated state
 * changes. `useReducer`'s dispatch is referentially stable for the provider's
 * lifetime, so this context value never changes identity.
 */
export const AppDispatchContext = createContext<Dispatch<AppAction> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
