"use client";

import { motion } from "framer-motion";
import { HudPanel } from "@/features/hud/HudPanel";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { CAPABILITIES, DOMAIN_ACCENT, SECTION_ICONS, type Capability } from "./data";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "./panelStyle";

/**
 * What the operator DOES, as distinct from what the operator uses.
 *
 * The panels below this one are a library of nouns. This one is the answer to the
 * question a library of nouns never answers, so the two must not look alike: a
 * capability cell carries an address, a title and a sentence; a technology tile
 * carries a mark and a word.
 *
 * EIGHT ACROSS IN ONE ROW, CENTRE-ALIGNED. This reverses the left-aligned 4x2
 * matrix that preceded it, and the reasoning that produced that matrix is worth
 * keeping because it explains what this arrangement has to be careful about: a
 * centred cell reserves its widest line's width as air on both sides of every
 * other line, which in a 4-column grid left a visible column of emptiness down the
 * middle of all eight cells.
 *
 * What makes it work at eight columns is that the cell is now NARROW — about 170
 * units — so the title and the sentence both wrap to two lines and set nearly the
 * same measure. There is no widest line to leave air around. The arrangement that
 * fails at four columns is the one that succeeds at eight, and vice versa; do not
 * move one without the other.
 *
 * The cells stay separated by the panel showing through a 1px grid gap. A 1px gap
 * over a rule-coloured ground draws every internal division and none of the outer
 * ones — the engraved faceplate — and it cannot produce the doubled 2px seam that
 * eight bordered boxes in a grid always do where two of them meet.
 *
 * EVERY CELL IS LIT IN THE COLOUR OF THE DOMAIN IT SERVES. Eight identical grey
 * glyphs made the matrix correct and inert — it was the one panel on the console
 * with no hue in it at all, sitting directly under six cards that are nothing but
 * hue. `data.ts` records why each cell gets the colour it does: this is a
 * cross-reference to the cards above, not a palette.
 */
export function EngineeringCapabilities() {
  return (
    <HudPanel
      label="Engineering Capabilities"
      icon={SECTION_ICONS.capabilities}
      iconClassName="text-[#ff6a45]"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      bodyClassName="min-h-0 flex-1"
      // TWO PINNED HEIGHTS, ONE PER DOMAIN-ROW SHAPE — see the budget table in
      // <SystemsConsole>. The cells divide whatever they are given rather than
      // setting it: content-sized, the panel left a band of unspent black at the
      // foot of the frame, and `auto-rows-fr` against a pinned height puts that
      // height where it does the most good.
      className="sys-capabilities flex min-h-0 flex-col @6xl:h-[205px]"
    >
      {/* THE COLUMN COUNT HAS TO DIVIDE EIGHT AT EVERY TIER, because a row that
          does not fill leaves the PANEL showing through where the missing cells
          would be — not blank space but a lighter rectangle. Two, four and eight
          all divide; three and five do not, and a three-column tier is what put a
          hole in the last row the first time this panel was built.

          Eight only from the widest tier: at 1400 units of frame each cell gets
          about 170, which is the least "DISTRIBUTED COMPUTING" can wrap into on two
          lines. Below that it steps to four, then two. */}
      <div className="bg-panel-rule grid grid-cols-2 gap-px @5xl:grid-cols-4 @6xl:h-full @6xl:auto-rows-fr sys-capability-row">
        {CAPABILITIES.map((capability, index) => (
          <CapabilityItem key={capability.id} capability={capability} index={index} />
        ))}
      </div>
    </HudPanel>
  );
}

function CapabilityItem({ capability, index }: { capability: Capability; index: number }) {
  const Icon = capability.icon;
  const accent = DOMAIN_ACCENT[capability.accent];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.28 + index * 0.03 }}
      style={{ "--cap-accent": accent, "--cap-glow": `${accent}59` } as CSSProperties}
      // OPAQUE, AND THAT IS WHAT MAKES THE GAP GRID WORK. Inheriting the panel's
      // translucent fill would let the rule underneath show through the cell and
      // the seams would vanish.
      className={cn(
        "group relative flex flex-col items-center justify-center px-2.5 py-3.5 text-center",
        "bg-[linear-gradient(180deg,#080b11,#050709)]",
        "transition-colors duration-200 hover:bg-[linear-gradient(180deg,#0d1219,#080b11)]",
      )}
    >
      {/* The cell's own light, pooled behind the glyph. Off at rest — the glyph
          carries the colour, this only says the cell is being pointed at. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(58% 46% at 50% 30%, ${accent}1f, transparent 74%)` }}
      />

      {/* NO PLATE, matching the domain cards. The housing was a 30px box inside a
          170px cell that already has seams on both sides — a third rectangle in a
          column of rectangles. The glyph carries its own bloom instead, which
          follows its strokes rather than the bounds of a box. */}
      <span
        aria-hidden="true"
        className="relative transition-[filter] duration-200 group-hover:brightness-110"
        style={{ color: accent, filter: `drop-shadow(0 0 8px ${accent}59)` }}
      >
        <Icon size={28} strokeWidth={1.55} />
      </span>

      <h3 className="text-t1 relative mt-3 text-[12.5px] leading-[1.3] font-semibold tracking-[0.05em] uppercase">
        {capability.label}
      </h3>

      {/* Rule terminator in the cell's accent, centred under the title — the same
          device the domain cards' metadata divider uses, mirrored for a centred
          cell. */}
      <span
        aria-hidden="true"
        className="relative mt-2.5 block h-px w-[22px] transition-[width] duration-200 group-hover:w-[36px]"
        style={{ backgroundColor: accent }}
      />

      <p className="relative mt-2 text-[11.5px] leading-[1.45] text-[#a9b4c0]">{capability.blurb}</p>
    </motion.div>
  );
}
