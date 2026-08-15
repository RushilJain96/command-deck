import type { LucideIcon } from "lucide-react";
import type { MissionPlacement } from "./placement";

export type MissionId = `MISSION-${string}`;

/**
 * Lifecycle state of a mission. This models an engineering ROADMAP, not a list
 * of shipped work — a mission may legitimately never have been started.
 */
export type MissionStatus = "PLANNED" | "IN_DEVELOPMENT" | "DEPLOYED";

export interface MissionSlot {
  id: MissionId;
  /** Short designator shown at every level of detail, e.g. "M-01". */
  label: string;
  /** Operational name. Survives even at marker LOD — identity is never dropped. */
  codename: string;
  /** Human title shown from compact LOD upward. */
  title: string;
  /** One line of context, shown at full LOD only. */
  summary: string;
  /**
   * WHERE THE CARD SITS, and it is AUTHORED rather than projected.
   *
   * `x` is offset from the plane's centre in units of `--orbit-radius`.
   * `y` is the same, BEFORE the tilt squash — so the drawn vertical offset is
   * `y * --orbit-radius * --orbit-tilt`, and negative is up the screen.
   *
   * THESE REPLACED `theta` AND `ring`, AND THAT IS THE POINT. Cards used to be
   * projected onto the orbital plane by trigonometry and then held above their
   * waypoint on a tether. That tied the composition to the ring's geometry, and
   * the ring is not wide enough to hold six legible cards: the back rank spans
   * 1.22R, so at any radius the viewport allows, three cards across it had to be
   * shrunk until they fitted. The cards were being sized by the orbit instead of
   * the orbit being a backdrop for the cards.
   *
   * Authoring the position inverts that. The cards are a composed arrangement
   * that floats ABOVE the plane, the plane is scenery behind them, and nothing
   * connects the two. Size is now a design decision rather than a residual.
   *
   * LAYOUT IS THREE COLUMNS OF TWO. The back rank sits higher and is pulled
   * slightly INWARD of the front rank, which is what makes the pair read as one
   * behind the other rather than as two unrelated cards. Keep `|x| <= 1.02` —
   * the radius formula in globals.css reserves its horizontal budget against the
   * widest card, and pushing one further out puts it under the HUD rail.
   */
  x: number;
  y: number;
  /**
   * Which size band this callout is drawn at. See CALLOUT_TIER.
   *
   * AUTHORED, NOT DERIVED, AND THAT IS A REVERSAL. The scale used to come out of
   * `placement.depth` — `0.75 + depth * 0.4` — which is the physically honest
   * answer and produced a composition nobody wanted: AURORA and FORGE ride ring
   * 1.0 on the near side, so they measured 1.10 while ORION, the deck's declared
   * focal point on ring 0.34, came out at 1.02. The two flanks dominated the
   * frame and the centre read as recessed.
   *
   * Depth still owns everything it should — opacity, level of detail, and the
   * resting sort order it always did. What it no longer owns is SIZE, because
   * size is the strongest hierarchy cue on the deck and hierarchy here is an
   * editorial judgement about which mission matters, not a readout of how far
   * away it happens to sit.
   */
  tier: CalloutTier;
  /**
   * The glyph on the card's index line. One per mission rather than one shared
   * mark, because six identical icons carry no information and the reference
   * uses the glyph to say what KIND of system each mission is at a glance —
   * before any of the text is read.
   */
  icon: LucideIcon;
  status: MissionStatus;
}

/**
 * Depth bands. THESE CARRY STACKING ORDER ONLY — size is no longer among them.
 *
 * SCALE IS GONE FROM THIS TABLE FOR THE SECOND AND LAST TIME. It was withdrawn
 * once when a 1.15/0.95/0.80/0.65 ramp shrank the furthest card to the point of
 * vanishing, then restored when the cards were briefly stacked in columns where
 * a local size comparison read cleanly as depth. The columns are gone; the cards
 * sit in six separate quadrants with air around them, and in that arrangement a
 * size difference between two cards that share no axis reads as IMPORTANCE
 * rather than as distance. Which is the failure mode from the first attempt.
 *
 * Every card is now drawn at exactly one size. Depth is carried by vertical
 * position on the receding plane and by opacity, both of which cost no
 * legibility, and by this z-order if a resize ever brings two cards together.
 */
export type CalloutTier = "hero" | "mid" | "back" | "deep";

export const CALLOUT_TIER: Record<CalloutTier, { z: number }> = {
  /** Centre. Sorts above everything else on the plane. */
  hero: { z: 50 },
  /** Front quadrants — eight and four o'clock. */
  mid: { z: 30 },
  /** Back quadrants — ten and two o'clock. */
  back: { z: 10 },
  /** Back centre, twelve o'clock. Shares the back plane; nothing overlaps. */
  deep: { z: 10 },
};

/**
 * NO ACTIVE SCALE. A targeted module used to grow by 12%, and every `scale()` on
 * a mission card is withdrawn — including this one, because a hover that resizes
 * is the same fake-depth device as a tier that resizes, applied to time instead
 * of space. It also reflowed a card's neighbours' clearances on hover, which is
 * why the layout solver needed a whole second pass to model pointer state.
 *
 * The lock is carried by the things that do not move the box: the red bezel, the
 * corner brackets, the bloom, the lit face, the z-lift to ACTIVE_Z, and the
 * bearing beam terminating on the card's edge. That is six cues without a single
 * pixel of geometry change.
 */


/** A slot with its projection precomputed. This is what components consume. */
export interface Mission extends MissionSlot {
  readonly placement: MissionPlacement;
}

export const STATUS_LABEL: Record<MissionStatus, string> = {
  PLANNED: "PLANNED",
  IN_DEVELOPMENT: "IN DEV",
  DEPLOYED: "DEPLOYED",
};

/** Status rail fill, read as a gauge rather than a badge. */
export const STATUS_FILL: Record<MissionStatus, string> = {
  PLANNED: "38%",
  IN_DEVELOPMENT: "68%",
  DEPLOYED: "100%",
};

/**
 * Lifecycle colours, taken from annunciator-panel convention: green is nominal,
 * amber is work in progress, unlit is not yet started.
 *
 * SIGNAL RED IS STILL ABSENT FROM THIS TABLE, and the original reason still
 * holds: letting red also mean "deployed" made target and lifecycle impossible
 * to tell apart — hovering a deployed mission turned everything the same red.
 * No status may map to red here.
 *
 * What changed is that <MissionPanel> now OVERRIDES this table on the selected
 * module, painting its status word red along with the rest of the frame. That is
 * not a lifecycle colour meaning something new; it is the selection state
 * temporarily owning the whole card. The distinction matters because it is what
 * keeps this table honest: three lifecycles, three colours, none of them red.
 */
export const STATUS_TONE: Record<MissionStatus, { rail: string; text: string; dot: string }> = {
  DEPLOYED: { rail: "bg-nominal", text: "text-nominal", dot: "bg-nominal" },
  IN_DEVELOPMENT: { rail: "bg-caution", text: "text-caution", dot: "bg-caution" },
  PLANNED: { rail: "bg-t4", text: "text-t3", dot: "bg-t4" },
};
