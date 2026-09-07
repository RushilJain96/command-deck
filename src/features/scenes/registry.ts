import type { ComponentType } from "react";
import type { SceneId } from "@/features/app/state";
import { BootScene } from "./BootScene";
import { CommandDeckScene } from "./CommandDeckScene";
import { ContactScene } from "./ContactScene";
import { ProjectScene } from "./ProjectScene";
import { ProjectsScene } from "./ProjectsScene";
import { SystemsScene } from "./SystemsScene";
import { TimelineScene } from "./TimelineScene";
import { TerminalScene } from "./TerminalScene";

/**
 * A plain lookup, not a runtime `register()` call — scenes are known at build
 * time, and `Record<SceneId, ...>` makes the compiler enforce that every member
 * of the Scene union has an implementation.
 */
export const SCENE_REGISTRY: Record<SceneId, ComponentType> = {
  boot: BootScene,
  "command-deck": CommandDeckScene,
  systems: SystemsScene,
  projects: ProjectsScene,
  terminal: TerminalScene,
  contact: ContactScene,
  timeline: TimelineScene,
  project: ProjectScene,
};
