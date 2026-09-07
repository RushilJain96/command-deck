"use client";

import { FlaskConical, GraduationCap, Layers, Lightbulb, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import { ENTRIES } from "./data";
import type { EntryKind } from "./types";

/**
 * FOUR CHIPS, AND THE THREE KIND CHIPS ARE DERIVED FROM THE RAIL.
 *
 * The reference carried two rows here: a tab strip (TIMELINE / SKILLS GROWTH /
 * LOCATIONS / ACHIEVEMENTS) and a filter row. The tabs are gone — skills are the
 * Systems console's subject, locations were two cities, and achievements is a
 * section this portfolio has already decided not to invent. What remains is the one
 * control that acts on what is actually here.
 *
 * A kind with no entries renders no chip. With four entries a filter is already
 * close to furniture; a chip that filters to nothing would be furniture that lies.
 */
const KIND_ICON: Record<EntryKind, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  academics: GraduationCap,
  research: FlaskConical,
  experience: ShieldCheck,
  milestone: Lightbulb,
};

const KIND_LABEL: Record<EntryKind, string> = {
  academics: "Academics",
  research: "Research",
  experience: "Experience",
  milestone: "Milestones",
};

const PRESENT_KINDS = (["academics", "research", "experience", "milestone"] as const).filter((kind) =>
  ENTRIES.some((entry) => entry.kind === kind),
);

export function FilterRow({
  kind,
  onKind,
  shown,
  total,
}: {
  kind: EntryKind | null;
  onKind: (kind: EntryKind | null) => void;
  shown: number;
  total: number;
}) {
  return (
    <div className="flex h-full items-center gap-2.5">
      <div role="group" aria-label="Filter the journey" className="flex items-stretch gap-2">
        <Chip
          label="All"
          icon={Layers}
          active={kind === null}
          onClick={() => onKind(null)}
        />
        {PRESENT_KINDS.map((entryKind) => (
          <Chip
            key={entryKind}
            label={KIND_LABEL[entryKind]}
            icon={KIND_ICON[entryKind]}
            active={kind === entryKind}
            onClick={() => onKind(kind === entryKind ? null : entryKind)}
          />
        ))}
      </div>

      {/* Announced, not drawn. The rail itself shows how many entries there are —
          printing "2 of 4" beside it would be a readout of something already on
          screen — but a screen reader user filtering gets no such feedback unless
          it is said out loud. */}
      <p aria-live="polite" className="sr-only">
        Showing {shown} of {total} entries
      </p>
    </div>
  );
}

function Chip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "tracking-micro flex shrink-0 items-center gap-2 rounded-[3px] border px-3.5 py-2 font-mono text-[10px] whitespace-nowrap uppercase",
        "focus-visible:ring-signal/70 outline-none transition-colors duration-200 focus-visible:ring-2",
        active
          ? // The lit chip takes the deck identity red rather than the kind colour.
            // Kinds are a way of LOOKING at the rail, not subjects on it — giving
            // each chip its entry hue would put three more accents on a bar whose
            // job is to be quiet.
            "text-signal border-[rgb(255_42_42/0.55)] bg-[rgb(255_42_42/0.08)]"
          : "border-panel-edge bg-panel text-t3 hover:text-t1 hover:border-[rgb(190_205_220/0.3)]",
      )}
    >
      <Icon size={13} strokeWidth={1.7} className="shrink-0" />
      {label}
    </button>
  );
}
