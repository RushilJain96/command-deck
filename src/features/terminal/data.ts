import { BIO, HEADLINE, OPERATOR } from "@/features/contact/data";
import { PROJECTS } from "@/features/projects/data";
import {
  CAPABILITIES,
  DAILY_TOOLS,
  EXPLORATION_FOCUS,
  SYSTEM_DOMAINS,
  TECHNOLOGIES,
} from "@/features/systems/data";

/**
 * THE SESSION'S IDENTITY.
 *
 * One constant rather than the string typed into four components, because the
 * prompt appears in the title bar, in every echoed command in the scrollback, on
 * the live input line, and in the `about` output — and a terminal whose hostname
 * differs between its title bar and its prompt is a terminal nobody believes.
 */
export const TERMINAL_USER = "engineer";
export const TERMINAL_HOST = "rushil-portfolio";
export const TERMINAL_CWD = "~";
export const PROMPT = `${TERMINAL_USER}@${TERMINAL_HOST}:${TERMINAL_CWD}`;

/**
 * Where `resume` sends the browser.
 *
 * The command navigates straight to it with no existence check, which is the
 * behaviour that was asked for — so until a PDF is dropped at `public/resume.pdf`
 * this is a 404. It is a constant rather than a literal in the command so that
 * moving or renaming the file is one edit, and so the path is greppable.
 */
export const RESUME_PATH = "/resume.pdf";

/**
 * THE PROFILE NOW LIVES IN THE ABOUT SCENE, and this is a re-export of it.
 *
 * It used to be a provisional block in this file with a TODO saying to replace it
 * once the About console existed. That console exists, so the TODO is discharged
 * rather than left to rot: `contact/data.tsx` owns the operator's own words, and
 * `about` prints them. There is now one place where the bio is written and three
 * surfaces that read it.
 *
 * `focus` comes from the systems console's `EXPLORATION_FOCUS` for the same
 * reason — it is already asserted on screen next to a panel of exploration tracks,
 * and a second copy here would be a second answer to "what are you working on".
 */
export const PROFILE = {
  operator: OPERATOR,
  role: HEADLINE,
  focus: EXPLORATION_FOCUS,
  bio: BIO,
} as const;

/** Counted rather than typed, so `about` cannot overstate the roster. See `ConsoleStats`. */
export const PROFILE_COUNTS = {
  projects: PROJECTS.length,
  production: PROJECTS.filter((project) => project.status === "PRODUCTION").length,
  domains: SYSTEM_DOMAINS.length,
  technologies: TECHNOLOGIES.length,
  tools: DAILY_TOOLS.length,
  capabilities: CAPABILITIES.length,
} as const;

export interface TimelineEntry {
  readonly year: number;
  readonly label: string;
  readonly detail: string;
}

/**
 * THE TIMELINE, SEEDED FROM THE PROJECT ROSTER RATHER THAN AUTHORED.
 *
 * TODO(rushil): replace with a hand-written list when the Timeline scene is built.
 * `TimelineEntry` is the shape that scene will want, so the authored version drops
 * in here and both consumers pick it up.
 *
 * Until then the entries are DERIVED: one per year present in `projects/data.ts`,
 * naming the systems that shipped in it. That is a deliberate choice over typing
 * placeholder milestones — a seeded list can only ever repeat facts the roster
 * already asserts, whereas invented dates read as real the moment they render and
 * nobody remembers which lines were filler. The command is honest today and gets
 * better the day the real list lands.
 */
export const TIMELINE: readonly TimelineEntry[] = (() => {
  const years = [...new Set(PROJECTS.map((project) => project.year))].sort((a, b) => b - a);
  return years.map((year) => {
    const shipped = PROJECTS.filter((project) => project.year === year);
    return {
      year,
      label: `${shipped.length} ${shipped.length === 1 ? "system" : "systems"}`,
      detail: shipped.map((project) => project.name).join(", "),
    };
  });
})();

export interface Shortcut {
  readonly keys: string;
  readonly label: string;
}

/**
 * THE SHORTCUT BAR, AND ONE LABEL DIFFERS FROM THE REFERENCE ON PURPOSE.
 *
 * The reference prints CTRL+K as "Clear" and CTRL+L as "Clear Screen", which reads
 * as two keys for one action. They are not: in every shell CTRL+L wipes the screen
 * and CTRL+K kills the rest of the input line, and that is what these two do here.
 * Labelling them "Clear Line" and "Clear Screen" is the smallest edit that makes
 * the bar describe what actually happens — a legend that lies about the keys is
 * worse than a legend that differs from the mockup by one word.
 */
export const SHORTCUTS: readonly Shortcut[] = [
  { keys: "TAB", label: "Autocomplete" },
  { keys: "↑ / ↓", label: "History" },
  { keys: "CTRL + K", label: "Clear Line" },
  { keys: "CTRL + L", label: "Clear Screen" },
  { keys: "ESC", label: "Focus Navigation" },
];
