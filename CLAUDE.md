# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Rushil's personal portfolio site — a Next.js (App Router) + TypeScript + Tailwind CSS v4 project, built as an interactive Engineering Command Center rather than a page-based site. One fixed, non-scrolling viewport hosts a spatial scene: an orbital mission field, a spacecraft that aims at whatever is targeted, and a screen-space HUD.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`)
- `npm run check:layout` — headless collision solver; proves the six mission callouts, the HUD rails, the ship and the frame coexist across 25 viewports

There is no unit-test runner. `check:layout` is the closest thing to a test suite, and it is a **hand-maintained mirror** of constants in `globals.css`, `placement.ts` and `data.ts` — change any of those and you must change it too, or it passes on stale numbers.

## Important: Next.js version mismatch with training data

This project pins `next@16.2.12`, which is newer than most models' training data and has breaking API/convention changes from what you likely expect. **Before writing or modifying any Next.js-specific code** (routing, data fetching, server/client components, config, image/font handling, etc.), read the relevant guide under `node_modules/next/dist/docs/` — it is organized into `01-app` (App Router), `02-pages` (Pages Router), `03-architecture`, and `04-community`. This project uses the App Router (`src/app/`), so `01-app` is the relevant section. Heed any deprecation notices found there.

## Architecture

- App Router structure under `src/app/`: `layout.tsx` defines the root HTML shell (Geist Sans/Mono fonts via `next/font/google`, loaded as CSS variables), `page.tsx` is the home route, `globals.css` wires up Tailwind v4 via `@import "tailwindcss"` and defines theme tokens.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`, `babel-plugin-react-compiler` devDependency) — avoid manual `useMemo`/`useCallback` micro-optimizations since the compiler handles memoization automatically.
- Tailwind CSS v4 is configured via PostCSS (`@tailwindcss/postcss` in `postcss.config.mjs`) rather than a `tailwind.config.js` file; theme customization happens in `globals.css` using `@theme inline`.
- `clsx` + `tailwind-merge` are available for conditional/merged class names; `framer-motion` is available for animation; `lucide-react` for icons.

Feature code lives in flat folders under `src/features/{app,camera,chrome,environment,hud,missions,scenes,spacecraft}`, with cross-cutting primitives in `src/lib/{math,motion}`. Add subfolders to a feature only once it exceeds ~5 files.

- `app` — reducer, provider, hooks. Four separate primitive-valued contexts, not one object context.
- `camera` — MotionValue-driven pan/zoom. No React state.
- `chrome` — persistent shell (`TopBar`, `Dock`), siblings of `SceneHost` so they do not fade with scene transitions.
- `environment` — starfield, celestial bodies, and the orbital field. The field is a `<canvas>` because it needs additive compositing.
- `hud` — scene-scoped readouts, all built on the shared `HudPanel` housing.
- `missions` — the roster, its polar→screen projection (`placement.ts`), and the callout cards.
- `scenes` — `SceneHost` plus the scene registry. `boot` and `command-deck` are real; `project` is still a stub.
- `spacecraft` — 16 pre-rendered WebP yaw frames, an attitude integrator, and an SVG exhaust plume.

There is no WebGL and no three.js. The entire 2.5D projection is one constant: `ORBIT_TILT = 0.64` in `placement.ts`, which is `sin(elevation)` for a camera 39.8° above the plane. Depth is carried by parallax factors and z-index, never by perspective.

## Interaction engine invariants

These were established in Sprint 1 and are load-bearing. Breaking one produces bugs that stay invisible until a later sprint.

**The camera rig must stay nested.** Framer Motion serializes transforms in a fixed key order (`x`, `y`, … `scale`, `rotate`), so putting pan and zoom on one element yields `translate(-C) scale(Z)` = `Z*p - C`, whereas a camera requires `Z*(p - C)`. These are identical at zoom 1 and diverge at every other zoom (24px of drift at zoom 1.6). `CameraRig` nests scale outside translate for this reason.

**Screen-space UI is a sibling of `<CameraRig>`, never a child.** A transformed ancestor becomes the containing block for `position: fixed` descendants, opens a new stacking context, and scales `backdrop-filter` blur radii. HUD, dock and glass panels go outside the rig.

**Angles are degrees, clockwise from screen-up.** This matches CSS `rotate()` and Framer's `rotate`, so the nose-up ship SVG needs no offset constant. All trigonometry lives in `src/lib/math/angle.ts` — note `angleTo` uses `atan2(dx, -dy)`, deliberately swapped and negated for y-down screen space. If you ever need a "nose offset" fudge factor, the convention has been broken.

**Never call `mv.get()` or `mv.set()` during render.** MotionValues are mutable external state; the React Compiler is entitled to memoize a component and never re-read. Bind via `style`, `useTransform` or `useMotionValueEvent`, and mutate only in effects and event handlers. `camera.moveTo`/`jumpTo` are effects-and-handlers-only for this reason.

**Reduced motion needs two mechanisms.** `<MotionConfig reducedMotion="user">` covers only the declarative path (`animate`, `whileHover`). `useSpring`/`useFollowValue` do **not** read it — verified in `use-spring.mjs`. Anything imperatively driven must swap its own options via `useMotionPreset`.

**`AnimatePresence` uses `mode="sync"`, not `"wait"`.** `wait` leaves a gap with nothing on screen, which breaks spatial continuity. The keyed `motion.div` wrapper lives in `SceneHost`, not in individual scenes — a scene whose root is a fragment would silently no-op its exit.

**The orbit radius is owned by CSS.** `--orbit-radius` is registered with `@property` in `globals.css` so its computed value resolves to pixels and JS can read it with `getComputedStyle` when needed. Do not measure the viewport in JS: reading `window.innerWidth` during render is both a hydration-mismatch source and a `react-hooks/purity` violation (eslint-plugin-react-hooks 7 is active via `eslint-config-next`).

**Targeting is three slots plus a selector**, not one "active" field — pointer, focus and lock are concurrent inputs, and collapsing them causes flicker and latches targets permanently on touch (where `pointerenter` fires with no matching `pointerleave`).

# Engineering Command Center — System Rules

## Project Paradigm
* This project is an interactive Engineering Command Center inspired by premium software tools and modern game UI.
* The portfolio itself is a software engineering system — not a traditional website.
* Every architectural decision must prioritize performance, responsiveness, and clean code.

## Non-Negotiable Engineering Principles
* Engineering over decoration; performance over visual excess.
* Every animation must have an navigational or spatial purpose.
* Accessibility and reusability are mandatory.
* Never introduce unnecessary abstraction or replace existing working interactions without explicit instruction.

## Forbidden Patterns (STRICT ANTI-PATTERNS)
* NO traditional landing page layouts (Hero -> About -> Skills -> Contact).
* NO generic project cards, Bootstrap-like grids, or long vertical-scrolling pages.
* NO neon cyberpunk styling, noisy HUD clutter, or arbitrary gradient fills.

## Architecture Philosophy: Scene-Based State
Think in continuous Scenes rather than static Pages:
  Boot Scene ──> Command Deck ──> Project Scene ──> Timeline ──> Lab ──> Contact
* Transitions between scenes must feel smooth, continuous, and spatial.
* State switching occurs on the single viewport canvas without traditional page reloads.

## Motion & Design System Language
* **Aesthetic Benchmark:** Clean technical minimalism inspired by Linear, Vercel, and Apple hardware interfaces.
* **Motion Feel:** Smooth, spring-based physics (Apple + Linear + Astro's Playroom).
* **Palette:** Deep Obsidian/Dark Slate background, subtle 1px glassmorphic borders, crisp geometric typography paired with monospace data accents.

## Tech Stack Requirements
* Framework: Next.js (App Router, TypeScript)
* Styling: Tailwind CSS, `clsx`, `tailwind-merge`
* Motion & Icons: Framer Motion, Lucide Icons
* Optimizations: React Compiler enabled

## Development Workflow
For every task or feature request:
1. Analyze requirements & potential visual/architectural regressions.
2. Produce a clear implementation plan.
3. Wait for user approval.
4. Implement cleanly.
5. Verify build integrity & responsiveness.