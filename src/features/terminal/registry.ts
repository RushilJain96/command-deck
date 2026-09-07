import { CHANNELS, PUBLISHED_CHANNELS } from "@/features/contact/data";
import { PROJECTS, TAG_ALIAS } from "@/features/projects/data";
import { STATUS_LABEL } from "@/features/projects/types";
import { CAPABILITIES, DAILY_TOOLS, SYSTEM_DOMAINS, TECHNOLOGIES } from "@/features/systems/data";
import { PROFILE, PROFILE_COUNTS, RESUME_PATH, TIMELINE } from "./data";
import type { CommandSpec, OutputLine, Segment, Tone } from "./types";

/**
 * THE COMMAND TABLE — the terminal's only source of truth about itself.
 *
 * `help` iterates this array. So does the quick-command panel. So does TAB
 * completion. Which means a command cannot be added without appearing in all
 * three, cannot be removed while still being advertised, and cannot describe
 * itself one way in the panel and another in `help` — every one of those was a
 * separate hand-maintained list in the first sketch, and two of them were already
 * out of step before it ran.
 *
 * Commands read the CONSOLES' data rather than keeping their own. `projects` walks
 * `projects/data.ts`, `skills` walks `systems/data.ts`. A terminal with its own
 * copy of the roster is a terminal that will one day disagree with the screen next
 * to it about how many projects exist.
 */

// ------------------------------------------------------------------ builders

const seg = (text: string, tone?: Tone): Segment => ({ text, tone });
const line = (...segments: Segment[]): OutputLine => segments;
const BLANK: OutputLine = [];

/**
 * Fixed-width padding, which only works because every glyph in this scene is set
 * in Geist Mono. If the terminal ever renders in a proportional face, every column
 * below silently becomes ragged — that is the coupling, stated so it is not a
 * surprise.
 */
const pad = (text: string, width: number) => text.padEnd(width, " ");

/**
 * A `KEY   value` row, used by every readout-shaped command.
 *
 * FOURTEEN, NOT TWELVE. `CAPABILITIES` is exactly twelve characters, so a
 * twelve-wide column printed `CAPABILITIES8` with the value welded to the key.
 * The column must be wider than the longest key any command passes, not equal to
 * it — this is the whole failure mode of hand-set monospace columns, and the fix
 * is two units of headroom rather than a lucky number.
 */
const field = (key: string, value: string, tone: Tone = "text"): OutputLine =>
  line(seg(pad(key, 14), "dim"), seg(value, tone));

const heading = (text: string): OutputLine => line(seg(text, "green"));

/** Status words keep the console's tones: shipped is green, moving is amber. */
const statusTone = (status: string): Tone =>
  status === "PRODUCTION" ? "nominal" : status === "BETA" ? "link" : "warn";

/**
 * Match a typed argument to a project.
 *
 * Punctuation-insensitive on both sides, so `orion-stem`, `Orion STEM` and
 * `orionstem` all land on the same card. A reader who has just seen "ORION STEM"
 * on the projects console will type it with the space, and a reader who saw the id
 * will not; refusing one of them is a failure the terminal has no reason to have.
 */
const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const findProject = (query: string) => {
  const needle = normalise(query);
  if (needle === "") return undefined;
  return (
    PROJECTS.find((project) => normalise(project.id) === needle) ??
    PROJECTS.find((project) => normalise(project.name) === needle) ??
    PROJECTS.find((project) => normalise(project.name).startsWith(needle))
  );
};

// ------------------------------------------------------------------ commands

const about: CommandSpec = {
  name: "about",
  summary: "System overview",
  run: () => [
    heading("System profile"),
    BLANK,
    field("OPERATOR", PROFILE.operator),
    field("ROLE", PROFILE.role),
    field("FOCUS", PROFILE.focus, "green"),
    BLANK,
    // The operator's own paragraphs, wrapped by the terminal rather than by the
    // data — the bio is written as prose and this is the one surface that has to
    // print it into a fixed-width column.
    ...PROFILE.bio.map((paragraph) => line(seg(paragraph, "text"))),
    BLANK,
    field(
      "ROSTER",
      `${PROFILE_COUNTS.projects} projects, ${PROFILE_COUNTS.production} in production`,
      "dim",
    ),
    field(
      "SYSTEMS",
      `${PROFILE_COUNTS.domains} domains, ${PROFILE_COUNTS.technologies} technologies, ${PROFILE_COUNTS.tools} tools`,
      "dim",
    ),
    field("CAPABILITIES", String(PROFILE_COUNTS.capabilities), "dim"),
    BLANK,
    line(seg("Run ", "dim"), seg("projects", "green"), seg(" to list the roster.", "dim")),
  ],
};

const projects: CommandSpec = {
  name: "projects",
  summary: "List all projects",
  run: () => [
    heading(`Engineering projects (${PROJECTS.length}):`),
    BLANK,
    ...PROJECTS.map((project) =>
      line(
        seg("  "),
        seg(pad(project.name.toUpperCase(), 14), "green"),
        seg(pad(String(project.year), 6), "dim"),
        seg(pad(STATUS_LABEL[project.status], 14), statusTone(project.status)),
        seg(project.kind, "text"),
      ),
    ),
    BLANK,
    line(
      seg("Run ", "dim"),
      seg("project <name>", "green"),
      seg(" for the detail of any one of them.", "dim"),
    ),
  ],
};

const project: CommandSpec = {
  name: "project",
  usage: "project <name>",
  summary: "View project details",
  completeArg: (partial) => {
    const needle = normalise(partial);
    return PROJECTS.filter((entry) => normalise(entry.name).startsWith(needle)).map(
      (entry) => entry.id,
    );
  },
  run: (args) => {
    if (args.length === 0) {
      return [
        line(seg("project: missing operand", "warn")),
        line(seg("Usage: ", "dim"), seg("project <name>", "green")),
        BLANK,
        line(seg("Known: ", "dim"), seg(PROJECTS.map((entry) => entry.id).join(", "), "dim")),
      ];
    }

    const query = args.join(" ");
    const found = findProject(query);
    if (!found) {
      return [
        line(seg(`project: no such project: ${query}`, "warn")),
        line(seg("Run ", "dim"), seg("projects", "green"), seg(" to see the roster.", "dim")),
      ];
    }

    return [
      line(seg(found.name.toUpperCase(), "green"), seg(`  ${found.kind}`, "dim")),
      BLANK,
      line(seg(found.summary, "text")),
      BLANK,
      field("YEAR", String(found.year), "dim"),
      field("STATUS", STATUS_LABEL[found.status], statusTone(found.status)),
      field("FEATURED", found.featured ? "yes" : "no", "dim"),
      // The full stack, not the card's first four — the card truncates because it
      // is 345 units wide, and this is the place a reader comes to for what the
      // card could not show.
      field("STACK", found.stack.map((entry) => TAG_ALIAS[entry] ?? entry).join(", "), "dim"),
      field("DOMAINS", found.categories.join(", "), "dim"),
      ...(found.href === null
        ? [BLANK, line(seg("No public repository for this system.", "dim"))]
        : [BLANK, line(seg(found.href, "link"))]),
    ];
  },
};

const skills: CommandSpec = {
  name: "skills",
  summary: "Technical expertise",
  run: () => [
    heading(`Engineering domains (${SYSTEM_DOMAINS.length}):`),
    BLANK,
    ...SYSTEM_DOMAINS.map((domain) =>
      line(
        seg("  "),
        seg(pad(domain.label, 24), "green"),
        seg(domain.stack.slice(0, 4).join(", "), "dim"),
      ),
    ),
    BLANK,
    heading(`Capabilities (${CAPABILITIES.length}):`),
    BLANK,
    line(seg("  "), seg(CAPABILITIES.map((entry) => entry.label).join(" · "), "text")),
    BLANK,
    field("TECHNOLOGIES", String(TECHNOLOGIES.length), "dim"),
    field("TOOLS", String(DAILY_TOOLS.length), "dim"),
    BLANK,
    line(seg("The SYSTEMS console shows all of this with the marks.", "dim")),
  ],
};

const timeline: CommandSpec = {
  name: "timeline",
  summary: "Engineering timeline",
  run: () => [
    heading("Engineering journey:"),
    BLANK,
    ...TIMELINE.flatMap((entry) => [
      line(
        seg("  "),
        seg(pad(entry.year, 8), "green"),
        seg(pad(entry.title, 30), "text"),
        seg(entry.period, "dim"),
      ),
      ...(entry.org === null
        ? []
        : [line(seg("  "), seg(pad("", 8)), seg(entry.org, "dim"))]),
      BLANK,
    ]),
    line(seg("The TIMELINE console shows the same journey with its rail.", "dim")),
  ],
};

const resume: CommandSpec = {
  name: "resume",
  summary: "Download resume",
  run: (_args, io) => {
    io.open(RESUME_PATH);
    return [
      line(seg("Opening ", "dim"), seg(RESUME_PATH, "link"), seg(" ...", "dim")),
      line(seg("If nothing downloaded, the file has not been published yet.", "dim")),
    ];
  },
};

/**
 * `github` and `linkedin` are the same command twice, so they are built once — and
 * both read the CHANNEL ROSTER rather than `links.ts`.
 *
 * `linkedin` is why. The roster deliberately has no address for it, while
 * `links.ts` still carries a bare `linkedin.com` host under its own TODO. Reading
 * the latter would mean `contact` printing "not published yet" and `linkedin`
 * cheerfully opening a tab to LinkedIn's front page two lines later — the terminal
 * disagreeing with itself inside one session. An unresolved channel says so and
 * opens nothing.
 */
function outboundCommand(id: string, summary: string): CommandSpec {
  return {
    name: id,
    summary,
    run: (_args, io) => {
      const channel = CHANNELS.find((entry) => entry.id === id);
      if (!channel) return [line(seg(`${id}: no channel configured`, "warn"))];
      if (channel.href === null) {
        return [
          line(seg(`${channel.label} is not published yet.`, "warn")),
          line(seg("Run ", "dim"), seg("contact", "green"), seg(" for what is.", "dim")),
        ];
      }
      io.open(channel.href);
      return [line(seg("Opening ", "dim"), seg(channel.href, "link"), seg(" ...", "dim"))];
    },
  };
}

/**
 * `contact` READS THE ABOUT CONSOLE'S CHANNEL ROSTER, not `links.ts`.
 *
 * Two of those channels have no confirmed address yet and that console deliberately
 * declines to guess one. If this command printed `links.ts` instead, the terminal
 * would hand out an address the screen next to it is refusing to publish — which is
 * the exact failure the roster's `href: null` exists to prevent, reintroduced by a
 * different door.
 */
const contact: CommandSpec = {
  name: "contact",
  summary: "Get in touch",
  run: () => [
    heading("Contact:"),
    BLANK,
    // Published only, matching the console. The terminal printing "not published
    // yet" for a row the About page has stopped drawing would put the site's own
    // unfinished business back on screen through a different door.
    ...PUBLISHED_CHANNELS.map((channel) =>
      line(seg("  "), seg(pad(channel.label, 12), "green"), seg(channel.handle ?? "", "link")),
    ),
    BLANK,
    line(seg("Or run ", "dim"), seg("github", "green"), seg(" to open it.", "dim")),
  ],
};

const clear: CommandSpec = {
  name: "clear",
  summary: "Clear terminal",
  run: (_args, io) => {
    io.clear();
    return [];
  },
};

const history: CommandSpec = {
  name: "history",
  summary: "Command history",
  run: (_args, io) => {
    if (io.history.length === 0) return [line(seg("No commands yet this session.", "dim"))];
    return io.history.map((entry, index) =>
      line(seg(pad(String(index + 1), 6), "dim"), seg(entry, "text")),
    );
  },
};

const help: CommandSpec = {
  name: "help",
  summary: "Show help message",
  run: () => {
    const listed = COMMANDS.filter((command) => !command.hidden);
    // The dash column is solved from the widest entry rather than hard-coded, so
    // adding `deploy <target>` does not silently break the alignment of the other
    // twelve rows.
    const width = Math.max(...listed.map((command) => (command.usage ?? command.name).length)) + 2;
    return [
      heading("Available commands:"),
      BLANK,
      ...listed.map((command) =>
        line(
          seg("  "),
          seg(pad(command.usage ?? command.name, width), "green"),
          seg("- ", "dim"),
          seg(command.summary, "text"),
        ),
      ),
      BLANK,
      line(seg("TAB completes · ↑ ↓ recalls · ESC releases the caret to the top bar.", "dim")),
    ];
  },
};

const exit: CommandSpec = {
  name: "exit",
  summary: "Exit terminal",
  run: (_args, io) => {
    io.exit();
    return [line(seg("Returning to Mission Control ...", "dim"))];
  },
};

/**
 * HIDDEN ALIASES. They do not appear in `help` or the quick panel, and that is the
 * point — the visible surface stays the thirteen commands the reference advertises,
 * while the two things a person with a shell in their fingers will try anyway do
 * not produce an error.
 */
const aliases: readonly CommandSpec[] = [
  { ...projects, name: "ls", hidden: true },
  { ...about, name: "whoami", hidden: true },
  { ...help, name: "?", hidden: true },
  { ...exit, name: "quit", hidden: true },
];

export const COMMANDS: readonly CommandSpec[] = [
  about,
  projects,
  project,
  skills,
  timeline,
  resume,
  outboundCommand("github", "GitHub profile"),
  outboundCommand("linkedin", "LinkedIn profile"),
  contact,
  clear,
  history,
  help,
  exit,
  ...aliases,
];

const BY_NAME = new Map(COMMANDS.map((command) => [command.name, command]));

export const VISIBLE_COMMANDS = COMMANDS.filter((command) => !command.hidden);

export function lookup(name: string): CommandSpec | undefined {
  return BY_NAME.get(name.toLowerCase());
}

/**
 * What an unknown word produces.
 *
 * It suggests the nearest command by prefix rather than just refusing. A terminal
 * that answers "command not found" and stops is correct and useless; `proj` almost
 * certainly meant `projects`, and saying so is the difference between a prompt
 * that teaches its own vocabulary and one that makes you go read the panel.
 */
export function unknownCommand(name: string): readonly OutputLine[] {
  const guess = VISIBLE_COMMANDS.find((command) => command.name.startsWith(name.toLowerCase()));
  return [
    // `terminal: <word>: command not found`, the shape every shell uses: the
    // program names itself, then the thing it could not resolve. An earlier
    // version led with the full prompt string, which read as the HOSTNAME being
    // at fault rather than the word that was typed.
    line(seg("terminal: ", "dim"), seg(name, "warn"), seg(": command not found", "dim")),
    ...(guess
      ? [line(seg("Did you mean ", "dim"), seg(guess.name, "green"), seg("?", "dim"))]
      : [line(seg("Run ", "dim"), seg("help", "green"), seg(" for the command list.", "dim"))]),
  ];
}
