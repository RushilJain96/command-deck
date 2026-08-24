import type { LucideIcon } from "lucide-react";

/**
 * THE PROJECT ROSTER IS NOT THE MISSION ROSTER, AND THE SPLIT IS DELIBERATE.
 *
 * `missions/data.ts` holds six waypoints positioned by trigonometry on a tilted
 * plane — every field on a `MissionSlot` exists to get a card drawn at a polar
 * station and keep it out from under the HUD rail. This file holds eight entries
 * in a fixed 4x2 grid, and the only thing the two structures share is that some
 * of the same systems appear in both.
 *
 * Fusing them would mean one record carrying `x`, `y`, `tier` and `ring` for the
 * deck alongside `preview`, `categories` and `stack` for the console, where each
 * consumer ignores most of it and `deck-layout-check.mjs` mirrors a shape that is
 * mostly not about layout. `missionId` is the seam instead: a project that also
 * flies on the deck names its waypoint, and a future "open this project from its
 * callout" is a lookup rather than a merge.
 */
export type ProjectId = string;

/**
 * Delivery state. THREE VALUES, NOT THE MISSION LIFECYCLE'S THREE.
 *
 * `MissionStatus` models a roadmap — PLANNED means a thing that may never have
 * been started, which is honest for a deck of intentions. This console lists work
 * that exists, so its lowest rung is IN_PROGRESS: something is running, it is just
 * not finished. There is no PLANNED here, because a card with a preview, a stack
 * and a year is by definition past planning.
 */
export type ProjectStatus = "PRODUCTION" | "BETA" | "IN_PROGRESS";

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  PRODUCTION: "PRODUCTION",
  BETA: "BETA",
  IN_PROGRESS: "IN PROGRESS",
};

/**
 * Status tone. Green for shipped, blue for the thing you can use but shouldn't
 * rely on, amber for the thing still moving.
 *
 * BLUE FOR BETA RATHER THAN A SECOND AMBER. `--telemetry` is the deck's colour for
 * live machine data, which is exactly what a beta is: real, observable, not yet
 * settled. Reusing amber for both BETA and IN_PROGRESS would collapse the two
 * states the reader most needs to tell apart, and red stays off this table for the
 * same reason it is off the mission one — red is targeting and identity here.
 */
export const STATUS_TONE: Record<ProjectStatus, string> = {
  PRODUCTION: "text-nominal",
  BETA: "text-telemetry",
  IN_PROGRESS: "text-caution",
};

/**
 * WHICH SCHEMATIC THE CARD DRAWS IN ITS PREVIEW WELL.
 *
 * Eight kinds for eight projects, which looks like a one-to-one mapping worth
 * collapsing into a field on the project — it is not. The kind describes the
 * SHAPE of a system (a directed graph, a request path, a conversation, a map of
 * where events land), and two projects can legitimately share one: SENTINEL and
 * ORION both draw a threat map because both are things that light up a world.
 * A ninth project picks from this list rather than adding to it.
 */
export type PreviewKind =
  | "console-map"
  | "score-panel"
  | "dag"
  | "gateway"
  | "chat"
  | "pipeline"
  | "iac-topology"
  | "threat-map";

export interface ProjectCategory {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

export interface Project {
  readonly id: ProjectId;
  /** Display name. Mono uppercase on the card — it is a designator, not prose. */
  readonly name: string;
  /** One line under the name, in sans: what KIND of system this is. */
  readonly kind: string;
  /** Two to three lines of what it does. Clamped to three on the card. */
  readonly summary: string;
  /**
   * THE WHOLE STACK, NOT THE VISIBLE FOUR.
   *
   * The card shows the first `TAG_PREVIEW_COUNT` and a `+N` overflow, and N is
   * computed from this array's length — so the badge cannot drift from the list
   * the way a hand-written "+4" does the moment a technology is added.
   */
  readonly stack: readonly string[];
  readonly categories: readonly string[];
  readonly year: number;
  readonly status: ProjectStatus;
  readonly featured: boolean;
  readonly accent: string;
  readonly icon: LucideIcon;
  readonly preview: PreviewKind;
  /** The deck waypoint this project flies as, when it has one. See the note above. */
  readonly missionId?: string;
  /** Outbound repository or case study. Null renders the link glyph unlit. */
  readonly href: string | null;
}
