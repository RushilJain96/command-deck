/**
 * Command Deck layout solver.
 *
 *   node scripts/deck-layout-check.mjs
 *
 * WHY THIS EXISTS. The deck's composition is over-constrained and its failures
 * are invisible in code review. Six mission callouts, a full-height HUD rail, a
 * bottom-right instrument cluster and a 444px spacecraft have to coexist inside
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
const TILT = 0.46;
const SHIP_STANDOFF = 0.85;
// The plane's perspective divide. Mirrors ORBIT_PERSPECTIVE / planeDivisor /
// SHIP_STANDOFF_SCREEN in placement.ts — node screen positions come out of it,
// so a stale value here checks collisions against a deck that is not drawn.
const PERSPECTIVE = 0.28;
const divisor = (ring, cosTheta) => 1 + PERSPECTIVE * ring * cosTheta;
const SHIP_STANDOFF_SCREEN = SHIP_STANDOFF / divisor(SHIP_STANDOFF, -1);
const DECK_BIAS = 1.24;
const CENTRE_BAND = 0.12;
// Collapsed to a single level: every module is drawn at `full`. The tier caps in
// TIER below still clamp it (md shows no summary), but depth no longer does.
const LOD = { marker: 0, compact: 0 };

// ---------------------------------------------------------------------- data.ts
// AUTHORED CARD POSITIONS, in units of --orbit-radius, `y` before the tilt.
// These used to be `theta`/`ring` polar coordinates that got projected onto the
// plane; the cards are detached from the plane now and simply sit where the
// roster puts them. Three columns of two: a front rank low and wide, a back rank
// higher and pulled inward.
// Stated as clock stations and projected here exactly as `orbitalStation` does
// in placement.ts, so the mirror stays a mirror rather than a copied result.
const station = (theta, ring) => {
  const rad = (theta * Math.PI) / 180;
  const d = divisor(ring, Math.cos(rad));
  return { x: (ring * Math.sin(rad)) / d, y: (TILT * (ring * -Math.cos(rad))) / d };
};
const MISSIONS = [
  { id: "ORION", ...station(0, 0.135), tier: "hero" },
  { id: "NEXUS", ...station(55.4, 1.183), tier: "back" },
  { id: "ECHO", ...station(304.6, 1.183), tier: "back" },
  { id: "DATAFLOW", ...station(0, 2.055), tier: "deep" },
  { id: "AURORA", ...station(124.7, 0.914), tier: "mid" },
  { id: "FORGE", ...station(235.3, 0.914), tier: "mid" },
];

// -------------------------------------------------------------------- types.ts
// SIZE IS UNIFORM. The tiers used to carry a scale each (1.15/0.95/0.80/0.65);
// they now carry stacking order only, and every module is drawn at 1.0 except
// the one under the pointer. Mirror of CALLOUT_SCALE / CALLOUT_SCALE_ACTIVE.
// UNIFORM. Every card is drawn at one size, at rest and under the pointer — the
// per-tier scale ramp and the active multiplier are both withdrawn, so there is
// no longer any geometry difference between the resting and hovered deck.
const CALLOUT_SCALE = 1;

// ------------------------------------------------------- measured panel boxes
// Unscaled. At `lg` compact is the same WIDTH as full — the text column is a
// fixed 12.5rem either way — and differs only in height, having dropped the
// summary. At `sm` no callout is drawn at all: the ring shows bare markers and
// identity moves to the target readout strip.
// The `lg` width has moved twice and the reasons are worth keeping, because
// they pull in opposite directions:
//
//   205 -> 181  when the text column went 200 -> 176, to buy the deck-md
//               threshold. Heights held: the summary is `line-clamp-2` either
//               way, so a narrower measure rewraps inside two lines.
//   181 -> 225  when the cards were enlarged ~25% for legibility. Heights DID
//               grow this time (118 -> 132, 78 -> 86), because the type inside
//               scaled with the box rather than just rewrapping.
//
// `md.full` is dead weight and always has been — TIER.md.cap clamps every
// mission to `compact` at that tier, so the entry is never read. Kept accurate
// rather than deleted so the table stays a faithful mirror.
//
// An earlier cut of the bands used 7px fields and came out at 126/86, which put
// NEXUS under the top bar at 1101x700 — found by this script, not by eye. The
// fields are 5px instead. Nothing structural changed to fix it: the seams do the
// sectioning, and the padding around them was more than the composition had.
//   225 -> 173  when the callouts were centred over their waypoints. See the
//               column note in <MissionPanel>: a centred card spans half its
//               width either side of its anchor, so 225 at the `hero` 1.15 put
//               ORION through AURORA everywhere below R=382. 168px column plus
//               the 3px status rail and the 2px bezel.
//   173 -> 161  and the padding with it, when every module went full size. Six
//               full cards share a vertical and horizontal budget that three
//               full plus three reduced ones never tested.
//   161 -> 221  when the cards were DETACHED from the orbital plane. Every
//               reduction above was made to satisfy this script while the cards
//               were tethered to ring positions the viewport could not spread far
//               enough apart — the orbit was sizing the content. With the
//               arrangement authored instead, spacing is chosen and the cards can
//               be the size the design wants. 216px column + 3px rail + 2 bezel.
//   221 -> 229  and the HEIGHT 113 -> 145, which was the part that actually
//               mattered. Measured against the reference: its front-rank cards
//               run about 220x175 in a 1536-wide frame, so the old box was close
//               on width and far too short, and the type inside was a couple of
//               steps too small. Title 14.5 -> 17px, summary 11.5 -> 12.5,
//               labels 9 -> 10, with padding to match.
const BOX = {
  lg: { full: { w: 261, h: 160 }, compact: { w: 261, h: 112 }, marker: { w: 70, h: 30 } },
  md: { full: { w: 213, h: 160 }, compact: { w: 213, h: 112 }, marker: { w: 70, h: 30 } },
  sm: { full: { w: 0, h: 0 }, compact: { w: 0, h: 0 }, marker: { w: 0, h: 0 } },
};

// ------------------------------------------------------------------ globals.css
// `shipScale` is the tier's own transform on the sprite (deck-md:scale-75,
// deck-sm:scale-50 in ShipSprite). The envelope below turns it into a box.
// `run` and `rise` are both gone: there is no standoff left to model in either
// axis, because the cards are detached from the plane and `x`/`y` name the
// card's own centre. See the note in <MissionNode>.
const TIER = {
  lg: { name: "lg", rail: 208, railGap: 20, cluster: 420, bar: 56, dock: 72, shipScale: 1, cap: "full" },
  md: { name: "md", rail: 0, railGap: 0, cluster: 0, bar: 56, dock: 72, shipScale: 0.75, cap: "compact" },
  sm: { name: "sm", rail: 0, railGap: 0, cluster: 0, bar: 56, dock: 96, shipScale: 0.5, cap: "marker" },
};

// ------------------------------------------------------------- shipFrames.ts
const SHIP_PIXELS = 444;

/**
 * THE SHIP IS NOT A SQUARE, AND MODELLING IT AS ONE IS NOT MERELY CONSERVATIVE.
 *
 * This used to be a single half-size of SHIP_PIXELS/2 applied in all four
 * directions. That is wrong by a factor of three upward: the frames carry a lot
 * of transparent margin, and the painted hull occupies only the middle band of
 * the box. The error did not matter while the ship sat half an orbit below the
 * ring, because nothing came near it. The moment the vehicle was moved INTO the
 * plane — which is the entire point of the current composition — a square box
 * started reporting collisions against callouts separated from the hull by a
 * hundred-plus pixels of empty alpha, and it would have vetoed the design on
 * evidence that was not real.
 *
 * So these are MEASURED, not estimated, the same rule BOX above follows. Union
 * of the alpha bounding box across all 16 frames in public/ship/, taken at
 * alpha > 12/255 (the value is insensitive: thresholds of 12, 64 and 140 agree
 * to within one part in a thousand):
 *
 *   vertical    0.333 .. 0.711 of the frame
 *   horizontal  0.190 .. 0.782, symmetrised about the centre to 0.310 half-width
 *               because ShipSprite mirrors the frames with scaleX(-1) for port
 *               turns, so the swept envelope has to be symmetric in x
 *
 * Then rotated about the box centre — the bank is applied to the whole sprite in
 * ShipSprite, so it sweeps the silhouette — which grows the axis-aligned
 * envelope to the fractions below. That rotation is why `up` is 0.204 rather
 * than the 0.167 the unrotated hull would give.
 *
 * The sweep was computed at 7deg of bank. FLIGHT.bankMax has since come down to
 * 4, so this envelope is now slightly larger than the hull can actually reach —
 * left as is, because erring wide on a collision box is the safe direction and
 * re-deriving it would only ever loosen the check.
 *
 * To re-measure after a re-render, run the dev server and evaluate the alpha
 * scan over `/ship/yaw-*.webp` in the console.
 */
const SHIP_ENV = { halfW: 0.34, up: 0.21, down: 0.25 };

// `vhOff` mirrors the `- 130px` in the lg height term. Only lg needs it: md and
// sm cap R low enough (276 / 120) that the top-bar constraint never binds.
// The reserves dropped when the callouts were centred: what has to clear the
// rail went from `run + fullPanelWidth` to `halfPanelWidth`, measured at the
// `hero` scale because any module can be promoted to it by the pointer.
// `vh2`/`vhOff2` is a SECOND height bound, and it exists because the top of the
// ring got taller. DATAFLOW is the highest module and used to be a 30px marker;
// as a full 126px card it needs far more headroom, and the constraint that
// governs it — `R <= 0.775h - 300` — is a STEEPER line than the original
// `0.56h - 130`. Two lines with different slopes cannot be expressed as one
// `Nsvh - M`, so both are kept and the smaller wins. They cross around h=760, so
// on tall viewports the original still binds and nothing was given away.
// `vh`/`vh2` are the two vertical bounds: the TOP BAR against the back rank's
// card top, and the DOCK against the hull's lower edge. They have different
// slopes, so neither can absorb the other.
const FORM = {
  lg: { reserve: 367, vh: 0.9213, vhOff: 258, vh2: 0.8766, vhOff2: 321, min: 96, max: 470 },
  md: { reserve: 121, vh: 0.9213, vhOff: 214, vh2: 0.8766, vhOff2: 321, min: 80, max: 305 },
  sm: { reserve: 20, vh: 0.3, vhOff: 0, vh2: 99, vhOff2: 0, min: 60, max: 120 },
};

// THE `md` HEIGHT THRESHOLD WENT 640 -> 830, and it is the one change here that
// is a product decision rather than arithmetic.
//
// With every module drawn full size, two bounds move toward each other as the
// viewport gets shorter: the back rank needs `R >= 290` to fit three 161px cards
// side by side, and the top bar needs `R <= 0.775h - 355` to keep the highest of
// them out of the chrome. They CROSS at about h=830. Below that there is no
// radius that satisfies both — not a tuning problem, an empty feasible set.
//
// So short viewports drop to `md`, where the summary is hidden and the card is
// 84px instead of 126. That buys 48px of the thing there is none of, and the
// bounds separate again. A 1366x768 laptop now gets the compact deck, which is
// the honest trade: it can show six readable modules or it can show six modules
// with prose, and it cannot show both.
const tierOf = (w, h) =>
  w <= 620 || h <= 560 ? "sm" : w <= 1340 || h <= 830 ? "md" : "lg";

// ---------------------------------------------------------------------- model
const RANK = { marker: 0, compact: 1, full: 2 };
const lodOf = (d) => (d < LOD.marker ? "marker" : d < LOD.compact ? "compact" : "full");
const clampLod = (l, cap) => (RANK[l] <= RANK[cap] ? l : cap);

const placed = MISSIONS.map((m) => ({
  ...m,
  // Further up the frame reads as further away.
  depth: (m.y + 1) / 2,
  side: Math.abs(m.x) < CENTRE_BAND ? "center" : m.x < 0 ? "left" : "right",
}));

/** `max(|x|)`. The divisor in every radius formula. Mirrors --orbit-radius. */
const REACH = Math.max(...placed.map((p) => Math.abs(p.x)));

function radiusOf(w, h, name) {
  const f = FORM[name];
  return Math.max(
    f.min,
    Math.min(
      (w / 2 - f.reserve) / REACH,
      f.vh * h - f.vhOff,
      f.vh2 * h - f.vhOff2,
      f.name === "md" ? 0.38 * h : Infinity,
      f.max,
    ),
  );
}

/**
 * HOVER IS NO LONGER A LAYOUT STATE, so there is no `heroId` and no second pass.
 *
 * There used to be one: a targeted callout was promoted to a larger scale and
 * expanded to full detail, so it was both wider and taller than it rested at, and
 * checking only the resting arrangement proved a deck that was correct right up
 * until someone pointed at it. That sweep found real bugs.
 *
 * Every `scale()` is gone from the cards now and detail no longer changes on
 * hover either, so the hovered deck is geometrically IDENTICAL to the resting
 * one. Keeping the sweep would have run the same six boxes through the same
 * checks six extra times per viewport and reported the same answer.
 */
function boxes(w, h, R, t) {
  const cx = w / 2;
  const shipY = h / 2 + R * TILT * DECK_BIAS;
  const planeY = shipY - R * TILT * SHIP_STANDOFF_SCREEN;
  return placed.map((p) => {
    const scale = CALLOUT_SCALE;
    // Every module resolves to `full` now (LOD thresholds are zero), so the only
    // thing still shrinking a box is the tier cap — md drops the summary.
    // Targeting changes scale, never the box.
    const box = BOX[t.name][clampLod(lodOf(p.depth), t.cap)];
    const bw = box.w * scale;
    const bh = box.h * scale;
    // The authored position IS the card's centre now — there is no anchor below
    // it and no tether rise, because the cards are detached from the plane.
    const nx = cx + R * p.x;
    const ny = planeY + R * p.y;
    const x0 = nx - bw / 2;
    const y0 = ny - bh / 2;
    return { id: p.id, x0, x1: x0 + bw, y0, y1: y0 + bh, nx, ny, shipY, empty: bw === 0 };
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

  // Painted hull only. The exhaust plume reaches further down and is expected
  // to run behind the dock — it is a light source, not an obstacle.
  const px = SHIP_PIXELS * t.shipScale;
  const ship = {
    x0: w / 2 - SHIP_ENV.halfW * px, x1: w / 2 + SHIP_ENV.halfW * px,
    y0: shipY - SHIP_ENV.up * px, y1: shipY + SHIP_ENV.down * px,
  };

  if (ship.y1 > h - 6) out.push("ship below frame");
  // THE HULL MUST CLEAR THE DOCK, not merely the frame. This check did not
  // exist, and its absence was actively misleading: raising DECK_BIAS to buy
  // headroom for the top of the ring reported as a clean pass while quietly
  // sinking the engines behind the dock. The frame bound (h-6) is 66px lower
  // than the dock and never caught it. The exhaust plume is still expected to
  // run behind the dock — it is a light source, not an obstacle — but painted
  // hull disappearing under a navigation bar is a composition error.
  if (ship.y1 > h - t.dock) out.push(`ship into dock by ${Math.round(ship.y1 - (h - t.dock))}px`);
  if (ship.y0 < t.bar + 4) out.push("ship under top bar");
  // y0 mirrors the rail's own `top-[72px]` (bar 56 + 16), not the old top-20.
  const railL = t.rail && { x0: -1e4, x1: t.railGap + t.rail, y0: t.bar + 16, y1: h - t.dock };
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
    if (railL && hit(a, railL, 0)) out.push(`${a.id} over left rail`);
    if (clusterR && hit(a, clusterR, 0)) out.push(`${a.id} over right cluster`);
    if (hit(a, ship, 0)) out.push(`${a.id} over spacecraft`);
    for (let j = i + 1; j < bs.length; j++) {
      const b = bs[j];
      if (b.empty) continue;
      // ANY card-on-card overlap is a FAULT again. A lane-aware exemption lived
      // here while the columns were deliberately stacked; the cards occupy
      // separate quadrants now, so there is nothing left that is allowed to
      // intersect and the plain check is the correct one.
      if (hit(a, b)) out.push(`${a.id} overlaps ${b.id}`);
    }
  }
  return { name, R, out };
}

// ----------------------------------------------------------------------- run
// The lg tier's LOWER BOUNDARY is sampled densely on purpose. R falls off a
// cliff there — it is `(w/2 - 475) / 0.786`, so every 10px of width costs ~6px
// of orbit — and for a long time the list jumped straight from 1280 to 1180,
// which straddles the boundary without ever landing near it. A tier whose worst
// case is never tested is a tier that passes on the strength of its best case.
const VIEWPORTS = [
  [1920, 1080], [1728, 1117], [1600, 900], [1536, 1024], [1512, 982], [1440, 900],
  [1460, 900], [1440, 880], [1420, 860], [1400, 840], [1380, 820],
  [1366, 768], [1340, 800], [1300, 850], [1280, 800], [1280, 720],
  [1260, 800], [1240, 800], [1200, 800], [1181, 820],
  [1180, 820], [1101, 700],
  [1100, 800], [1024, 768], [900, 1200], [820, 1180], [768, 1024], [744, 1133], [932, 430],
  [620, 900], [430, 932], [402, 874], [390, 844], [360, 640], [320, 568], [844, 390],
];

console.log("Command Deck layout check");
console.log(`max reach = ${REACH.toFixed(3)}R  (the divisor in every --orbit-radius formula)\n`);

for (const p of placed) {
  console.log(
    `  ${p.id.padEnd(9)} x=${p.x.toFixed(2).padStart(5)} y=${p.y.toFixed(2).padStart(5)}` +
      ` depth=${p.depth.toFixed(3)} lod=${lodOf(p.depth).padEnd(7)}` +
      ` tier=${p.tier.padEnd(4)} side=${p.side}`,
  );
}
console.log();

let failed = 0;
for (const [w, h] of VIEWPORTS) {
  const { name, R, out } = violations(w, h);
  if (out.length) failed++;


  const lines = out;
  console.log(
    `${String(w).padStart(4)}x${String(h).padStart(4)}  ${name}  R=${String(Math.round(R)).padStart(3)}  ` +
      (lines.length ? `FAIL\n            ${lines.join("\n            ")}` : "ok"),
  );
}

console.log(`\n${VIEWPORTS.length - failed}/${VIEWPORTS.length} viewports clear`);
process.exit(failed === 0 ? 0 : 1);
