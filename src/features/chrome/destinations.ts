import {
  Beaker,
  CircleDot,
  FolderGit2,
  Radio,
  Send,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import type { SceneId } from "@/features/app/state";

/**
 * Application structure, as advertised to the operator.
 *
 * Mirrors the scene list in SPEC.md. Destinations beyond the Command Deck are
 * not navigable until their sprint lands; rather than hiding them, the deck
 * shows them as locked so a first-time visitor can see the shape of the whole
 * system immediately. `sceneId` is present for the ones that already exist, so
 * wiring navigation in a later sprint is a matter of dispatching `scene/enter`.
 *
 * The `index` and `icon` exist because the top bar renders these as a segmented
 * mode selector rather than a row of links. A channel number and a glyph are
 * what separate a console from a website menu: they say the destinations are
 * positions on a switch, not pages to browse.
 */
/**
 * A switch position can only be a scene the reducer can enter from a bare id.
 *
 * `boot` is excluded because it is an arrival sequence rather than a place, and
 * `project` because it carries a `missionId` — a segment that dispatched
 * `{ id: "project" }` with no mission would be a type error waiting to be a
 * runtime one. Narrowing here rather than casting at the call site is what lets
 * <TopBar> build the action straight from the datum.
 */
export type SwitchSceneId = Exclude<SceneId, "boot" | "project">;

export interface Destination {
  id: string;
  label: string;
  short: string;
  /** Channel number, shown in the selector. Stable regardless of order. */
  index: string;
  icon: LucideIcon;
  sceneId: SwitchSceneId | null;
}

export const DESTINATIONS: readonly Destination[] = [
  {
    id: "mission-control",
    label: "Mission Control",
    short: "CTRL",
    index: "01",
    icon: Radio,
    sceneId: "command-deck",
  },
  { id: "systems", label: "Systems", short: "SYS", index: "02", icon: Waypoints, sceneId: "systems" },
  { id: "projects", label: "Projects", short: "PROJ", index: "03", icon: FolderGit2, sceneId: null },
  { id: "timeline", label: "Timeline", short: "TIME", index: "04", icon: CircleDot, sceneId: null },
  { id: "lab", label: "Lab", short: "LAB", index: "05", icon: Beaker, sceneId: null },
  { id: "contact", label: "Contact", short: "CONT", index: "06", icon: Send, sceneId: null },
];
