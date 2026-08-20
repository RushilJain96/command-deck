"use client";

import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { ConsoleStats } from "./ConsoleStats";

/**
 * The console's nameplate, built as a HUD BAND rather than as a heading.
 *
 * A 31px title with a paragraph under it is a web page's masthead, and it read as
 * one — the single most "website" thing on the scene. What makes this an
 * instrument instead is structure, not size:
 *
 *   The glyph sits in a plate with a lit top lip, matched to the rail's icon
 *   cells, so the title has a HOUSING to start from rather than floating.
 *
 *   A hairline runs the full width beneath the whole band, with a short red
 *   segment under the plate. That is the console's own rule — it closes the
 *   header the way a panel's header rule closes a panel, and it is what ties the
 *   band to the four housings below it.
 *
 *   The readout box sits at the far end of the band, so the header reads left to
 *   right as one strip of instrumentation: what this console is, then what is in
 *   it.
 *
 * COMPACT ON PURPOSE. This scene has four panels and thirty-nine named things to
 * fit inside 902 units, so the header gets 52 of them and no more.
 *
 * See <ConsoleStats> for what the box on the right reports and why every figure in
 * it is counted rather than claimed.
 */
export function SystemsHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative pb-3"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3.5">
          {/* Hue confined to the mark and a wash of the same hue behind it, so the
              colour reads as coming FROM the glyph rather than painted on the
              plate — the rule the rail's icon cells follow. */}
          <span
            aria-hidden="true"
            className="border-panel-edge text-signal flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[3px] border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),0_0_18px_-6px_rgb(255_42_42/0.5)]"
            style={{
              background: "linear-gradient(180deg, rgb(255 42 42 / 0.13), rgb(255 42 42 / 0.04))",
            }}
          >
            <Cpu size={20} strokeWidth={1.6} />
          </span>

          <div className="min-w-0">
            <h1 className="text-t1 truncate text-[25px] leading-none font-medium tracking-[-0.015em] uppercase @2xl:text-[29px]">
              Engineering Systems
            </h1>
            <p className="mt-2 truncate text-[12.5px] leading-none text-[#a9b4c0]">
              Core technologies and domains I work with
            </p>
          </div>
        </div>

        {/* THE READOUT BOX HAS THE RIGHT END TO ITSELF NOW.
            A "CHANNEL 02 — SYSTEMS CONSOLE" stamp used to sit above it, reading the
            channel number off `DESTINATIONS` so the address followed the mode
            selector. It was true and it was furniture: the top bar already shows
            which position is lit, in red, six inches away — so the stamp restated
            the one thing on this screen that was never in doubt, and it did it in
            the smallest, dimmest type on the console. Removing it gives the box the
            whole cell and the box is what a reader actually wants there.

            @6xl, NOT @3xl. The box is wide once its figures are set at this size,
            and on a 768-unit frame — minus the rail and the console's own padding —
            it left the title block under 100 units and "ENGINEERING SYSTEMS"
            rendered as "E…". Below 1152 the title takes the whole band. */}
        <div className="hidden shrink-0 @6xl:block">
          <ConsoleStats />
        </div>
      </div>

      {/* The band's own rule. Full bleed, because a rule inset from the content
          reads as an underline beneath the text rather than as the edge of the
          instrument. */}
      <span aria-hidden="true" className="bg-panel-rule absolute inset-x-0 bottom-0 h-px" />
      <span
        aria-hidden="true"
        className="bg-signal absolute bottom-0 left-0 h-px w-[42px]"
        style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.7)" }}
      />
    </motion.header>
  );
}
