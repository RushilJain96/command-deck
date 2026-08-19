# Command Deck

Rushil's personal portfolio, built as an interactive Engineering Command Center rather than a
page-based site. One fixed, non-scrolling viewport hosts a spatial scene: an orbital mission
field, a spacecraft that aims at whatever is targeted, and a screen-space HUD.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4 and Framer Motion.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint (flat config via `eslint.config.mjs`) |
| `npm run check:layout` | Headless collision solver — proves the mission callouts, HUD rails, ship and frame coexist across 25 viewports |

There is no unit-test runner. `check:layout` is the closest thing to a test suite, and it is a
hand-maintained mirror of constants in `globals.css`, `placement.ts` and `data.ts` — change any
of those and it must change too, or it passes on stale numbers.

## Layout

```
src/
  app/          root shell, home route, global styles
  components/   shared one-offs
  features/
    app/          reducer, provider, hooks
    camera/       MotionValue-driven pan/zoom
    chrome/       persistent shell (top bar, footer)
    environment/  starfield, celestial bodies, orbital field
    hud/          scene-scoped readouts on the shared HudPanel housing
    missions/     the roster, its polar to screen projection, callout cards
    scenes/       SceneHost plus the scene registry
    spacecraft/   yaw frames, attitude integrator, exhaust plume
  lib/          cross-cutting primitives (angles, springs, class merging)
scripts/        deck-layout-check.mjs
```

There is no WebGL and no three.js — the 2.5D projection is two constants in
`features/missions/placement.ts`.

## Notes for contributors

`CLAUDE.md` and `AGENTS.md` carry the architectural invariants: the nested camera rig, the
angle convention, the MotionValue rules and the reduced-motion handling. Read them before
touching the interaction engine — breaking one of those produces bugs that stay invisible for
a long time.
