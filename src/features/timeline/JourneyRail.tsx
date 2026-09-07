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
      className="group grid grid-cols-[64px_18px_1fr] gap-x-4"
    >
      {/* THE YEAR COLUMN IS RIGHT-ALIGNED against the rail, so four numbers of
          different widths still form a straight edge beside the dots. */}
      <div className="pt-3.5 text-right">
        <p
          className={cn(
            "font-mono text-[15px] leading-none font-medium tabular-nums",
            ongoing ? "text-signal" : "text-t2",
          )}
        >
          {entry.year}
        </p>
        <p className="text-t3 tracking-micro mt-1.5 font-mono text-[9.5px] leading-none uppercase">
          {entry.span}
        </p>
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
            "border-panel-rule relative flex items-start gap-4 rounded-[4px] border px-4 py-3.5",
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
          <span className="mt-0.5">
            <InstitutionMark
              src={entry.logo}
              alt={entry.org ?? entry.title}
              icon={Icon}
              size={22}
              accent={entry.accent}
            />
          </span>

          <div className="w-[212px] shrink-0">
            <span
              className="tracking-micro inline-block rounded-[3px] border px-2 py-1 font-mono text-[9px] leading-none uppercase"
              style={{
                color: entry.accent,
                borderColor: `${entry.accent}59`,
                backgroundColor: `${entry.accent}14`,
              }}
            >
              {ENTRY_KIND_LABEL[entry.kind]}
            </span>
            <h3 className="text-t1 mt-2.5 font-mono text-[13.5px] leading-none font-medium">
              {entry.title}
            </h3>
            {/* `org` is null for the entry that happened nowhere in particular, and
                the row simply closes up rather than printing an empty line. */}
            {entry.org !== null && (
              <p className="text-t2 mt-2 text-[11.5px] leading-none">{entry.org}</p>
            )}
            <p className="text-t3 mt-2 font-mono text-[11px] leading-none tabular-nums">
              {entry.period}
            </p>
          </div>

          <ul className="min-w-0 flex-1 space-y-2 pt-0.5">
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

          <StatusPill ongoing={ongoing} />
        </article>
      </div>
    </motion.li>
  );
}

/**
 * ONGOING is green, COMPLETE is the deck's telemetry blue.
 *
 * Deliberately not amber: amber on this deck means "in development", which is a
 * judgement about a thing's readiness. A degree in progress is not half-finished
 * work, it is a span of time that has not ended yet, and colouring it like an
 * unshipped feature would say the wrong thing about it.
 */
function StatusPill({ ongoing }: { ongoing: boolean }) {
  return (
    <span
      className={cn(
        "tracking-micro ml-auto shrink-0 self-start rounded-[3px] border px-2.5 py-1.5 font-mono text-[9px] leading-none uppercase",
        ongoing
          ? "border-nominal/50 bg-nominal/10 text-nominal"
          : "border-telemetry/40 bg-telemetry/10 text-telemetry",
      )}
    >
      {ongoing ? "Ongoing" : "Complete"}
    </span>
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
