import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared housing for every HUD panel: a bordered, filled box with a ruled header.
 *
 * THE BOX HAS BEEN REMOVED AND RESTORED TWICE, so the reasoning on both sides is
 * worth keeping rather than overwritten each time.
 *
 * AGAINST: a near-black card on a true-black void is a rectangle you can only
 * detect by its border, so the border is drawing a box around nothing; and six
 * such fills over a starfield read as a web page's cards laid on top of a render
 * rather than as instrumentation inside the scene.
 *
 * FOR, and this is what settles it: a panel is an EDGE, and an edge is what tells
 * the eye where one instrument stops and the next begins. Without it the left rail
 * is a single column of loose readouts in which "Latest Commit" looks like a
 * seventh statistic, and the bottom-right legend has nothing holding it together
 * at all — it reads as three sentences that happen to be near a logo.
 *
 * The "cards on a render" objection is answered by the VALUES, not by deleting
 * the box. `--panel-fill` at 0.72 over black lands near #090b0f: dark enough that
 * the starfield still reads through the panel's neighbourhood, distinct enough
 * that the panel is an object. What made the earlier attempt look pasted-on was a
 * heavier fill and a backdrop-blur, and the blur is gone for a second reason
 * below.
 *
 * NO `backdrop-filter`, DELIBERATELY. <DeckViewport> now scales the entire deck,
 * which makes it a transformed ancestor of everything — and a transformed
 * ancestor scales backdrop blur radii, which is exactly the hazard the
 * screen-space-sibling invariant was written about. A plain fill has no such
 * coupling, so the housing is a fill and a border and nothing else.
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
    <section
      className={cn(
        "border-panel-edge bg-panel relative rounded-[3px] border",
        "shadow-[var(--panel-shadow)]",
        className,
      )}
    >
      {label && (
        <div className="border-panel-rule border-b px-4 py-3">
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
