import { HudPanel } from "./HudPanel";
import { STATS } from "./stats";

/**
 * The operator's standing record — and the whole of the left rail's upper half.
 *
 * WAS `StatsPanel`, AND WAS ONE OF THREE. The rail used to open with an operator
 * thesis and an active-mission box stacked above this one, which pushed the
 * figures into the bottom third of the column and made the rail read as three
 * unrelated cards rather than as one instrument. A command centre's side column
 * is a single continuous readout; that is what this is now, and the two panels
 * above it stood down (see `CommandHud`).
 *
 * ROW ANATOMY: a bordered icon cell on the left, and a three-register text block
 * on the right — label, figure, qualifier. The icon cell is what makes six rows
 * scannable: it gives every row the same left edge and the same optical weight,
 * so the eye tracks down one column of glyphs instead of down a ragged wall of
 * text. Without it the rows differ only by their label length, which is the
 * shape a list takes when nobody decided how it should be read.
 *
 * TYPOGRAPHY carries the hierarchy, because six near-identical rows are exactly
 * where a rail turns to mush. 17px tabular figure, 9px tracked uppercase label,
 * 10px sentence-case qualifier — three clearly different registers, so any one
 * of the three columns can be scanned without reading the other two.
 *
 * THE ROW METRICS ARE A HEIGHT BUDGET, NOT A TASTE CALL. This is the tallest
 * panel on the deck and the rail cannot scroll, so the stack has to fit inside
 * `100svh - 72 - 64`. Before growing any of it, check the rail still clears the
 * dock at 1280x720.
 */
export function CommandCenterPanel() {
  return (
    <HudPanel label="Command Center" className="w-52">
      <ul className="-my-1 flex flex-col">
        {STATS.map((stat, index) => {
          const Icon = stat.icon;
          const isText = typeof stat.value === "string";
          return (
            <li
              key={stat.id}
              className={index === 0 ? "py-1.5" : "border-t border-white/[0.06] py-1.5"}
            >
              <div className="flex items-start gap-2.5">
                <span
                  aria-hidden="true"
                  className="text-t3 flex h-[22px] w-[22px] shrink-0 items-center justify-center border border-white/[0.09] bg-white/[0.03]"
                >
                  <Icon size={11} strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {/* 8.5px, not the 9px used elsewhere on the deck. The icon
                        cell and the provenance lamp take 40px out of a 176px
                        measure, and "GITHUB CONTRIBUTIONS" — the longest label
                        in the set — needs 137px at 9px with `tracking-micro`.
                        It truncated. Half a pixel of type is a cheaper fix than
                        abbreviating the label or dropping the tracking that
                        makes every other instrument label on the deck match. */}
                    <span className="text-t3 tracking-micro truncate font-mono text-[8.5px] uppercase">
                      {stat.label}
                    </span>
                    {/* Provenance lamp. Unlit until the figure is fetched rather
                        than asserted — lit means measured, unlit means claimed,
                        and that is the one honest signal left in the panel while
                        every number here is still a constant. */}
                    <span
                      aria-hidden="true"
                      className={
                        stat.live
                          ? "bg-nominal signal-blink ml-auto h-1 w-1 shrink-0"
                          : "bg-t4 ml-auto h-1 w-1 shrink-0"
                      }
                    />
                  </div>

                  <p
                    className={
                      isText
                        ? "text-t1 mt-1 truncate text-[13px] leading-none font-medium tracking-[-0.01em]"
                        : "text-t1 mt-0.5 text-[17px] leading-none font-medium tracking-[-0.02em] tabular-nums"
                    }
                  >
                    {stat.value === null
                      ? "—"
                      : typeof stat.value === "number"
                        ? stat.value.toLocaleString()
                        : stat.value}
                  </p>

                  <p className="text-t3 mt-1 truncate text-[10px] leading-none">{stat.unit}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </HudPanel>
  );
}
