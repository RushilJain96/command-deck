import { HudPanel } from "./HudPanel";
import { STATS } from "./stats";

/**
 * Operator track record, as a stack of instrument readings.
 *
 * Replaces the old data-link sockets. The figures are placeholders until the
 * integrations land — see the note in `stats.ts` — and a stat that is not yet
 * live carries a small unlit pip, which is the one honest signal left in the
 * panel: lit means measured, unlit means asserted.
 *
 * TYPOGRAPHY does the work here, because five near-identical rows are exactly
 * where a rail turns to mush. The figure is 19px and tabular, the label is 9px
 * tracked uppercase, and the unit is 10px sentence case — three clearly
 * different registers, so the eye can scan any one of the three columns
 * without reading the other two. Rows are separated by a hairline rather than
 * by whitespace so the block stays compact.
 */
export function StatsPanel() {
  return (
    <HudPanel label="Record" className="w-60">
      <ul className="-my-1 flex flex-col">
        {STATS.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <li
              key={stat.id}
              className={index === 0 ? "py-2" : "border-t border-white/[0.06] py-2"}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={11} strokeWidth={1.75} aria-hidden="true" className="text-t3 shrink-0" />
                <span className="text-t3 tracking-micro truncate font-mono text-[9px] uppercase">
                  {stat.label}
                </span>
                {/* Provenance lamp. Unlit until the figure is fetched rather
                    than asserted. */}
                <span
                  aria-hidden="true"
                  className={
                    stat.live ? "bg-nominal signal-blink ml-auto h-1 w-1" : "bg-t4 ml-auto h-1 w-1"
                  }
                />
              </div>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-t1 text-[19px] leading-none font-medium tracking-[-0.02em] tabular-nums">
                  {stat.value === null ? "—" : stat.value.toLocaleString()}
                </span>
                <span className="text-t3 truncate text-[10px] leading-none">{stat.unit}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </HudPanel>
  );
}
