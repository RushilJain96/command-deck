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
      {/* Connector stub, on the edge facing the deck. Down with everything else:
          a hairline at 0.15 against pure black is one of the brightest marks on
          the screen, which is a lot of attention for a decorative tie-in. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-7 h-px w-3 bg-white/10",
          side === "left" ? "left-full" : "right-full",
        )}
      />

      {/* DARKENED ACROSS THE BOARD, and the bezel came down with the face.
          The rail used to sit at rgb(25 30 38) over a #06070a ground, which was
          a comfortable step above its background. Against pure black that same
          panel reads as a lit grey card floating in a void — the contrast ratio
          against the ground roughly doubled without a single value changing.
          So the face drops to rgb(13 16 21) and the bezel from 0.11 to 0.07:
          the panels are still legible as housings, but they are now barely above
          the black they sit on rather than glowing off it.

          The top lip came down too. An inset highlight is a specular, and a
          specular implies a light source — with the deck's ambient light stood
          down there is far less for these edges to be catching. */}
      <span className="block bg-white/[0.07] p-px" style={clip}>
        <span
          className={cn(
            "relative block px-4 py-3.5",
            "bg-[linear-gradient(158deg,rgb(13_16_21/0.96),rgb(4_5_8/0.98))]",
            "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),inset_0_-1px_0_0_rgb(0_0_0/0.6)]",
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
