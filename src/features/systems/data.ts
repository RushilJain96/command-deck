import {
  Activity,
  Blocks,
  Braces,
  Brain,
  Cloud,
  CloudCog,
  Container,
  Database,
  FileCode,
  GitMerge,
  ListChecks,
  MessageSquare,
  Network,
  Server,
  ShieldCheck,
  SquareTerminal,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  siApachekafka,
  siDiscord,
  siDjango,
  siDocker,
  siFastapi,
  siFigma,
  siGit,
  siGoogledrive,
  siJupyter,
  siKubernetes,
  siLangchain,
  siLinux,
  siMongodb,
  siNginx,
  siNotion,
  siObsidian,
  siPandas,
  siPostgresql,
  siPostman,
  siPycharm,
  siPython,
  siPytorch,
  siRedis,
  siScikitlearn,
  siTerraform,
} from "simple-icons";
import type { Glyph } from "./Mark";

/**
 * THE SYSTEMS CONSOLE'S ONLY SOURCE OF CONTENT.
 *
 * Same contract `missions/data.ts` holds for the deck: adding a technology,
 * renaming a domain or re-staging an exploration track never requires opening a
 * component. Every list below is read once, by one presenter.
 *
 * NOTHING HERE ASSERTS A MEASUREMENT. There are no proficiency percentages, no
 * years, no uptime and no "expert" ratings, because none of those numbers exist
 * anywhere in this project to be reported. The only figures rendered are counts
 * of the entries in these arrays — `stack.length` is a fact about this file, not
 * a claim about a person — and they are labelled as such.
 *
 * The lifecycle words are chosen for the same reason. A portfolio is not running
 * a fleet, so a domain card does not say ONLINE; it says what the operator's
 * relationship to that domain currently is.
 */

/**
 * CATEGORY ACCENTS ARE NOT THE DECK'S PALETTE TOKENS, and that follows the
 * precedent `hud/stats.ts` set rather than diverging from it.
 *
 * `--signal` means "the operator's target" and `--nominal` means "deployed".
 * Borrowing either to say "this card is about databases" would put targeting and
 * lifecycle vocabulary onto a taxonomy that has neither. These six are their own
 * set and mean nothing beyond "different subject".
 *
 * THEY WERE DESATURATED A NOTCH AND THEY ARE NOT ANY MORE. The original set sat
 * below LED brightness on the same reasoning `hud/stats.ts` uses — six saturated
 * hues in one grid turn an instrument into a colour key. That reasoning holds for
 * the RAIL, where six coloured glyphs sit in one narrow column against grey type
 * and nothing else. It does not hold here: these six are spread across a full-width
 * row, each one owning a whole card, and at #e06a54 on a near-black face the hue
 * was being read as "dark orange-grey" rather than as red.
 *
 * What keeps the set from becoming a colour key is not the saturation, it is WHERE
 * the colour is allowed to go — the bezel, the head rule, the glyph, the divider
 * terminator and the hover bloom. Every one of those is an edge or a mark. No fill
 * on the console carries hue at any strength, which is why six vivid outlines still
 * read as a dark instrument.
 */
export const DOMAIN_ACCENT = {
  backend: "#ff6a45",
  distributed: "#ffab3d",
  cloud: "#52b6ff",
  security: "#33d693",
  intelligence: "#a78bff",
  tooling: "#46d5e0",
} as const;

export type AccentKey = keyof typeof DOMAIN_ACCENT;

/**
 * What the operator's relationship to a domain actually is.
 *
 * Deliberately three words and not a percentage. ACTIVE is "I build in this
 * regularly", WORKING is "I use this in service of the above", EXPLORING is "I
 * am learning this now and will say so".
 */
export type DomainStance = "ACTIVE" | "WORKING" | "EXPLORING";

/** Lifecycle words DO map to the deck palette — that is what those tokens mean. */
export const STANCE_TONE: Record<DomainStance, string> = {
  ACTIVE: "text-nominal",
  WORKING: "text-telemetry",
  EXPLORING: "text-caution",
};

export const STANCE_LAMP: Record<DomainStance, string> = {
  ACTIVE: "bg-nominal",
  WORKING: "bg-telemetry",
  EXPLORING: "bg-caution",
};

export interface SystemDomain {
  readonly id: string;
  readonly label: string;
  /** One line. If it needs two, the domain is two domains. */
  readonly blurb: string;
  /**
   * Flat, not pre-broken into display lines. The card wraps it itself, and the
   * count in the card's footer is this array's length — which is only honest if
   * the array holds technologies rather than typeset rows.
   */
  readonly stack: readonly string[];
  readonly stance: DomainStance;
  readonly accent: AccentKey;
  readonly icon: LucideIcon;
}

export const SYSTEM_DOMAINS: readonly SystemDomain[] = [
  {
    id: "backend",
    label: "Backend Engineering",
    blurb: "APIs, services, databases and server-side logic",
    stack: ["Python", "Django", "Flask", "FastAPI", "REST APIs", "PostgreSQL"],
    stance: "ACTIVE",
    accent: "backend",
    icon: Server,
  },
  {
    id: "distributed",
    label: "Distributed Systems",
    blurb: "Scalable, fault-tolerant and event-driven systems",
    stack: ["Kafka", "RabbitMQ", "Redis", "Docker", "Kubernetes"],
    stance: "WORKING",
    accent: "distributed",
    icon: Network,
  },
  {
    id: "cloud",
    label: "Cloud Infrastructure",
    blurb: "Cloud platforms, containers and infrastructure as code",
    stack: ["AWS", "GCP", "Terraform", "Docker", "CI/CD", "IaC"],
    stance: "WORKING",
    accent: "cloud",
    icon: Cloud,
  },
  {
    id: "security",
    label: "Security",
    blurb: "Secure systems, data protection and threat prevention",
    stack: ["Network Security", "OAuth2", "JWT", "Encryption", "Secure Architecture"],
    stance: "WORKING",
    accent: "security",
    icon: ShieldCheck,
  },
  {
    id: "ai-ml",
    label: "AI / ML Systems",
    blurb: "ML models, pipelines, RAG and intelligent applications",
    stack: ["Python", "PyTorch", "Scikit-learn", "LangChain", "Transformers"],
    stance: "EXPLORING",
    accent: "intelligence",
    icon: Brain,
  },
  {
    id: "dev-tools",
    label: "Dev Tools",
    blurb: "Developer productivity and automation",
    stack: ["Git", "Docker", "Linux", "Bash", "VS Code", "Postman", "APIs"],
    stance: "ACTIVE",
    accent: "tooling",
    icon: Wrench,
  },
];

/**
 * CAPABILITIES ARE VERBS, TECHNOLOGIES ARE NOUNS.
 *
 * This section exists because a list of tools does not say what someone can do
 * with them, and the two are constantly confused on skills pages. Nothing in
 * here names a product — if an entry could be replaced by a vendor's name it
 * belongs in TECHNOLOGIES below instead.
 *
 * `index` is not stored: the matrix numbers its cells from array order, which is
 * the one place a derived ordinal is safer than an authored one.
 *
 * EVERY CELL CARRIES AN ACCENT, AND IT IS THE ACCENT OF THE DOMAIN IT SERVES.
 * That is what keeps eight hues from being a colour wheel: the matrix is not
 * decorated, it is CROSS-REFERENCED. API Design is red because Backend
 * Engineering is red; AI Engineering is violet because the AI/ML card is violet.
 * A reader who has looked at the six cards above already knows what each colour
 * means by the time they reach this panel, so the hue is doing the one job colour
 * should do in an instrument — saying which subsystem a reading belongs to.
 *
 * Two pairs repeat (amber twice, red twice) because two capabilities genuinely
 * serve the same domain. They are placed so no repeat is adjacent in either the
 * four-column or the two-column arrangement.
 */
export interface Capability {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly icon: LucideIcon;
  readonly accent: AccentKey;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "api-design",
    label: "API Design",
    blurb: "Design robust APIs & services",
    icon: Braces,
    accent: "backend",
  },
  {
    id: "system-design",
    label: "System Design",
    blurb: "Scalable architectures & service boundaries",
    icon: Network,
    accent: "distributed",
  },
  {
    id: "data-engineering",
    label: "Data Engineering",
    blurb: "Pipelines, ETL, storage & data modeling",
    icon: Database,
    accent: "security",
  },
  {
    id: "distributed-computing",
    label: "Distributed Computing",
    blurb: "Queues, workers, events & concurrency",
    icon: Workflow,
    accent: "cloud",
  },
  {
    id: "ai-engineering",
    label: "AI Engineering",
    blurb: "RAG, agents, inference & model evaluation",
    icon: Brain,
    accent: "intelligence",
  },
  {
    id: "cloud-deployment",
    label: "Cloud & Deployment",
    blurb: "Containers, CI/CD, cloud & IaC",
    icon: CloudCog,
    accent: "tooling",
  },
  {
    id: "observability",
    label: "Observability",
    blurb: "Logging, metrics, monitoring & alerts",
    icon: Activity,
    accent: "distributed",
  },
  {
    id: "testing",
    label: "Testing",
    blurb: "Unit, integration & system testing",
    icon: ListChecks,
    accent: "backend",
  },
];

/**
 * THE MARKS ARE THE REAL ONES. See <Mark> for where they come from, which three
 * entries have no mark and why hand-drawing the missing ones is not an option.
 *
 * `kind` survives the switch to brand marks because it is still the only thing
 * that says what a technology IS — the tile discloses it on hover, and a logo
 * cannot. It no longer drives colour: a mark carries its own.
 */
export type TechKind = "language" | "framework" | "platform" | "data" | "stream" | "tooling" | "ai";

export interface Technology {
  readonly id: string;
  readonly name: string;
  readonly kind: TechKind;
  readonly glyph: Glyph;
}

export const TECHNOLOGIES: readonly Technology[] = [
  { id: "python", name: "Python", kind: "language", glyph: siPython },
  { id: "django", name: "Django", kind: "framework", glyph: siDjango },
  { id: "fastapi", name: "FastAPI", kind: "framework", glyph: siFastapi },
  { id: "docker", name: "Docker", kind: "platform", glyph: siDocker },
  { id: "kubernetes", name: "Kubernetes", kind: "platform", glyph: siKubernetes },
  { id: "postgresql", name: "PostgreSQL", kind: "data", glyph: siPostgresql },
  { id: "mongodb", name: "MongoDB", kind: "data", glyph: siMongodb },
  { id: "redis", name: "Redis", kind: "data", glyph: siRedis },
  { id: "kafka", name: "Kafka", kind: "stream", glyph: siApachekafka },
  // No mark upstream — trademark removal. Lucide stands in.
  { id: "aws", name: "AWS", kind: "platform", glyph: Cloud },
  { id: "linux", name: "Linux", kind: "platform", glyph: siLinux },
  { id: "git", name: "Git", kind: "tooling", glyph: siGit },
  { id: "terraform", name: "Terraform", kind: "platform", glyph: siTerraform },
  // Not a product, so there is no mark to be missing.
  { id: "ci-cd", name: "CI/CD", kind: "tooling", glyph: GitMerge },
  { id: "nginx", name: "Nginx", kind: "platform", glyph: siNginx },
  { id: "langchain", name: "LangChain", kind: "ai", glyph: siLangchain },
  { id: "pytorch", name: "PyTorch", kind: "ai", glyph: siPytorch },
  { id: "scikit-learn", name: "Scikit-learn", kind: "ai", glyph: siScikitlearn },
  { id: "pandas", name: "Pandas", kind: "data", glyph: siPandas },
];

export interface Tool {
  readonly id: string;
  readonly name: string;
  readonly glyph: Glyph;
}

export const DAILY_TOOLS: readonly Tool[] = [
  // No mark upstream — trademark removal.
  { id: "vs-code", name: "VS Code", glyph: FileCode },
  { id: "pycharm", name: "PyCharm", glyph: siPycharm },
  { id: "git", name: "Git", glyph: siGit },
  { id: "postman", name: "Postman", glyph: siPostman },
  { id: "docker", name: "Docker", glyph: siDocker },
  { id: "linux", name: "Linux", glyph: siLinux },
  { id: "jupyter", name: "Jupyter", glyph: siJupyter },
  { id: "notion", name: "Notion", glyph: siNotion },
  { id: "figma", name: "Figma", glyph: siFigma },
  // No mark upstream — trademark removal.
  { id: "slack", name: "Slack", glyph: MessageSquare },
  // Not a product.
  { id: "terminal", name: "Terminal", glyph: SquareTerminal },
  { id: "google-drive", name: "Google Drive", glyph: siGoogledrive },
  { id: "obsidian", name: "Obsidian", glyph: siObsidian },
  { id: "discord", name: "Discord", glyph: siDiscord },
];

/**
 * THE TRAJECTORY PANEL.
 *
 * THE PRINTED PERCENTAGES ARE GONE, AND THE HISTORY BELONGS HERE rather than being
 * quietly overwritten, because this went round twice.
 *
 * They were removed first on the argument that "78%" beside RAG SYSTEMS measures
 * nothing — no scale, no assessor, no denominator — so the number's only function
 * is to look like data. The panel was rebuilt around a stepper derived from the
 * stage word so no free number could exist to drift into a score.
 *
 * They were then restored at the operator's explicit direction, read as exploration
 * depth rather than proficiency, with the violet bar and the stage word holding
 * that reading in place.
 *
 * They are now off again, also at the operator's direction, and the panel has
 * landed somewhere better than either end: `depth` SURVIVES and still sets each
 * bar's length, but the figure is not printed. A bar invites the reader to
 * estimate, which is honest for a rough measure; a printed number invites them to
 * believe two significant figures, which nothing here can support.
 *
 * `stage` is the readout a reader actually takes away. Keep `depth` roughly in the
 * band its stage implies — if the two disagree, the bar is wrong, not the word.
 */
export type TrackStage = "ACTIVE" | "EXPLORING" | "NEXT";

/** Lit segments out of three. Derived — never authored per entry. */
export const STAGE_STEPS: Record<TrackStage, number> = {
  ACTIVE: 3,
  EXPLORING: 2,
  NEXT: 1,
};

export const STAGE_TONE: Record<TrackStage, string> = {
  ACTIVE: "text-nominal",
  EXPLORING: "text-caution",
  NEXT: "text-t3",
};

export const STAGE_FILL: Record<TrackStage, string> = {
  ACTIVE: "bg-nominal",
  EXPLORING: "bg-caution",
  NEXT: "bg-t3",
};

export interface ExplorationTrack {
  readonly id: string;
  readonly label: string;
  readonly stage: TrackStage;
  /**
   * Exploration depth, 0-100. SETS THE BAR'S LENGTH AND IS NEVER PRINTED — see the
   * note above. Keep it roughly in the band its `stage` implies; the word is what a
   * reader takes away, and a bar that disagrees with it is a bug.
   */
  readonly depth: number;
}

export const CURRENTLY_EXPLORING: readonly ExplorationTrack[] = [
  { id: "rag", label: "RAG Systems", stage: "ACTIVE", depth: 88 },
  { id: "llm-apps", label: "LLM Applications", stage: "ACTIVE", depth: 76 },
  { id: "agents", label: "AI Agents", stage: "EXPLORING", depth: 60 },
  { id: "model-eval", label: "Model Evaluation", stage: "EXPLORING", depth: 45 },
  { id: "mlops", label: "MLOps", stage: "NEXT", depth: 24 },
  { id: "distributed-ai", label: "Distributed AI", stage: "NEXT", depth: 14 },
];

/** What all six tracks are in service of. Stated once, at the foot of the panel. */
export const EXPLORATION_FOCUS = "AI Engineering & System Design";

/** Section glyphs, so the console's panel headers are named in one place. */
export const SECTION_ICONS = {
  capabilities: Blocks,
  technologies: Container,
  tools: Wrench,
} as const;
