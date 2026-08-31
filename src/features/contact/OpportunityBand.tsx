"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { OPPORTUNITIES } from "./data";
import { SectionHeading } from "./SectionHeading";
import type { Opportunity } from "./types";

/**
 * THE ASK, and it is the last thing on the page for a reason.
 *
 * The two panels above answer "who is this" and "how do I reach them". Neither
 * says what the operator actually wants, and a contact page that never states its
 * own purpose leaves the reader to guess whether an email would be welcome. This
 * band says it in three words and three sentences, full width, directly above the
 * footer — the last thing read before the frame ends.
 */
export function OpportunityBand() {
  return (
    <HudPanel corners className="flex h-full min-h-0 flex-col" bodyClassName="min-h-0 flex-1 px-6 py-5">
      <div className="flex h-full min-h-0 flex-col">
        <SectionHeading
          icon={Star}
          title="Let's Build Something Great"
          blurb="I'm always open to exciting opportunities and collaborations."
        />

        {/* SEAMS BETWEEN THE COLUMNS, not gaps. Three equal blocks of text with only
            whitespace between them read as one paragraph that has been chopped up;
            a hairline says they are three separate answers. `divide-x` puts the rule
            between cells rather than around them, so the row has no outer edges to
            collide with the panel's own border. */}
        <div className="divide-panel-rule mt-5 grid min-h-0 flex-1 grid-cols-1 divide-y @3xl:grid-cols-3 @3xl:divide-x @3xl:divide-y-0">
          {OPPORTUNITIES.map((entry, index) => (
            <OpportunityCell key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      </div>
    </HudPanel>
  );
}

function OpportunityCell({ entry, index }: { entry: Opportunity; index: number }) {
  const Icon = entry.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut", delay: 0.42 + index * 0.07 }}
      style={{ "--opp-accent": entry.accent } as CSSProperties}
      className={cellClass(index)}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        style={{ color: entry.accent, filter: `drop-shadow(0 0 9px ${entry.accent}5c)` }}
      >
        <Icon size={26} strokeWidth={1.6} />
      </span>

      <div className="min-w-0">
        <h3 className="text-t1 font-mono text-[13px] leading-none font-medium">{entry.label}</h3>
        <p className="text-t2 mt-2.5 text-[12px] leading-[1.55]">{entry.blurb}</p>
      </div>
    </motion.div>
  );
}

/**
 * The first cell has no left padding and the last no right, so the row's text
 * aligns with the heading above it and with the panel's own padding. Without this
 * the outer two columns sit inset by an amount nothing else on the page shares.
 */
function cellClass(index: number) {
  const base = "flex items-start gap-3.5 py-4 @3xl:py-0";
  if (index === 0) return `${base} @3xl:pr-8`;
  if (index === 2) return `${base} @3xl:pl-8`;
  return `${base} @3xl:px-8`;
}
