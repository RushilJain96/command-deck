import { ROSTER_READOUTS, ROSTER_SUMMARY } from "./data";

/**
 * The roster's readout box.
 *
 * DELIBERATELY THE SAME INSTRUMENT AS THE SYSTEMS CONSOLE'S `<ConsoleStats>` —
 * same cell padding, same 23px figure, same 11px caption on the body tone, same
 * inset seam between cells. The two consoles are two channels of one machine, and
 * the fastest way to make them read as two different products is to set their
 * headline instruments at two different scales.
 *
 * It is a copy rather than a shared component, and that is the weaker of two bad
 * options taken deliberately. Extracting a `<ReadoutBox readouts=... />` means a
 * component whose only job is to iterate an array, parameterised by nothing but
 * its data — and the moment one console wants a five-cell box or a different seam,
 * the shared version grows a prop for it and stops being shared in any useful
 * sense. Forty lines of duplication that can diverge honestly beats an abstraction
 * that has to be negotiated. If a third console appears, extract it then.
 */
export function ProjectStats() {
  return (
    <div
      aria-label={ROSTER_SUMMARY}
      className="border-panel-edge flex shrink-0 items-stretch rounded-[3px] border bg-[rgb(6_8_12/0.6)] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]"
    >
      {ROSTER_READOUTS.map((readout, index) => {
        const Icon = readout.icon;
        return (
          <div key={readout.id} className="relative flex items-center gap-3.5 px-5 py-3.5">
            {index > 0 && (
              <span aria-hidden="true" className="bg-panel-rule absolute inset-y-2.5 left-0 w-px" />
            )}
            <Icon size={23} strokeWidth={1.55} aria-hidden="true" className="text-t2 shrink-0" />
            <span className="flex flex-col gap-1.5">
              <span className="text-t1 text-[23px] leading-none font-medium tabular-nums">
                {readout.value}
              </span>
              <span className="text-t2 tracking-micro font-mono text-[11px] leading-none uppercase">
                {readout.label}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
