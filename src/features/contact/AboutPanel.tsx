"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { BIO, TRAITS } from "./data";
import type { Trait } from "./types";

/**
 * The bio, and the four things under it.
 *
 * THE PROSE IS SET IN MONO. Every other paragraph on the deck is sans — the project
 * summaries, the domain blurbs, the capability captions — and the rule is worth
 * keeping wherever the text is describing a THING. This is the one screen where the
 * text is the operator speaking, and the reference sets it in the machine's own
 * face. That reads as a message typed into the console rather than as copy written
 * about it, which is the difference between an About panel and an About page.
 *
 * <HudPanel> is used as the housing only, with no `label`. Its header strip would
 * put a bordered title bar above a panel whose own heading is <SectionHeading> —
 * two headings for one section. See the note there.
 */
export function AboutPanel() {
  return (
    <HudPanel corners className="flex h-full min-h-0 flex-col" bodyClassName="min-h-0 flex-1 px-6 py-6">
      <div className="flex h-full min-h-0 flex-col">
        <div className="space-y-4">
          {BIO.map((paragraph, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.34, ease: "easeOut", delay: 0.1 + index * 0.07 }}
              className="font-mono text-[13.5px] leading-[1.72] text-[#ccd5df]"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        {/* The panel's own rule, full bleed inside the padding rather than inset,
            so it reads as the seam between two halves of one instrument rather than
            as an underline beneath the paragraph above it.

            A FIXED OFFSET UNDER THE BIO, NOT `mt-auto`. Pushed to the bottom the
            rule left a 130-unit void in the middle of the panel at this console's
            height — the bio floating at the top and the traits pinned to the floor,
            with nothing between them. The seam belongs to the paragraph above it,
            so it follows it; the slack goes below, where the trait grid absorbs it. */}
        <div className="bg-panel-rule mt-7 mb-5 h-px shrink-0" />

        {/* THE LABEL AND ITS GRID CENTRE AS ONE BLOCK.
            Centring only the grid put the slack between the heading and the cells
            it names — a caption floating a hundred units above its own contents,
            which is worse than the void it replaced. They are one section, so they
            take the leftover height together. */}
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <h3 className="text-t3 tracking-label mb-4 font-mono text-[10.5px] leading-none uppercase">
            What Drives Me
          </h3>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 @lg:grid-cols-2">
            {TRAITS.map((trait, index) => (
              <TraitCell key={trait.id} trait={trait} index={index} />
            ))}
          </div>
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
      {/* NO PLATE BEHIND THE GLYPH, matching the domain cards and the capability
          matrix. A 34px box inside a cell that has no border of its own would be
          the only rectangle in this grid, and the mark is line art — it wants to
          be read as a drawing, not as a button. */}
      <span
        aria-hidden="true"
        className="mt-0.5 shrink-0 transition-[filter] duration-200 group-hover:brightness-110"
        style={{ color: trait.accent, filter: `drop-shadow(0 0 8px ${trait.accent}59)` }}
      >
        <Icon size={22} strokeWidth={1.6} />
      </span>

      <div className="min-w-0">
        <h4 className="text-t1 font-mono text-[12.5px] leading-none font-semibold">{trait.label}</h4>
        <p className="text-t2 mt-2 text-[11.5px] leading-[1.5]">{trait.blurb}</p>
      </div>
    </motion.div>
  );
}
