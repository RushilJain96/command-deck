export type MissionId = `MISSION-${string}`;

export type MissionStatus = "online" | "standby" | "locked";

export interface MissionSlot {
  id: MissionId;
  /**
   * Short label rendered on the node. Sprint 1 ships abstract slot designators
   * only — real project names arrive with the Project Scene in Sprint 4.
   */
  label: string;
  /**
   * Orbital position, in degrees clockwise from screen-up.
   * See `src/lib/math/angle.ts` for the convention.
   */
  theta: number;
  status: MissionStatus;
}
