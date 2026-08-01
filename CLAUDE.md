# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Rushil's personal portfolio site — a Next.js (App Router) + TypeScript + Tailwind CSS v4 project. Currently an unmodified `create-next-app` scaffold (single page at `src/app/page.tsx`); no components, routes, or tests exist yet beyond the default template.

## Commands

- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint (flat config via `eslint.config.mjs`)

There is no test runner configured in this project.

## Important: Next.js version mismatch with training data

This project pins `next@16.2.12`, which is newer than most models' training data and has breaking API/convention changes from what you likely expect. **Before writing or modifying any Next.js-specific code** (routing, data fetching, server/client components, config, image/font handling, etc.), read the relevant guide under `node_modules/next/dist/docs/` — it is organized into `01-app` (App Router), `02-pages` (Pages Router), `03-architecture`, and `04-community`. This project uses the App Router (`src/app/`), so `01-app` is the relevant section. Heed any deprecation notices found there.

## Architecture

- App Router structure under `src/app/`: `layout.tsx` defines the root HTML shell (Geist Sans/Mono fonts via `next/font/google`, loaded as CSS variables), `page.tsx` is the home route, `globals.css` wires up Tailwind v4 via `@import "tailwindcss"` and defines theme tokens (`--background`, `--foreground`) with a dark-mode media query override.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`).
- The React Compiler is enabled (`reactCompiler: true` in `next.config.ts`, `babel-plugin-react-compiler` devDependency) — avoid manual `useMemo`/`useCallback` micro-optimizations since the compiler handles memoization automatically.
- Tailwind CSS v4 is configured via PostCSS (`@tailwindcss/postcss` in `postcss.config.mjs`) rather than a `tailwind.config.js` file; theme customization happens in `globals.css` using `@theme inline`.
- `clsx` + `tailwind-merge` are available for conditional/merged class names; `framer-motion` is available for animation; `lucide-react` for icons.

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