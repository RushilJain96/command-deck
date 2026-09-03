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
        <h1 className="text-t1 truncate font-mono text-[24px] leading-none font-medium tracking-[0.06em] uppercase @2xl:text-[27px]">
          About Me
        </h1>

        {/* THE SUBTITLE SITS UNDER THE TITLE, NOT BESIDE A RULE.
            The tick used to lead this line, which pushed the strapline right and
            left it hanging in space rather than reading as the title's own second
            line. It is now a short lit underline BENEATH the title — the same device
            <SectionHeading> uses inside the panels — with the strapline directly
            below at the title's own left edge, where the eye is already looking. */}
        <span
          aria-hidden="true"
          className="bg-signal mt-2.5 block h-px w-[26px]"
          style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.7)" }}
        />
        <p className="text-t2 mt-2.5 min-w-0 truncate font-mono text-[12.5px] leading-none">
          {HEADLINE}
        </p>
      </div>
    </motion.header>
  );
}
