"use client";

import { ChevronDown, ListFilter, Search } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  ALL_CATEGORY_ICON,
  PROJECT_CATEGORIES,
  SORT_LABEL,
  SORT_ORDERS,
  type SortOrder,
} from "./data";
import { STATUS_LABEL, type ProjectStatus } from "./types";

/**
 * THE CONTROLS DO SOMETHING. All of them.
 *
 * A filter row is the easiest thing in a portfolio to fake — the reference is a
 * still image, so its chips and its search box cost nothing there — and a faked
 * one is worse than no row at all: it is the first thing a visitor touches, and it
 * teaches them in one click that the rest of the screen is a picture. Everything
 * here is wired to real state in <ProjectsConsole>.
 *
 * THE STATUS CONTROL CYCLES RATHER THAN OPENING A MENU, and it says what it is
 * currently set to. The reference draws a button labelled FILTER, which in a real
 * product opens a panel of facets; this roster has eight entries and one facet
 * worth filtering on, so a panel would be a popover containing three radio buttons.
 * Cycling through the three states in place is the same control at a quarter of the
 * machinery, and — because the label shows the CURRENT state rather than the word
 * "FILTER" forever — it is more honest than the reference about what it is doing.
 */

/** `null` is the unfiltered position — see the note on PROJECT_CATEGORIES. */
export type StatusFilter = ProjectStatus | null;

const STATUS_CYCLE: readonly StatusFilter[] = [null, "PRODUCTION", "BETA", "IN_PROGRESS"];

export function nextStatus(current: StatusFilter): StatusFilter {
  const index = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length];
}

export function FilterBar({
  category,
  onCategory,
  query,
  onQuery,
  status,
  onStatus,
  sort,
  onSort,
  resultCount,
}: {
  category: string | null;
  onCategory: (id: string | null) => void;
  query: string;
  onQuery: (value: string) => void;
  status: StatusFilter;
  onStatus: () => void;
  sort: SortOrder;
  onSort: (value: SortOrder) => void;
  resultCount: number;
}) {
  const AllIcon = ALL_CATEGORY_ICON;

  return (
    <div className="flex h-full items-stretch gap-2.5">
      {/* THE CHIPS SCROLL RATHER THAN WRAP. This row shares a 40-unit band with the
          search box and two controls, so a seventh chip that wraps would push the
          band to two lines and cost the grid a card's worth of height. Overflow is
          the cheaper failure: the row is complete at the console's design width and
          degrades to a scroller below it. */}
      <div
        role="group"
        aria-label="Filter by category"
        className="deck-scroll flex min-w-0 flex-1 items-stretch gap-2 overflow-x-auto"
      >
        <CategoryChip
          label="All Projects"
          icon={AllIcon}
          active={category === null}
          accent="var(--signal)"
          onClick={() => onCategory(null)}
        />
        {PROJECT_CATEGORIES.map((entry) => (
          <CategoryChip
            key={entry.id}
            label={entry.label}
            icon={entry.icon}
            active={category === entry.id}
            accent="var(--signal)"
            onClick={() => onCategory(category === entry.id ? null : entry.id)}
          />
        ))}
      </div>

      {/* Search. `type="search"` rather than `text`: it gives the field a native
          clear affordance and the correct virtual keyboard, and costs nothing. */}
      <label className="border-panel-edge bg-panel focus-within:border-signal/50 relative flex w-[212px] shrink-0 items-center gap-2.5 rounded-[3px] border px-3 transition-colors duration-200">
        <Search size={13} strokeWidth={1.8} aria-hidden="true" className="text-t3 shrink-0" />
        <span className="sr-only">Search projects</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search projects..."
          className="text-t1 placeholder:text-t3 min-w-0 flex-1 bg-transparent text-[12px] leading-none outline-none"
        />
      </label>

      <ControlButton
        onClick={onStatus}
        active={status !== null}
        icon={ListFilter}
        label={status === null ? "Filter" : STATUS_LABEL[status]}
        title={
          status === null
            ? "Filter by delivery state"
            : `Showing ${STATUS_LABEL[status]} — click to change`
        }
      />

      {/* SORT IS A NATIVE `<select>` UNDER A STYLED SHELL.
          A custom listbox here would be four hundred lines of roving focus, escape
          handling and outside-click for three options. The native control brings
          keyboard support, screen reader semantics and mobile pickers for free; the
          only thing it costs is that the open list is drawn by the OS rather than
          by the deck, which is a fair price on a control that is open for half a
          second at a time. */}
      <div className="border-panel-edge bg-panel relative flex w-[128px] shrink-0 items-center rounded-[3px] border">
        <label className="sr-only" htmlFor="project-sort">
          Sort projects
        </label>
        <select
          id="project-sort"
          value={sort}
          onChange={(event) => onSort(event.target.value as SortOrder)}
          className="text-t2 tracking-micro focus-visible:ring-signal/70 h-full w-full cursor-pointer appearance-none bg-transparent px-3.5 font-mono text-[10px] uppercase outline-none focus-visible:ring-2"
        >
          {SORT_ORDERS.map((order) => (
            <option key={order} value={order} className="bg-[#0b0f16] text-[#f2f5f8]">
              {SORT_LABEL[order]}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={1.8}
          aria-hidden="true"
          className="text-t3 pointer-events-none absolute right-3"
        />
      </div>

      {/* The result count is announced but not drawn. The grid itself shows how many
          cards there are — printing "6 of 8" beside it would be a readout of
          something already on screen — but a screen reader user filtering by
          category gets no such feedback unless it is said out loud. */}
      <p aria-live="polite" className="sr-only">
        {resultCount} {resultCount === 1 ? "project" : "projects"} shown
      </p>
    </div>
  );
}

function CategoryChip({
  label,
  icon: Icon,
  active,
  accent,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{ "--chip-accent": accent } as CSSProperties}
      className={cn(
        "tracking-micro flex shrink-0 items-center gap-2 rounded-[3px] border px-3 font-mono text-[10px] whitespace-nowrap uppercase",
        "focus-visible:ring-signal/70 outline-none transition-colors duration-200 focus-visible:ring-2",
        active
          ? // The lit chip takes the deck's identity red rather than a per-category
            // hue. Categories are a way of LOOKING at the roster, not subjects in
            // it — giving each one a colour would put seven more hues on a screen
            // whose eight cards already carry seven.
            "border-[rgb(255_42_42/0.55)] bg-[rgb(255_42_42/0.08)] text-[var(--chip-accent)]"
          : "border-panel-edge bg-panel text-t3 hover:text-t1 hover:border-[rgb(190_205_220/0.3)]",
      )}
    >
      <Icon size={13} strokeWidth={1.7} className="shrink-0" />
      {label}
    </button>
  );
}

function ControlButton({
  onClick,
  active,
  icon: Icon,
  label,
  title,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "tracking-micro flex shrink-0 items-center gap-2 rounded-[3px] border px-3.5 font-mono text-[10px] whitespace-nowrap uppercase",
        "focus-visible:ring-signal/70 outline-none transition-colors duration-200 focus-visible:ring-2",
        active
          ? "border-[rgb(255_42_42/0.55)] bg-[rgb(255_42_42/0.08)] text-signal"
          : "border-panel-edge bg-panel text-t2 hover:text-t1 hover:border-[rgb(190_205_220/0.3)]",
      )}
    >
      <Icon size={13} strokeWidth={1.7} className="shrink-0" />
      {label}
    </button>
  );
}
