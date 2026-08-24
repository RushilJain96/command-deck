/**
 * THE PARTS EVERY PREVIEW IS BUILT FROM.
 *
 * Each card carries a miniature of the thing it describes — a SIEM console, a
 * pipeline graph, a chat transcript. Drawn freehand, eight of those become eight
 * unrelated illustrations: eight stroke weights, eight greys, eight ideas about
 * how big a list row is. The grid then reads as eight screenshots from eight
 * products, which is the opposite of what a roster is for.
 *
 * So the schematics are assembled from this vocabulary instead. A pane is a pane
 * at the same radius and the same two alphas wherever it appears; a row of type is
 * the same 2.4-unit bar at the same rhythm. What varies between previews is the
 * ARRANGEMENT, which is the only thing that should vary — the arrangement is what
 * says "directed graph" or "conversation" or "world map".
 *
 * NOTHING HERE IS RANDOM AT RENDER TIME. Every ragged edge comes out of `seeded`
 * with a literal seed, so the server and the client draw the same bar widths.
 * `Math.random()` in this file would be a hydration mismatch on every card.
 */
import type { ReactNode } from "react";

/**
 * The preview well's own coordinate system. Every schematic is authored against
 * this box and scaled by the SVG, so a change to the well's size on the card
 * cannot require redrawing any of them.
 */
export const PREVIEW_W = 320;
export const PREVIEW_H = 98;

/** Mulberry32 — the same generator the console sky uses, for the same reason. */
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * THE SHARED GREYS. Three values and no more.
 *
 * The well sits inside a card that is already three near-blacks deep, so the
 * schematic's whole tonal range lives in a band about 12% wide. `EDGE` is what
 * separates one pane from the next, `INK` is anything standing in for type, and
 * `DIM` is the same thing further away. A fourth value would not be visible.
 */
export const EDGE = "rgb(190 205 220 / 0.13)";
export const INK = "rgb(190 205 220 / 0.34)";
export const DIM = "rgb(190 205 220 / 0.17)";

export function Pane({
  x,
  y,
  w,
  h,
  stroke = EDGE,
  fill = "rgb(190 205 220 / 0.022)",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  stroke?: string;
  fill?: string;
}) {
  return <rect x={x} y={y} width={w} height={h} rx={2.5} fill={fill} stroke={stroke} strokeWidth={0.7} />;
}

/**
 * A pane's title strip: a lit pip and a word, over a hairline.
 *
 * The pip is the accent's only appearance in most panes, and it is what keeps a
 * grid of grey rectangles from reading as a wireframe — one lit point per pane is
 * the difference between "a screen" and "a placeholder".
 */
export function PaneHeader({
  x,
  y,
  w,
  accent,
  label = 34,
}: {
  x: number;
  y: number;
  w: number;
  accent: string;
  label?: number;
}) {
  return (
    <>
      <circle cx={x + 6} cy={y + 6} r={1.7} fill={accent} />
      <rect x={x + 11} y={y + 4.6} width={label} height={2.6} rx={1.3} fill={INK} />
      <rect x={x} y={y + 12} width={w} height={0.7} fill={EDGE} />
    </>
  );
}

/**
 * Rows of stand-in type. Widths are ragged by seed rather than uniform: a column
 * of identical bars reads as a loading skeleton, and a skeleton is a screen that
 * has not arrived yet.
 */
export function TextRows({
  x,
  y,
  w,
  rows,
  gap = 7,
  seed,
  accent,
  litRow = -1,
  bullet = false,
}: {
  x: number;
  y: number;
  w: number;
  rows: number;
  gap?: number;
  seed: number;
  accent: string;
  /** Index of the one row drawn in the accent, or -1 for none. */
  litRow?: number;
  bullet?: boolean;
}) {
  const random = seeded(seed);
  const left = bullet ? x + 6 : x;
  const span = w - (bullet ? 6 : 0);

  return (
    <>
      {Array.from({ length: rows }, (_, index) => {
        const width = span * (0.45 + random() * 0.55);
        const lit = index === litRow;
        return (
          <g key={index}>
            {bullet && (
              <circle cx={x + 1.8} cy={y + index * gap + 1.2} r={1.4} fill={lit ? accent : DIM} />
            )}
            <rect
              x={left}
              y={y + index * gap}
              width={width}
              height={2.4}
              rx={1.2}
              fill={lit ? accent : index % 3 === 0 ? INK : DIM}
              opacity={lit ? 0.9 : 1}
            />
          </g>
        );
      })}
    </>
  );
}

/**
 * A column chart on a baseline.
 *
 * The tallest bar takes the accent and the rest stay grey. That is not decoration:
 * one lit column is how a chart at 60 units wide communicates that it HAS a
 * reading, without any of the values being legible.
 */
export function BarChart({
  x,
  y,
  w,
  h,
  count,
  seed,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  seed: number;
  accent: string;
}) {
  const random = seeded(seed);
  const values = Array.from({ length: count }, () => 0.22 + random() * 0.78);
  const peak = values.indexOf(Math.max(...values));
  const pitch = w / count;
  const bar = Math.max(1.6, pitch * 0.58);

  return (
    <>
      {values.map((value, index) => {
        const barHeight = Math.max(1.4, value * h);
        return (
          <rect
            key={index}
            x={x + index * pitch}
            y={y + h - barHeight}
            width={bar}
            height={barHeight}
            rx={0.7}
            fill={index === peak ? accent : DIM}
            opacity={index === peak ? 0.85 : 1}
          />
        );
      })}
      <rect x={x} y={y + h} width={w} height={0.6} fill={EDGE} />
    </>
  );
}

/** A filled area under a jagged line — the shape of a metric over time. */
export function AreaChart({
  x,
  y,
  w,
  h,
  count,
  seed,
  accent,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  seed: number;
  accent: string;
}) {
  const random = seeded(seed);
  const points = Array.from({ length: count }, (_, index) => {
    const px = x + (w * index) / (count - 1);
    const py = y + h - (0.18 + random() * 0.74) * h;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  const line = `M${points.join("L")}`;

  return (
    <>
      <path d={`${line}L${x + w},${y + h}L${x},${y + h}Z`} fill={accent} opacity={0.12} />
      <path d={line} fill="none" stroke={accent} strokeWidth={1} opacity={0.75} />
    </>
  );
}

/**
 * A node in a graph. `filled` is the accent-washed variant used for the handful of
 * nodes on the critical path — the rest stay neutral so the path is readable as a
 * path rather than as a fully-lit graph.
 */
export function GraphNode({
  x,
  y,
  w = 26,
  h = 11,
  accent,
  filled = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  accent: string;
  filled?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={filled ? accent : "rgb(190 205 220 / 0.04)"}
        opacity={filled ? 0.16 : 1}
        stroke={filled ? accent : EDGE}
        strokeWidth={0.7}
      />
      <rect x={x + 4} y={y + h / 2 - 1.2} width={w - 10} height={2.4} rx={1.2} fill={filled ? accent : DIM} />
    </g>
  );
}

/**
 * An edge between two nodes, drawn as a horizontal-then-vertical-then-horizontal
 * run with rounded turns rather than a straight diagonal. Orthogonal routing is
 * what makes a graph read as a SYSTEM diagram; diagonals read as a network graph,
 * which is a different claim.
 */
export function Edge({
  from,
  to,
  accent,
  lit = false,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  accent: string;
  lit?: boolean;
}) {
  const mid = (from[0] + to[0]) / 2;
  const d = `M${from[0]},${from[1]}H${mid}V${to[1]}H${to[0]}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={lit ? accent : EDGE}
      strokeWidth={lit ? 0.9 : 0.7}
      opacity={lit ? 0.8 : 1}
      strokeLinejoin="round"
    />
  );
}

/** A curved link, for the flows that are genuinely streams rather than topologies. */
export function Flow({
  from,
  to,
  accent,
  lit = false,
}: {
  from: readonly [number, number];
  to: readonly [number, number];
  accent: string;
  lit?: boolean;
}) {
  const dx = (to[0] - from[0]) * 0.55;
  const d = `M${from[0]},${from[1]}C${from[0] + dx},${from[1]} ${to[0] - dx},${to[1]} ${to[0]},${to[1]}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={lit ? accent : EDGE}
      strokeWidth={lit ? 1 : 0.7}
      opacity={lit ? 0.85 : 1}
    />
  );
}

/**
 * Stand-in source code: an indented ragged column with a few tokens in the accent.
 *
 * The indent ladder is what distinguishes this from `TextRows` at a glance. Prose
 * is flush left; code steps in and back out, and that silhouette is legible long
 * before any character would be.
 */
export function CodeBlock({
  x,
  y,
  w,
  rows,
  seed,
  accent,
  gap = 6.4,
}: {
  x: number;
  y: number;
  w: number;
  rows: number;
  seed: number;
  accent: string;
  gap?: number;
}) {
  const random = seeded(seed);
  const indents = [0, 0, 6, 6, 12, 6, 0, 6, 12, 12, 6, 0];

  return (
    <>
      {Array.from({ length: rows }, (_, index) => {
        const indent = indents[index % indents.length];
        const width = (w - indent) * (0.35 + random() * 0.6);
        const token = random() > 0.62;
        return (
          <g key={index}>
            <rect
              x={x + indent}
              y={y + index * gap}
              width={Math.min(width, w - indent)}
              height={2.3}
              rx={1.15}
              fill={index % 4 === 0 ? INK : DIM}
            />
            {token && (
              <rect
                x={x + indent + Math.min(width, w - indent) + 2.5}
                y={y + index * gap}
                width={7}
                height={2.3}
                rx={1.15}
                fill={accent}
                opacity={0.55}
              />
            )}
          </g>
        );
      })}
    </>
  );
}

/**
 * The well itself. Every preview mounts inside this, so the ground, the viewBox
 * and the crop behaviour are decided once.
 *
 * NO `<defs>`, NO GRADIENTS, AND THAT IS A CONSTRAINT ON EVERY SCHEMATIC.
 *
 * Eight of these render on one page. SVG ids share the document's namespace, so
 * eight wells each defining `url(#preview-ground)` is eight elements fighting over
 * one name — the first definition wins for all of them, which happens to look
 * correct here and stops looking correct the moment two previews want different
 * stops. Threading a `useId()` through every primitive would fix it and costs a
 * prop on every part in this file.
 *
 * The cheaper answer is to not need ids. A flat ground and stacked translucent
 * circles say everything a gradient would at 98 units tall, so nothing below this
 * line references a def. If a schematic ever genuinely needs one, it takes a `uid`
 * prop — it does not add a bare id.
 *
 * `slice` rather than `meet`: the well's aspect on the card is close to this
 * viewBox but not identical, and `meet` would letterbox — two bands of card
 * showing through the middle of a schematic. Slicing trims a unit or two off an
 * edge that carries nothing.
 */
export function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect x={0} y={0} width={PREVIEW_W} height={PREVIEW_H} fill="#070b11" />
      {children}
    </svg>
  );
}
