import {
  Boxes,
  Brain,
  Cloud,
  Code2,
  Cog,
  Database,
  Infinity as InfinityIcon,
  LayoutGrid,
  MessageCircle,
  Network,
  Package,
  Radar,
  Rocket,
  Server,
  Share2,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  siApachekafka,
  siDjango,
  siDocker,
  siFastapi,
  siGo,
  siKubernetes,
  siPostgresql,
  siPython,
  siRedis,
  siTerraform,
} from "simple-icons";
import type { Glyph } from "@/features/systems/Mark";
import type { Project, ProjectCategory } from "./types";

/**
 * EIGHT ACCENTS, AND TWO OF THEM ARE THE SAME RED ON PURPOSE.
 *
 * Six of these are the systems console's `DOMAIN_ACCENT` values unchanged, which
 * is what makes a reader arriving from that scene recognise the palette rather
 * than meet a second one. The console does not import that table, though, and the
 * duplication is the point: `DOMAIN_ACCENT` is keyed by ENGINEERING DOMAIN —
 * "backend", "cloud", "intelligence" — and a project is not a domain. ORION is a
 * security platform written in Python over a Postgres store; asking which single
 * domain key owns it produces an argument rather than a colour.
 *
 * So the accent is authored per project, and what it encodes is position in the
 * grid as much as subject: eight cards in one field need eight distinguishable
 * edges, which is a composition problem rather than a taxonomy one.
 *
 * THE TWO REDS ARE THE EXCEPTION THAT PROVES IT. ORION and SENTINEL are the two
 * security systems and they are the two red cards, at opposite corners of the
 * grid — far enough apart never to read as a repeated swatch, close enough in
 * subject that the shared hue says something true. Red is otherwise reserved on
 * this deck for identity and targeting; here it is spent on the one subject with
 * a claim to it.
 */
export const PROJECT_ACCENT = {
  threat: "#ff3d3d",
  analysis: "#46d5e0",
  pipeline: "#ffab3d",
  gateway: "#33d693",
  assistant: "#a78bff",
  stream: "#52b6ff",
  infra: "#6f9dff",
} as const;

/**
 * THE CHIPS ARE A VIEW OF `categories`, NOT A SECOND LIST TO KEEP IN STEP.
 *
 * Every project names its categories by id and every chip filters on that id, so
 * a category with no members renders a chip that empties the grid — a data error
 * the console cannot detect for you. There is no ALL entry here: "all projects"
 * is the ABSENCE of a filter, and modelling it as a category would oblige every
 * project to declare membership in it.
 */
export const PROJECT_CATEGORIES: readonly ProjectCategory[] = [
  { id: "ai-ml", label: "AI / ML", icon: Brain },
  { id: "backend", label: "Backend", icon: Server },
  { id: "distributed", label: "Distributed Systems", icon: Network },
  { id: "cloud", label: "Cloud", icon: Cloud },
  { id: "data", label: "Data Engineering", icon: Database },
  { id: "devtools", label: "DevTools", icon: Wrench },
];

/** The unfiltered position. Its glyph is the only one in the row that carries hue. */
export const ALL_CATEGORY_ICON: LucideIcon = LayoutGrid;

export const PROJECTS: readonly Project[] = [
  {
    id: "orion-stem",
    name: "Orion STEM",
    kind: "Security Event Monitoring Platform",
    summary:
      "Real-time security monitoring platform with threat detection, anomaly analysis and incident response automation.",
    stack: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Redis",
      "Kafka",
      "Docker",
      "Elasticsearch",
      "Grafana",
    ],
    categories: ["backend", "distributed", "data"],
    year: 2024,
    status: "PRODUCTION",
    featured: true,
    accent: PROJECT_ACCENT.threat,
    icon: Radar,
    preview: "console-map",
    missionId: "MISSION-01",
    href: null,
  },
  {
    id: "codeccllas",
    name: "CodecCllas",
    kind: "AI Code Analysis Platform",
    summary:
      "AI-powered code review and analysis platform with automated suggestions and quality metrics.",
    stack: ["Python", "Django", "PostgreSQL", "Celery", "Redis", "Docker", "Transformers"],
    categories: ["ai-ml", "backend"],
    year: 2024,
    status: "PRODUCTION",
    featured: true,
    accent: PROJECT_ACCENT.analysis,
    icon: Code2,
    preview: "score-panel",
    href: null,
  },
  {
    id: "aurora-ml",
    name: "Aurora ML",
    kind: "ML Pipeline Orchestration System",
    summary:
      "Scalable ML pipeline orchestration with experiment tracking, model registry and deployment automation.",
    stack: ["Python", "Airflow", "MLflow", "Docker", "Kubernetes", "PyTorch", "S3"],
    categories: ["ai-ml", "data", "distributed"],
    year: 2024,
    status: "PRODUCTION",
    featured: false,
    accent: PROJECT_ACCENT.pipeline,
    icon: Cog,
    preview: "dag",
    missionId: "MISSION-05",
    href: null,
  },
  {
    id: "nexus-api",
    name: "Nexus API",
    kind: "Unified API Gateway",
    summary:
      "High-performance API gateway with rate limiting, authentication and real-time analytics.",
    stack: ["Go", "Gin", "Redis", "Kafka", "Docker", "Prometheus"],
    categories: ["backend", "distributed", "cloud"],
    year: 2023,
    status: "PRODUCTION",
    featured: false,
    accent: PROJECT_ACCENT.gateway,
    icon: Share2,
    preview: "gateway",
    missionId: "MISSION-04",
    href: null,
  },
  {
    id: "echonaut",
    name: "Echonaut",
    kind: "AI ChatOps Assistant",
    summary:
      "Intelligent ChatOps assistant for DevOps teams with natural language commands and automation.",
    stack: ["Python", "LangChain", "OpenAI", "Redis", "FastAPI", "Slack API"],
    categories: ["ai-ml", "devtools"],
    year: 2024,
    status: "BETA",
    featured: false,
    accent: PROJECT_ACCENT.assistant,
    icon: MessageCircle,
    preview: "chat",
    missionId: "MISSION-02",
    href: null,
  },
  {
    id: "dataflow",
    name: "Dataflow",
    kind: "Real-time Data Pipeline",
    summary: "Real-time data ingestion and processing pipeline for analytics and reporting.",
    stack: ["Python", "Kafka", "Spark", "S3", "Airflow", "PostgreSQL"],
    categories: ["data", "distributed"],
    year: 2023,
    status: "PRODUCTION",
    featured: false,
    accent: PROJECT_ACCENT.stream,
    icon: Database,
    preview: "pipeline",
    missionId: "MISSION-03",
    href: null,
  },
  {
    id: "cloudnova",
    name: "CloudNova",
    kind: "Infrastructure as Code",
    summary:
      "Multi-cloud infrastructure provisioning platform using Terraform and automated CI/CD pipelines.",
    stack: ["Terraform", "AWS", "Docker", "GitHub", "Kubernetes", "Ansible"],
    categories: ["cloud", "devtools"],
    year: 2023,
    status: "PRODUCTION",
    featured: false,
    accent: PROJECT_ACCENT.infra,
    icon: Cloud,
    preview: "iac-topology",
    href: null,
  },
  {
    id: "sentinel",
    name: "Sentinel",
    kind: "Threat Detection Engine",
    summary:
      "ML-powered threat detection and anomaly identification engine with behavioral analysis.",
    stack: ["Python", "Scikit-learn", "Elasticsearch", "Kibana", "Kafka", "Redis", "Docker"],
    categories: ["ai-ml", "data"],
    year: 2023,
    status: "IN_PROGRESS",
    featured: false,
    accent: PROJECT_ACCENT.threat,
    icon: ShieldAlert,
    preview: "threat-map",
    href: null,
  },
];

/** How many stack entries the card prints before the `+N` badge takes over. */
export const TAG_PREVIEW_COUNT = 4;

/**
 * SHORT FORMS FOR THE CHIPS, AND THEY EARN THEIR KEEP GEOMETRICALLY.
 *
 * A card is 345 units wide with 28 of padding, so the tag row has about 317 to
 * spend on four chips and an overflow badge. "SCIKIT-LEARN" and "ELASTICSEARCH"
 * together take 214 of it, which put SENTINEL's row onto a second line and pushed
 * the third line of its summary out through the top of the tag row — a card that
 * was visibly broken while every other one looked fine.
 *
 * The fix is the one the reference already made: those two chips read SKLEARN and
 * ELASTIC there, because that is what engineers call them. So this is not a
 * layout hack dressed as vocabulary — it is the working name, and it happens to
 * fit. `stack` keeps the full name, so search still matches "scikit-learn" and
 * the technology count still counts it once.
 *
 * The row is `flex-nowrap` regardless (see <ProjectCard>), so a future entry with
 * a long name degrades by clipping rather than by breaking the card. This table
 * is how it avoids needing to.
 */
export const TAG_ALIAS: Readonly<Record<string, string>> = {
  "Scikit-learn": "SKLearn",
  Elasticsearch: "Elastic",
  Kubernetes: "K8s",
  Prometheus: "Prom",
  Transformers: "HF",
  "Slack API": "Slack",
};

/**
 * SORT ORDERS. Three of them, and none is "relevance".
 *
 * A roster of eight has no relevance problem to solve — the reader can see all of
 * it at once — so the control's job is to say WHICH END of the list is the front,
 * not to rank. `latest` is newest first with featured work breaking ties; the
 * other two put a different field in charge of the same eight cards.
 */
export type SortOrder = "latest" | "featured" | "name";

export const SORT_LABEL: Record<SortOrder, string> = {
  latest: "Latest",
  featured: "Featured",
  name: "A – Z",
};

export const SORT_ORDERS: readonly SortOrder[] = ["latest", "featured", "name"];

export interface FocusArea {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

/**
 * FOUR TILES, AND THEY ARE THE HEADINGS THE EIGHT CARDS FALL UNDER.
 *
 * Each accent belongs to the project that most exemplifies it — the AI tile is
 * Echonaut's violet, the data tile is CodecCllas' cyan — so the band reads as a
 * summary of the grid above it rather than as a fifth palette.
 */
export const DEVELOPMENT_FOCUS: readonly FocusArea[] = [
  {
    id: "ai",
    label: "AI Engineering",
    blurb: "LLM apps, RAG, agents",
    icon: Brain,
    accent: PROJECT_ACCENT.assistant,
  },
  {
    id: "system-design",
    label: "System Design",
    blurb: "Scalable, resilient systems",
    icon: Network,
    accent: PROJECT_ACCENT.pipeline,
  },
  {
    id: "cloud",
    label: "Cloud & DevOps",
    blurb: "Infrastructure at scale",
    icon: Cloud,
    accent: PROJECT_ACCENT.stream,
  },
  {
    id: "data",
    label: "Data Engineering",
    blurb: "Pipelines & real-time analytics",
    icon: Database,
    accent: PROJECT_ACCENT.analysis,
  },
];

/**
 * THE MARKS THAT RUN ACROSS THE ROSTER, ordered by how many cards list them.
 *
 * `simple-icons` carries no AWS mark — Amazon had it removed on trademark grounds
 * — so the one non-brand glyph in the row is a lucide cloud, the same substitution
 * the systems library makes for the same entry.
 */
export const TECH_BAND: readonly {
  readonly id: string;
  readonly name: string;
  readonly glyph: Glyph;
}[] = [
  { id: "python", name: "Python", glyph: siPython },
  { id: "go", name: "Go", glyph: siGo },
  { id: "django", name: "Django", glyph: siDjango },
  { id: "fastapi", name: "FastAPI", glyph: siFastapi },
  { id: "postgresql", name: "PostgreSQL", glyph: siPostgresql },
  { id: "redis", name: "Redis", glyph: siRedis },
  { id: "kafka", name: "Kafka", glyph: siApachekafka },
  { id: "docker", name: "Docker", glyph: siDocker },
  { id: "kubernetes", name: "Kubernetes", glyph: siKubernetes },
  { id: "aws", name: "AWS", glyph: Cloud },
  { id: "terraform", name: "Terraform", glyph: siTerraform },
];

/**
 * THE READOUT BOX, DERIVED RATHER THAN TYPED.
 *
 * Every figure but the last is counted off `PROJECTS` at module load, so the box
 * cannot claim twelve projects above a grid of eight — which is exactly what a
 * hand-written value does the first time an entry is added or cut. The systems
 * console's `ConsoleStats` is built the same way and for the same reason.
 *
 * "TECH STACKS" counts DISTINCT technologies across the roster, not stacks. The
 * label is the reference's; the unit under it is the only one the data can
 * honestly supply, since "a stack" is not a thing this file enumerates.
 */
export const PROJECT_COUNT = PROJECTS.length;
export const PRODUCTION_COUNT = PROJECTS.filter((p) => p.status === "PRODUCTION").length;
export const TECHNOLOGY_COUNT = new Set(PROJECTS.flatMap((p) => p.stack)).size;

export const ROSTER_READOUTS = [
  { id: "projects", icon: Package, value: String(PROJECT_COUNT), label: "Projects" },
  { id: "production", icon: Rocket, value: String(PRODUCTION_COUNT), label: "In Production" },
  { id: "stacks", icon: Boxes, value: String(TECHNOLOGY_COUNT), label: "Tech Stacks" },
  { id: "impact", icon: InfinityIcon, value: "∞", label: "Impact" },
] as const;

export const ROSTER_SUMMARY = `${PROJECT_COUNT} projects, ${PRODUCTION_COUNT} in production, ${TECHNOLOGY_COUNT} technologies`;
