import type { MissionSlot } from "./types";

/**
 * Placeholder orbital slots for the interaction engine.
 *
 * These are deliberately content-free: Sprint 1's acceptance criteria forbid
 * placeholder portfolio content, so these are unassigned mission slots rather
 * than invented projects. Adding a real mission later is a matter of appending
 * to this array — nothing else in the app is aware of how many there are.
 *
 * `theta` is degrees clockwise from screen-up. The values below distribute six
 * slots evenly (60 degree spacing) while leaving 12 o'clock occupied, which
 * reads as intentional rather than arbitrary.
 */
export const MISSION_SLOTS: readonly MissionSlot[] = [
  { id: "MISSION-01", label: "01", theta: 0, status: "online" },
  { id: "MISSION-02", label: "02", theta: 60, status: "online" },
  { id: "MISSION-03", label: "03", theta: 120, status: "standby" },
  { id: "MISSION-04", label: "04", theta: 180, status: "online" },
  { id: "MISSION-05", label: "05", theta: 240, status: "standby" },
  { id: "MISSION-06", label: "06", theta: 300, status: "locked" },
];

export function getMissionById(id: string | null): MissionSlot | undefined {
  if (id === null) return undefined;
  return MISSION_SLOTS.find((mission) => mission.id === id);
}
