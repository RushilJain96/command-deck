"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ConsoleRail } from "@/features/chrome/ConsoleRail";
import { ConsoleSky } from "@/features/systems/ConsoleSky";
import { PROJECTS, type SortOrder } from "./data";
import { DevelopmentFocus } from "./DevelopmentFocus";
import { FilterBar, nextStatus, type StatusFilter } from "./FilterBar";
import { ProjectGrid } from "./ProjectGrid";
import { ProjectsHeader } from "./ProjectsHeader";
import { TechnologyBand } from "./TechnologyBand";
import type { Project } from "./types";

/**
 * THE CONSOLE RE-POINTS THE DECK'S SURFACE TOKENS FOR ITS OWN SUBTREE.
 *
 * Identical to the systems console's block, and that is the point rather than an
 * oversight: `--panel-fill`, `--panel-border`, `--panel-rule` and the text ramp are
 * plain custom properties that `@theme inline` maps to `bg-panel`, `text-t2` and so
 * on, so redeclaring them here re-points every one of those utilities INSIDE this
 * scene and changes nothing outside it. The two consoles are two channels of one
 * machine and have to be lit the same way; the deck's own rail is untouched by
 * either.
 *
 * `--preview-h` rides along in the same block. It is the height of the schematic
 * well inside every card, and it lives here rather than on the card because it is
 * the one card dimension that has to be solved against the CONSOLE's vertical
 * budget — see the table below. A card cannot know how much room the grid has.
 */
const CONSOLE_SURFACE = {
  "--panel-fill": "rgb(6 8 12 / 0.86)",
  "--panel-border": "rgb(190 205 220 / 0.19)",
  "--panel-rule": "rgb(190 205 220 / 0.13)",
  "--text-secondary": "#a9b4c0",
  "--text-tertiary": "#74808c",
  "--preview-h": "104px",
} as CSSProperties;

/**
 * SORTING IS A COMPARATOR TABLE, NOT A CHAIN OF IFS.
 *
 * Each order is TOTAL — every tie is broken by something — because a partial one
 * leaves `Array.prototype.sort` to fill the gap, and what it fills it with is not
 * specified across engines for equal elements. A grid that reshuffles between two
 * browsers is a bug nobody can reproduce.
 *
 * `latest` breaks its ties on ROSTER POSITION rather than on name, and that is the
 * meaningful choice here. Four projects share 2024; sorted alphabetically they come
 * out Aurora, CodecCllas, Echonaut, Orion, which is an ordering the reader did not
 * ask for and cannot see the logic of. `data.ts` is authored best-first, so falling
 * back to it means "newest, and within a year, in the order the roster puts them" —
 * the curation survives the sort instead of being overwritten by the alphabet.
 *
 * `ROSTER_INDEX` is a map rather than an `indexOf` inside the comparator: `indexOf`
 * is a linear scan run O(n log n) times, which is quadratic for no reason.
 */
const ROSTER_INDEX = new Map(PROJECTS.map((project, index) => [project.id, index]));
const byRoster = (a: Project, b: Project) =>
  (ROSTER_INDEX.get(a.id) ?? 0) - (ROSTER_INDEX.get(b.id) ?? 0);

const COMPARATORS: Record<SortOrder, (a: Project, b: Project) => number> = {
  latest: (a, b) => b.year - a.year || byRoster(a, b),
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year || byRoster(a, b),
  name: (a, b) => a.name.localeCompare(b.name),
};

/**
 * SEARCH READS THE STACK AND THE SUBTITLE, NOT JUST THE NAME.
 *
 * Someone typing "kafka" into a project search is asking which of these systems
 * uses Kafka — a name-only match answers that with nothing, which reads as a broken
 * box rather than as an empty result. Matching name, kind, summary and stack means
 * every visible string on a card is searchable, which is the behaviour a reader
 * assumes without being told.
 */
function matches(project: Project, needle: string): boolean {
  if (needle === "") return true;
  const haystack = [project.name, project.kind, project.summary, ...project.stack]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function ProjectsConsole() {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(null);
  const [sort, setSort] = useState<SortOrder>("latest");

  // `useMemo` HERE DESPITE THE REACT COMPILER, and it is not a micro-optimisation.
  // The compiler memoizes on the props and state a component reads, which is
  // exactly what this depends on — so it would very likely hoist this anyway. What
  // it cannot do is guarantee a STABLE ARRAY IDENTITY across a re-render caused by
  // something else, and `sort()` on a fresh array is what keeps this pure: the
  // spread is load-bearing, since sorting `PROJECTS` in place would mutate a
  // module-level readonly export and permanently reorder the roster.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PROJECTS.filter(
      (project) =>
        (category === null || project.categories.includes(category)) &&
        (status === null || project.status === status) &&
        matches(project, needle),
    ).sort(COMPARATORS[sort]);
  }, [category, query, status, sort]);

  return (
    <div className="@container absolute inset-0" style={CONSOLE_SURFACE}>
      <ConsoleSky />

      {/* SCRIM UNDER THE TOP BAR. The bar is a sibling of the whole scene host, so
          it floats above this scene with the void showing between its cells. On the
          deck nothing moves underneath it and that is fine; here the header sits
          twenty units below it and a bloom from the icon plate would show through
          the gaps. Shorter than the systems console's, because this console does
          not scroll — there is nothing that can slide up behind the bar, so the
          scrim only has to cover the gap rather than mask a moving edge — and it
          stays on at every tier, because below 1152 units of frame the console
          DOES scroll (see `.proj-grid` in globals.css) and a card sliding up
          through the bar's seams is exactly what it is there to stop. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[86px] bg-[linear-gradient(to_bottom,#000_0%,#000_62%,transparent_100%)]"
      />

      {/* Ends at the foot of the grid, which is where the full-width bottom row
          starts — the same rule the systems rail follows against its capability
          matrix. See `.proj-rail` in globals.css for the arithmetic. */}
      <ConsoleRail activeId="files" className="proj-rail" />

      {/*
        THE WHOLE VERTICAL BUDGET, AND IT IS FIXED RATHER THAN SCROLLED.

        This is the one structural difference from the systems console, and it comes
        straight off the reference: that image is 1536x1024, which is the deck's own
        design frame, so the composition was drawn to FIT. The systems console
        scrolls because its middle tier genuinely runs about seventy units long; this
        one has no such tier, and a console that scrolls when it does not need to is
        a console that has given up on being one screen.

        1024 units, top to bottom:

          top bar          14 .. 76     sibling of this scene, not in this column
          pad                     96    clears the bar plus a 20-unit gap
          header                  76
          gap                     12
          filter bar              40
          gap                     12
          grid                   578    two rows of 280 with an 18 gap
          gap                     12
          bottom row             132
          footer                  66    also a sibling; this column stops above it

        Everything but the grid is authored in `globals.css` so the four numbers that
        have to add up live in one place. The grid takes `flex-1` and absorbs the
        remainder, which means a change to any other row re-solves the card height
        automatically instead of silently clipping a footer.

        THIS HOLDS ONLY AT THE WIDE TIER. Below 1152 units of frame the column
        scrolls and the grid's rows take a floor instead — see the `@container`
        block beside `.proj-rail` in globals.css for why, and for what breaks if
        only part of that switch is made. `overflow-y-auto` is on this element at
        every tier and costs nothing at 1536, where the numbers below sum to
        exactly the frame and no scrollbar can appear.

        THE RAIL'S INSET IS 46, MATCHING THE SYSTEMS CONSOLE RATHER THAN THE
        REFERENCE. The image puts its first card at x=93 against a 54-wide rail; ours
        is 44 wide because that is what the systems console already ships, and the
        two rails have to be one instrument. Inheriting the systems inset keeps the
        gutter between rail and content identical on both screens, which is worth
        more than nine units of margin on one of them.
      */}
      <div className="deck-scroll proj-stack relative flex h-full flex-col overflow-x-hidden overflow-y-auto px-7 pt-[96px] pb-[66px]">
        <div className="proj-header shrink-0 @6xl:pl-[46px]">
          <ProjectsHeader />
        </div>

        <div className="proj-filters shrink-0 @6xl:pl-[46px]">
          <FilterBar
            category={category}
            onCategory={setCategory}
            query={query}
            onQuery={setQuery}
            status={status}
            onStatus={() => setStatus(nextStatus)}
            sort={sort}
            onSort={setSort}
            resultCount={visible.length}
          />
        </div>

        {/* `min-h-0` IS LOAD-BEARING. A flex child defaults to `min-height: auto`,
            which means it refuses to shrink below its content — so eight cards
            slightly taller than their share would push the bottom row off the frame
            instead of the grid absorbing the difference. With it, the grid is bounded
            by the budget above and the cards divide what it gives them. */}
        <div className="proj-grid min-h-0 flex-1 @6xl:pl-[46px]">
          <ProjectGrid projects={visible} />
        </div>

        {/* FULL WIDTH, BREAKING THE RAIL'S INSET. The rail does not reach down here
            — it stops at the grid's foot — so reserving its column all the way to
            the frame would cost this row 46 units for nothing. It is the same
            arrangement the systems console's library row uses, and it is why the
            reference's bottom band looks wider than the cards above it. */}
        <div className="proj-focus grid shrink-0 grid-cols-1 gap-[18px] @3xl:grid-cols-[1.3fr_1fr]">
          <DevelopmentFocus />
          <TechnologyBand />
        </div>
      </div>
    </div>
  );
}
