import type { CSSProperties, ReactNode } from "react";
import { hudChamfer, type ChamferSide } from "@/lib/chamfer";
import { cn } from "@/lib/cn";

/**
 * Shared housing for every HUD panel.
 *
 * Three things make the rail read as part of the deck rather than a separate
 * application floating on top of it:
 *
 *   1. the same chamfer vocabulary as the mission callouts, mirrored so the
 *      rail leans toward the centre of the deck;
 *   2. a two-layer bezel, identical construction to the callouts;
 *   3. a short connector stub on the inner edge, echoing the leader lines that
 *      tie callouts to their footprints.
 *
 * No backdrop-filter. On a near-black background a blur of the backdrop is
 * visually indistinguishable from a flat translucent fill, while costing a
 * backdrop readback and a separable blur every frame the starfield moves.
 *
 * TYPOGRAPHY: spacing here follows a 4px rhythm, and the steps between levels
 * are large enough to be felt rather than measured — 17px title against 9px
 * tracked labels. Even gaps between equally-weighted lines are what make an
 * interface look mechanical, so the vertical space is deliberately uneven:
 * tight inside a group, generous between groups.
 */
export function HudPanel({
  label,
  children,
  className,
  side = "left",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  side?: ChamferSide;
}) {
  const clip = { clipPath: hudChamfer(side) } as CSSProperties;

  return (
    <section className={cn("relative", className)}>
      {/* Connector stub, on the edge facing the deck. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-7 h-px w-3 bg-white/15",
          side === "left" ? "left-full" : "right-full",
        )}
      />

      <span className="block bg-white/[0.11] p-px" style={clip}>
        <span
          className={cn(
            "relative block px-4 py-3.5",
            "bg-[linear-gradient(158deg,rgb(25_30_38/0.95),rgb(10_13_18/0.97))]",
            "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),inset_0_-1px_0_0_rgb(0_0_0/0.55)]",
          )}
          style={clip}
        >
          {label && <HudLabel>{label}</HudLabel>}
          {children}
        </span>
      </span>
    </section>
  );
}

/** Eyebrow. Small, wide-tracked and quiet — it names the panel, nothing more. */
export function HudLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-t3 tracking-label mb-3.5 font-mono text-[9px] leading-none uppercase">
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
  return <div className="mt-3.5 mb-2 h-px bg-white/[0.08]" />;
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
