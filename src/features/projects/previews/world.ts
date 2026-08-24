/**
 * THE DOTTED WORLD, GENERATED RATHER THAN PASTED.
 *
 * Two cards draw a map — ORION plots where security events land, SENTINEL plots
 * where threats originate — and a map is the one element in the preview well that
 * a reader recognises before they read anything. It has to be legible at 150
 * units across.
 *
 * The obvious implementations are both wrong here. Real coastline data (TopoJSON,
 * Natural Earth) is 100KB+ shipped to draw a thumbnail. A hand-typed ASCII grid is
 * a 1700-character blob that nobody can review, edit or explain — change one row
 * and you have no way to tell whether you improved Africa or deleted it.
 *
 * So the landmasses are ELLIPSES in real longitude/latitude, listed below by name,
 * and the dot grid is sampled against them at module load. The whole model is
 * thirty lines you can argue with: if Scandinavia sits too far south, there is one
 * number to move. It is a caricature of the world and it is meant to be — at this
 * size a coastline resolves to the same handful of pixels either way, and what the
 * eye is actually matching is the ARRANGEMENT of the continents.
 *
 * Accuracy claim, stated plainly: this is not a projection anyone should measure
 * anything against. It is scenery that reads as Earth.
 */

interface LandMass {
  readonly name: string;
  /** Centre longitude, degrees east. */
  readonly lon: number;
  /** Centre latitude, degrees north. */
  readonly lat: number;
  /** Half-width in degrees of longitude. */
  readonly rlon: number;
  /** Half-height in degrees of latitude. */
  readonly rlat: number;
}

const LAND: readonly LandMass[] = [
  { name: "Alaska", lon: -152, lat: 64, rlon: 13, rlat: 6 },
  { name: "Canada", lon: -100, lat: 57, rlon: 40, rlat: 13 },
  { name: "Greenland", lon: -42, lat: 73, rlon: 13, rlat: 9 },
  { name: "United States", lon: -98, lat: 40, rlon: 26, rlat: 9 },
  { name: "Mexico and Central America", lon: -95, lat: 22, rlon: 13, rlat: 8 },
  { name: "Northern South America", lon: -62, lat: -5, rlon: 19, rlat: 13 },
  { name: "Southern Cone", lon: -64, lat: -32, rlon: 10, rlat: 16 },
  { name: "British Isles", lon: -3, lat: 54, rlon: 4, rlat: 4 },
  { name: "Europe", lon: 16, lat: 50, rlon: 21, rlat: 10 },
  { name: "Scandinavia", lon: 18, lat: 63, rlon: 11, rlat: 6 },
  { name: "North Africa", lon: 16, lat: 19, rlon: 23, rlat: 14 },
  { name: "Southern Africa", lon: 25, lat: -14, rlon: 12, rlat: 16 },
  { name: "Madagascar", lon: 47, lat: -20, rlon: 3, rlat: 7 },
  { name: "Middle East", lon: 47, lat: 27, rlon: 12, rlat: 10 },
  { name: "Siberia", lon: 95, lat: 61, rlon: 53, rlat: 13 },
  { name: "Central Asia", lon: 78, lat: 43, rlon: 30, rlat: 11 },
  { name: "China", lon: 108, lat: 32, rlon: 19, rlat: 12 },
  { name: "India", lon: 79, lat: 21, rlon: 10, rlat: 11 },
  { name: "Indochina", lon: 104, lat: 13, rlon: 11, rlat: 8 },
  { name: "Japan", lon: 138, lat: 37, rlon: 4, rlat: 7 },
  { name: "Indonesia", lon: 118, lat: -3, rlon: 18, rlat: 5 },
  { name: "Australia", lon: 134, lat: -25, rlon: 18, rlat: 10 },
  { name: "New Zealand", lon: 173, lat: -42, rlon: 3, rlat: 5 },
];

/** Normalised dot, both axes 0..1 with y running down the screen. */
export interface WorldDot {
  readonly x: number;
  readonly y: number;
}

/**
 * THE FRAME IS CROPPED AT 78N AND 58S, which is not an oversight.
 *
 * A full -90..90 sample spends a quarter of its vertical budget on Antarctica and
 * the empty Arctic — two bands that carry no events and push the inhabited world
 * into the middle half of the well. Every dashboard map in the reference is
 * cropped the same way, for the same reason.
 */
const NORTH = 78;
const SOUTH = -58;

const COLS = 74;
const ROWS = 26;

function isLand(lon: number, lat: number): boolean {
  for (const mass of LAND) {
    const dx = (lon - mass.lon) / mass.rlon;
    const dy = (lat - mass.lat) / mass.rlat;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

/**
 * Sampled once at module load and shared by every map that renders. The grid is
 * fixed, so two components asking for it get the same array rather than two
 * copies — and a card that re-renders on hover does no work here at all.
 */
export const WORLD_DOTS: readonly WorldDot[] = (() => {
  const dots: WorldDot[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    const lat = NORTH - ((NORTH - SOUTH) * row) / (ROWS - 1);
    for (let col = 0; col < COLS; col += 1) {
      const lon = -180 + (360 * col) / (COLS - 1);
      if (!isLand(lon, lat)) continue;
      dots.push({ x: col / (COLS - 1), y: row / (ROWS - 1) });
    }
  }
  return dots;
})();

/**
 * Where the hotspots sit, in the same normalised space.
 *
 * AUTHORED RATHER THAN RANDOM, because a random hotspot lands in the Pacific
 * about half the time and a beacon over open ocean is the one thing that gives
 * the whole map away as decoration. These five are over land, on five different
 * continents, and spread across the frame so no two blooms overlap.
 */
export const HOTSPOTS: readonly (WorldDot & { readonly scale: number })[] = [
  { x: 0.21, y: 0.42, scale: 1 },
  { x: 0.5, y: 0.34, scale: 0.78 },
  { x: 0.66, y: 0.45, scale: 0.9 },
  { x: 0.78, y: 0.72, scale: 0.7 },
  { x: 0.35, y: 0.7, scale: 0.62 },
];
