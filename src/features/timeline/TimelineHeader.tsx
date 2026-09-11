"use client";

import { motion } from "framer-motion";
import { ChartNoAxesColumn, Quote } from "lucide-react";
import { JOURNEY_BLURB, JOURNEY_STAMP } from "./data";

/**
 * The nameplate, on the geometry every console shares.
 *
 * MONO, like the About console and unlike Systems and Projects. Those two name
 * subsystems and are set in the sans face; these two are the operator speaking,
 * and the machine's own typeface is what marks the difference across a scene
 * transition.
 *
 * "MY JOURNEY", NOT "ENGINEERING JOURNEY". Every other console on this deck is
 * named for a system — Mission Control, Systems, Projects, Terminal. This one is
 * named for a person, and the possessive is the whole difference: the page is not
 * a readout of an engineering career, it is where the operator says what happened
 * to him. The first-person title is the cheapest possible way to signal that, and
 * it is the one console where that signal is worth sending.
 *
 * THE RIGHT END HOLDS A LINE, not a readout box. Systems, Projects and the Terminal
 * all put a figure or a status there; this console has no figure worth putting,
 * since every count it could show is counted better on another screen. That is the
 * same reasoning that cut its stats panel.
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
          <h1 className="text-t1 truncate font-mono text-[23px] leading-none font-medium tracking-[0.05em] uppercase @2xl:text-[26px]">
            My Journey
          </h1>
          <p className="mt-2 truncate text-[12.5px] leading-none text-[#a9b4c0]">
            Key moments, experiences, and what&apos;s next.
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
          <p className="text-t1 text-[13px] leading-[1.5]">{JOURNEY_BLURB}</p>
          <p className="text-t3 tracking-micro mt-2 font-mono text-[10px] leading-none">
            {JOURNEY_STAMP}
          </p>
        </div>
      </div>
    </motion.header>
  );
}
