/**
 * THE TERMINAL'S OUTPUT MODEL.
 *
 * Commands return DATA — arrays of tinted segments — not JSX. That boundary is the
 * whole design, and it buys three things that a `run()` returning markup does not:
 *
 *   `help` and the quick-command panel are both generated from the same registry,
 *   so a command cannot exist without appearing in both, and its description cannot
 *   say two different things in two places.
 *
 *   The renderer owns every colour. A command that wanted to be blue would have to
 *   add a tone to the closed union below, which is a decision someone makes on
 *   purpose rather than a hex code that drifts into one output block.
 *
 *   Output can be measured, searched and replayed without mounting anything.
 *
 * The cost is that no command can draw a box or a chart. That is intentional: this
 * is a terminal, and a terminal that renders components is a panel with a prompt
 * glued to it.
 */

/**
 * The seven tints, mapped to real colours in <TerminalStream>.
 *
 * They are named for their ROLE, not their colour — `signal` rather than `red` —
 * so a change to the deck's palette does not leave a segment called "green"
 * rendering in amber. `green` is the one exception and it is deliberate: it is the
 * terminal's own convention colour, the one every shell on earth uses for the
 * prompt, and calling it `prompt` would be wrong the moment a heading uses it.
 */
export type Tone = "text" | "dim" | "green" | "signal" | "warn" | "nominal" | "link";

export interface Segment {
  readonly text: string;
  readonly tone?: Tone;
}

/** One line of output. An empty `segments` array is a blank line, and is common. */
export type OutputLine = readonly Segment[];

/**
 * A line in the scrollback.
 *
 * `input` lines are kept as the raw string rather than as pre-rendered segments so
 * the echoed prompt is drawn by the renderer, in one place, exactly as the live
 * prompt below it is. Storing them as segments meant the two prompts could be
 * styled differently, and at one point they were.
 */
export type ScrollbackLine =
  | { readonly id: number; readonly kind: "input"; readonly text: string }
  | { readonly id: number; readonly kind: "output"; readonly segments: OutputLine };

/**
 * What a command is allowed to do besides print.
 *
 * A narrow, explicit surface rather than handing commands the dispatch function:
 * `exit` should be able to leave the scene and `github` should be able to open a
 * tab, but neither should be able to change the scene to something arbitrary or
 * reach into app state. Everything a command can do to the world outside its own
 * output is on this interface, which makes the answer to "what can typing a
 * command actually do" a fifteen-line read.
 */
export interface CommandIO {
  /** Empty the scrollback. */
  readonly clear: () => void;
  /** Leave the terminal for Mission Control. */
  readonly exit: () => void;
  /** Open an external URL in a new tab. */
  readonly open: (url: string) => void;
  /** Commands already run this session, oldest first. */
  readonly history: readonly string[];
}

export interface CommandSpec {
  /** The word typed. Lower case, no spaces — arguments are parsed off separately. */
  readonly name: string;
  /** How it is written in help and in the quick panel, e.g. `project <name>`. */
  readonly usage?: string;
  /** One line, used by BOTH `help` and the quick-command panel. */
  readonly summary: string;
  readonly run: (args: readonly string[], io: CommandIO) => readonly OutputLine[];
  /**
   * Argument completion for TAB. Returns candidates for the partial argument.
   * Absent means the command takes no arguments worth completing.
   */
  readonly completeArg?: (partial: string) => readonly string[];
  /** Kept out of `help` and the quick panel. Easter eggs and aliases live here. */
  readonly hidden?: boolean;
}
