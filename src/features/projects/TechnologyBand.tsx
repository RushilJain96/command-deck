"use client";

import { motion } from "framer-motion";
import { Code2, MoreHorizontal } from "lucide-react";
import { HudPanel } from "@/features/hud/HudPanel";
import { Mark, markColor } from "@/features/systems/Mark";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "@/features/systems/panelStyle";
import { TECHNOLOGY_COUNT, TECH_BAND } from "./data";

/**
 * THE MARKS, IN THEIR OWN COLOURS, AT THIRTY-FOUR PIXELS.
 *
 * This is the only place on either console where saturated brand colour appears at
 * size, and it is why the panel under it is the darkest surface in the frame — a
 * #0e131b plate would have Python's blue and Redis' red sitting ON something, and
 * at near-black they sit in the dark and read as lit. That trade is the systems
 * console's finding; this band inherits it by using the same `--panel-fill`.
 *
 * `markColor` is imported rather than reimplemented. It lifts any brand hex too
 * dark to read against near-black — Django's bottle green, Kafka's black — to a
 * fixed lightness while keeping its hue, and a second copy of that rule would
 * eventually disagree with the first about which marks need it.
 */
export function TechnologyBand() {
  return (
    <HudPanel
      label="Technologies Across Projects"
      icon={Code2}
      iconClassName="text-[#52b6ff]"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      className="flex h-full min-h-0 flex-col"
      bodyClassName="min-h-0 flex-1 px-3.5 py-3"
    >
      <ul className="border-panel-rule flex h-full items-center justify-around gap-2 rounded-[3px] border bg-[rgb(190_205_220/0.018)] px-4">
        {TECH_BAND.map((entry, index) => (
          <TechMark key={entry.id} entry={entry} index={index} />
        ))}

        {/* THE OVERFLOW GLYPH IS A COUNT, NOT AN ELLIPSIS.
            The reference ends the row with three dots, which say "and others" and
            nothing else. The roster knows exactly how many others there are, so the
            tooltip says it — and the figure comes from the same `TECHNOLOGY_COUNT`
            the readout box prints, which means the two can never disagree about how
            long the list is. */}
        <li
          className="text-t3 shrink-0"
          title={`${TECHNOLOGY_COUNT} technologies across the roster`}
        >
          <MoreHorizontal size={26} strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">and {TECHNOLOGY_COUNT - TECH_BAND.length} more</span>
        </li>
      </ul>
    </HudPanel>
  );
}

function TechMark({
  entry,
  index,
}: {
  entry: (typeof TECH_BAND)[number];
  index: number;
}) {
  const color = markColor(entry.glyph);

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.26, ease: "easeOut", delay: 0.44 + index * 0.025 }}
      title={entry.name}
      className="group relative flex shrink-0 items-center justify-center"
    >
      {/* The mark's own light, pooled behind it. Off at rest; on hover it is the
          richest thing in the band and it costs no layout. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-10px] rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `radial-gradient(50% 50% at 50% 50%, ${color}2e, transparent 70%)` }}
      />
      <span
        aria-hidden="true"
        className="relative transition-transform duration-200 group-hover:scale-110"
        style={{ color }}
      >
        <Mark glyph={entry.glyph} size={34} />
      </span>
      <span className="sr-only">{entry.name}</span>
    </motion.li>
  );
}
