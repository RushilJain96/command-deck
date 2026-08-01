import type { ComponentType } from "react";
import type { SceneId } from "@/features/app/state";
import { BootScene } from "./BootScene";
import { CommandDeckScene } from "./CommandDeckScene";
import { ProjectScene } from "./ProjectScene";

/**
 * A plain lookup, not a runtime `register()` call — scenes are known at build
 * time, and `Record<SceneId, ...>` makes the compiler enforce that every member
 * of the Scene union has an implementation.
 */
export const SCENE_REGISTRY: Record<SceneId, ComponentType> = {
  boot: BootScene,
  "command-deck": CommandDeckScene,
  project: ProjectScene,
};
