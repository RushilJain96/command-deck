import { HudPanel } from "./HudPanel";

/**
 * The deck's legend.
 *
 * It sits bottom-right, where <SystemsPanel>, <TargetReadout> and <Telemetry>
 * used to stack, and it answers a question none of them did: WHAT IS THIS AND
 * WHAT DO I DO WITH IT. Three live readouts told a visitor what the machine was
 * currently doing before they had any reason to care, which is the failure mode a
 * command centre falls into most easily — instrumentation is legible to whoever
 * built it and opaque to everybody else.
 *
 * Deliberately STATIC. Every other surface on the deck answers the pointer, and
 * this one must not: it is the one fixed thing to read when nothing is happening
 * yet, and a legend that changes while you are reading it is not a legend.
 *
 * The three lines are the deck's three verbs, in the order a visitor meets them —
 * point at something, look around, go in.
 */
const LEGEND = [
  "Navigate through projects",
  "Explore systems",
  "Launch into knowledge",
] as const;

export function MissionControlCard() {
  return (
    <HudPanel bodyClassName="flex items-center gap-4 px-4 py-4">
      <div className="min-w-0 flex-1">
        {/* `whitespace-nowrap`, and the tracking eased to 0.08em from the
            `tracking-micro` 0.16em this line started on. "MISSION CONTROL" at
            15px with 0.16em tracking measures about 178px, against roughly 173
            available once the card's gutters, the seam and the mark have taken
            theirs — so it wrapped to two lines and the card's title became its
            tallest element. Tracking is the right thing to spend: it is the term
            that was buying the least here, since the surrounding legend lines are
            sentence case and untracked anyway. */}
        <p className="text-t1 text-[15px] leading-none font-medium tracking-[0.08em] whitespace-nowrap uppercase">
          Mission Control
        </p>
        <ul className="mt-3 flex flex-col gap-[5px]">
          {LEGEND.map((line) => (
            <li key={line} className="text-t2 text-[13px] leading-[1.35]">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Vertical seam. The same hairline the panel header uses, turned ninety
          degrees — the card is two things (a name and a mark) and the rule is
          what stops the mark reading as a fourth legend line. */}
      <div className="bg-panel-rule w-px self-stretch" />

      <CraftMark />
    </HudPanel>
  );
}

/**
 * Wireframe delta, in the system red.
 *
 * The one place on the deck where the accent is used for something that is NOT a
 * target. That is defensible here and nowhere else: this mark is the deck's
 * signature rather than a readout, so it carries identity colour the way the top
 * bar's subtitle does. It is drawn UNFILLED so it reads as a schematic — a
 * filled red delta would look like a lit annunciator and start competing with
 * the actual lock indicator on the callouts.
 *
 * Geometry is the ship seen from behind and slightly above, which is the view the
 * visitor already has of the real one at the bottom of the frame.
 */
function CraftMark() {
  return (
    <svg
      width="88"
      height="80"
      viewBox="0 0 98 88"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      style={{ color: "var(--signal)" }}
    >
      <g stroke="currentColor" strokeLinejoin="round" opacity="0.62">
        {/* Outer planform: nose at the top, wingtips at the trailing edge. */}
        <path d="M 49 6 L 92 78 L 49 66 L 6 78 Z" strokeWidth="1.1" />
        {/* Inner fuselage, the same delta pulled in — two nested outlines are
            what make a wireframe read as a solid seen through, rather than as a
            triangle. */}
        <path d="M 49 20 L 70 70 L 49 62 L 28 70 Z" strokeWidth="0.9" opacity="0.75" />
        {/* Spine, stopping short of the engine so the circle stays legible. */}
        <path d="M 49 6 L 49 48" strokeWidth="0.8" opacity="0.6" />
        {/* Leading-edge struts out to the wingtips. */}
        <path d="M 30 47 L 14 71 M 68 47 L 84 71" strokeWidth="0.8" opacity="0.5" />
      </g>
      {/* Engine bell, on the spine at the trailing edge. */}
      <circle cx="49" cy="53" r="6.5" stroke="currentColor" strokeWidth="1.1" opacity="0.72" />
      <circle cx="49" cy="53" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
