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

/** Mission callouts: deep cut on the corner facing away from the spacecraft. */
export function calloutChamfer(side: ChamferSide): string {
  return side === "left"
    ? "polygon(8px 0, 100% 0, 100% 100%, 16px 100%, 0 calc(100% - 16px), 0 8px)"
    : "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)";
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
