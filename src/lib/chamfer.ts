/**
 * Shared chamfer language.
 *
 * Every housing on the deck — mission callouts, HUD panels, the dock, the
 * emblem — is cut from the same vocabulary, which is what makes the sidebar
 * read as part of the same instrument rather than a separate application
 * floating on top. Diverging corner treatments are the fastest way to make two
 * panels look like they came from different products.
 *
 * Cut sizes are deliberately asymmetric: a small nick on one corner, a deep cut
 * on the diagonally opposite one. Symmetric chamfers read as a decorative
 * rounded rectangle; asymmetric ones read as a part with an orientation.
 */

export type ChamferSide = "left" | "right";

/**
 * Mission callouts: cuts on the TOP-LEFT and BOTTOM-RIGHT, 14px each.
 *
 * THE CUTS MOVED. They used to fall on the two corners of whichever side faced
 * away from the spacecraft — top-right and bottom-right for a card on the right
 * of the deck, mirrored for one on the left. Two reasons that is gone:
 *
 *   The mirroring was withdrawn when the cards became a matched set, so `side`
 *   had nothing left to vary and both variants collapsed onto one shape anyway.
 *
 *   And cutting two corners on the SAME edge reads as a bevelled panel end. The
 *   diagonal pair reads as a machined plate — the cut runs across the part rather
 *   than along one side of it, which is the tactical geometry the reference uses.
 *
 * Equal 14px cuts rather than the old asymmetric 8/16. The asymmetry existed to
 * give a single-sided bevel an orientation; on a diagonal pair the geometry
 * already has one, and unequal cuts just read as a mistake.
 *
 * It takes no `side` any more. The parameter survived the mirroring's removal as
 * an ignored argument, which is worse than either keeping or dropping it: every
 * call site still had to pick a value that could not matter.
 */
export function calloutChamfer(): string {
  return "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)";
}

/**
 * HUD housings: cut on the top-outer and bottom-inner corners, mirrored by
 * which edge of the viewport the panel is docked against, so the whole rail
 * leans toward the deck at its centre.
 */
export function hudChamfer(side: ChamferSide): string {
  return side === "left"
    ? "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 10px 100%, 0 calc(100% - 10px))"
    : "polygon(12px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 12px)";
}
