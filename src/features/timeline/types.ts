import type { LucideIcon } from "lucide-react";

/**
 * WHAT THIS CONSOLE IS FOR, stated once so the next entry added here has a test
 * to pass.
 *
 * Every other console answers a question that has no date in it. Systems asks what
 * the operator works with, Projects what he has built, About who he is. This one
 * owns the only question that is inherently chronological: WHEN, and in what
 * order. That is the whole boundary, and it is what keeps the page from becoming
 * a second copy of the others.
 *
 * So the rail carries education and research — things with a start, an end and a
 * position relative to each other — and nothing else. A project belongs on the
 * Projects console even though it happened in a year; a technology belongs on
 * Systems even though he learned it at some point. The reference put both here and
 * the counts immediately disagreed with the consoles they were copied from: it
 * claimed twelve projects where the roster counts eight, and three domains where
 * Systems lists six. Two screens contradicting each other about the same fact is
 * the failure this boundary exists to prevent.
 */
export type EntryKind = "academics" | "research" | "internship" | "milestone";

/**
 * ONGOING or COMPLETE, and there is no third value.
 *
 * The reference also carried a PROJECT kind with its own status vocabulary
 * borrowed from the projects console. Those are gone with the project entries; a
 * span of a life is either still running or it is not.
 */
export type EntryStatus = "ongoing" | "complete";

export interface JourneyEntry {
  readonly id: string;
  readonly kind: EntryKind;
  /** What it is: a degree, a role, a beginning. */
  readonly title: string;
  /** Where it happened. `null` for the entries that happened nowhere in particular. */
  readonly org: string | null;
  /** Printed under the title: "May 2025 — Aug 2025". */
  readonly period: string;
  /**
   * THE FULL RANGE, ON THE RAIL RATHER THAN IN THE CARD.
   *
   * This used to be a bare start year with a qualifier under it — "2025" over
   * "MAY — AUG" — while the card printed "May 2025 — Aug 2025" a few units to the
   * right. The same fact, twice, eight units apart. The rail is where a reader
   * looks for WHEN, so the range lives there and the card no longer repeats it.
   */
  readonly range: string;
  /**
   * What that stretch of time WAS — "Early Exploration", "Building Forward".
   *
   * The one piece of interpretation on the page, and the reason it earns its place
   * is that dates alone do not say what a period meant. "2018 — 2022" is a fact;
   * "Early Exploration" is what makes four years of unfinished side projects
   * legible as a phase rather than a gap.
   */
  readonly phase: string;
  readonly status: EntryStatus;
  /**
   * Path to the institution's own logo under `public/logos/`, or `null` where
   * there is no institution. A path that does not resolve is not an error — see
   * <InstitutionMark>, which falls back to `icon`.
   */
  readonly logo: string | null;
  /** Two or three lines. Not a résumé bullet list — what actually happened. */
  readonly points: readonly string[];
  readonly icon: LucideIcon;
  readonly accent: string;
}

export interface Milestone {
  readonly id: string;
  readonly label: string;
  readonly when: string;
  readonly detail: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}
