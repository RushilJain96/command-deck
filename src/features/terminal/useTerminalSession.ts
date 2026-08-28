"use client";

import { useRef, useState } from "react";
import { lookup, unknownCommand, VISIBLE_COMMANDS } from "./registry";
import type { CommandIO, OutputLine, ScrollbackLine, Segment } from "./types";

/**
 * Line ids come from a module counter rather than from the array index.
 *
 * React keys off these, and the index is not stable: `clear` empties the list and
 * the next command's output takes ids 0..n again, so React reuses the DOM nodes of
 * the cleared output for the new output and the enter animation never plays. A
 * monotonic counter has no such collision. Two terminals sharing one counter is
 * harmless — the ids only have to be unique, not dense.
 */
let lineCounter = 0;
const nextId = () => (lineCounter += 1);

const seg = (text: string, tone?: Segment["tone"]): Segment => ({ text, tone });

/**
 * THE SESSION OPENS WITH `help` ALREADY RUN.
 *
 * The reference shows it that way and it is the right behaviour for a portfolio
 * terminal: a bare prompt on a black screen is a puzzle, and the one thing every
 * visitor needs is the list of what they are allowed to type. It is echoed as a
 * real command rather than printed as a banner because that is what it is — the
 * session ran `help` for you, and pretending otherwise would mean the scrollback
 * contained output with no command above it, which no terminal ever shows.
 */
function seedSession(): ScrollbackLine[] {
  const helpCommand = lookup("help");
  const output = helpCommand
    ? helpCommand.run([], {
        clear: () => {},
        exit: () => {},
        open: () => {},
        history: [],
      })
    : [];
  // Framed the same way `append` frames every other command — see the note there.
  return [
    { id: nextId(), kind: "input", text: "help" },
    { id: nextId(), kind: "output", segments: [] },
    ...output.map((segments) => ({ id: nextId(), kind: "output" as const, segments })),
    { id: nextId(), kind: "output", segments: [] },
  ];
}

/** The longest string every candidate starts with — what TAB fills in on ambiguity. */
function commonPrefix(values: readonly string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (const value of values.slice(1)) {
    while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export interface TerminalSession {
  readonly lines: readonly ScrollbackLine[];
  readonly input: string;
  readonly setInput: (value: string) => void;
  /**
   * Execute a command string directly, without it having passed through the input.
   *
   * The quick-command panel needs this. Setting the input and then calling
   * `submit()` does not work and the reason is worth stating: `setInput` is
   * asynchronous, so `submit` would read the PREVIOUS value and run whatever was
   * on the prompt before the click. Sharing one `run` between the panel and the
   * Enter key means both paths append the same echo line and touch history the
   * same way, which is what makes a clicked command indistinguishable from a typed
   * one in the scrollback — as it should be, since it is the same command.
   */
  readonly run: (text: string) => void;
  readonly submit: () => void;
  readonly recall: (direction: -1 | 1) => void;
  readonly complete: () => void;
  readonly clearScreen: () => void;
  readonly clearLine: () => void;
  readonly newSession: () => void;
}

export function useTerminalSession({ onExit }: { onExit: () => void }): TerminalSession {
  const [lines, setLines] = useState<ScrollbackLine[]>(seedSession);
  const [history, setHistory] = useState<readonly string[]>([]);
  const [input, setInput] = useState("");

  /**
   * `null` means the caret is on the live draft rather than anywhere in history.
   * Modelling it as an index into the array with a null sentinel — rather than as
   * an offset from the end — is what preserves the draft: walking up to an old
   * command and back down restores what was half-typed, which is what every shell
   * does and what makes ArrowUp safe to press mid-thought.
   */
  const [recallIndex, setRecallIndex] = useState<number | null>(null);

  /**
   * The one ref, and it holds something that is genuinely not render state: the
   * half-typed line parked while the reader walks history. Nothing displays it —
   * it is only ever read back into `input` on the way down — so putting it in
   * state would re-render on a value no pixel depends on.
   *
   * It is written from event handlers only. An earlier version also mirrored
   * `history` and `onExit` into refs to keep the command `io` current; those are
   * gone. Writing a ref during render is what `react-hooks/refs` forbids, and they
   * were never needed — every function below is a plain closure recreated each
   * render, so it already sees the current values. The React Compiler handles the
   * memoization that `useCallback` used to be here for.
   */
  const draftRef = useRef("");

  /**
   * A COMMAND'S OUTPUT IS FRAMED BY BLANK LINES, and that is a renderer decision
   * rather than each command's business.
   *
   * Without it the scrollback is a solid wall: the echoed command, its output and
   * the next prompt all sit on consecutive lines, and after three commands there is
   * no visual seam between one answer and the next. Every command could open and
   * close with `BLANK` itself — the first draft did — but then thirteen commands
   * each carry two lines of formatting that exist purely to space them from their
   * neighbours, and the one that forgets is the one that looks broken.
   *
   * Done here, the rhythm is a property of the transcript and no command can opt
   * out of it by accident.
   */
  const append = (echo: string | null, output: readonly OutputLine[], reset: boolean) => {
    setLines((previous) => {
      const next: ScrollbackLine[] = reset ? [] : [...previous];
      if (!reset && echo !== null) next.push({ id: nextId(), kind: "input", text: echo });
      const framed = echo !== null && output.length > 0;
      if (framed) next.push({ id: nextId(), kind: "output", segments: [] });
      for (const segments of output) next.push({ id: nextId(), kind: "output", segments });
      if (framed) next.push({ id: nextId(), kind: "output", segments: [] });
      return next;
    });
  };

  const run = (raw: string) => {
    const text = raw.trim();
    setInput("");
    setRecallIndex(null);
    draftRef.current = "";

    // An empty line still echoes a prompt and prints nothing, which is what a
    // shell does. Skipping it entirely makes Enter feel broken.
    if (text === "") {
      append("", [], false);
      return;
    }

    setHistory((previous) =>
      // Consecutive duplicates are not recorded — pressing Enter twice on the same
      // command should not mean pressing ArrowUp twice to get past it.
      previous[previous.length - 1] === text ? previous : [...previous, text],
    );

    const [name, ...args] = text.split(/\s+/);

    // `cleared` is set by the command through `io` and read after `run` returns.
    // The alternative — clearing from inside the state updater — would run a
    // command's side effects during a render, which is the same rule this project
    // keeps elsewhere about MotionValues, for the same reason.
    let cleared = false;
    const io: CommandIO = {
      clear: () => {
        cleared = true;
      },
      exit: onExit,
      open: (url) => window.open(url, "_blank", "noopener,noreferrer"),
      history,
    };

    const command = lookup(name);
    const output = command ? command.run(args, io) : unknownCommand(name);
    append(text, output, cleared);
  };

  const submit = () => run(input);

  /**
   * The next index is computed BEFORE either setter is called, rather than calling
   * `setInput` from inside a `setRecallIndex` updater.
   *
   * An updater has to be a pure function of the previous state: React is entitled
   * to run it twice, and does in StrictMode. Setting the input from inside one
   * means the second invocation repeats that write — harmless here by luck, since
   * the value is the same, and exactly the kind of luck that stops holding the
   * moment the body grows.
   */
  const recall = (direction: -1 | 1) => {
    if (history.length === 0) return;

    let next: number | null;
    if (recallIndex === null) {
      // Already on the live draft: ArrowDown has nowhere further to go.
      if (direction === 1) return;
      draftRef.current = input;
      next = history.length - 1;
    } else {
      const candidate = recallIndex + direction;
      // Walking off the top stops at the oldest command; walking off the bottom
      // returns whatever was half-typed.
      next = candidate < 0 ? 0 : candidate > history.length - 1 ? null : candidate;
    }

    setRecallIndex(next);
    setInput(next === null ? draftRef.current : history[next]);
  };

  /**
   * TAB, and it completes ARGUMENTS as well as command names.
   *
   * Completing only the verb is the half of this that is easy and the half nobody
   * needs — `pro` + TAB saves four keystrokes, while `project or` + TAB is the one
   * that saves a reader from having to remember whether the card said "Orion STEM"
   * or "orion-stem". That second branch is why the registry carries `completeArg`
   * at all.
   *
   * On an ambiguous stem it fills the common prefix AND prints the candidates,
   * which is bash's behaviour and the only version that teaches anything.
   */
  const complete = () => {
    const parts = input.split(/\s+/);
    const typingArgument = /\s/.test(input);

    if (!typingArgument) {
      const stem = parts[0].toLowerCase();
      const matches = VISIBLE_COMMANDS.filter((command) => command.name.startsWith(stem));
      if (matches.length === 0) return;
      if (matches.length === 1) {
        const only = matches[0];
        // A command that takes an argument completes to `name ` with the space
        // already typed, because the reader's next keystroke is always the operand.
        setInput(only.completeArg ? `${only.name} ` : only.name);
        return;
      }
      setInput(commonPrefix(matches.map((command) => command.name)));
      append(null, [[], [seg(matches.map((command) => command.name).join("   "), "dim")]], false);
      return;
    }

    const command = lookup(parts[0]);
    if (!command?.completeArg) return;

    const matches = command.completeArg(parts.slice(1).join(" "));
    if (matches.length === 0) return;
    if (matches.length === 1) {
      setInput(`${command.name} ${matches[0]}`);
      return;
    }
    setInput(`${command.name} ${commonPrefix(matches)}`);
    append(null, [[], [seg(matches.join("   "), "dim")]], false);
  };

  const clearScreen = () => setLines([]);

  const clearLine = () => {
    setInput("");
    setRecallIndex(null);
    draftRef.current = "";
  };

  /**
   * The title bar's `+`. A NEW SESSION, not a clear: the scrollback goes back to
   * the opening `help` and the history is emptied, because a session that still
   * remembers what the last one typed is the same session with a tidier screen.
   */
  const newSession = () => {
    setLines(seedSession());
    setHistory([]);
    setInput("");
    setRecallIndex(null);
    draftRef.current = "";
  };

  return {
    lines,
    input,
    setInput,
    run,
    submit,
    recall,
    complete,
    clearScreen,
    clearLine,
    newSession,
  };
}
