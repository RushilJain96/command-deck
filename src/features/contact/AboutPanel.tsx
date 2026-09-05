"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { BIO, TRAITS } from "./data";
import type { Trait } from "./types";

/**
 * THE BIO AND THE FOUR TRAITS ARE ONE BLOCK, and the fix here was to stop
 * pretending otherwise.
 *
 * This panel previously distributed its contents down the full height: the bio at
 * the top, the traits centred in whatever was left, and a hundred and thirty units
 * of nothing between them. Every mechanism that produced it was reasonable on its
 * own — `mt-auto` on the rule, then `justify-center` on the lower block — and the
 * result read as a rendering fault, because a gap that large inside one panel is
 * not a design decision any reader will credit.
 *
 * The content now simply flows from the top: paragraphs, a seam, the label, the
 * grid. The introduction and what drives him are two halves of one answer to one
 * question, so they sit together and the panel's remaining height falls below them
 * as margin. Margin at the foot of a column reads as breathing room; a hole in the
 * middle of one reads as a bug.
 *
 * THE PROSE IS SET IN MONO AND SLIGHTLY LARGE. Every other paragraph on the deck is
 * sans, and that rule holds wherever the text describes a THING. This is the one
 * screen where the text is the operator speaking, so it is set in the machine's own
 * face — and it is the most important content on the page, so it is the only body
 * copy on the deck allowed above 14px.
 */
export function AboutPanel() {
  return (
    <HudPanel
      corners
      className="flex flex-col"
      bodyClassName="px-6 py-6"
    >
      <div className="flex flex-col">
        <div className="max-w-[72ch] space-y-4">
          {BIO.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: "easeOut", delay: 0.1 + index * 0.07 }}
              className="font-mono text-[15px] leading-[1.8] text-[#ccd5df]"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        {/* The seam. Full bleed inside the panel's padding rather than inset, so it
            reads as the division between two halves of one instrument rather than
            as an underline beneath the paragraph above it. Its margins are close and
            equal — the two blocks belong together, and an even seam is what says so. */}
        <div className="bg-panel-rule mt-6 mb-5 h-px shrink-0" />

        <h3 className="text-t3 tracking-label mb-5 shrink-0 font-mono text-[10.5px] leading-none uppercase">
          What Drives Me
        </h3>

        {/* COMPACT, AND NOT A SKILLS GRID. These are four things about a person, so
            they get a glyph, two words and a sentence — no bars, no counts, nothing
            that would file them alongside the systems console's capability matrix.
            Two columns wherever there is room, because one column turns four short
            entries into a long list — the wrong shape for a set. The threshold is
            @lg rather than @md so a phone gets a single readable column instead of
            two 195-unit ones: this container query measures the CONSOLE, not the
            panel, so 512 is the frame width at which the panel itself is wide
            enough to divide. */}
        <div className="grid shrink-0 grid-cols-1 gap-x-8 gap-y-5 @lg:grid-cols-2">
          {TRAITS.map((trait, index) => (
            <TraitCell key={trait.id} trait={trait} index={index} />
          ))}
        </div>
      </div>
    </HudPanel>
  );
}

function TraitCell({ trait, index }: { trait: Trait; index: number }) {
  const Icon = trait.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut", delay: 0.3 + index * 0.06 }}
      style={{ "--trait-accent": trait.accent } as CSSProperties}
      className="group flex items-start gap-3"
    >
      {/* No plate behind the glyph, matching the domain cards and the capability
          matrix: a box inside a cell that has no border of its own would be the only
          rectangle in this grid, and the mark is line art — it wants to read as a
          drawing rather than as a button. */}
      <span
        aria-hidden="true"
        className="mt-px shrink-0 transition-[filter] duration-200 group-hover:brightness-110"
        style={{ color: trait.accent, filter: `drop-shadow(0 0 8px ${trait.accent}59)` }}
      >
        <Icon size={20} strokeWidth={1.6} />
      </span>

      <div className="min-w-0">
        <h4 className="text-t1 font-mono text-[12.5px] leading-none font-semibold">{trait.label}</h4>
        <p className="text-t2 mt-2 text-[11.5px] leading-[1.55]">{trait.blurb}</p>
      </div>
    </motion.div>
  );
}
