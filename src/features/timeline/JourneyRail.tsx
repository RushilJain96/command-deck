"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { ENTRY_KIND_LABEL } from "./data";
import { InstitutionMark } from "./InstitutionMark";
import type { JourneyEntry } from "./types";

/**
 * THE RAIL IS ONE CONTINUOUS LINE, DRAWN BY THE ROWS RATHER THAN BEHIND THEM.
 *
 * The obvious construction is an absolutely-positioned line down the column with
 * dots laid on top. It breaks the moment the list is filtered: the line is sized
 * to the full set, so hiding two entries leaves it running past the last card into
 * empty space. Here each row draws its own segment and the last row draws none, so
 * the line is always exactly as long as what is on screen.
 */
export function JourneyRail({ entries }: { entries: readonly JourneyEntry[] }) {
  if (entries.length === 0) return <EmptyRail />;

  return (
    <ol aria-label="Engineering journey" className="flex flex-col">
      {entries.map((entry, index) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          index={index}
          isLast={index === entries.length - 1}
        />
      ))}
    </ol>
  );
}

function EntryRow({
  entry,
  index,
  isLast,
}: {
  entry: JourneyEntry;
  index: number;
  isLast: boolean;
}) {
  const Icon = entry.icon;
  const ongoing = entry.status === "ongoing";

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut", delay: 0.08 + index * 0.07 }}
      style={{ "--entry-accent": entry.accent } as CSSProperties}
      // THE WHEN COLUMN NARROWS BEFORE THE CARD DOES. At a 473-unit frame the card
      // column was down to 216 while the title block inside it was a fixed 224, so
      // the content spilled and the stack's `overflow-x-hidden` quietly clipped it.
      // The dates wrap to two lines in 92 units, which costs nothing; the card
      // cannot give up width it does not have.
      className="group grid grid-cols-[92px_18px_1fr] gap-x-3 @3xl:grid-cols-[152px_18px_1fr] @3xl:gap-x-4"
    >
      {/* THE WHEN COLUMN, right-aligned against the rail so five ranges of
          different widths still form a straight edge beside the dots. The range
          lives here rather than in the card — see the note on `JourneyEntry.range`
          — and the phase under it is the one line on this page that interprets
          rather than records. */}
      <div className="pt-3.5 text-right">
        <p
          className={cn(
            "font-mono text-[12.5px] leading-[1.35] font-medium tabular-nums",
            ongoing ? "text-signal" : "text-t2",
          )}
        >
          {entry.range}
        </p>
        <p className="text-t3 mt-2 text-[11px] leading-[1.35]">{entry.phase}</p>
      </div>

      {/* The dot and this row's segment of the line. The segment is `flex-1` under a
          fixed-height cap, so a taller card lengthens the line rather than leaving
          it short — the two cannot drift apart. */}
      <div aria-hidden="true" className="flex flex-col items-center pt-[18px]">
        <span
          className={cn(
            "relative block h-[9px] w-[9px] shrink-0 rounded-full",
            ongoing ? "signal-blink" : "",
          )}
          style={{
            backgroundColor: entry.accent,
            boxShadow: `0 0 10px ${entry.accent}b3`,
          }}
        />
        {!isLast && <span className="bg-panel-rule mt-1.5 w-px flex-1" />}
      </div>

      <div className={cn("min-w-0", isLast ? "pb-0" : "pb-3.5")}>
        <article
          className={cn(
            "border-panel-rule relative flex flex-col items-start gap-3 rounded-[4px] border px-4 py-3.5",
            // Side by side only where there is room for all four parts. Below @2xl
            // the plate, the title, the points and the badge stack instead, which
            // is the one arrangement that needs no minimum width at all.
            "@2xl:flex-row @2xl:items-start @2xl:gap-4",
            "bg-[linear-gradient(180deg,#0a0e14,#06080d)]",
            "transition-colors duration-200 hover:border-[var(--entry-accent)]",
          )}
        >
          {/* A lit edge on the ongoing entry only. One card on this page is still
              running, and the reader should be able to find it without reading a
              badge — the same job the domain cards' head rule does. */}
          {ongoing && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-px"
              style={{
                backgroundColor: entry.accent,
                boxShadow: `0 0 10px ${entry.accent}99`,
              }}
            />
          )}

          {/* The institution's own mark where there is one, this deck's line art
              where there is not — see <InstitutionMark>. */}
          <InstitutionMark
            src={entry.logo}
            alt={entry.org ?? entry.title}
            icon={Icon}
            size={50}
            accent={entry.accent}
          />

          <div className="w-full pt-1 @2xl:w-[224px] @2xl:shrink-0">
            <h3 className="text-t1 font-mono text-[14px] leading-none font-medium">
              {entry.title}
            </h3>
            {/* `org` is null for the entry that happened nowhere in particular, and
                the row simply closes up rather than printing an empty line. */}
            {entry.org !== null && (
              <p className="text-t2 mt-2.5 text-[11.5px] leading-none">{entry.org}</p>
            )}
          </div>

          <ul className="w-full min-w-0 space-y-2 @2xl:flex-1 @2xl:pt-1">
            {entry.points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <span
                  aria-hidden="true"
                  className="mt-[6px] block h-[3px] w-[3px] shrink-0 rounded-full"
                  style={{ backgroundColor: entry.accent }}
                />
                <span className="text-t2 min-w-0 text-[12px] leading-[1.5]">{point}</span>
              </li>
            ))}
          </ul>

          {/* ONE BADGE, AND IT NAMES THE KIND RATHER THAN THE STATUS.
              There used to be two: a kind chip beside the title and an
              ONGOING/COMPLETE pill on the right. The pill read COMPLETE on four of
              five cards, which a past date already says, and ONGOING on the fifth,
              which the lit left edge and the pulsing rail dot each say already. The
              kind is the only one of the two a reader cannot infer from the row. */}
          <span
            className="tracking-micro shrink-0 self-start rounded-[3px] border px-2 py-1 font-mono text-[9px] leading-none uppercase @2xl:ml-auto"
            style={{
              color: entry.accent,
              borderColor: `${entry.accent}59`,
              backgroundColor: `${entry.accent}14`,
            }}
          >
            {ENTRY_KIND_LABEL[entry.kind]}
          </span>
        </article>
      </div>
    </motion.li>
  );
}

function EmptyRail() {
  return (
    <div
      role="status"
      className="border-panel-rule flex flex-col items-center justify-center gap-2 rounded-[4px] border border-dashed py-12"
    >
      <p className="text-t2 text-[13px] leading-none">Nothing on the rail under that filter.</p>
      <p className="text-t3 tracking-micro font-mono text-[10px] uppercase">Select ALL to see everything</p>
    </div>
  );
}
