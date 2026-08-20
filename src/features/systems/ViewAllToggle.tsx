"use client";

import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * The overflow control both libraries mount at the FOOT of their panel.
 *
 * IT MOVED OUT OF THE HEADER AND BECAME A BUTTON. In the header it was a bare
 * label on the rule, which is the right weight for a control that sits next to the
 * thing it governs — but it also read as part of the panel's title, and a reader
 * scanning a grid of logos finished at the bottom of the grid and never looked back
 * up. At the foot, in an outlined housing, it is where the list runs out and it
 * looks like something to press.
 *
 * IT PAGES THE LIST RATHER THAN GROWING THE FRAME. The deck does not scroll — that
 * is the product's first rule — so a library that rendered every entry would push
 * the console past 1024 units the moment a technology is added. The panels show two
 * rows and keep the rest one click away.
 *
 * IT IS A TOGGLE, NOT A LINK, and that is why it says COLLAPSE on the way back. A
 * "VIEW ALL →" that expands in place and then offers no way to undo it is a one-way
 * door in an interface whose whole premise is that nothing navigates.
 *
 * IT WEARS ITS PANEL'S ACCENT rather than the neutral edge every other housing on
 * the console uses, and that is the one place a control is allowed to. Everything
 * else in these two panels is inert — marks, names, a heading — so the button is
 * the only thing a reader can press, and a grey outline in a grey panel gave it no
 * way to say so. Taking the same hue as the panel's header glyph makes it read as
 * belonging to that panel while still being the one lit element in it.
 */
export function ViewAllToggle({
  label,
  expanded,
  hiddenCount,
  onToggle,
  controls,
  accent,
}: {
  /** What the list holds, e.g. "Technologies". Rendered as VIEW ALL <label>. */
  label: string;
  /** The owning panel's hue. See the note above for why the control carries one. */
  accent: string;
  expanded: boolean;
  /** Entries not currently rendered. Shown so the control states its own cost. */
  hiddenCount: number;
  onToggle: () => void;
  /** id of the region this button expands, for `aria-controls`. */
  controls: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      style={
        {
          "--view-accent": accent,
          "--view-edge": `${accent}59`,
          "--view-wash": `${accent}14`,
          "--view-glow": `${accent}4d`,
        } as CSSProperties
      }
      className={cn(
        "tracking-micro group inline-flex items-center gap-2 rounded-[3px] border px-3.5 py-2.5 font-mono text-[10.5px] uppercase",
        "border-[var(--view-edge)] bg-[var(--view-wash)] text-[var(--view-accent)]",
        "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05)]",
        "transition-[background-color,border-color,box-shadow] duration-200",
        "hover:border-[var(--view-accent)] hover:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.09),0_0_16px_-4px_var(--view-glow)]",
        "focus-visible:ring-signal/70 outline-none focus-visible:ring-2",
      )}
    >
      {expanded ? `Collapse ${label}` : `View all ${label}`}
      <ArrowRight
        size={13}
        strokeWidth={2}
        aria-hidden="true"
        className={cn(
          "transition-transform duration-200",
          expanded ? "-rotate-90" : "group-hover:translate-x-0.5",
        )}
      />
      {!expanded && hiddenCount > 0 && (
        <span className="text-t2 tabular-nums">+{hiddenCount}</span>
      )}
    </button>
  );
}
