/**
 * Command Deck layout solver.
 *
 *   node scripts/deck-layout-check.mjs
 *
 * WHY THIS EXISTS. The deck's composition is over-constrained and its failures
 * are invisible in code review. Six mission callouts, a full-height HUD rail, a
 * bottom-right instrument cluster and a 196px spacecraft have to coexist inside
 * one viewport at every size, and the callouts are positioned by trigonometry
 * rather than by layout — so nothing in the CSS can tell you that Forge has
 * ended up underneath the sidebar at 1440px. The first hand-tuned pass did
 * exactly that at every desktop size and looked fine in the file.
 *
 * So this models what the browser will actually compute and checks every
 * callout against every other callout, the rail, the cluster, the spacecraft
 * and the frame, across 25 viewports.
 *
 * IT IS A MIRROR, NOT A SOURCE. Every constant below is duplicated from the
 * real code and has to be kept in step by hand:
 *
 *   TILT, SHIP_STANDOFF, DECK_BIAS, CENTRE_BAND, LOD  src/features/missions/placement.ts
 *   MISSIONS                                          src/features/missions/data.ts
 *   FORM (the radius formulas), TIER breakpoints       src/app/globals.css
 *   BOX (panel outer boxes)                            measured off the live DOM
 *
 * BOX in particular must be MEASURED, not estimated. A 203px estimate turned
 * out to be 205px plus a 3px inset edge light, and those 6px were the
 * difference between clear and clipped. To re-measure, run the dev server and
 * evaluate in the console:
 *
 *   [...document.querySelectorAll('li > button')].map(b => {
 *     const h = [...b.children].find(el => el.style.transform?.startsWith('scale'));
 *     const r = h.querySelector('span.relative').getBoundingClientRect();
 *     const s = parseFloat(/scale\(([\d.]+)\)/.exec(h.style.transform)[1]);
 *     return [b.getAttribute('aria-describedby'), Math.round(r.width / s), Math.round(r.height / s)];
 *   })
 *
 * Exits non-zero if any viewport fails, so it can be wired into CI.
 */

// ---------------------------------------------------------------- placement.ts
const TILT = 0.64;
const SHIP_STANDOFF = 1.45;
const DECK_BIAS = 0.80;
const CENTRE_BAND = 0.12;
const LOD = { marker: 0.2, compact: 0.34 };

// ---------------------------------------------------------------------- data.ts
const MISSIONS = [
  { id: "ORION", theta: 168, ring: 0.34 },
  { id: "NEXUS", theta: 46, ring: 0.66 },
  { id: "ECHO", theta: 296, ring: 0.80 },
  { id: "DATAFLOW", theta: 338, ring: 0.80 },
  { id: "AURORA", theta: 140, ring: 1.00 },
  { id: "FORGE", theta: 222, ring: 1.00 },
];

// ------------------------------------------------------- measured panel boxes
// Unscaled. At `lg` compact is the same WIDTH as full — the text column is a
// fixed 10rem either way — and differs only in height, having dropped the
// summary. At `sm` no callout is drawn at all: the ring shows bare markers and
// identity moves to the target readout strip.
const BOX = {
  lg: { full: { w: 205, h: 114 }, compact: { w: 205, h: 75 }, marker: { w: 70, h: 30 } },
  md: { full: { w: 153, h: 100 }, compact: { w: 153, h: 75 }, marker: { w: 70, h: 30 } },
  sm: { full: { w: 0, h: 0 }, compact: { w: 0, h: 0 }, marker: { w: 0, h: 0 } },
};

// ------------------------------------------------------------------ globals.css
const TIER = {
  lg: { name: "lg", run: 18, rise: 26, rail: 240, railGap: 20, cluster: 420, bar: 56, dock: 72, ship: 202, cap: "full" },
  md: { name: "md", run: 16, rise: 24, rail: 0, railGap: 0, cluster: 0, bar: 56, dock: 72, ship: 151, cap: "compact" },
  sm: { name: "sm", run: 9, rise: 14, rail: 0, railGap: 0, cluster: 0, bar: 56, dock: 96, ship: 101, cap: "marker" },
};

const FORM = {
  lg: { reserve: 536, vh: 0.62, min: 96, max: 470 },
  md: { reserve: 210, vh: 0.38, min: 80, max: 276 },
  sm: { reserve: 20, vh: 0.3, min: 60, max: 120 },
};

const tierOf = (w, h) =>
  w <= 620 || h <= 560 ? "sm" : w <= 1500 || h <= 700 ? "md" : "lg";

// ---------------------------------------------------------------------- model
const rad = (d) => (d * Math.PI) / 180;
const RANK = { marker: 0, compact: 1, full: 2 };
const lodOf = (d) => (d < LOD.marker ? "marker" : d < LOD.compact ? "compact" : "full");
const clampLod = (l, cap) => (RANK[l] <= RANK[cap] ? l : cap);

const placed = MISSIONS.map((m) => {
  const r = rad(m.theta);
  const sx = Math.sin(r);
  const sy = -Math.cos(r);
  return {
    ...m,
    sx,
    sy,
    depth: (1 - m.ring * Math.cos(r)) / 2,
    side: Math.abs(m.ring * sx) < CENTRE_BAND ? "center" : sx < 0 ? "left" : "right",
  };
});

/** `max(ring * |sin theta|)`. The divisor in every radius formula. */
const REACH = Math.max(...placed.map((p) => Math.abs(p.ring * p.sx)));

function radiusOf(w, h, name) {
  const f = FORM[name];
  return Math.max(f.min, Math.min(Math.min((w / 2 - f.reserve) / REACH, f.vh * h), f.max));
}

function boxes(w, h, R, t) {
  const cx = w / 2;
  const shipY = h / 2 + R * TILT * DECK_BIAS;
  const planeY = shipY - R * TILT * SHIP_STANDOFF;
  return placed.map((p) => {
    const scale = 0.78 + p.depth * 0.5;
    const box = BOX[t.name][clampLod(lodOf(p.depth), t.cap)];
    const bw = box.w * scale;
    const bh = box.h * scale;
    const nx = cx + R * p.ring * p.sx;
    const ny = planeY + R * TILT * p.ring * p.sy;
    const x0 =
      p.side === "left" ? nx - t.run - bw : p.side === "right" ? nx + t.run : nx - bw / 2;
    const y1 = ny - t.rise;
    return { id: p.id, x0, x1: x0 + bw, y0: y1 - bh, y1, nx, ny, shipY, empty: bw === 0 };
  });
}

const hit = (a, b, pad = 8) =>
  a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;

function violations(w, h) {
  const name = tierOf(w, h);
  const t = TIER[name];
  const R = radiusOf(w, h, name);
  const bs = boxes(w, h, R, t);
  const shipY = bs[0].shipY;
  const out = [];

  if (shipY + t.ship > h - 6) out.push("ship below frame");

  const ship = {
    x0: w / 2 - t.ship, x1: w / 2 + t.ship,
    y0: shipY - t.ship, y1: shipY + t.ship,
  };
  const railL = t.rail && { x0: -1e4, x1: t.railGap + t.rail, y0: t.bar + 24, y1: h - t.dock };
  const clusterR = t.rail && {
    x0: w - t.railGap - t.rail, x1: 1e4,
    y0: h - t.dock - t.cluster, y1: h - t.dock,
  };

  for (let i = 0; i < bs.length; i++) {
    const a = bs[i];
    if (a.empty) continue;
    if (a.x0 < 4) out.push(`${a.id} off left edge`);
    if (a.x1 > w - 4) out.push(`${a.id} off right edge`);
    if (a.y0 < t.bar + 4) out.push(`${a.id} under top bar`);
    if (a.ny > h - t.dock) out.push(`${a.id} anchor under dock`);
    if (railL && hit(a, railL, 0)) out.push(`${a.id} over left rail`);
    if (clusterR && hit(a, clusterR, 0)) out.push(`${a.id} over right cluster`);
    if (hit(a, ship, 0)) out.push(`${a.id} over spacecraft`);
    for (let j = i + 1; j < bs.length; j++) {
      if (!bs[j].empty && hit(a, bs[j])) out.push(`${a.id} overlaps ${bs[j].id}`);
    }
  }
  return { name, R, out };
}

// ----------------------------------------------------------------------- run
const VIEWPORTS = [
  [1920, 1080], [1728, 1117], [1600, 900], [1536, 1024], [1512, 982], [1440, 900],
  [1366, 768], [1280, 800], [1280, 720], [1180, 820], [1101, 700],
  [1100, 800], [1024, 768], [900, 1200], [820, 1180], [768, 1024], [744, 1133], [932, 430],
  [620, 900], [430, 932], [402, 874], [390, 844], [360, 640], [320, 568], [844, 390],
];

console.log("Command Deck layout check");
console.log(`max reach = ${REACH.toFixed(3)}R  (the divisor in every --orbit-radius formula)\n`);

for (const p of placed) {
  console.log(
    `  ${p.id.padEnd(9)} theta=${String(p.theta).padStart(3)} ring=${p.ring.toFixed(2)}` +
      ` depth=${p.depth.toFixed(3)} lod=${lodOf(p.depth).padEnd(7)} side=${p.side}`,
  );
}
console.log();

let failed = 0;
for (const [w, h] of VIEWPORTS) {
  const { name, R, out } = violations(w, h);
  if (out.length) failed++;
  console.log(
    `${String(w).padStart(4)}x${String(h).padStart(4)}  ${name}  R=${String(Math.round(R)).padStart(3)}  ` +
      (out.length ? `FAIL\n            ${out.join("\n            ")}` : "ok"),
  );
}

console.log(`\n${VIEWPORTS.length - failed}/${VIEWPORTS.length} viewports clear`);
process.exit(failed === 0 ? 0 : 1);
