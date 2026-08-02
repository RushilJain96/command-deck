import { derivePlacement } from "./placement";
import type { Mission, MissionSlot } from "./types";

/**
 * The mission roadmap. THIS FILE IS THE ONLY PLACE MISSION CONTENT LIVES —
 * adding, renaming or re-staging a mission never requires touching a component.
 *
 * Entries describe intended engineering work and its lifecycle state, not
 * claimed accomplishments. A PLANNED mission is honest about not existing yet.
 *
 * LAYOUT. `theta` is degrees clockwise from screen-up; `ring` is the orbit,
 * as a fraction of --orbit-radius. Two rules govern the arrangement:
 *
 *   1. THE FULL RING IS AVAILABLE. Earlier the arc around theta 180 was banned
 *      because the spacecraft parked there. It no longer does — SHIP_STANDOFF
 *      now puts the vehicle half an orbit BEYOND the outermost ring, so every
 *      angle is free and the near arc is the most valuable real estate on the
 *      deck: it is closest to the viewer, so it carries the full-detail
 *      callouts.
 *
 *   2. NO EVEN GAPS, AND NO ORBIT EVENLY POPULATED. Six nodes at 60deg spacing
 *      on one ring is the tell that a layout was generated rather than
 *      composed. These ride four well-separated orbits (0.34 / 0.66 / 0.80 /
 *      1.00) at gaps of 26/28/54/74/42/136deg. Sharing orbits is deliberate:
 *      the rings are drawn, so a node floating between two of them reads as a
 *      mistake rather than as variety. The asymmetry belongs in the angles.
 *
 * ORION rides the innermost orbit almost directly ahead of the vehicle, which
 * puts it inside the CENTRE_BAND and gives it a straight vertical sight line
 * from the nose. It is the deck's focal point; if you re-author these angles,
 * something should stay in that band or the composition loses its centre.
 */
const MISSION_SLOTS: readonly MissionSlot[] = [
  {
    id: "MISSION-01",
    label: "M-01",
    codename: "ORION",
    title: "Orion SIEM",
    summary: "Security event pipeline: ingestion, correlation, incident triage.",
    theta: 168,
    ring: 0.34,
    status: "IN_DEVELOPMENT",
  },
  {
    id: "MISSION-02",
    label: "M-02",
    codename: "ECHO",
    title: "Echo Relay",
    summary: "Real-time messaging layer over WebSockets with presence and backpressure.",
    theta: 296,
    ring: 0.8,
    status: "DEPLOYED",
  },
  {
    id: "MISSION-03",
    label: "M-03",
    codename: "DATAFLOW",
    title: "Dataflow",
    summary: "Distributed batch and stream orchestration with lineage tracking.",
    theta: 338,
    ring: 0.8,
    status: "PLANNED",
  },
  {
    id: "MISSION-04",
    label: "M-04",
    codename: "NEXUS",
    title: "Nexus Gateway",
    summary: "API gateway handling routing, rate limiting and request shaping.",
    theta: 46,
    ring: 0.66,
    status: "PLANNED",
  },
  {
    id: "MISSION-05",
    label: "M-05",
    codename: "AURORA",
    title: "Aurora ML",
    summary: "Model training and evaluation platform with reproducible runs.",
    theta: 140,
    ring: 1.0,
    status: "IN_DEVELOPMENT",
  },
  {
    id: "MISSION-06",
    label: "M-06",
    codename: "FORGE",
    title: "Forge",
    summary: "Developer tooling: build caching, CLI ergonomics, release automation.",
    theta: 222,
    ring: 1.0,
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
  placement: derivePlacement(slot.theta, slot.ring),
}));

export function getMissionById(id: string | null): Mission | undefined {
  if (id === null) return undefined;
  return MISSIONS.find((mission) => mission.id === id);
}
