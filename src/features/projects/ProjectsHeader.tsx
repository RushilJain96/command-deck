"use client";

import { motion } from "framer-motion";
import { FolderGit2 } from "lucide-react";
import { ProjectStats } from "./ProjectStats";

/**
 * The console's nameplate, built on the systems header's geometry: a 42px icon
 * plate carrying the only hue in the band, the title, the line that says what the
 * screen is for, and the readout box holding the right end.
 *
 * NO RULE UNDER IT, WHICH THE SYSTEMS HEADER HAS. That band sits directly above a
 * row of domain cards with no edges of their own, so it needs a hairline to stop
 * the title floating over them. This one sits above the filter row, which is a
 * line of bordered controls — a rule between the two would be a third horizontal
 * edge in forty units, and the reference does not draw one either.
 *
 * The glyph matches the PROJECTS position in the top bar. The bar says which
 * channel is lit and the plate repeats the mark eighty units below it, so arriving
 * at this screen confirms the switch you just threw rather than presenting an
 * unrelated icon.
 */
export function ProjectsHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full items-center justify-between gap-6"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {/* Hue confined to the mark and a wash of the same hue behind it, so the
            colour reads as coming FROM the glyph rather than painted on the plate. */}
        <span
          aria-hidden="true"
          className="border-panel-edge text-signal flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[3px] border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),0_0_18px_-6px_rgb(255_42_42/0.5)]"
          style={{
            background: "linear-gradient(180deg, rgb(255 42 42 / 0.13), rgb(255 42 42 / 0.04))",
          }}
        >
          <FolderGit2 size={20} strokeWidth={1.6} />
        </span>

        <div className="min-w-0">
          <h1 className="text-t1 truncate text-[25px] leading-none font-medium tracking-[-0.015em] uppercase @2xl:text-[29px]">
            Engineering Projects
          </h1>
          <p className="mt-2 truncate text-[12.5px] leading-none text-[#a9b4c0]">
            Real-world systems I&apos;ve designed, built and shipped
          </p>
        </div>
      </div>

      {/* @6xl for the same reason the systems console uses it: below 1152 units of
          frame, the box and the title compete for a band that cannot hold both, and
          the title is the one that has to win. */}
      <div className="hidden shrink-0 @6xl:block">
        <ProjectStats />
      </div>
    </motion.header>
  );
}
