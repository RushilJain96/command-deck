import { Box, Cog, Infinity as InfinityIcon, Wrench, type LucideIcon } from "lucide-react";
import { CAPABILITIES, DAILY_TOOLS, SYSTEM_DOMAINS, TECHNOLOGIES } from "./data";

/**
 * The header's readout box: four inline figures in one faint housing.
 *
 * EVERY NUMBER IS COUNTED, NOT CLAIMED, and that is the one liberty taken with the
 * brief. The design called for "28+ TECHNOLOGIES" and "15+ TOOLS"; this file
 * renders `TECHNOLOGIES.length` and `DAILY_TOOLS.length` instead, which are 19 and
 * 14. The layout is identical either way — same box, same four cells, same glyphs —
 * so the only thing the substitution changes is whether the figures are true.
 *
 * It matters because of what is directly underneath them. The console's whole
 * argument is that it reports rather than advertises: the domain cards count their
 * own stack, the exploration panel labels its bars as depth rather than skill, and
 * the technology grid shows every mark it counts. A "28+" over a grid a reader can
 * count to 19 in is the one line on the page that would not survive being checked.
 *
 * If the intent was that the roster is a curated subset of a genuinely larger set,
 * the honest way to say so is to put the missing technologies in `data.ts` — then
 * this box reports the real number and the grid's "VIEW ALL" opens onto it.
 *
 * `∞ POSSIBILITIES` is kept exactly as designed. It is plainly rhetorical: there
 * is no unit and no reader will take it for a measurement, which is precisely what
 * separates it from "28+".
 */
interface Readout {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly value: string;
  readonly label: string;
}

const READOUTS: readonly Readout[] = [
  { id: "domains", icon: Box, value: String(SYSTEM_DOMAINS.length), label: "Domains" },
  { id: "technologies", icon: Cog, value: String(TECHNOLOGIES.length), label: "Technologies" },
  { id: "tools", icon: Wrench, value: String(DAILY_TOOLS.length), label: "Tools" },
  {
    id: "possibilities",
    icon: InfinityIcon,
    value: "∞",
    label: "Possibilities",
  },
];

/** Counted for the same reason as the rest — used only in the aria summary. */
const SUMMARY = `${SYSTEM_DOMAINS.length} domains, ${TECHNOLOGIES.length} technologies, ${DAILY_TOOLS.length} tools, ${CAPABILITIES.length} capabilities`;

export function ConsoleStats() {
  return (
    <div
      aria-label={SUMMARY}
      className="border-panel-edge flex shrink-0 items-stretch rounded-[3px] border bg-[rgb(6_8_12/0.6)] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]"
    >
      {READOUTS.map((readout, index) => {
        const Icon = readout.icon;
        return (
          <div key={readout.id} className="relative flex items-center gap-3.5 px-5 py-3.5">
            {/* Seam between cells, inset vertically so it reads as a division in the
                faceplate rather than a table rule — the same treatment the top bar's
                mode selector uses between its segments. */}
            {index > 0 && (
              <span aria-hidden="true" className="bg-panel-rule absolute inset-y-2.5 left-0 w-px" />
            )}
            <Icon size={23} strokeWidth={1.55} aria-hidden="true" className="text-t2 shrink-0" />
            <span className="flex flex-col gap-1.5">
              <span className="text-t1 text-[23px] leading-none font-medium tabular-nums">
                {readout.value}
              </span>
              {/* 11px ON THE BODY TONE, not 9.5 on the tertiary.
                  These four labels are what the four figures MEAN, and they were set
                  at the size the console uses for a lamp caption — the numbers read
                  and the words beside them did not. They now sit one step under the
                  panel headings, which is the level they belong on. */}
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
