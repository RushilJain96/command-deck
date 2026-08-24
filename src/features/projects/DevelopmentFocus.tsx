"use client";

import { motion } from "framer-motion";
import { Crosshair } from "lucide-react";
import type { CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "@/features/systems/panelStyle";
import { DEVELOPMENT_FOCUS, type FocusArea } from "./data";

/**
 * WHAT THE EIGHT CARDS ADD UP TO.
 *
 * The grid above answers "what have you built"; this band answers "what are you",
 * which is the question a roster of individual projects cannot answer no matter
 * how long it gets. Four tiles is the whole claim, and each one is a heading that
 * several cards above it fall under — so a reader who scanned the grid and a
 * reader who only glanced at this row come away with the same summary.
 *
 * It is a <HudPanel> on the console's shared heading scale rather than a bespoke
 * housing, for the reason `panelStyle.ts` exists: a console whose section headings
 * are set at three sizes has no heading level, it has three separate decisions.
 */
export function DevelopmentFocus() {
  return (
    <HudPanel
      label="Development Focus"
      icon={Crosshair}
      iconClassName="text-signal"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      className="flex h-full min-h-0 flex-col"
      bodyClassName="min-h-0 flex-1 px-3.5 py-3"
    >
      {/* A LIT TICK UNDER THE HEADING, in the deck's red. It is the same device the
          systems header uses at the left end of its rule — the console's way of
          saying which end of a band is the start of it. */}
      <span
        aria-hidden="true"
        className="bg-signal absolute top-0 left-3.5 h-px w-[42px] -translate-y-px"
        style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.7)" }}
      />

      <div className="grid h-full grid-cols-2 gap-2.5 @2xl:grid-cols-4">
        {DEVELOPMENT_FOCUS.map((area, index) => (
          <FocusTile key={area.id} area={area} index={index} />
        ))}
      </div>
    </HudPanel>
  );
}

function FocusTile({ area, index }: { area: FocusArea; index: number }) {
  const Icon = area.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.4 + index * 0.05 }}
      style={{ "--focus-accent": area.accent } as CSSProperties}
      className="group border-panel-rule relative flex flex-col items-center justify-center rounded-[3px] border bg-[linear-gradient(180deg,#080b11,#050709)] px-3 py-2.5 text-center transition-colors duration-200 hover:border-[var(--focus-accent)]"
    >
      {/* The tile's own light, pooled behind the glyph and off at rest — the glyph
          carries the colour, this only says the tile is being pointed at. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[3px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: `radial-gradient(62% 52% at 50% 26%, ${area.accent}1f, transparent 74%)`,
        }}
      />

      <span
        aria-hidden="true"
        className="relative transition-[filter] duration-200 group-hover:brightness-110"
        style={{ color: area.accent, filter: `drop-shadow(0 0 8px ${area.accent}59)` }}
      >
        <Icon size={22} strokeWidth={1.6} />
      </span>

      {/* SENTENCE CASE AND SANS, WHICH IS THE ONE PLACE THIS CONSOLE BREAKS ITS OWN
          RULE. Every other label on the screen is mono uppercase, because every
          other label names a machine-readable thing — a status, a technology, a
          designator. These four are disciplines, written the way a person would say
          them out loud, and setting "AI Engineering" as "AI ENGINEERING" in mono
          would file it alongside PRODUCTION and POSTGRESQL as another token. */}
      <h3 className="text-t1 relative mt-2 text-[12.5px] leading-none font-semibold">
        {area.label}
      </h3>
      <p className="text-t2 relative mt-1.5 text-[10.5px] leading-[1.3]">{area.blurb}</p>
    </motion.div>
  );
}
