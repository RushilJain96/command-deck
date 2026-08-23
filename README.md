# Command Deck

Rushil Jain's personal portfolio, built as an interactive **Engineering Command Center** rather
than a page-based site. One fixed, non-scrolling viewport hosts a spatial scene: an orbital
mission field, a spacecraft that aims at whatever is targeted, and a screen-space HUD.

<!-- LIVE DEMO — add the URL here once it is deployed, e.g.
**[View the deck →](https://example.vercel.app)**
Leave this commented out rather than linking a URL that 404s. -->

<!-- SCREENSHOTS
Drop two captures in `docs/` and uncomment the block below. Capture at 1536x1024
(the design frame) or 3072x2048 for a 2x image — anything narrower and the deck
scales down and the type gets soft.

![Command Deck](docs/command-deck.png)
![Engineering Systems console](docs/systems-console.png)
-->

```
Boot  ──▶  Mission Control  ──▶  Systems  ──▶  Projects · Timeline · Lab · Contact
                                                       (not built yet)
```

---

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, React Compiler |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (`@theme inline`, no config file) |
| Motion | Framer Motion 12 |
| Icons | `lucide-react` for interface glyphs, `simple-icons` for technology brand marks |

No WebGL, no three.js, no UI kit. The 2.5D projection is two constants in
[`features/missions/placement.ts`](src/features/missions/placement.ts).

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `eslint.config.mjs`) |
| `npm run check:layout` | Headless collision solver — proves the six mission callouts, the HUD rails, the ship and the frame coexist inside the design frame |

There is no unit-test runner. `check:layout` is the closest thing to a test suite, and it is a
**hand-maintained mirror** of constants in `globals.css`, `placement.ts` and `data.ts`. Change
any of those and it must change too, or it passes on stale numbers.

## Scenes

Navigation is state, not routing — `SceneHost` swaps scenes on one canvas with no page loads.
The top bar is a six-position mode selector; two positions are live.

| Scene | State | What it is |
| --- | --- | --- |
| **Boot** | live | Arrival sequence, hands off to the deck on a timer |
| **Mission Control** | live | The orbital field: six mission callouts, the spacecraft, the instrument rails |
| **Systems** | live | Engineering console — domain cards, capability matrix, technology and tool libraries, exploration panel |
| **Projects · Timeline · Lab · Contact** | locked | Advertised in the selector so the shape of the system is visible; `ProjectScene` is a stub |

## Layout

```
src/
  app/                 root shell, home route, global styles + design tokens
  components/          shared one-offs
  features/
    app/                 reducer, provider, hooks, the scaled design frame
    camera/              MotionValue-driven pan/zoom
    chrome/              persistent shell (top bar, footer)
    environment/         starfield, celestial bodies, orbital field
    hud/                 scene-scoped readouts on the shared HudPanel housing
    missions/            the roster, its polar→screen projection, callout cards
    scenes/              SceneHost plus the scene registry
    spacecraft/          16 pre-rendered yaw frames, attitude integrator, exhaust plume
    systems/             the Systems console and its content
  lib/                 cross-cutting primitives (angles, springs, chamfers, class merging)
scripts/               deck-layout-check.mjs
```

Feature folders stay flat; a subfolder only appears once a feature exceeds ~5 files.
`@/*` maps to `src/*`.

## Engineering notes

A few decisions that are load-bearing and not obvious from the file names:

- **One fixed composition, scaled to the window.** The deck is authored against 1536×1024 and
  scaled by `min(1, innerHeight / 1024)`; nothing reflows. This replaced three responsive tiers
  that hid the rails, the legend and the navigation below the largest one — which meant a common
  laptop rendered a different, poorer product than the one that was designed.
  See [`DeckViewport`](src/features/app/DeckViewport.tsx).

- **The camera rig is nested, and it has to be.** Framer serializes transforms in a fixed key
  order, so pan and zoom on one element gives `Z·p − C` where a camera needs `Z·(p − C)`. Identical
  at zoom 1, 24px apart at zoom 1.6. See [`CameraRig`](src/features/camera/CameraRig.tsx).

- **Targeting is three concurrent slots, not one "active" field.** Pointer, focus and lock are
  separate inputs; collapsing them causes flicker on mouse and permanently latched targets on
  touch. See [`state.ts`](src/features/app/state.ts).

- **Reduced motion needs two mechanisms.** `<MotionConfig reducedMotion="user">` covers only the
  declarative path — `useSpring` does not read it — so anything imperatively driven swaps its own
  options via [`useMotionPreset`](src/lib/motion/useMotionPreset.ts). CSS keyframes are a third,
  switched off explicitly in `globals.css`.

- **The Systems console reports; it does not advertise.** Every figure on it is a count of
  [`systems/data.ts`](src/features/systems/data.ts) — no invented percentages, years or ratings —
  and the exploration panel shows stage words over bars rather than printed scores.

## Contributing

[`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) carry the full architectural invariants:
the nested camera rig, the angle convention, the MotionValue rules, the `AnimatePresence` mode
and the reduced-motion handling. Read them before touching the interaction engine — breaking one
of those produces bugs that stay invisible until much later.

Note that this project pins `next@16.2.12`, which has API and convention changes from older
versions. The relevant guides ship with the package under `node_modules/next/dist/docs/`.
