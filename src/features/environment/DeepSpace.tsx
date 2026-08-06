/**
 * Screen-space backdrop behind everything.
 *
 * The job is atmosphere, not scenery: nobody should consciously notice any of
 * these layers, only that the deck sits somewhere rather than on flat black.
 * Every value is deliberately close to the void colour — the moment a nebula
 * becomes legible as a shape it stops being atmosphere and starts being noise.
 *
 * EVERY LAYER CAME DOWN BY ROUGHLY HALF IN THIS PASS, and none of the orbit's
 * own values went up. That asymmetry is the entire point: the plane has to be
 * the brightest structure in the frame, and there are only two ways to get
 * there. Raising the rings makes them glow, which is the failure mode the brief
 * names outright. Lowering everything they sit against costs nothing, changes no
 * geometry, and produces a field that reads as PROJECTED — bright because its
 * surroundings are dark, the way a real instrument in a dark room is.
 *
 * The nebulae are now barely above the void. They still do their job, which was
 * never to be seen: two overlapping cool clouds at different angles give the
 * field a direction, so the eye reads depth instead of a flat vignette.
 *
 * No blur filters anywhere. On a near-black base a wide radial gradient is
 * indistinguishable from a blurred shape and costs nothing to composite, which
 * matters because these layers cover the full viewport.
 */
export function DeepSpace() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Nebula wash. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(78% 58% at 18% 24%, rgb(40 64 102 / 0.085), transparent 66%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(64% 48% at 82% 18%, rgb(54 50 90 / 0.065), transparent 64%)",
        }}
      />
      {/* A single warm counterpoint, low and to one side. Without it the whole
          field skews blue and reads as a colour cast rather than as space. Kept
          because removing it was worse than halving it — at zero the frame goes
          monochrome cool and starts to look tinted. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(52% 40% at 74% 88%, rgb(104 64 50 / 0.045), transparent 68%)",
        }}
      />

      {/* ORBITAL HAZE, NOW ALMOST GONE — 0.13, then 0.05, now 0.018.
          It existed to imply an atmosphere behind the ring back when the ring
          was a set of hairlines with nothing underneath them. The orbital plane
          is now a physical surface, and screen-space haze sitting behind a
          surface does not read as atmosphere: it reads as the surface being
          slightly out of register with its own backdrop, because unlike the
          plate it does not move with the world. Kept at a trace, purely so the
          transition from platform to void is not an abrupt one. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(96% 38% at 50% 60%, rgb(96 134 184 / 0.018), transparent 60%)",
        }}
      />

      {/* Bloom directly behind the spacecraft, tying the brightest object to the
          brightest part of the field. Tightened as well as dimmed so it stays
          behind the hull rather than spilling onto the plane around it. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(24% 19% at 50% 52%, rgb(140 172 214 / 0.05), transparent 70%)",
        }}
      />

      {/* VIGNETTE, last. Deeper and starting further in than before: the frame's
          margins now go to effectively pitch black, which is what gives the
          centre of the composition its whole dynamic range back. This is the
          layer that lets the field's core read as illumination.

          0.90 AND NOT 0.93, WHICH WAS THE FIRST ATTEMPT. The outermost structural
          rings are the thing that says the field is CROPPED by the frame rather
          than ending inside it, and they live exactly where this gradient is
          strongest. Three points of alpha here erased them completely — the
          plane went back to reading as a disc with a hard edge, which is the
          failure this pass was supposed to fix. The corners are still black to
          any eye that has not got a colour picker on them. */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(112% 92% at 50% 50%, transparent 28%, rgb(0 0 0 / 0.90))",
        }}
      />
    </div>
  );
}
