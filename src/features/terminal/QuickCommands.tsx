"use client";

import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { HudPanel } from "@/features/hud/HudPanel";
import { PANEL_ICON_SIZE, PANEL_LABEL } from "@/features/systems/panelStyle";
import { VISIBLE_COMMANDS } from "./registry";
import type { CommandSpec } from "./types";

/**
 * THE PANEL IS A VIEW OF THE REGISTRY, NOT A SECOND LIST.
 *
 * Every row here is a `CommandSpec` — its label is `usage ?? name`, its caption is
 * the same `summary` string `help` prints. Hand-writing the twelve rows to match
 * the reference would produce a panel that is correct on the day it ships and wrong
 * the first time a command is renamed, and the failure is silent: the button still
 * sends the old name and the terminal answers "command not found" to its own
 * advertised command.
 *
 * `project <name>` is the one row that cannot be run by clicking, because it needs
 * an argument. It puts the stem on the prompt and leaves the caret after it, which
 * is the honest behaviour — the panel offers the command, the reader supplies the
 * name.
 */
export function QuickCommands({
  onRun,
  onCompose,
}: {
  onRun: (command: string) => void;
  onCompose: (stem: string) => void;
}) {
  return (
    <HudPanel
      label="Quick Commands"
      icon={Terminal}
      iconClassName="text-signal"
      iconSize={PANEL_ICON_SIZE}
      labelClassName={PANEL_LABEL}
      corners
      className="flex h-full min-h-0 flex-col border-[rgb(255_42_42/0.32)]"
      bodyClassName="min-h-0 flex-1 px-3 py-3"
    >
      <ul className="deck-scroll flex h-full min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
        {VISIBLE_COMMANDS.map((command, index) => (
          <Row
            key={command.name}
            command={command}
            index={index}
            onRun={onRun}
            onCompose={onCompose}
          />
        ))}
      </ul>
    </HudPanel>
  );
}

function Row({
  command,
  index,
  onRun,
  onCompose,
}: {
  command: CommandSpec;
  index: number;
  onRun: (command: string) => void;
  onCompose: (stem: string) => void;
}) {
  const takesArgument = command.usage !== undefined;

  return (
    <motion.li
      initial={{ opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: "easeOut", delay: 0.18 + index * 0.028 }}
      className="shrink-0"
    >
      <button
        type="button"
        onClick={() => (takesArgument ? onCompose(`${command.name} `) : onRun(command.name))}
        title={takesArgument ? `${command.usage} — put it on the prompt` : `Run ${command.name}`}
        className="group border-panel-rule focus-visible:ring-signal/70 flex w-full items-center gap-3 rounded-[3px] border bg-[linear-gradient(180deg,#0a0e14,#06080d)] px-3 py-2.5 text-left outline-none transition-colors duration-200 hover:border-[rgb(255_42_42/0.45)] hover:bg-[rgb(255_42_42/0.05)] focus-visible:ring-2"
      >
        <Terminal size={15} strokeWidth={2} aria-hidden="true" className="text-signal shrink-0" />
        <span className="text-t1 truncate font-mono text-[12.5px] leading-none font-medium">
          {command.usage ?? command.name}
        </span>
        <span className="text-t3 ml-auto truncate font-mono text-[11px] leading-none transition-colors duration-200 group-hover:text-[#a9b4c0]">
          {command.summary}
        </span>
      </button>
    </motion.li>
  );
}
