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
const DECK_BIAS = 0.93;
/**
 * The card arrangement's own gains. Mirrors CARD_X_GAIN / CARD_Y_GAIN /
 * CARD_Y_LIFT in placement.ts, applied in <MissionNode>'s transform.
 *
 * THESE APPLY TO THE CALLOUTS AND NOTHING ELSE. The ship and the plane are still
 * positioned in raw --orbit-radius units off DECK_BIAS, so they must NOT be run
 * through these — doing so would model a deck where the vehicle moved with the
 * cards, which is exactly the coupling the two constants exist to break.
 *
 * FOLDED INTO THE AUTHORED STATION, at every tier. They were briefly tier-scoped
 * CSS variables that reset to identity below `deck-md`; that split the drawn
 * position from the one `derivePlacement` reasons about and mis-aimed the bearing
 * beam. `gainedStation` in placement.ts applies them once, and `station()` below
 * mirrors it exactly.
 */
const CARD_X_GAIN = 0.93;
const CARD_Y_GAIN = 0.82;
const CARD_Y_LIFT = 0.01655;
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
// Mirrors `gainedStation`: the raw clock projection with the three card gains
// folded in, which is what data.ts stores and therefore what everything draws.
const station = (theta, ring) => {
  const rad = (theta * Math.PI) / 180;
  const d = divisor(ring, Math.cos(rad));
  const x = (ring * Math.sin(rad)) / d;
  const y = (TILT * (ring * -Math.cos(rad))) / d;
  return { x: x * CARD_X_GAIN, y: y * CARD_Y_GAIN - CARD_Y_LIFT };
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
/**
 * ZERO. The cards used to carry a `translateY(-20px)` in their tilt transform;
 * it is folded into CARD_Y_LIFT now, so the stored position already includes it
 * and adding it again here would model the deck 20px high.
 */
const CARD_LIFT = 0;

// ------------------------------------------------------- measured panel boxes
/**
 * AXIS-ALIGNED BOUNDING BOXES, READ OFF THE LIVE DOM. Not the authored card size.
 *
 * TWO THINGS USED TO BE COMPUTED HERE AND ARE NOW MEASURED INSTEAD. The old table
 * held one `full`/`compact` size per tier and the script derived the flanks'
 * footprint from it by scaling through a `TILT_BOX` ratio — <MissionNode> applies
 * `perspective(1200px) rotateY(±12deg)`, and a rotated rectangle is narrower
 * across and taller down than the card it is drawn from. That derivation was
 * correct for ONE card width, because the perspective divide is a function of the
 * card's own half-width, and it silently stops being correct the moment different
 * cards are different widths. They are now: CALLOUT_TIER runs 250 / 215 / 178 /
 * 157 to give the arrangement its depth ramp.
 *
 * So the ratio is gone and these are the numbers `getBoundingClientRect` reports
 * at 1536x1024, which folds in the rotation, the status rail, the bezel and the
 * hero's target brackets without any of it having to be re-derived. That also
 * makes the hero's box conservative by ~12px in each axis, since its outer bloom
 * is included; erring wide on a collision box is the safe direction.
 *
 * The `lod` axis is gone with it. LOD_THRESHOLDS collapsed to a single level some
 * time ago, so every entry but `full` was unreachable at `lg`; what varies is
 * TIER, which is authored per mission in data.ts.
 *
 * To re-measure: run the dev server, then in the console —
 *   [...document.querySelectorAll('ul[aria-label="Mission slots"] > li')]
 *     .map(li => { let b = null; li.querySelectorAll('*').forEach(e => {
 *       const r = e.getBoundingClientRect();
 *       if (r.width > 80 && r.height > 50 && (!b || r.width * r.height > b.w * b.h))
 *         b = { w: Math.round(r.width), h: Math.round(r.height) }; }); return b; })
 */
const BOX = {
  lg: {
    // RESTING boxes. The solver multiplies whichever card is selected by
    // CALLOUT_ACTIVE_SCALE itself, so these must be the UNSCALED footprints —
    // `hero` is measured at 274x222 on screen because ORION is selected at rest,
    // and divided by 1.28 to get back to the resting box it would occupy.
    //
    // They still differ by a few pixels between tiers because these are measured
    // AABBs: the flanks carry the 12deg tilt (narrower across, taller down) and
    // the hero's includes its target brackets and outer bloom.
    // One box for every tier — CALLOUT_TIER is uniform. They still differ because
    // these are MEASURED AABBs and the flanks carry the tilt: at 18deg through a
    // 460px perspective a rotated card is 14px narrower across and 11px taller
    // down than the flat one it is drawn from. The hero's box includes its target
    // brackets and outer bloom.
    //
    // RE-MEASURE THESE IF TILT_DEG OR TILT_PERSPECTIVE MOVES. The old pair (12deg
    // at 1200px) gave 239x176; the visible tilt changed the footprint, not just
    // the look.
    // The centre pair PITCH rather than yaw (rotateX 12deg, see PITCH_DEG), which
    // widens their box and shortens it — the opposite of what the yaw does to the
    // flanks. Both effects are already in these measured numbers.
    hero: { w: 259, h: 172 },
    mid: { w: 234, h: 187 },
    back: { w: 234, h: 187 },
    deep: { w: 254, h: 168 },
  },
  // Below `deck-md` the width ramp collapses to one 13rem column and the summary
  // is hidden, so all four tiers are the same box.
  md: {
    hero: { w: 213, h: 112 },
    mid: { w: 208, h: 112 },
    back: { w: 208, h: 112 },
    deep: { w: 213, h: 112 },
  },
  sm: {
    hero: { w: 0, h: 0 },
    mid: { w: 0, h: 0 },
    back: { w: 0, h: 0 },
    deep: { w: 0, h: 0 },
  },
};

// ------------------------------------------------------------------ globals.css
// `shipScale` is the tier's own transform on the sprite (deck-md:scale-75,
// deck-sm:scale-50 in ShipSprite). The envelope below turns it into a box.
// `run` and `rise` are both gone: there is no standoff left to model in either
// axis, because the cards are detached from the plane and `x`/`y` name the
// card's own centre. See the note in <MissionNode>.
/**
 * `bar` is the top bar's BOTTOM EDGE, not its height: the header is inset 14px
 * and 92px tall at every tier, so the first usable pixel is 106 everywhere.
 *
 * `dock` is the bottom chrome the rails must clear. At `lg` that is <Footer> at
 * 66px; below `deck-md` the footer hides and <Dock> takes the strip back.
 *
 * `shipFloor` is a SEPARATE and larger bottom reserve, for the HULL only. The
 * footer is not the lowest thing in the middle of the frame — <LaunchPrompt> sits
 * centred above it, exactly where the ship is — so checking the hull against the
 * footer alone would pass a deck whose nose cone is behind "PRESS ENTER". 66px of
 * footer plus the prompt's own ~90px stack. It does not apply below `deck-md`,
 * where the prompt is hidden.
 *
 * `clusterW` is separate from `rail` now: the right-hand mass is one 320px legend
 * card, not a 208px column of readouts, so the two sides are no longer the same
 * width and cannot share a constant.
 */
const TIER = {
  lg: { name: "lg", rail: 226, railGap: 14, cluster: 124, clusterW: 320, clusterBottom: 96, bar: 76, dock: 66, shipFloor: 137, shipScale: 1, cap: "full" },
};

// ------------------------------------------------------------- shipFrames.ts
const SHIP_PIXELS = 577;

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
// --orbit-radius is a constant: the frame is fixed, so the three bounds that used
// to solve it per viewport collapse to the single value they produced at
// 1536x1024. Mirrors globals.css.
const ORBIT_RADIUS = 470;

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
// The design frame, and the only size anything is drawn at. Mirrors DECK_WIDTH /
// DECK_HEIGHT in src/features/app/DeckViewport.tsx.
const DECK_WIDTH = 1536;
const DECK_HEIGHT = 1024;

// One tier. The breakpoints are gone with the reflow — see VIEWPORTS.
const tierOf = () => "lg";

// ---------------------------------------------------------------------- model
// `lodOf` survives for the roster printout only. `clampLod` and its RANK table
// are gone: BOX is keyed by the mission's authored TIER now rather than by a
// depth-derived level of detail, so there is no cap left to clamp against.
const lodOf = (d) => (d < LOD.marker ? "marker" : d < LOD.compact ? "compact" : "full");

const placed = MISSIONS.map((m) => ({
  ...m,
  // Further up the frame reads as further away.
  depth: (m.y + 1) / 2,
  side: Math.abs(m.x) < CENTRE_BAND ? "center" : m.x < 0 ? "left" : "right",
}));

/** `max(|x|)`. The divisor in every radius formula. Mirrors --orbit-radius. */
const REACH = Math.max(...placed.map((p) => Math.abs(p.x)));

const radiusOf = () => ORBIT_RADIUS;

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
    // Boxes are per-TIER and measured, rotation included — see BOX. Nothing
    // scales them: there is no LOD ramp and no active multiplier, so a card's
    // footprint is the same resting and hovered.
    const box = BOX[t.name][p.tier];
    const bw = box.w;
    const bh = box.h;
    // The authored position IS the card's centre now — there is no anchor below
    // it and no tether rise, because the cards are detached from the plane. The
    // two gains are the card arrangement's own, applied in <MissionNode>.
    // `p.x`/`p.y` already carry the card gains — see `station`.
    const nx = cx + R * p.x;
    const ny = planeY + R * p.y - CARD_LIFT;
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
  const R = radiusOf();
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
  // THE HULL MUST CLEAR THE BOTTOM CHROME, not merely the frame. This check did
  // not exist, and its absence was actively misleading: raising DECK_BIAS to buy
  // headroom for the top of the ring reported as a clean pass while quietly
  // sinking the engines behind the dock. The frame bound (h-6) is far lower and
  // never caught it. The exhaust plume is still expected to run behind whatever
  // is down there — it is a light source, not an obstacle — but painted hull
  // disappearing under chrome is a composition error.
  //
  // `shipFloor`, NOT `dock`: at `lg` the lowest thing in the middle of the frame
  // is <LaunchPrompt>, which sits above the footer and dead centre, which is
  // where the ship is. See TIER.
  if (ship.y1 > h - t.shipFloor)
    out.push(`ship into bottom chrome by ${Math.round(ship.y1 - (h - t.shipFloor))}px`);
  if (ship.y0 < t.bar + 4) out.push("ship under top bar");
  // y0 mirrors the rail's own RAIL_TOP in CommandHud (bar bottom 106 + 10 gap).
  const railL = t.rail && { x0: -1e4, x1: t.railGap + t.rail, y0: t.bar + 10, y1: h - t.dock };
  // The legend card, bottom-right. `clusterBottom` is CommandHud's RAIL_BOTTOM —
  // it clears the footer rather than resting on it, so this box does not start at
  // `h - dock`.
  const clusterR = t.clusterW && {
    x0: w - t.railGap - t.clusterW, x1: 1e4,
    y0: h - t.clusterBottom - t.cluster, y1: h - t.clusterBottom,
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
/**
 * ONE FRAME, NOT THIRTY-SIX, AND THAT IS NOT A REDUCTION IN COVERAGE.
 *
 * This list used to sample the whole viewport range densely, because the deck
 * reflowed into whatever window it was given: each width produced a different
 * orbit radius, each tier a different card size, and a collision could hide in
 * the gaps between sampled sizes. The note that stood here warned that a tier
 * whose worst case is never tested passes on the strength of its best case.
 *
 * <DeckViewport> removed the variable. The deck is authored once at 1536x1024 and
 * scaled uniformly to fit, so every window renders the SAME geometry at a
 * different magnification — and a uniform scale cannot introduce an overlap that
 * is not already present at 1:1. Checking the design frame checks every window.
 *
 * The script keeps its value: the frame is still over-constrained, the callouts
 * are still positioned by trigonometry rather than by layout, and moving a
 * station or a card width can still put FORGE under the rail. It just has one
 * case to prove instead of thirty-six.
 */
const VIEWPORTS = [[DECK_WIDTH, DECK_HEIGHT]];

console.log("Command Deck layout check");
console.log(`max reach = ${REACH.toFixed(3)}R  orbit radius = 470px, fixed frame\n`);

for (const p of placed) {
  console.log(
    `  ${p.id.padEnd(9)} x=${p.x.toFixed(2).padStart(5)} y=${p.y.toFixed(2).padStart(5)}` +
      ` depth=${p.depth.toFixed(3)} lod=${lodOf(p.depth).padEnd(7)}` +
      ` tier=${p.tier.padEnd(4)} side=${p.side}`,
  );
}
console.log();

let failed = 0;
/**
 * ONE PASS. A hover sweep lived here twice — once when the cards carried a tier
 * scale, once for a selection scale — and is gone with both. With no geometry
 * that changes under the pointer, a hovered deck is identical to a resting one
 * and the sweep reports the same answer six extra times.
 */
for (const [w, h] of VIEWPORTS) {
  const { name, R, out: lines } = violations(w, h);
  if (lines.length) failed++;
  console.log(
    `${String(w).padStart(4)}x${String(h).padStart(4)}  ${name}  R=${String(Math.round(R)).padStart(3)}  ` +
      (lines.length ? `FAIL\n            ${lines.join("\n            ")}` : "ok"),
  );
}

console.log(`\n${VIEWPORTS.length - failed}/${VIEWPORTS.length} viewports clear`);
process.exit(failed === 0 ? 0 : 1);
