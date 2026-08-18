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
 * Depth bands: stacking order, box width, and the two type sizes that go with it.
 *
 * SIZE IS BACK IN THIS TABLE, having been withdrawn twice. Both withdrawals were
 * right about what went wrong and wrong about the cause, so it is worth being
 * precise about what is different this time.
 *
 * The failed ramp was `transform: scale()` at 1.15 / 0.95 / 0.80 / 0.65 — a 1.77:1
 * spread applied to the WHOLE CARD. `scale()` cannot distinguish the box from its
 * contents, so the furthest module was drawn with 8px body copy and stopped being
 * readable; the second withdrawal correctly observed that a card nobody can read
 * has left the composition, and that a size difference between two cards sharing
 * no axis reads as importance rather than distance.
 *
 * WIDTH IS NOT SCALE. This ramp sets the box and sets the type INDEPENDENTLY, so
 * the two things the old note conflated come apart:
 *
 *   - The box runs 250 -> 157, a 1.59:1 spread, which is what carries distance.
 *   - The designator and the status strip DO NOT CHANGE at all. Every card, near
 *     or far, labels itself in the same 10.5px mono.
 *   - The title steps exactly once, 24 on the hero and 19 everywhere else, and
 *     the summary once, 14.5 and 12.5. Two steps, not four.
 *
 * So there is no tier at which anything is smaller than the smallest type the
 * deck already uses elsewhere, which is the failure the withdrawals were guarding
 * against. What is left is a receding arrangement, which is what the reference
 * has and what the flat version could not produce: six identically-sized cards on
 * a plane that recedes read as pinned to the glass, because the one cue that says
 * "further away" in every photograph ever taken is missing.
 *
 * The importance objection stands and is answered by the mapping rather than by
 * the ramp: `tier` is authored per mission and tracks the quadrant, so the two
 * FRONT cards are the large ones and the BACK-CENTRE card is the small one. Size
 * agrees with position instead of arguing with it.
 */
export type CalloutTier = "hero" | "mid" | "back" | "deep";

export interface CalloutTierSpec {
  /** Stacking order within the plane. */
  readonly z: number;
  /** Card width in px at the `lg` tier. The layout solver mirrors these. */
  readonly w: number;
  /** Title size. Two values across the whole ramp, not four. */
  readonly title: string;
  /** Summary size. Likewise two. */
  readonly summary: string;
  /** Horizontal padding. Narrow cards cannot afford the hero's 20px gutter. */
  readonly padX: string;
  /**
   * Whether the card carries its one line of prose.
   *
   * DISTANCE REDUCES DETAIL, and this is the last surviving piece of an idea the
   * deck had and lost. `LOD_THRESHOLDS` used to derive it from depth and was
   * collapsed to a single level, so every card carried a summary regardless of
   * how far back it sat. Two independent things say that was wrong:
   *
   * TYPOGRAPHIC. The back cards are 157-178px wide. A 65-character sentence in a
   * 12.5px face inside a 126px measure is four lines clamped to two, so what the
   * far cards actually rendered was a fragment cut mid-word — strictly less
   * useful than no sentence, because the reader spends the glance discovering it
   * has been truncated. The reference's own far cards carry short summaries, not
   * clamped long ones; we have long ones.
   *
   * GEOMETRIC, AND THIS IS THE HALF THAT EXPIRED. The prose is 45px of card
   * height, and while --orbit-radius was a function of the viewport it could fall
   * to 380 on a 1440x900 window — at which point carrying prose on all six drove
   * ORION through DATAFLOW and NEXUS through AURORA. Dropping it on the back
   * tiers was what made that class of viewport feasible.
   *
   * The radius is a constant 470 now (see <DeckViewport>): the deck is one fixed
   * composition that scales rather than reflows, so the small-radius case cannot
   * occur. At 470 the tightest pair clears by 22px with every summary drawn, so
   * the flag is true everywhere and this is left as a `false`-capable switch
   * rather than deleted — the typographic objection below still stands if the
   * copy stays long.
   *
   * Nothing is lost. The full summary stays in the accessibility tree on every
   * card (see the `sr-only` block in <MissionNode>), and pointing at a far card
   * does not add it back: prominence and distance stay separate axes, which is
   * the rule that got broken the last time this was conditional.
   */
  readonly showSummary: boolean;
}

/**
 * UNIFORM. Every tier draws the same box at the same type sizes, so the four
 * entries differ only in `z`.
 *
 * Depth is carried by the things that cost no legibility: vertical position on
 * the receding plane, the atmospheric opacity ramp in <MissionNode>, the inward
 * tilt of the flanks, and this z-order.
 *
 * A NEAR-UNIFORM RAMP PLUS A SELECTION SCALE WAS TRIED AND WITHDRAWN. It ran
 * 190-208 by tier with the selected card at 1.22, sized off the reference's own
 * fractions, and it did not read as an improvement — the cards lost presence at
 * that size without the arrangement gaining anything. Reverted rather than tuned:
 * the objection was to the whole direction, not to the numbers.
 */
const UNIFORM = {
  w: 230,
  title: "text-[20px]",
  summary: "text-[13px]",
  padX: "px-4",
  showSummary: true,
} as const;

export const CALLOUT_TIER: Record<CalloutTier, CalloutTierSpec> = {
  /** Centre. Sorts above everything else on the plane. */
  hero: { z: 50, ...UNIFORM },
  /** Front quadrants — eight and four o'clock. */
  mid: { z: 30, ...UNIFORM },
  /** Back quadrants — ten and two o'clock. */
  back: { z: 10, ...UNIFORM },
  /** Back centre, twelve o'clock. Shares the back plane; nothing overlaps. */
  deep: { z: 10, ...UNIFORM },
};

/**
 * NO ACTIVE SCALE. A targeted module grew by 22% for one pass and it is gone
 * again: a hover that resizes reflows its neighbours' clearances, and it cost the
 * layout solver a whole second sweep to model pointer state.
 *
 * The lock is carried by the things that do not move the box: the red bezel, the
 * corner brackets, the bloom, the lit face, the z-lift to ACTIVE_Z, and the
 * bearing beam terminating on the card's edge.
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
