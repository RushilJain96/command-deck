"use client";

import { useState, type CSSProperties } from "react";
import { ConsoleRail } from "@/features/chrome/ConsoleRail";
import { ConsoleSky } from "@/features/systems/ConsoleSky";
import { ClosingLine } from "./ClosingLine";
import { CurrentlyPanel, UpNextPanel } from "./CurrentlyPanel";
import { ENTRIES } from "./data";
import { FilterRow } from "./FilterRow";
import { JourneyRail } from "./JourneyRail";
import { TimelineHeader } from "./TimelineHeader";
import type { EntryKind } from "./types";

/** The fifth console, lit like the other four. See <SystemsConsole> for why. */
const CONSOLE_SURFACE = {
  "--panel-fill": "rgb(6 8 12 / 0.86)",
  "--panel-border": "rgb(190 205 220 / 0.19)",
  "--panel-rule": "rgb(190 205 220 / 0.13)",
  "--text-secondary": "#a9b4c0",
  "--text-tertiary": "#74808c",
} as CSSProperties;

export function TimelineConsole() {
  const [kind, setKind] = useState<EntryKind | null>(null);
  const visible = kind === null ? ENTRIES : ENTRIES.filter((entry) => entry.kind === kind);

  return (
    <div className="@container absolute inset-0" style={CONSOLE_SURFACE}>
      <ConsoleSky />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[86px] bg-[linear-gradient(to_bottom,#000_0%,#000_62%,transparent_100%)]"
      />
      {/* The foot needs one too, for the reason the contact console's does: this
          column scrolls on a narrow frame, and the footer has no fill of its own. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[66px] bg-[linear-gradient(to_top,#000_0%,#000_42%,transparent_100%)]"
      />

      {/* `transit` rather than a new mark. The rail is one shared instrument across
          five consoles and an arrow leaving a line is already the closest thing on
          it to "moving forward through time" — adding a ninth glyph would change the
          spacing on every other console to light one here. */}
      <ConsoleRail activeId="transit" className="time-rail" />

      {/*
        THE VERTICAL BUDGET. 1024 units, top to bottom:

          top bar          14 .. 76     sibling of this scene, not in this column
          pad                     96
          header                  76
          gap                     16
          filters                 40
          gap                     16
          main                   auto   rail | currently + up next
          gap                     16
          close                   72    the sign-off, no housing
          footer                  66    also a sibling; this column stops above it

        THERE IS NO BOTTOM ROW, AND TWO ATTEMPTS AT ONE ARE WHY.

        The reference had three panels down there: a stats block whose figures
        contradicted the Projects and Systems consoles, a skills bar chart
        duplicating Systems' exploration panel, and a closing quote. The first two
        went for saying things another screen says better; the quote moved to the
        header.

        A "journey spine" was then built to fill the gap — the same entries plotted
        on a decade axis, with two derived durations. It was cut too, and the reason
        is worth keeping: it restated the rail sideways. Elapsed time and a NOW
        marker are real information, but not enough of it to justify a band that
        repeats every card above it, and a page is not improved by being made longer.

        What actually filled this console was a fifth entry with real content in it.
        The rail is the page; the two side panels say where that leaves him today.
        <ClosingLine> closes it with a sentence rather than a readout — see the note
        there for why the third attempt at this strip is the one that survives.

        `items-start` on the row, for the reason the contact console learned the hard
        way: the right column is two short panels and the rail is tall, so stretching
        them to match would manufacture a void inside each rather than leaving the
        background where the content is not.
      */}
      <div className="deck-scroll time-stack relative flex h-full flex-col gap-4 overflow-x-hidden overflow-y-auto px-7 pt-[96px] pb-[66px]">
        <div className="time-header shrink-0 @6xl:pl-[46px]">
          <TimelineHeader />
        </div>

        <div className="time-filters shrink-0 @6xl:pl-[46px]">
          <FilterRow
            kind={kind}
            onKind={setKind}
            shown={visible.length}
            total={ENTRIES.length}
          />
        </div>

        {/* THE RAIL COMES FIRST IN THE MARKUP. Below @4xl the grid is one column and
            source order is what a reader meets first — the journey is the page, and
            the two side panels are commentary on it. */}
        <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[1fr_0.46fr] @6xl:pl-[46px]">
          <JourneyRail entries={visible} />

          <div className="flex flex-col gap-4">
            <CurrentlyPanel />
            <UpNextPanel />
          </div>
        </div>

        <div className="time-close shrink-0 @6xl:pl-[46px]">
          <ClosingLine />
        </div>
      </div>
    </div>
  );
}
