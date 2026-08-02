/**
 * Screen-space backdrop behind everything.
 *
 * The job is atmosphere, not scenery: nobody should consciously notice any of
 * these layers, only that the deck sits somewhere rather than on flat black.
 * Every value is deliberately close to the void colour — the moment a nebula
 * becomes legible as a shape it stops being atmosphere and starts being noise.
 *
 * No blur filters anywhere. On a #06070a base a wide radial gradient is
 * indistinguishable from a blurred shape and costs nothing to composite, which
 * matters because these layers cover the full viewport.
 */
export function DeepSpace() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Nebula wash. Two overlapping cool clouds at different angles give the
          field a direction, so the eye reads depth rather than a vignette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(78% 58% at 18% 24%, rgb(46 74 116 / 0.20), transparent 68%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(64% 48% at 82% 18%, rgb(64 58 104 / 0.16), transparent 66%)",
        }}
      />
      {/* A single warm counterpoint, low and to one side. Without it the whole
          field skews blue and reads as a colour cast rather than as space. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 40% at 74% 88%, rgb(122 74 58 / 0.11), transparent 70%)",
        }}
      />

      {/* Orbital haze: a wide band lifting the horizon behind the ring, which
          is what makes the plane feel like it sits in an atmosphere. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 44% at 50% 60%, rgb(108 148 198 / 0.13), transparent 62%)",
        }}
      />

      {/* Bloom directly behind the spacecraft, tying the brightest object to
          the brightest part of the field. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(30% 24% at 50% 52%, rgb(150 180 220 / 0.10), transparent 70%)",
        }}
      />

      {/* Vignette, last, to pull everything back toward the centre. */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(118% 96% at 50% 50%, transparent 38%, rgb(0 0 0 / 0.80))",
        }}
      />
    </div>
  );
}
