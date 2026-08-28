"use client";

import { Maximize2, Minimize2, Plus } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { PROMPT } from "./data";
import type { ScrollbackLine, Tone } from "./types";
import type { TerminalSession } from "./useTerminalSession";

/**
 * THE SEVEN TONES, RESOLVED HERE AND NOWHERE ELSE.
 *
 * Sampled off the reference rather than invented: the prompt and headings are a
 * mint green (#3fd68d), the echoed command is the deck's own signal red, and body
 * copy sits one step under white. That green is the only colour on this console
 * that is not already in the deck's palette, and it earns its place — it is the
 * convention every shell on earth uses for a prompt, and a terminal whose prompt
 * is grey does not read as a terminal.
 */
const TONE_CLASS: Record<Tone, string> = {
  text: "text-[#ccd5df]",
  dim: "text-[#868e98]",
  green: "text-[#3fd68d]",
  signal: "text-signal",
  warn: "text-caution",
  nominal: "text-nominal",
  link: "text-[#62b6ff]",
};

export function TerminalWindow({
  session,
  inputRef,
  expanded,
  onToggleExpand,
}: {
  session: TerminalSession;
  /**
   * Owned by <TerminalConsole>, not by this component.
   *
   * The quick-command panel is this window's SIBLING, and clicking a row has to
   * put the caret back on the prompt — otherwise every click leaves focus on the
   * button and the reader has to click the terminal again before they can type.
   * The only place that can see both is their common parent, so the ref is created
   * there and threaded down rather than exposed back up through an imperative
   * handle.
   */
  inputRef: RefObject<HTMLInputElement | null>;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  /**
   * PIN TO THE FOOT ON EVERY NEW LINE.
   *
   * `scrollTop = scrollHeight` in a layout effect rather than `scrollIntoView`:
   * the latter scrolls the nearest scrollable ANCESTOR too, and this console sits
   * inside a scaled design frame, so it would move the whole deck to bring a line
   * into view. Setting the offset directly can only ever move this box.
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [session.lines]);

  return (
    <section
      aria-label="Command terminal"
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[4px] border",
        // THE WINDOW'S EDGE IS RED, unlike every other housing on the deck.
        // The reference makes this the one lit box on the screen and it is right
        // to: the console has exactly one thing you can operate, and the border is
        // what says which one. The shortcut bar and the quick panel beside it stay
        // neutral so the distinction survives.
        "border-[rgb(255_42_42/0.42)]",
        "bg-[linear-gradient(180deg,#080b10_0%,#05070b_100%)]",
        "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.05),0_0_40px_-26px_rgb(255_42_42/0.65)]",
      )}
    >
      {/* TITLE BAR. The prompt again, in red rather than the body's green — it is
          the window's NAME here, not a place you type, and colouring it like the
          live prompt would make the title bar look like a second input. */}
      <header className="border-panel-rule flex shrink-0 items-center gap-3 border-b px-5 py-3.5">
        <span className="text-signal truncate font-mono text-[13px] leading-none">
          {PROMPT}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <TitleBarButton
            label="New session"
            icon={Plus}
            onClick={() => {
              session.newSession();
              inputRef.current?.focus();
            }}
          />
          <TitleBarButton
            label={expanded ? "Show quick commands" : "Expand terminal"}
            icon={expanded ? Minimize2 : Maximize2}
            onClick={onToggleExpand}
          />
        </div>
      </header>

      {/* THE WHOLE BODY IS A FOCUS TARGET. Clicking dead space in a terminal puts
          the caret back on the prompt — a body where only the 8px input strip
          accepts a click is the single most obvious way to make this read as a
          picture of a terminal. `onMouseDown` rather than `onClick` so it does not
          steal a text selection the reader is making. */}
      <div
        ref={scrollRef}
        onMouseDown={(event) => {
          if (window.getSelection()?.toString()) return;
          if (event.target instanceof HTMLElement && event.target.closest("button")) return;
          inputRef.current?.focus();
        }}
        className="deck-scroll min-h-0 flex-1 cursor-text overflow-y-auto px-5 py-4 font-mono text-[13px] leading-[1.72]"
      >
        {session.lines.map((line) => (
          <Line key={line.id} line={line} />
        ))}

        {/* The live prompt is INSIDE the scroller, as the last line — that is what
            makes it scroll away with the scrollback rather than sitting pinned at
            the foot like a chat composer. A terminal's input is not a fixture; it
            is the bottom of the transcript. */}
        <div className="flex items-baseline">
          <Prompt />
          <span className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              // Read by <TerminalScene>'s Escape handler to tell "release the
              // caret" from "leave the scene". See the note there.
              data-terminal-input="true"
              value={session.input}
              onChange={(event) => session.setInput(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  session.submit();
                  return;
                }
                if (event.key === "Tab") {
                  // Without this, TAB leaves the terminal for the next focusable
                  // element — which is the one key a terminal must own.
                  event.preventDefault();
                  session.complete();
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  session.recall(-1);
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  session.recall(1);
                  return;
                }
                if (event.key === "Escape") {
                  event.currentTarget.blur();
                  return;
                }
                if (event.ctrlKey && event.key.toLowerCase() === "l") {
                  // CTRL+L is the browser's "focus the address bar". Taking it is
                  // the correct trade inside a terminal — it is the muscle memory
                  // this screen exists to reward — and it is taken only while the
                  // caret is in the prompt.
                  event.preventDefault();
                  session.clearScreen();
                  return;
                }
                if (event.ctrlKey && event.key.toLowerCase() === "k") {
                  event.preventDefault();
                  session.clearLine();
                }
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              aria-label="Terminal input"
              className="text-signal w-full bg-transparent font-mono text-[13px] leading-[1.72] caret-[#3fd68d] outline-none"
            />

            {/* BLOCK CURSOR, ONLY ON AN EMPTY LINE — and that limit is honest
                rather than lazy. Drawing a block at an arbitrary caret position
                means mirroring the input's text and measuring it, and the mirror
                goes wrong the moment the reader presses ← to edit mid-string: the
                block would sit at the end while the real caret is in the middle.
                Empty is the one position where the block is guaranteed correct,
                and it is the state the reader is looking at when the console
                arrives. Typing hands over to the native caret, tinted the same
                green so the changeover reads as one cursor. */}
            {session.input === "" && focused && (
              <span
                aria-hidden="true"
                className="term-caret pointer-events-none absolute top-[0.16em] left-0 h-[1.05em] w-[7px] bg-[#3fd68d]"
              />
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

function Prompt() {
  return (
    <span className="shrink-0 whitespace-pre font-mono text-[13px] leading-[1.72]">
      <span className="text-[#3fd68d]">{PROMPT}</span>
      <span className="text-[#c2c8d0]">$ </span>
    </span>
  );
}

function Line({ line }: { line: ScrollbackLine }) {
  if (line.kind === "input") {
    return (
      <div className="flex items-baseline">
        <Prompt />
        <span className="text-signal min-w-0 break-all">{line.text}</span>
      </div>
    );
  }

  // A blank line still has to occupy a row, and an empty <div> collapses to zero
  // height — hence the non-breaking space rather than `min-h`, which would have to
  // be kept in step with the line height by hand.
  if (line.segments.length === 0) return <div>&nbsp;</div>;

  return (
    <div className="whitespace-pre-wrap">
      {line.segments.map((segment, index) => (
        <span key={index} className={TONE_CLASS[segment.tone ?? "text"]}>
          {segment.text}
        </span>
      ))}
    </div>
  );
}

function TitleBarButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof Plus;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="text-t3 hover:text-t1 focus-visible:ring-signal/70 rounded-[3px] p-1.5 outline-none transition-colors duration-200 hover:bg-[rgb(190_205_220/0.06)] focus-visible:ring-2"
    >
      <Icon size={15} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}
