"use client";

import { motion } from "framer-motion";
import { ChevronsRight, Crosshair, GraduationCap } from "lucide-react";
import type { CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { cn } from "@/lib/cn";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "@/features/systems/panelStyle";
import { currentAcademicYear, currentYearOfStudy, DEGREE, ENTRIES, UP_NEXT } from "./data";
import { InstitutionMark } from "./InstitutionMark";
import type { Milestone } from "./types";

/**
 * WHERE THE OPERATOR IS RIGHT NOW, and every figure in it is computed.
 *
 * The reference wrote "IN PROGRESS" beside a date range and left it there. This
 * panel says which year of four it is and which academic year that is, both derived
 * from the clock in `currentYearOfStudy` — because a page whose entire subject is
 * time cannot hardcode where in time it is. "Third year" typed as a string is
 * correct until next September and silently wrong after it, on the one screen a
 * reader would trust for exactly that fact.
 *
 * The four bullets the reference had here are gone. Three of them ("building
 * personal projects", "looking for internship opportunities", "continuously
 * learning and growing") already exist on the Projects, Contact and About consoles
 * respectively, and the fourth restated the degree above it.
 */
export function CurrentlyPanel() {
  const year = currentYearOfStudy();
  const academicYear = currentAcademicYear();

  return (
    <HudPanel
      label="Currently"
      icon={Crosshair}
      iconClassName="text-signal"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      className="flex flex-col"
      bodyClassName="px-4 py-4"
    >
      <div className="group flex items-start gap-3.5">
        {/* Reads the degree's own entry rather than naming the logo path again —
            the rail and this panel are describing the same thing, and two paths to
            one file is one too many. */}
        <span className="mt-0.5">
          <InstitutionMark
            src={ENTRIES.find((entry) => entry.id === "btech")?.logo ?? null}
            alt={DEGREE.org}
            icon={GraduationCap}
            size={24}
            accent="#ff3d3d"
          />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-t1 font-mono text-[13px] leading-[1.35] font-medium">
            {DEGREE.title}
          </h3>
          <p className="text-t2 mt-2 text-[11.5px] leading-none">{DEGREE.org}</p>
          <p className="text-t3 mt-2 font-mono text-[11px] leading-none tabular-nums">
            {DEGREE.from} — {DEGREE.to}
          </p>
        </div>

        <span className="border-nominal/50 bg-nominal/10 text-nominal tracking-micro shrink-0 rounded-[3px] border px-2.5 py-1.5 font-mono text-[9px] leading-none uppercase">
          Year {year} / {DEGREE.totalYears}
        </span>
      </div>

      <div className="bg-panel-rule mt-3.5 mb-3.5 h-px" />

      {/* FOUR SEGMENTS, ONE PER YEAR OF THE PROGRAMME — a position, not a score.
          It is deliberately blocky rather than a continuous bar: the degree is
          counted in years, so a smooth fill would imply a precision about progress
          that nobody has. The current year is lit and pulsing, the finished ones are
          solid, the remaining ones are outlines. A reader gets "third of four"
          without reading the badge. */}
      <div aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: DEGREE.totalYears }, (_, index) => {
          const yearNumber = index + 1;
          const done = yearNumber < year;
          const current = yearNumber === year;
          return (
            <span
              key={yearNumber}
              className={cn(
                "h-[5px] flex-1 rounded-full",
                current && "signal-blink",
                done
                  ? "bg-nominal/70"
                  : current
                    ? "bg-signal"
                    : "border-panel-rule border bg-transparent",
              )}
            />
          );
        })}
      </div>

      <p className="text-t2 mt-3 font-mono text-[11.5px] leading-none">
        Academic year <span className="text-t1 tabular-nums">{academicYear}</span>
      </p>
    </HudPanel>
  );
}

/**
 * WHAT IS ALREADY SCHEDULED, which is a different claim from what is wanted.
 *
 * See the note on `UP_NEXT`: the reference filled this with the Contact console's
 * opportunities list. These three are dated and determined — they happen whether or
 * not anyone reads this page — which is the only kind of "next" a timeline can
 * honestly assert.
 */
export function UpNextPanel() {
  return (
    <HudPanel
      label="Up Next"
      icon={ChevronsRight}
      iconClassName="text-signal"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      action={
        <span className="text-t3 font-mono text-[10.5px] leading-none tabular-nums">
          {UP_NEXT[0]?.when.split(" — ")[0]} — {DEGREE.to}
        </span>
      }
      className="flex flex-col"
      bodyClassName="px-4 py-3.5"
    >
      {/* A RAIL, LIKE THE ONE ON THE LEFT OF THE PAGE — because this list is the
          same kind of thing. Boxed rows made it read as a menu of options; dots on
          a line say these are points in sequence, which is what they are. The page
          then has one visual language for "things in order", used twice. */}
      <ol className="flex flex-col">
        {UP_NEXT.map((milestone, index) => (
          <MilestoneRow
            key={milestone.id}
            milestone={milestone}
            index={index}
            isLast={index === UP_NEXT.length - 1}
          />
        ))}
      </ol>
    </HudPanel>
  );
}

function MilestoneRow({
  milestone,
  index,
  isLast,
}: {
  milestone: Milestone;
  index: number;
  isLast: boolean;
}) {
  // ONLY THE FIRST ONE IS LIT. These are ordered and none of them has happened, so
  // colouring all three the same makes them read as a set of equal options rather
  // than a queue. The next one up carries its accent; the rest are waiting.
  const isNext = index === 0;

  return (
    <motion.li
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut", delay: 0.32 + index * 0.06 }}
      style={{ "--milestone-accent": milestone.accent } as CSSProperties}
      className="group grid grid-cols-[12px_1fr] gap-x-3"
    >
      <div aria-hidden="true" className="flex flex-col items-center pt-[5px]">
        <span
          className={cn("block h-[7px] w-[7px] shrink-0 rounded-full", isNext && "signal-blink")}
          style={
            isNext
              ? {
                  backgroundColor: milestone.accent,
                  boxShadow: `0 0 8px ${milestone.accent}b3`,
                }
              : { backgroundColor: "rgb(190 205 220 / 0.28)" }
          }
        />
        {!isLast && <span className="bg-panel-rule mt-1 w-px flex-1" />}
      </div>

      <div className={cn("min-w-0", isLast ? "pb-0" : "pb-3.5")}>
        <div className="flex items-baseline gap-3">
          <p className="text-t1 min-w-0 truncate font-mono text-[12px] leading-none font-medium">
            {milestone.label}
          </p>
          <span className="text-t3 ml-auto shrink-0 font-mono text-[10.5px] leading-none tabular-nums">
            {milestone.when}
          </span>
        </div>
        <p className="text-t2 mt-2 text-[11px] leading-[1.45]">{milestone.detail}</p>
      </div>
    </motion.li>
  );
}
