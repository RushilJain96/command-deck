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
 * where a rail turns to mush. 26px tabular figure, 9.5px tracked uppercase label,
 * 11px sentence-case qualifier — three clearly different registers, so any one
 * of the three columns can be scanned without reading the other two. The figure
 * has now been up twice: once when the rail went full-height, and again to the
 * reference's measured size, which is what makes the column read from across the
 * room rather than only when leaned into.
 *
 * THE ROW METRICS ARE A HEIGHT BUDGET, NOT A TASTE CALL. This is the tallest
 * panel on the deck and the rail cannot scroll, so the stack has to fit between
 * RAIL_TOP and RAIL_BOTTOM minus whatever <LatestCommitPanel> takes at the
 * bottom. Before growing any of it, MEASURE the rail at the shortest `lg`
 * viewport — the breakpoint is 830px tall, so that is roughly 1400x831.
 */

/**
 * Row padding, solved against the two ends of the `lg` range rather than picked.
 *
 * A row's CONTENT is a fixed 55px (10px label + 4 + 26px figure + 4 + 11px
 * qualifier), so the only free variable is the air around it, and that air is
 * exactly what has to absorb a 200px swing in viewport height. Fixed padding
 * cannot: at the reference's 1024 the stack wants ~17px a side to land on the
 * measured 89px pitch, and at the shortest `lg` viewport 17 overflows the rail
 * by about 50px — the panel does not scroll, so overflow means the last figure
 * is simply not on screen.
 *
 * The line runs 9px at 831 to 17px at 1024. `clamp` pins both ends so nothing
 * pathological happens outside the range.
 */
const ROW_PAD = "clamp(9px, calc(4.1svh - 25px), 17px)";

export function CommandCenterPanel() {
  return (
    <HudPanel label="Command Center" bodyClassName="">
      {/* HAIRLINE SEPARATORS, BACK AGAIN. They were removed on the argument that
          a border between tightly packed rows reads as a table while six rows
          with air around them read as six instruments. True of the packed rows
          that prompted it, and the wrong conclusion: what makes a table is the
          TIGHTNESS, not the rule. With ~34px of air in the pitch the rule stops
          being a cell wall and becomes what it is on a real instrument panel —
          the engraved line between two gauges.

          They also do a job nothing else was doing. Six figures in one column
          with no rules is a list whose groups the eye has to infer from spacing
          alone, and spacing is the one thing here that varies with viewport
          height. The rules do not.

          Full-bleed, hence `bodyClassName=""` on the panel and the padding moved
          onto the rows: a separator inset from the panel edge reads as a
          decoration inside the card rather than as part of its structure. */}
      <ul className="flex flex-col">
        {STATS.map((stat, index) => {
          const Icon = stat.icon;
          const isText = typeof stat.value === "string";
          return (
            <li
              key={stat.id}
              className={index > 0 ? "border-panel-rule border-t px-4" : "px-4"}
              style={{ paddingBlock: ROW_PAD }}
            >
              <div className="flex items-start gap-3">
                {/* The cell stays neutral and only the GLYPH takes the accent.
                    Tinting the cell's border and fill as well would turn six
                    rows into six coloured chips and the rail into a legend; a
                    lit glyph in a grey housing reads as an indicator, which is
                    what an instrument row wants.

                    A faint wash of the same hue sits behind it at 0.08 — just
                    enough that the colour looks like it is COMING FROM the glyph
                    rather than painted on it. */}
                <span
                  aria-hidden="true"
                  className="border-panel-rule flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[2px] border"
                  style={{ backgroundColor: `${stat.accent}14`, color: stat.accent }}
                >
                  <Icon size={11.5} strokeWidth={1.75} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {/* 9.5px. This was 8.5 to keep "GITHUB CONTRIBUTIONS" — the
                        longest label in the set — from truncating inside a 176px
                        measure once the icon cell and the provenance lamp had
                        taken their 40px. It still truncates gracefully via
                        `truncate`; verify that label specifically after any
                        further change to the type or the rail width. */}
                    <span className="text-t3 tracking-micro truncate font-mono text-[9.5px] uppercase">
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
                        ? "text-t1 mt-1 truncate text-[17px] leading-none font-medium tracking-[-0.01em]"
                        : "text-t1 mt-1 text-[26px] leading-none font-medium tracking-[-0.02em] tabular-nums"
                    }
                  >
                    {stat.value === null
                      ? "—"
                      : typeof stat.value === "number"
                        ? stat.value.toLocaleString()
                        : stat.value}
                  </p>

                  <p className="text-t3 mt-1 truncate text-[11px] leading-none">{stat.unit}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </HudPanel>
  );
}
