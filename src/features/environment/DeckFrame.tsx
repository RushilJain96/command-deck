/**
 * Instrument housing: hairline corner brackets and edge rules that frame the
 * viewport as a display surface.
 *
 * Screen space, above the world, below the HUD. Purely structural — it gives
 * the floating HUD panels something to register against so they read as parts
 * of one instrument rather than free-floating cards.
 */
export function DeckFrame() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Edge rules, faded at the ends so they do not box the composition in. */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.07) 20%, rgb(255 255 255 / 0.07) 80%, transparent)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.05) 25%, rgb(255 255 255 / 0.05) 75%, transparent)",
        }}
      />

      {CORNERS.map(({ key, className }) => (
        <div key={key} className={`absolute h-3 w-3 border-white/[0.14] ${className}`} />
      ))}
    </div>
  );
}

const CORNERS = [
  { key: "tl", className: "top-14 left-5 border-t border-l" },
  { key: "tr", className: "top-14 right-5 border-t border-r" },
  { key: "bl", className: "bottom-16 left-5 border-b border-l" },
  { key: "br", className: "right-5 bottom-16 border-r border-b" },
] as const;
