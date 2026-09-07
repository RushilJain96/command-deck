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
export type EntryKind = "academics" | "research" | "experience" | "milestone";

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
   * The two lines on the year rail to the left of the card.
   *
   * `year` IS ALWAYS THE START, never the end. The reference labelled its earliest
   * entry "2022" for a span running 2018–2022, which is the only entry it labelled
   * by its finish — so the rail read downward as 2026, 2025, 2025, 2024, 2022 and
   * looked ordered while actually mixing two different meanings of the number. A
   * rail whose numbers do not all mean the same thing is worse than no rail.
   */
  readonly year: string;
  /** The qualifier under the year: "PRESENT", "MAY — AUG", "SEP". */
  readonly span: string;
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
