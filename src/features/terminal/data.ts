import { PROJECTS } from "@/features/projects/data";
import { CAPABILITIES, DAILY_TOOLS, SYSTEM_DOMAINS, TECHNOLOGIES } from "@/features/systems/data";

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
 * WHAT `about` PRINTS — PROVISIONAL, AND MARKED AS SUCH.
 *
 * TODO(rushil): replace this with the real operator profile once the About scene
 * is built; that scene's copy is the source and this should quote it rather than
 * inventing a second version.
 *
 * Everything here is a fact already asserted somewhere else in the repo — the
 * footer's own strapline, the exploration focus on the systems console, the
 * domains and counts — so nothing in this block is biography that has not already
 * shipped. That is the constraint that keeps a placeholder from quietly becoming
 * a claim: a line goes in here only if it is already true on another screen.
 */
export const PROFILE = {
  operator: "Rushil Jain",
  role: "Engineer · Builder · Problem solver",
  focus: "AI Engineering & System Design",
  strapline: "Building systems that hold up under load, not demos that hold up on stage.",
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
