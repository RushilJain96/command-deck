"use client";

import { motion } from "framer-motion";
import { Lock, Terminal } from "lucide-react";

/**
 * The console nameplate — the systems and projects header geometry, with one
 * deliberate break.
 *
 * THE TITLE IS SET IN MONO. Both other consoles use the sans face at 29px, and the
 * shared scale is normally the thing worth protecting. Not here: a terminal names
 * itself in the typeface it speaks in, and "COMMAND TERMINAL" in a proportional
 * face above a monospace screen reads as a label somebody stuck on the front of it.
 * The plate, the plate's hue and the vertical rhythm are unchanged, so the three
 * consoles still line up across a scene transition — only the face moves.
 */
export function TerminalHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-full items-center justify-between gap-6"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          aria-hidden="true"
          className="border-panel-edge text-signal flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[3px] border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.08),0_0_18px_-6px_rgb(255_42_42/0.5)]"
          style={{
            background: "linear-gradient(180deg, rgb(255 42 42 / 0.13), rgb(255 42 42 / 0.04))",
          }}
        >
          <Terminal size={20} strokeWidth={1.9} />
        </span>

        <div className="min-w-0">
          <h1 className="text-t1 truncate font-mono text-[23px] leading-none font-medium tracking-[0.01em] uppercase @2xl:text-[27px]">
            Command Terminal
          </h1>
          <p className="mt-2 truncate font-mono text-[12px] leading-none text-[#a9b4c0]">
            Type &apos;help&apos; to see available commands
          </p>
        </div>
      </div>

      {/* SESSION: SECURE — a fact, not a badge.
          Everything this terminal does happens in the reader's own browser: there
          is no socket, no shell and nothing typed here leaves the tab. That is
          worth stating plainly on a screen deliberately dressed as a remote
          session, which is why the tooltip says it in words instead of leaving a
          green lamp to imply something stronger than the truth. */}
      <div
        title="This terminal runs entirely in your browser. Nothing you type is sent anywhere."
        className="border-panel-edge flex shrink-0 items-center gap-2.5 rounded-[3px] border bg-[rgb(6_8_12/0.6)] px-4 py-3 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]"
      >
        <Lock size={15} strokeWidth={1.8} aria-hidden="true" className="text-nominal shrink-0" />
        <span className="text-t2 tracking-micro font-mono text-[11px] leading-none uppercase">
          Session:
        </span>
        <span className="text-nominal tracking-micro font-mono text-[11px] leading-none uppercase">
          Secure
        </span>
      </div>
    </motion.header>
  );
}
