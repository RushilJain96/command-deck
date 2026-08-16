import {
  Coffee,
  GitCommitHorizontal,
  Flame,
  Boxes,
  Code2,
  Target,
  type LucideIcon,
} from "lucide-react";

/**
 * Operator track record.
 *
 * PLACEHOLDER FIGURES. Every number below is currently a constant, not a
 * measurement — the GitHub and LeetCode integrations land in Sprint 6. They are
 * shown rather than left blank at the operator's explicit direction; the
 * previous "NO LINK" sockets were the honest rendering of an unwired panel, and
 * this file is where that honesty now lives instead.
 *
 * Sprint 6 replaces the `value` constants with fetched figures and flips
 * `live` to true. Nothing in <StatsPanel> changes: it already renders a
 * pending state for anything not yet live, so a failed fetch degrades to the
 * socket rather than to a stale number.
 */
export interface Stat {
  readonly id: string;
  readonly label: string;
  /**
   * A number is formatted and set in the large tabular figure size. A string is
   * a standing statement rather than a count, so it is set smaller — at this
   * column width "Distributed Systems" in the figure size would not fit on one
   * line, and a wrapped headline number stops reading as a number. `null` is a
   * figure that has no value yet and renders as an em dash.
   */
  readonly value: number | string | null;
  /** Unit or qualifier shown under the figure. */
  readonly unit: string;
  readonly icon: LucideIcon;
  /**
   * Icon colour. The ONLY place hue enters the left rail.
   *
   * The rail was deliberately monochrome — six identical grey glyphs, so the eye
   * tracked down one column of shapes and read the FIGURES rather than being
   * pulled around by colour. That reasoning was sound for a rail of pure data and
   * it made the panel inert: six rows of grey is a spreadsheet, and this is
   * supposed to be an instrument someone wants to look at.
   *
   * Hue is confined to the 11px glyph. Labels, figures and qualifiers stay on the
   * text ramp, so the scanning column is untouched and the colour reads as the
   * icon being a lit indicator rather than as the row being categorised.
   *
   * THESE ARE NOT THE DECK'S PALETTE TOKENS, and that is deliberate rather than
   * sloppy. `--signal` red means "the operator's target" and `--nominal` green
   * means "deployed"; borrowing either here would put lifecycle vocabulary on a
   * statistic that has no lifecycle. These are their own set, and they mean
   * nothing beyond "this row is about that thing".
   *
   * DESATURATED ONE NOTCH FROM WHERE THEY STARTED. The set used to be the
   * brightest thing in the chrome — #00d4ff, #00e676, #ff6d00 are LED colours,
   * and six of them stacked in a column turned an instrument rail into a row of
   * status lights. The distinction each hue carries survives at two-thirds the
   * chroma; the arcade quality does not. The cyan went furthest, because it was
   * also the last survivor of a second accent the deck no longer runs.
   */
  readonly accent: string;
  /** True once the figure comes from a real source rather than this file. */
  readonly live: boolean;
}

export const STATS: readonly Stat[] = [
  { id: "leetcode", label: "LeetCode Solved", value: 482, unit: "Problems", icon: Code2, accent: "#7ba7cc", live: false },
  {
    id: "github",
    label: "GitHub Contributions",
    value: 1538,
    unit: "Total Contributions",
    icon: GitCommitHorizontal,
    accent: "#5fb98a", live: false,
  },
  { id: "streak", label: "Current Streak", value: 87, unit: "Days", icon: Flame, accent: "#d98b45", live: false },
  { id: "projects", label: "Projects Built", value: 12, unit: "Live Systems", icon: Boxes, accent: "#c3ccd6", live: false },
  { id: "coffee", label: "Coffee Consumed", value: 1248, unit: "Cups", icon: Coffee, accent: "#d9a463", live: false },
  {
    id: "focus",
    label: "Current Focus",
    value: "Distributed Systems",
    unit: "Next: event-driven pipelines",
    icon: Target,
    accent: "#d96a5c", live: false,
  },
];
