# Engineering Command Center
## Product Specification v1.0

---

## Purpose

Build an interactive engineering portfolio that feels like a premium software product rather than a traditional website.

The portfolio itself should demonstrate software engineering ability through architecture, interaction design, performance, and code quality.

---

## Target Audience

- Software Engineering Recruiters
- Hiring Managers
- Senior Engineers
- Technical Interviewers

---

## Core Principles

- Engineering over decoration.
- Performance over visual effects.
- Every animation has a purpose.
- Navigation should feel spatial.
- Every project has equal importance.
- Components should be reusable.
- Accessibility is mandatory.
- Maintainability is a feature.

---

## Core Experience

```
Boot
    ↓
Command Deck
    ↓
Target Mission
    ↓
Launch
    ↓
Project Scene
    ↓
Return
```

The experience should encourage exploration rather than scrolling.

---

## Scene Architecture

The application is scene-driven.

Scenes:

- Boot
- Command Deck
- Project
- Timeline
- Lab
- Contact

Each scene owns:

- UI
- Animations
- Camera
- Input
- Transitions

---

## Command Deck

Responsibilities

- Render spacecraft
- Render mission nodes
- Render dashboard
- Handle targeting
- Handle launching
- Handle scene transitions

The Command Deck is always the home state.

---

## Spacecraft Rules

Idle

- Remains near viewport center
- Subtle idle animation

Hover

- Rotates toward target
- HUD updates
- Mission highlights

Click

- Target lock
- Engine ignition
- Camera acceleration
- Transition to Project Scene

Return

- Camera resets
- Ship recenters
- Deck restored

The ship rotates.

The camera moves.

---

## Mission Nodes

Mission nodes represent destinations.

Requirements

- Floating motion
- Hover response
- Status indicator
- Launch interaction
- Responsive Polar Positioning: Nodes must be distributed around the center (0, 0) anchor using polar coordinates $(r, \theta)$, where the orbital radius $r$ scales dynamically based on viewport dimensions (Math.min(window.innerWidth, window.innerHeight) * 0.35) so nodes never collide with the center spacecraft or clip screen edges.

Mission nodes are never generic cards.

---

## Project Scene

Every project contains

- Overview
- Problem
- Architecture
- Tech Stack
- Challenges
- Tradeoffs
- Performance
- Lessons
- Future Work
- Repository
- Live Demo

---

## Motion Language

Motion should communicate

- Navigation
- Hierarchy
- Weight

Guidelines

- Spring animations
- No instant transitions
- No unnecessary effects
- Smooth acceleration/deceleration

Reference

- Apple
- Linear
- Astro's Playroom

---

## Visual Language

Style

- Premium
- Technical
- Minimal

Palette

- Obsidian background
- Slate surfaces
- Subtle borders
- White typography
- Single red accent

Avoid

- Neon
- Rainbow gradients
- Cyberpunk styling

---

## Technical Requirements

Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons

Requirements

- 60 FPS
- GPU transforms
- Responsive
- Accessible
- Reusable components
- Lazy loading

---

## Future Expansion

Architecture must support

- New projects
- New scenes
- Blog
- Research notes
- Live GitHub widgets
- Live LeetCode widgets
- Interactive diagrams

without major refactoring.