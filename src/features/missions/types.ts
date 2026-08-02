import type { MissionPlacement } from "./placement";

export type MissionId = `MISSION-${string}`;

/**
 * Lifecycle state of a mission. This models an engineering ROADMAP, not a list
 * of shipped work — a mission may legitimately never have been started.
 */
export type MissionStatus = "PLANNED" | "IN_DEVELOPMENT" | "DEPLOYED";

export interface MissionSlot {
  id: MissionId;
  /** Short designator shown at every level of detail, e.g. "M-01". */
  label: string;
  /** Operational name. Survives even at marker LOD — identity is never dropped. */
  codename: string;
  /** Human title shown from compact LOD upward. */
  title: string;
  /** One line of context, shown at full LOD only. */
  summary: string;
  /** Orbital position, degrees clockwise from screen-up. */
  theta: number;
  /**
   * Which orbit the mission rides, as a fraction of `--orbit-radius`.
   *
   * Missions deliberately do NOT share one ring. A single ring at uniform
   * spacing reads as generated; spreading them across several orbits at uneven
   * angles reads as a system somebody arranged. Keep every value <= 1.02 — the
   * radius formula in globals.css reserves its horizontal panel budget against
   * the widest reach, and pushing a mission further out clips it on narrow
   * viewports.
   */
  ring: number;
  status: MissionStatus;
}

/** A slot with its projection precomputed. This is what components consume. */
export interface Mission extends MissionSlot {
  readonly placement: MissionPlacement;
}

export const STATUS_LABEL: Record<MissionStatus, string> = {
  PLANNED: "PLANNED",
  IN_DEVELOPMENT: "IN DEV",
  DEPLOYED: "DEPLOYED",
};

/** Status rail fill, read as a gauge rather than a badge. */
export const STATUS_FILL: Record<MissionStatus, string> = {
  PLANNED: "38%",
  IN_DEVELOPMENT: "68%",
  DEPLOYED: "100%",
};

/**
 * Lifecycle colours, taken from annunciator-panel convention: green is nominal,
 * amber is work in progress, unlit is not yet started.
 *
 * Signal red is deliberately absent. It belongs exclusively to the operator's
 * current target, and letting it also mean "deployed" made the two impossible
 * to tell apart — hovering a deployed mission turned everything the same red.
 * One hue, one meaning.
 */
export const STATUS_TONE: Record<MissionStatus, { rail: string; text: string; dot: string }> = {
  DEPLOYED: { rail: "bg-nominal", text: "text-nominal", dot: "bg-nominal" },
  IN_DEVELOPMENT: { rail: "bg-caution", text: "text-caution", dot: "bg-caution" },
  PLANNED: { rail: "bg-t4", text: "text-t3", dot: "bg-t4" },
};
