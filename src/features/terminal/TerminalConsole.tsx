"use client";

import { useRef, useState, type CSSProperties } from "react";
import { ConsoleRail } from "@/features/chrome/ConsoleRail";
import { ConsoleSky } from "@/features/systems/ConsoleSky";
import { QuickCommands } from "./QuickCommands";
import { ShortcutBar } from "./ShortcutBar";
import { TerminalHeader } from "./TerminalHeader";
import { TerminalWindow } from "./TerminalWindow";
import { useTerminalSession } from "./useTerminalSession";

/**
 * The same surface block the systems and projects consoles carry, for the same
 * reason: `--panel-fill`, `--panel-border`, `--panel-rule` and the text ramp are
 * plain custom properties, so redeclaring them here re-points every `bg-panel` and
 * `text-t2` INSIDE this scene and nothing outside it. Three consoles, one lighting.
 */
const CONSOLE_SURFACE = {
  "--panel-fill": "rgb(6 8 12 / 0.86)",
  "--panel-border": "rgb(190 205 220 / 0.19)",
  "--panel-rule": "rgb(190 205 220 / 0.13)",
  "--text-secondary": "#a9b4c0",
  "--text-tertiary": "#74808c",
} as CSSProperties;

export function TerminalConsole({ onExit }: { onExit: () => void }) {
  const session = useTerminalSession({ onExit });
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * The title bar's expand button.
   *
   * It hides the quick-command panel rather than going fullscreen over the deck.
   * Fullscreen would mean covering the top bar and the rail — leaving the reader
   * inside a black rectangle with no visible way out, on the one scene where they
   * are most likely to be typing rather than looking for navigation. Taking the
   * panel's 384 units is the useful half of "expand" and costs nothing to undo.
   */
  const [expanded, setExpanded] = useState(false);

  const focusPrompt = () => inputRef.current?.focus();

  return (
    <div className="@container absolute inset-0" style={CONSOLE_SURFACE}>
      <ConsoleSky />

      {/* Scrim under the top bar — the bar is a sibling of the whole scene host, so
          without this the console shows through the gaps between its cells. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[86px] bg-[linear-gradient(to_bottom,#000_0%,#000_62%,transparent_100%)]"
      />

      {/* This console has no full-width bottom band, so unlike the projects rail
          this one runs the whole height of the content column. See `.term-rail`. */}
      <ConsoleRail activeId="terminal" className="term-rail" />

      {/*
        THE VERTICAL BUDGET. 1024 units, top to bottom:

          top bar          14 .. 76     sibling of this scene, not in this column
          pad                     96
          header                  76
          gap                     16
          main                   770    terminal column | quick commands
          footer                  66    also a sibling; this column stops above it

        Inside `main` the left column is the window (flex-1), a 16 gap and the
        56-unit shortcut bar; the right column is the quick panel at full height.
        Both columns therefore start and end on the same two lines, which is what
        the reference does and the reason the panel looks taller than the terminal
        rather than misaligned with it.

        Only the header and the shortcut bar carry authored heights — the window
        and the panel take what is left, so the terminal grows with the frame
        instead of being solved for one.
      */}
      <div className="relative flex h-full flex-col gap-4 px-7 pt-[96px] pb-[66px]">
        <div className="term-header shrink-0 @6xl:pl-[46px]">
          <TerminalHeader />
        </div>

        {/* NO `gap` ON THIS ROW. The panel's own margin is animated to zero when it
            collapses, and a flex gap would leave sixteen units of dead air between
            the terminal and the frame's edge with nothing in it. */}
        <div className="flex min-h-0 flex-1 @6xl:pl-[46px]">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <TerminalWindow
              session={session}
              inputRef={inputRef}
              expanded={expanded}
              onToggleExpand={() => {
                setExpanded((value) => !value);
                focusPrompt();
              }}
            />
            {/* The legend is hidden below the wide tier rather than wrapped. It is a
                single 990-unit row of five key/label pairs; wrapped to two lines it
                takes 112 units off the terminal — the one element on this screen
                that benefits from height — to restate bindings `help` already
                prints. */}
            <div className="term-shortcuts hidden shrink-0 @6xl:block">
              <ShortcutBar />
            </div>
          </div>

          {/*
            THE PANEL IS UNMOUNTED, AND THE TOGGLE SNAPS. That is the answer after
            three animated constructions failed, and it is worth recording which
            ones so nobody rebuilds them.

            An <AnimatePresence> around a conditional child never fired its exit:
            the button toggled, `inert` flipped, and the panel stayed at full
            opacity — with `mode="wait"`, with `sync`, and with the child keyed.
            A permanently mounted `motion.div` animating `width` wrote `384px` once
            on mount and never again. A CSS transition on `width` did not move it
            either, and that last one is the informative failure: with the class
            applied, the rule matched and `min-width: 0` computing to `0px`, the
            element still measured 384 — and it kept measuring 384 with
            `width: 0 !important` set inline. Something in this flex row refuses to
            let the item resolve below its content's fixed 384, and chasing it
            further buys nothing the reader can see.

            `display: none` removes it cleanly, which is what a conditional render
            does. So the panel is simply not rendered when collapsed. A snap on a
            layout toggle is normal — no productivity tool animates a sidebar out
            of the way and waits — and it removes every one of the failure modes
            above. It is also the most correct version for accessibility: an
            unmounted panel needs no `inert`, cannot hold focus, and is not in the
            accessibility tree, all without a second mechanism to keep in step.
          */}
          {!expanded && (
            <div className="ml-4 hidden w-[384px] shrink-0 @5xl:block">
              <QuickCommands
                onRun={(command) => {
                  session.run(command);
                  focusPrompt();
                }}
                onCompose={(stem) => {
                  session.setInput(stem);
                  focusPrompt();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
