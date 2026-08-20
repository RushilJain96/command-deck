import type { LucideIcon } from "lucide-react";
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
/**
 * `icon`, `action` and `corners` are ADDITIVE and all optional, so every existing
 * rail panel renders byte-identically without them.
 *
 * They exist for the systems console, where a panel's header has two jobs the
 * deck's rail never asked of it: to carry the section's glyph (the console has
 * five panels in one frame and a bare eyebrow does not separate them fast
 * enough), and to hold a control — the technology and tool libraries page their
 * own contents, and the toggle belongs on the housing rather than floating in
 * the body under the list it governs.
 *
 * The header is a flex row either way; with neither prop it collapses to exactly
 * the eyebrow it always was.
 *
 * `corners` draws four bracket ticks just inside the panel's edge. It is the one
 * piece of pure HUD vocabulary in the housing, and it earns its place on a screen
 * that is four large rectangles stacked in a column: the brackets say "this is an
 * instrument face" at a glance, where the 1px border alone says "this is a box".
 * Off by default — the deck's rail panels are small and closely spaced, and eight
 * ticks per panel there would be noise.
 */
export function HudPanel({
  label,
  icon: Icon,
  iconClassName,
  iconSize = 12,
  labelClassName,
  action,
  corners = false,
  children,
  className,
  bodyClassName,
}: {
  label?: string;
  icon?: LucideIcon;
  /** Tints the header glyph. */
  iconClassName?: string;
  /** Header glyph size. 12 is the rail's; the systems console runs larger. */
  iconSize?: number;
  /**
   * Overrides the eyebrow's size and tone. The default is the deck rail's 9px
   * tertiary, which is right for a 176-unit instrument panel and much too quiet
   * for a full-width console section — see `systems/panelStyle.ts`.
   */
  labelClassName?: string;
  /** Right-aligned control in the header rule. */
  action?: ReactNode;
  /** Draw HUD bracket ticks at the four corners. */
  corners?: boolean;
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
      {corners && <PanelCorners />}

      {label && (
        <div className="border-panel-rule flex items-center gap-2 border-b px-4 py-3">
          {Icon && (
            <Icon
              size={iconSize}
              strokeWidth={1.75}
              aria-hidden="true"
              className={cn("shrink-0", iconClassName ?? "text-t3")}
            />
          )}
          <HudLabel className={labelClassName}>{label}</HudLabel>
          {action && <div className="ml-auto flex items-center">{action}</div>}
        </div>
      )}
      <div className={cn("relative", bodyClassName ?? "px-4 py-3")}>{children}</div>
    </section>
  );
}

/**
 * Four L-shaped ticks, inset 5px so they read as machined marks ON the face
 * rather than as a second border around it. `pointer-events-none` because they
 * overlay the body and nothing in them is interactive.
 */
function PanelCorners() {
  const arms = [
    "top-[5px] left-[5px] border-t border-l",
    "top-[5px] right-[5px] border-t border-r",
    "bottom-[5px] left-[5px] border-b border-l",
    "bottom-[5px] right-[5px] border-b border-r",
  ];
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      {arms.map((arm) => (
        <span
          key={arm}
          className={cn("border-panel-edge absolute h-[7px] w-[7px] opacity-80", arm)}
        />
      ))}
    </span>
  );
}

/** Eyebrow. Small, wide-tracked and quiet — it names the panel, nothing more. */
export function HudLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-t3 tracking-label font-mono text-[9px] leading-none uppercase",
        className,
      )}
    >
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
