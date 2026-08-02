import { Coffee, GitCommitHorizontal, Flame, Boxes, Code2, type LucideIcon } from "lucide-react";

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
  readonly value: number | null;
  /** Unit or qualifier shown under the figure. */
  readonly unit: string;
  readonly icon: LucideIcon;
  /** True once the figure comes from a real source rather than this file. */
  readonly live: boolean;
}

export const STATS: readonly Stat[] = [
  { id: "leetcode", label: "LeetCode Solved", value: 482, unit: "Problems", icon: Code2, live: false },
  {
    id: "github",
    label: "GitHub Contributions",
    value: 1538,
    unit: "Past 12 months",
    icon: GitCommitHorizontal,
    live: false,
  },
  { id: "streak", label: "Current Streak", value: 87, unit: "Days", icon: Flame, live: false },
  { id: "projects", label: "Projects Built", value: 12, unit: "Live systems", icon: Boxes, live: false },
  { id: "coffee", label: "Coffee Consumed", value: 1248, unit: "Cups", icon: Coffee, live: false },
];
