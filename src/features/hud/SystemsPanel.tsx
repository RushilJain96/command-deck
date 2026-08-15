"use client";

import { useReducedMotion } from "framer-motion";
import { useActiveTargetId, useLockedTargetId } from "@/features/app/hooks";
import { FIELD_RINGS } from "@/features/environment/orbit.data";
import { MISSIONS } from "@/features/missions/data";
import { cn } from "@/lib/cn";
import { HudPanel } from "./HudPanel";

/**
 * Subsystem status board.
 *
 * The right rail carried a single small panel while the left carried four, so
 * the composition pulled hard to one side. This is the counterweight — but a
 * counterweight made of invented numbers would be worse than the imbalance,
 * so every row here reports something the application actually knows:
 *
 *   TARGETING  whether a mission is pointed at, and whether it is committed
 *   NAV        how many slots the roster holds and how many are reachable
 *   MOTION     the resolved reduced-motion preference, which genuinely
 *              changes how the deck behaves
 *   PLANE      how many distinct orbits the surface is drawing
 *
 * If a row here ever needs a number this component cannot derive, that is the
 * signal to wire the source rather than to type the figure in.
 */
export function SystemsPanel() {
  const activeTargetId = useActiveTargetId();
  const lockedTargetId = useLockedTargetId();
  const prefersReduced = useReducedMotion();

  const reachable = MISSIONS.filter((mission) => mission.status !== "PLANNED").length;
  // Counts the rings the FIELD actually draws, not the ones missions ride.
  // Missions no longer ride any — their cards are a composed arrangement
  // floating above the plane rather than points projected onto it — so deriving
  // this from the roster would have reported a property that stopped existing.
  const orbits = FIELD_RINGS.length;

  const rows: SubsystemRow[] = [
    {
      id: "targeting",
      label: "Targeting",
      value: lockedTargetId !== null ? "LOCK" : activeTargetId !== null ? "TRACK" : "IDLE",
      tone: lockedTargetId !== null ? "signal" : activeTargetId !== null ? "caution" : "muted",
      fill: lockedTargetId !== null ? 1 : activeTargetId !== null ? 0.6 : 0.12,
    },
    {
      id: "nav",
      label: "Nav Slots",
      value: `${reachable} / ${MISSIONS.length}`,
      tone: "nominal",
      fill: reachable / MISSIONS.length,
    },
    {
      id: "motion",
      label: "Motion",
      // `useReducedMotion` is null on the server. Rendering the null branch as
      // its own state keeps server and client markup identical on first paint
      // instead of flipping text during hydration.
      value: prefersReduced === null ? "—" : prefersReduced ? "REDUCED" : "FULL",
      tone: prefersReduced ? "caution" : "nominal",
      fill: prefersReduced ? 0.35 : 1,
    },
    {
      id: "plane",
      label: "Orbits",
      value: String(orbits),
      tone: "telemetry",
      fill: 1,
    },
  ];

  return (
    <HudPanel label="Systems" className="deck-sm:w-full w-52">
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <Subsystem key={row.id} {...row} />
        ))}
      </ul>
    </HudPanel>
  );
}

interface SubsystemRow {
  id: string;
  label: string;
  value: string;
  tone: "signal" | "nominal" | "caution" | "telemetry" | "muted";
  /** 0-1, drives the bar. */
  fill: number;
}

const TONE_TEXT: Record<SubsystemRow["tone"], string> = {
  signal: "text-signal",
  nominal: "text-nominal",
  caution: "text-caution",
  telemetry: "text-telemetry",
  muted: "text-t3",
};

const TONE_BAR: Record<SubsystemRow["tone"], string> = {
  signal: "bg-signal",
  nominal: "bg-nominal",
  caution: "bg-caution",
  telemetry: "bg-telemetry",
  muted: "bg-t4",
};

/**
 * One subsystem: name, state, and a bar.
 *
 * The bar is what makes this a status board rather than a definition list —
 * four rows of text all read at the same weight, whereas four bars at different
 * lengths can be scanned in one glance without reading a word.
 */
function Subsystem({ label, value, tone, fill }: SubsystemRow) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-t3 tracking-micro font-mono text-[9px] uppercase">{label}</span>
        <span className={cn("font-mono text-[10px] leading-none tabular-nums", TONE_TEXT[tone])}>
          {value}
        </span>
      </div>
      <div className="mt-1.5 h-[3px] w-full bg-black/50">
        <div
          className={cn("h-full transition-[width] duration-500 ease-out", TONE_BAR[tone])}
          style={{ width: `${Math.round(fill * 100)}%`, opacity: 0.85 }}
        />
      </div>
    </li>
  );
}
