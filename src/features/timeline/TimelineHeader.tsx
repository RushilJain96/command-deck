"use client";

import { motion } from "framer-motion";
import { ChartNoAxesColumn, Quote } from "lucide-react";
import { JOURNEY_QUOTE, JOURNEY_STAMP } from "./data";

/**
 * The nameplate, on the geometry every console shares: a 42-unit plate carrying the
 * only hue in the band, the title, and the line that says what the screen is for.
 *
 * THE QUOTE HOLDS THE RIGHT END rather than a readout box. Systems, Projects and
 * the Terminal all put a figure or a status there, and this console has no figure
 * worth putting — every count it could show is counted better on another screen,
 * which is the whole reason its stats panel was cut. A line of the operator's own
 * is the honest thing to give that space to.
 */
export function TimelineHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full items-center justify-between gap-8"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          aria-hidden="true"
          className="border-panel-edge text-signal flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[3px] border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),0_0_18px_-6px_rgb(255_42_42/0.5)]"
          style={{
            background: "linear-gradient(180deg, rgb(255 42 42 / 0.13), rgb(255 42 42 / 0.04))",
          }}
        >
          <ChartNoAxesColumn size={20} strokeWidth={1.8} />
        </span>

        <div className="min-w-0">
          <h1 className="text-t1 truncate text-[25px] leading-none font-medium tracking-[-0.015em] uppercase @2xl:text-[29px]">
            Engineering Journey
          </h1>
          <p className="mt-2 truncate text-[12.5px] leading-none text-[#a9b4c0]">
            Key milestones, experiences, and what comes next.
          </p>
        </div>
      </div>

      <div className="hidden shrink-0 items-start gap-3 @5xl:flex">
        <Quote
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          className="text-signal mt-0.5 shrink-0"
          style={{ filter: "drop-shadow(0 0 8px rgb(255 42 42 / 0.45))" }}
        />
        <div className="text-right">
          <p className="text-t1 text-[13px] leading-[1.5]">{JOURNEY_QUOTE}</p>
          <p className="text-t3 tracking-micro mt-2 font-mono text-[10px] leading-none">
            {JOURNEY_STAMP}
          </p>
        </div>
      </div>
    </motion.header>
  );
}
