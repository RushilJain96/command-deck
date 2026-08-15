import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared housing for every HUD panel.
 *
 * THERE IS NO HOUSING ANY MORE — no bezel, no face, no chamfer, no connector
 * stub. This used to be a machined panel built from the same vocabulary as the
 * mission callouts, and all of it is withdrawn: the rails float directly over the
 * void and the content is the only thing drawn.
 *
 * The stub went with the rest. It existed to tie a BOX back to the deck, echoing
 * the leader lines that once joined callouts to their footprints; with no box and
 * no leaders, it was a connector between two things that had both stopped
 * existing.
 *
 * `side` is gone from the signature too. It picked which way the chamfer and the
 * stub leaned; with both removed it was a parameter every caller had to supply
 * and nothing could act on.
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
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {

  return (
    <section className={cn("relative", className)}>
      {/* NO HOUSING. The bezel, the face gradient, the inset lip and the chamfer
          clip are all withdrawn: the rails now float directly over the void.

          THE WHOLE OF THE NOTE ABOVE IS OBSOLETE, and it is worth saying why
          rather than just deleting it. Every value in it was tuned to make a
          PANEL sit correctly against its background — darken the face, drop the
          bezel, lower the lip. That is the right work if the answer is a panel.
          Once the void went genuinely black, the honest observation is that the
          housing had nothing left to do: a near-black card on a black ground is a
          rectangle you can only detect by its border, so the border was the only
          thing still drawing a box, and it was drawing a box around nothing.

          Removing it costs the panels their edges and buys the composition its
          depth back — text and lit glyphs reading directly off the void is what
          the reference does, and it is why its HUD feels like part of the space
          rather than a layer over it.

          `px-0` rather than the old `px-4 py-3`: with no housing there is no
          inner face to inset content from. The rail's own left margin positions
          it now. */}
      <div className="relative">
        {label && <HudLabel>{label}</HudLabel>}
        {children}
      </div>
    </section>
  );
}

/** Eyebrow. Small, wide-tracked and quiet — it names the panel, nothing more. */
export function HudLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-t3 tracking-label mb-2.5 font-mono text-[9px] leading-none uppercase">
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
  return <div className="mt-2.5 mb-2 h-px bg-white/[0.08]" />;
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
