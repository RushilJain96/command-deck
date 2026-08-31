"use client";

import { motion } from "framer-motion";
import { Code2 } from "lucide-react";
import { HEADLINE } from "./data";

/**
 * "ABOUT ME" UNDER A NAV POSITION THAT SAYS CONTACT, and the mismatch is the
 * reference's, kept on purpose.
 *
 * The top bar names the DESTINATION — contact is what a visitor is looking for when
 * they reach for it — while the screen names what it opens with, which is the
 * operator. Renaming the bar to ABOUT would hide the thing people come here to
 * find; renaming the screen to CONTACT would make the bio look like preamble to a
 * form. Both labels are correct about their own job.
 *
 * MONO, like the terminal's header and unlike the systems and projects consoles.
 * The heading is the operator introducing themselves in the machine's voice, and
 * the bio under it is set in the same face for the same reason — see <AboutPanel>.
 */
export function ContactHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full items-center gap-4"
    >
      <span
        aria-hidden="true"
        className="border-panel-edge text-signal flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[4px] border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),0_0_18px_-6px_rgb(255_42_42/0.5)]"
        style={{
          background: "linear-gradient(180deg, rgb(255 42 42 / 0.13), rgb(255 42 42 / 0.04))",
        }}
      >
        <Code2 size={22} strokeWidth={1.8} />
      </span>

      <div className="min-w-0">
        <h1 className="text-t1 truncate font-mono text-[26px] leading-none font-medium tracking-[0.06em] uppercase @2xl:text-[30px]">
          About Me
        </h1>

        {/* Tick then strapline, on one line — the same device <SectionHeading> uses
            inside the panels, so the page's four headings are one family. */}
        <div className="mt-3 flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="bg-signal block h-px w-[30px] shrink-0"
            style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.7)" }}
          />
          <p className="text-t2 min-w-0 truncate font-mono text-[13px] leading-none">{HEADLINE}</p>
        </div>
      </div>
    </motion.header>
  );
}
