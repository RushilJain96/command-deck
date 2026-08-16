import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared housing for every HUD panel.
 *
 * THERE IS NO BOX. No background, no backdrop-filter, no border, no shadow — the
 * rails and the legend float directly over the void and only their content is
 * drawn.
 *
 * This has now been argued both ways and the deciding evidence is the rendered
 * frame rather than the reasoning. The case FOR a box was that a panel is an
 * EDGE, and an edge is what tells the eye where one instrument stops and the next
 * begins; without it the left rail reads as a single column of loose readouts and
 * "Latest Commit" looks like a seventh statistic. That is a real problem and it
 * has a cheaper solution: the internal rules. A ruled header and hairlines
 * between rows group the content just as well, and they do it without putting a
 * lit rectangle between the deck and the space it is supposed to be sitting in.
 *
 * What the box cost is the thing this deck is actually for. Six panels of
 * `rgb(9 11 15 / 0.72)` over a true-black void are six grey slabs, and they read
 * as a web page's cards laid on top of a render rather than as instrumentation
 * inside the scene. The starfield stops passing behind the rail. The reference is
 * unambiguous about this and so is the result.
 *
 * SO: THE INTERNAL RULES STAY, THE CONTAINER GOES. If a future pass wants the
 * grouping back, add rules — not a fill.
 *
 * `side` stays gone. It picked which way a chamfer and a connector stub leaned,
 * and both of those are withdrawn too.
 *
 * TYPOGRAPHY: spacing follows a 4px rhythm, and the steps between levels are large
 * enough to be felt rather than measured — 17px title against 9px tracked labels.
 * Even gaps between equally-weighted lines are what make an interface look
 * mechanical, so the vertical space is deliberately uneven: tight inside a group,
 * generous between groups.
 */
export function HudPanel({
  label,
  children,
  className,
  bodyClassName,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  /** Escape hatch for panels that manage their own body padding (row lists). */
  bodyClassName?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      {label && (
        <div className="border-panel-rule border-b px-4 pb-3">
          <HudLabel>{label}</HudLabel>
        </div>
      )}
      <div className={cn("relative", bodyClassName ?? "px-4 py-3")}>{children}</div>
    </section>
  );
}

/** Eyebrow. Small, wide-tracked and quiet — it names the panel, nothing more. */
export function HudLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-t3 tracking-label font-mono text-[9px] leading-none uppercase">
      {children}
    </h2>
  );
}

/**
 * Primary value. Deliberately much larger than everything around it — this is
 * the line a scanning reader is meant to catch, and hierarchy only exists if
 * the steps between levels are big enough to be felt.
 */
export function HudHeadline({ children }: { children: ReactNode }) {
  return (
    <p className="text-t1 truncate text-[17px] leading-[1.15] font-medium tracking-[-0.015em]">
      {children}
    </p>
  );
}

export function HudCaption({ children }: { children: ReactNode }) {
  return <p className="text-t2 mt-2 line-clamp-2 text-[11.5px] leading-[1.5]">{children}</p>;
}

/** Divides identity from data. */
export function HudDivider() {
  return <div className="bg-panel-rule mt-2.5 mb-2 h-px" />;
}

/** A label/value row. `tabular-nums` keeps readouts from reflowing as they tick. */
export function HudRow({
  label,
  children,
  tone = "default",
}: {
  label: string;
  children: ReactNode;
  tone?: "default" | "signal" | "nominal" | "caution" | "telemetry";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[5px]">
      <span className="text-t3 tracking-micro font-mono text-[9px] uppercase">{label}</span>
      <span
        className={cn(
          "font-mono text-[12px] leading-none tabular-nums",
          tone === "signal" && "text-signal",
          tone === "nominal" && "text-nominal",
          tone === "caution" && "text-caution",
          tone === "telemetry" && "text-telemetry",
          tone === "default" && "text-t1",
        )}
      >
        {children}
      </span>
    </div>
  );
}
