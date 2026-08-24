/**
 * THE EIGHT SCHEMATICS.
 *
 * One file rather than eight, and the reason is that they have to AGREE. These are
 * not eight independent illustrations; they are eight arrangements of one
 * vocabulary, and the only way to see that a pane in the DAG is the same pane as
 * in the gateway is to read them next to each other. Split across eight files they
 * drift within a week — someone nudges a stroke here, a row pitch there, and the
 * grid slowly turns back into eight screenshots.
 *
 * Each one answers a single question: what SHAPE is this system? A SIEM is panes
 * around a map. A pipeline is a left-to-right flow. A gateway is a fan-in and a
 * fan-out around one waist. A conversation is alternating blocks down a column.
 * That shape is the whole payload — nothing here is meant to be read, and at 96
 * units tall nothing could be.
 */
import { HOTSPOTS, WORLD_DOTS } from "./world";
import {
  AreaChart,
  BarChart,
  CodeBlock,
  DIM,
  Edge,
  EDGE,
  Flow,
  GraphNode,
  INK,
  Pane,
  PaneHeader,
  PREVIEW_H,
  PREVIEW_W,
  TextRows,
} from "./primitives";

export interface SchematicProps {
  readonly accent: string;
}

/**
 * THE DOTTED WORLD, PLACED.
 *
 * `WORLD_DOTS` is normalised, so this is the only thing that knows how big the map
 * is on any given card — ORION gives it a hundred units in a corner, SENTINEL
 * gives it the whole well, and the model is sampled once either way.
 *
 * The hotspot is three stacked circles rather than a radial gradient: see the
 * no-defs note in <PreviewFrame>. Three stops is also all that survives at this
 * size — a smooth falloff and a three-step one are the same handful of pixels.
 */
function WorldMap({
  x,
  y,
  w,
  h,
  accent,
  dot = 0.85,
  hotspots = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  accent: string;
  dot?: number;
  hotspots?: number;
}) {
  return (
    <g>
      {WORLD_DOTS.map((point, index) => (
        <circle
          key={index}
          cx={x + point.x * w}
          cy={y + point.y * h}
          r={dot}
          fill={DIM}
        />
      ))}
      {HOTSPOTS.slice(0, hotspots).map((spot, index) => {
        const cx = x + spot.x * w;
        const cy = y + spot.y * h;
        const scale = spot.scale * (h / 70);
        return (
          <g key={index}>
            <circle cx={cx} cy={cy} r={11 * scale} fill={accent} opacity={0.07} />
            <circle cx={cx} cy={cy} r={5.5 * scale} fill={accent} opacity={0.16} />
            <circle cx={cx} cy={cy} r={1.9 * scale} fill={accent} opacity={0.95} />
          </g>
        );
      })}
    </g>
  );
}

/**
 * ORION — a security console. Three panes: an event feed you scroll, a cluster of
 * readings you watch, and a map of where it is all happening.
 *
 * The map is the smallest pane and it is on the right, which is where every
 * operations console in the reference puts it: the feed is what you read, the map
 * is what you glance at.
 */
export function ConsoleMapSchematic({ accent }: SchematicProps) {
  return (
    <>
      <Pane x={4} y={4} w={72} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={72} accent={accent} label={30} />
      <TextRows x={11} y={24} w={58} rows={9} gap={7.4} seed={0x0a1} accent={accent} litRow={3} bullet />

      <Pane x={80} y={4} w={128} h={PREVIEW_H - 8} />
      <PaneHeader x={80} y={4} w={128} accent={accent} label={38} />
      {/* Three readings across, then the long histogram they summarise. */}
      <Pane x={86} y={22} w={38} h={26} />
      <AreaChart x={90} y={27} w={30} h={16} count={9} seed={0x0a2} accent={accent} />
      <Pane x={128} y={22} w={38} h={26} />
      <BarChart x={132} y={27} w={30} h={16} count={7} seed={0x0a3} accent={accent} />
      <Pane x={170} y={22} w={32} h={26} />
      <BarChart x={174} y={27} w={24} h={16} count={5} seed={0x0a4} accent={accent} />
      <BarChart x={86} y={56} w={116} h={30} count={26} seed={0x0a5} accent={accent} />

      <Pane x={212} y={4} w={PREVIEW_W - 216} h={PREVIEW_H - 8} />
      <PaneHeader x={212} y={4} w={PREVIEW_W - 216} accent={accent} label={26} />
      <WorldMap x={218} y={26} w={92} h={58} accent={accent} dot={0.7} hotspots={3} />
    </>
  );
}

/**
 * CODECCLLAS — a code review screen. A file tree, a scored report, findings.
 *
 * The ring is the only closed figure in any of the eight schematics, and that is
 * what makes this one identifiable: a number in a circle means a grade, and a
 * grade is what a code analysis platform hands you.
 */
export function ScorePanelSchematic({ accent }: SchematicProps) {
  const ring = 2 * Math.PI * 9;

  return (
    <>
      <Pane x={4} y={4} w={62} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={62} accent={accent} label={26} />
      <TextRows x={10} y={24} w={50} rows={9} gap={7.4} seed={0x1b1} accent={accent} litRow={5} bullet />

      <Pane x={70} y={4} w={158} h={PREVIEW_H - 8} />
      <PaneHeader x={70} y={4} w={158} accent={accent} label={44} />
      {/* The score, top-right of its own pane, where a report card puts it. */}
      <circle cx={206} cy={38} r={9} fill="none" stroke={EDGE} strokeWidth={2} />
      <circle
        cx={206}
        cy={38}
        r={9}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={`${ring * 0.78} ${ring}`}
        transform="rotate(-90 206 38)"
      />
      {/* TWO SHORT BARS, NOT ONE LONG ONE. A single bar across the middle of a
          ring is a no-entry sign — the one glyph in the world that means the
          opposite of a good score. Two stand in for two digits, which is what is
          actually printed inside a gauge like this. */}
      <rect x={201.5} y={36.6} width={4} height={3} rx={0.8} fill={accent} opacity={0.95} />
      <rect x={207} y={36.6} width={4} height={3} rx={0.8} fill={accent} opacity={0.95} />
      <TextRows x={78} y={26} w={104} rows={4} gap={7} seed={0x1b2} accent={accent} />
      <BarChart x={78} y={58} w={90} h={28} count={18} seed={0x1b3} accent={accent} />
      <AreaChart x={176} y={58} w={44} h={28} count={9} seed={0x1b4} accent={accent} />

      <Pane x={232} y={4} w={PREVIEW_W - 236} h={PREVIEW_H - 8} />
      <PaneHeader x={232} y={4} w={PREVIEW_W - 236} accent={accent} label={28} />
      <TextRows x={238} y={24} w={72} rows={9} gap={7.4} seed={0x1b5} accent={accent} litRow={1} />
    </>
  );
}

/**
 * AURORA — an orchestration DAG. Four ranks left to right, fanning out and back in.
 *
 * ORTHOGONAL EDGES, NOT CURVES. This is a dependency graph — a thing with a
 * topology someone authored — and right-angled routing is how every scheduler in
 * the world draws one. Curves are for streams, and the stream case is DATAFLOW's.
 */
export function DagSchematic({ accent }: SchematicProps) {
  const ranks: readonly (readonly number[])[] = [[38], [20, 49, 78], [34, 64], [49]];
  const columns = [16, 84, 158, 232];
  const nodeW = 30;
  const nodeH = 11;

  return (
    <>
      <Pane x={4} y={4} w={PREVIEW_W - 8} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={PREVIEW_W - 8} accent={accent} label={40} />

      {ranks.slice(0, -1).map((rank, rankIndex) =>
        rank.flatMap((fromY, fromIndex) =>
          ranks[rankIndex + 1].map((toY, toIndex) => (
            <Edge
              key={`${rankIndex}-${fromIndex}-${toIndex}`}
              from={[columns[rankIndex] + nodeW, fromY + nodeH / 2]}
              to={[columns[rankIndex + 1], toY + nodeH / 2]}
              accent={accent}
              lit={fromIndex === 0 && toIndex === 0}
            />
          )),
        ),
      )}

      {ranks.map((rank, rankIndex) =>
        rank.map((nodeY, nodeIndex) => (
          <GraphNode
            key={`${rankIndex}-${nodeIndex}`}
            x={columns[rankIndex]}
            y={nodeY}
            w={nodeW}
            h={nodeH}
            accent={accent}
            filled={rankIndex === 0 || (rankIndex === 1 && nodeIndex === 1) || rankIndex === 3}
          />
        )),
      )}

      {/* The terminal rank gets a second box beside it — a registry the run writes
          to. Without it the graph reads as ending in mid-air. */}
      <Pane x={278} y={38} w={36} h={34} />
      <TextRows x={283} y={46} w={26} rows={3} gap={7} seed={0x2c1} accent={accent} litRow={0} />
    </>
  );
}

/**
 * NEXUS — a gateway. Many clients in, one waist, many services out, with the
 * traffic it shapes charted underneath.
 *
 * The waist is the whole idea: every line on the left converges on one box before
 * anything on the right happens. Drawn as a mesh instead, it would be a service
 * map — which is what a gateway exists to REPLACE.
 */
export function GatewaySchematic({ accent }: SchematicProps) {
  const clients = [24, 44, 64];
  const services = [22, 42, 62, 82];

  return (
    <>
      <Pane x={4} y={4} w={PREVIEW_W - 8} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={PREVIEW_W - 8} accent={accent} label={36} />

      {clients.map((y, index) => (
        <Edge
          key={`in-${index}`}
          from={[42, y + 5]}
          to={[112, 48]}
          accent={accent}
          lit={index === 1}
        />
      ))}
      {services.map((y, index) => (
        <Edge
          key={`out-${index}`}
          from={[164, 48]}
          to={[196, y + 5]}
          accent={accent}
          lit={index === 1}
        />
      ))}

      {clients.map((y, index) => (
        <GraphNode key={`c-${index}`} x={16} y={y} w={26} h={10} accent={accent} />
      ))}

      {/* The waist. Wider and taller than anything else in the frame, because it
          is the only element in this schematic that has a name. */}
      <rect
        x={112}
        y={36}
        width={52}
        height={24}
        rx={2.5}
        fill={accent}
        opacity={0.14}
        stroke={accent}
        strokeWidth={0.9}
      />
      <rect x={121} y={44} width={34} height={2.8} rx={1.4} fill={accent} opacity={0.95} />
      <rect x={125} y={50} width={26} height={2.2} rx={1.1} fill={INK} />

      {services.map((y, index) => (
        <GraphNode
          key={`s-${index}`}
          x={196}
          y={y}
          w={26}
          h={10}
          accent={accent}
          filled={index === 1}
        />
      ))}

      <Pane x={236} y={22} w={PREVIEW_W - 240} h={64} />
      <AreaChart x={242} y={28} w={68} h={24} count={11} seed={0x3d1} accent={accent} />
      <BarChart x={242} y={60} w={68} h={20} count={14} seed={0x3d2} accent={accent} />
    </>
  );
}

/**
 * ECHONAUT — a ChatOps transcript. Alternating blocks down a column, with the
 * assistant's replies indented and lit.
 *
 * ALTERNATION IS THE ENTIRE SIGNAL. A single column of even blocks is a document;
 * blocks that swap sides and change width are a conversation, and the reader
 * decides which one they are looking at before they notice anything else.
 */
export function ChatSchematic({ accent }: SchematicProps) {
  const turns = [
    { x: 96, w: 84, rows: 1, mine: true },
    { x: 78, w: 118, rows: 3, mine: false },
    { x: 112, w: 68, rows: 1, mine: true },
    { x: 78, w: 104, rows: 2, mine: false },
  ];
  let cursor = 24;

  return (
    <>
      <Pane x={4} y={4} w={62} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={62} accent={accent} label={24} />
      <TextRows x={10} y={24} w={50} rows={8} gap={8} seed={0x4e1} accent={accent} litRow={2} bullet />

      <Pane x={70} y={4} w={158} h={PREVIEW_H - 8} />
      <PaneHeader x={70} y={4} w={158} accent={accent} label={40} />

      {turns.map((turn, index) => {
        const height = 8 + turn.rows * 6.5;
        const y = cursor;
        cursor += height + 5;
        return (
          <g key={index}>
            <rect
              x={turn.x}
              y={y}
              width={turn.w}
              height={height}
              rx={2.5}
              fill={turn.mine ? "rgb(190 205 220 / 0.05)" : accent}
              opacity={turn.mine ? 1 : 0.12}
              stroke={turn.mine ? EDGE : accent}
              strokeWidth={0.7}
            />
            <TextRows
              x={turn.x + 5}
              y={y + 4.5}
              w={turn.w - 10}
              rows={turn.rows}
              gap={6.5}
              seed={0x4e2 + index}
              accent={accent}
            />
          </g>
        );
      })}

      {/* The composer, pinned to the foot of the thread. */}
      <rect x={78} y={82} width={142} height={10} rx={2.5} fill="rgb(190 205 220 / 0.03)" stroke={EDGE} strokeWidth={0.7} />
      <rect x={83} y={86} width={40} height={2.4} rx={1.2} fill={DIM} />
      <circle cx={214} cy={87} r={2.4} fill={accent} />

      <Pane x={232} y={4} w={PREVIEW_W - 236} h={PREVIEW_H - 8} />
      <PaneHeader x={232} y={4} w={PREVIEW_W - 236} accent={accent} label={28} />
      <TextRows x={238} y={24} w={72} rows={8} gap={8} seed={0x4e9} accent={accent} litRow={4} />
    </>
  );
}

/**
 * DATAFLOW — sources, stages, sink, left to right on curves.
 *
 * CURVES HERE, RIGHT ANGLES IN THE DAG, and the difference is the claim each makes.
 * A scheduler's edges are dependencies someone declared; a pipeline's are data in
 * motion. The packets riding the curves are the only literal thing in the eight
 * schematics — everything else stands in for something, and these ARE the payload.
 */
export function PipelineSchematic({ accent }: SchematicProps) {
  const sources = [22, 48, 74];
  const stages = [
    { x: 118, y: 30 },
    { x: 118, y: 62 },
    { x: 186, y: 46 },
  ];

  return (
    <>
      <Pane x={4} y={4} w={PREVIEW_W - 8} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={PREVIEW_W - 8} accent={accent} label={38} />

      {sources.map((y, index) => (
        <Flow
          key={`s-${index}`}
          from={[52, y + 5]}
          to={[118, stages[index % 2].y + 5]}
          accent={accent}
          lit={index === 0}
        />
      ))}
      <Flow from={[148, 35]} to={[186, 51]} accent={accent} lit />
      <Flow from={[148, 67]} to={[186, 51]} accent={accent} />
      <Flow from={[216, 51]} to={[262, 51]} accent={accent} lit />

      {sources.map((y, index) => (
        <GraphNode key={`n-${index}`} x={26} y={y} w={26} h={10} accent={accent} filled={index === 0} />
      ))}
      {stages.map((stage, index) => (
        <GraphNode key={`t-${index}`} x={stage.x} y={stage.y} w={30} h={10} accent={accent} filled={index === 2} />
      ))}

      {/* Packets in transit, spaced unevenly along the lit run — evenly spaced dots
          read as a dashed line rather than as traffic. */}
      {[0.22, 0.46, 0.79].map((t, index) => (
        <circle key={index} cx={216 + (262 - 216) * t} cy={51} r={1.5} fill={accent} opacity={0.9} />
      ))}

      <Pane x={262} y={26} w={PREVIEW_W - 266} h={50} />
      <TextRows x={268} y={34} w={38} rows={5} gap={7.4} seed={0x5f1} accent={accent} litRow={0} />
    </>
  );
}

/**
 * CLOUDNOVA — infrastructure as code: the declaration on the left, the estate it
 * provisions on the right, over a very faint world.
 *
 * The two halves are the whole point — this is the only schematic that shows a
 * cause and its effect side by side, which is exactly what IaC is. The map behind
 * the topology is at a third of the usual dot alpha: it says "multi-region"
 * without becoming a third subject.
 */
export function IacTopologySchematic({ accent }: SchematicProps) {
  const tiers: readonly (readonly [number, number])[] = [
    [196, 26],
    [244, 26],
    [196, 56],
    [244, 56],
    [286, 41],
  ];

  return (
    <>
      <Pane x={4} y={4} w={110} h={PREVIEW_H - 8} />
      <PaneHeader x={4} y={4} w={110} accent={accent} label={32} />
      <CodeBlock x={12} y={24} w={94} rows={10} seed={0x6a1} accent={accent} />

      <Pane x={118} y={4} w={PREVIEW_W - 122} h={PREVIEW_H - 8} />
      <PaneHeader x={118} y={4} w={PREVIEW_W - 122} accent={accent} label={36} />
      <g opacity={0.42}>
        <WorldMap x={128} y={26} w={180} h={58} accent={accent} dot={0.6} />
      </g>

      <Edge from={[210, 37]} to={[244, 37]} accent={accent} lit />
      <Edge from={[210, 67]} to={[244, 67]} accent={accent} />
      <Edge from={[258, 37]} to={[286, 46]} accent={accent} lit />
      <Edge from={[258, 67]} to={[286, 52]} accent={accent} />
      <Edge from={[203, 37]} to={[203, 56]} accent={accent} />

      {tiers.map(([x, y], index) => (
        <GraphNode
          key={index}
          x={x}
          y={y}
          w={index === 4 ? 24 : 28}
          h={11}
          accent={accent}
          filled={index === 0 || index === 4}
        />
      ))}
    </>
  );
}

/**
 * SENTINEL — the map, and nothing but the map.
 *
 * Every other schematic surrounds its subject with panes. This one has none, and
 * the emptiness is the design: a detection engine's output is a set of places
 * where something is happening, and the reason the card reads at a glance is that
 * five lit points on a dark world need no chrome to be understood.
 *
 * Five hotspots rather than three, and the graticule turned on, because at full
 * width the frame can carry them — ORION's map is a hundred units wide in a corner
 * and would silt up with either.
 */
export function ThreatMapSchematic({ accent }: SchematicProps) {
  return (
    <>
      <Pane x={4} y={4} w={PREVIEW_W - 8} h={PREVIEW_H - 8} />
      {/* Graticule. Four verticals and three horizontals at the alpha of the panel
          rule — any stronger and it becomes a grid with a map on it. */}
      {[0.2, 0.4, 0.6, 0.8].map((t) => (
        <rect key={`v${t}`} x={8 + (PREVIEW_W - 16) * t} y={10} width={0.5} height={PREVIEW_H - 20} fill={EDGE} />
      ))}
      {[0.25, 0.5, 0.75].map((t) => (
        <rect key={`h${t}`} x={10} y={10 + (PREVIEW_H - 20) * t} width={PREVIEW_W - 20} height={0.5} fill={EDGE} />
      ))}
      <WorldMap x={16} y={12} w={PREVIEW_W - 32} h={PREVIEW_H - 24} accent={accent} dot={0.95} hotspots={5} />
    </>
  );
}
