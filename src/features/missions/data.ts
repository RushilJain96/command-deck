import { Brain, Hammer, Network, Radio, Shield, Workflow } from "lucide-react";
import { derivePlacement, gainedStation } from "./placement";
import type { Mission, MissionSlot } from "./types";

/**
 * The mission roadmap. THIS FILE IS THE ONLY PLACE MISSION CONTENT LIVES —
 * adding, renaming or re-staging a mission never requires touching a component.
 *
 * Entries describe intended engineering work and its lifecycle state, not
 * claimed accomplishments. A PLANNED mission is honest about not existing yet.
 *
 * LAYOUT IS A CLOCK FACE ON THE ORBITAL PLANE.
 *
 * ORION holds the hub at dead centre and the other five ring it, stated as
 * `orbitalStation(theta, ring)` — theta in degrees clockwise from screen-up, so
 * it reads as a clock: 0 is twelve, 62 is two, 130 is four, 230 is eight, 298 is
 * ten. Six o'clock is deliberately empty; that is where the spacecraft sits.
 *
 * THIS IS THE POLAR VOCABULARY COMING BACK, BUT NOT THE OLD COUPLING. Stations
 * used to be stored as `theta`/`ring` and re-projected on every consumer, with a
 * tether drawn from each card down to its point on the ring. That made the orbit
 * the thing that SIZED the cards: three of them had to fit across a 1.22R span
 * whatever the viewport, so every collision the solver found was answered by
 * shrinking the card — 220px to 168 to 156, in that order.
 *
 * What is stored now is the PROJECTED OFFSET. `orbitalStation` runs the
 * trigonometry once at module load and the components consume a plain x/y in
 * --orbit-radius units; nothing at runtime knows an angle, and no card is tied to
 * a point on a ring. So the ellipse describes the arrangement without governing
 * how big the things arranged on it may be, which is what went wrong before.
 *
 * DATAFLOW RIDES A MUCH LARGER RING THAN ITS NEIGHBOURS (2.05 against 0.98-1.2)
 * AND THAT IS NOT AN INCONSISTENCY. Twelve o'clock is where the ellipse is
 * narrowest, so a station there converts almost none of its radius into vertical
 * distance from the hub — at the flanks' ring it would sit inside ORION's own
 * card. The ring number is not a measure of apparent distance; the projection is.
 *
 * THE RING VALUES ARE SOLVED, NOT CHOSEN. Six cards on a clock face is a tight
 * packing problem: each pair has to clear either horizontally or vertically, and
 * the binding pair moves as the numbers change (it was NEXUS/AURORA, then
 * ORION/DATAFLOW, then ORION against the hull). The current set has a minimum
 * feasible radius of 274px, which the narrowest `lg` viewport clears at 299.
 * Re-angle anything and re-run the check before trusting it.
 *
 * `npm run check:layout` models this arrangement, including a sweep with each
 * mission in turn under the pointer. Move anything here and run it.
 */
const MISSION_SLOTS: readonly MissionSlot[] = [
  {
    id: "MISSION-01",
    label: "M-01",
    codename: "ORION",
    title: "Orion SIEM",
    summary: "Security event pipeline: ingestion, correlation, incident triage.",
    // FRONT-CENTRE. Ring 0.35 at twelve o'clock, so x is EXACTLY 0 (sin 0) and
    // the card is dead centre horizontally while still sitting on an orbit
    // rather than at a mathematical point.
    //
    // Ring 0 put it lower, and the hull ran through its status strip: the hero
    // is 174px tall at 1.2 and the ship sits only 0.51R below the plane centre,
    // so dead-centre-and-lowest needed R > 387 to clear. Lifting it one small
    // orbit drops that to 301.
    ...gainedStation(0, 0.135),
    icon: Shield,
    tier: "hero",
    status: "IN_DEVELOPMENT",
  },
  {
    id: "MISSION-02",
    label: "M-02",
    codename: "ECHO",
    title: "Echo Relay",
    summary: "Real-time messaging layer over WebSockets with presence and backpressure.",
    // BACK-LEFT. Ring solved so its x matches FORGE's to 0.0002R — the pair
    // shares a lane and must share a centre line.
    ...gainedStation(304.6, 1.183),
    icon: Radio,
    tier: "back",
    status: "DEPLOYED",
  },
  {
    id: "MISSION-03",
    label: "M-03",
    codename: "DATAFLOW",
    title: "Dataflow",
    summary: "Distributed batch and stream orchestration with lineage tracking.",
    // TWELVE O'CLOCK, and on a ring FAR outside the other five (2.05 against
    // 1.05-1.3). Twelve is where the ellipse is narrowest, so a station there
    // converts almost none of its radius into vertical distance from the hub —
    // at the flanks' own ring it would sit inside ORION's card. This also puts
    // it beyond the field's drawn outer ring at 1.55, which is correct rather
    // than a mistake: in the reference the top card floats clear above the ring
    // system rather than sitting on it.
    ...gainedStation(0, 2.055),
    icon: Workflow,
    tier: "deep",
    status: "PLANNED",
  },
  {
    id: "MISSION-04",
    label: "M-04",
    codename: "NEXUS",
    title: "Nexus Gateway",
    summary: "API gateway handling routing, rate limiting and request shaping.",
    // BACK-RIGHT, mirroring ECHO onto AURORA's lane.
    ...gainedStation(55.4, 1.183),
    icon: Network,
    tier: "back",
    status: "PLANNED",
  },
  {
    id: "MISSION-05",
    label: "M-05",
    codename: "AURORA",
    title: "Aurora ML",
    summary: "Model training and evaluation platform with reproducible runs.",
    // FRONT-RIGHT. Near side, so perspective spreads it wider than its back-lane
    // partner despite the smaller ring.
    ...gainedStation(124.7, 0.914),
    icon: Brain,
    tier: "mid",
    status: "IN_DEVELOPMENT",
  },
  {
    id: "MISSION-06",
    label: "M-06",
    codename: "FORGE",
    title: "Forge",
    summary: "Developer tooling: build caching, CLI ergonomics, release automation.",
    // FRONT-LEFT.
    ...gainedStation(235.3, 0.914),
    icon: Hammer,
    tier: "mid",
    status: "DEPLOYED",
  },
];

/**
 * One line of flight-briefing prose per mission, keyed by id.
 *
 * Lives beside the roster rather than inside it because it serves a different
 * surface: the operator panel swaps its standing line for the briefing of
 * whatever the pointer is over, so the introduction narrates the exploration
 * instead of sitting inert. Deliberately shorter and more directive than
 * `summary`, which is the panel's own description of itself.
 */
export const MISSION_BRIEFINGS: Readonly<Record<string, string>> = {
  "MISSION-01": "Correlating security events into something a human can triage.",
  "MISSION-02": "Keeping sockets honest when every client talks at once.",
  "MISSION-03": "Moving data on a schedule, with lineage you can audit.",
  "MISSION-04": "One front door for every service behind it.",
  "MISSION-05": "Training runs that reproduce, months later, on other hardware.",
  "MISSION-06": "Sharpening the tools the other five missions are built with.",
};

/**
 * Projection resolved once at module load. Server and client derive identical
 * values from the same constants, so this is hydration-safe by construction.
 */
export const MISSIONS: readonly Mission[] = MISSION_SLOTS.map((slot) => ({
  ...slot,
  placement: derivePlacement(slot.x, slot.y),
}));

/**
 * The module the deck rests on when nothing has been pointed at yet.
 *
 * Derived from `tier` rather than written down, so promoting a different mission
 * to hero moves the resting lock with it and cannot leave the two disagreeing.
 *
 * THE DECK OPENS WITH SOMETHING TARGETED, deliberately. An untargeted deck draws
 * no bearing beam, no reticle and no lit callout — the three things that say this
 * is a machine aimed at something rather than six cards on a starfield — so the
 * whole targeting mechanism was invisible until the visitor happened to move the
 * mouse over a card. Resting on the hero shows the mechanism in its engaged state
 * on arrival, and the first pointer move demonstrates it by CHANGING rather than
 * by appearing from nothing.
 */
export const HERO_MISSION_ID = MISSION_SLOTS.find((slot) => slot.tier === "hero")!.id;

export function getMissionById(id: string | null): Mission | undefined {
  if (id === null) return undefined;
  return MISSIONS.find((mission) => mission.id === id);
}
