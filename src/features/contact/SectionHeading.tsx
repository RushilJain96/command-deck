import type { LucideIcon } from "lucide-react";

/**
 * THE HEADING USED BY BOTH PANELS AND THE BAND, and it is not <HudPanel>'s.
 *
 * `HudPanel`'s `label` slot draws a bordered header strip across the top of the
 * housing, which is right for an instrument whose contents are a readout. These
 * three sections are prose with a title over it: the reference gives them a glyph,
 * a mono title, a short lit tick and a sentence — and no rule, because a rule under
 * a heading that is itself sitting inside a bordered panel is the second horizontal
 * edge in twenty units.
 *
 * The tick is the load-bearing part. It is the same device the systems header uses
 * at the left end of its rule, and here it is the ONLY red on a panel whose content
 * is otherwise grey and four accent glyphs — which is what makes three sections
 * read as three sections rather than as one long column of cards.
 */
export function SectionHeading({
  icon: Icon,
  title,
  blurb,
}: {
  icon: LucideIcon;
  title: string;
  blurb: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <Icon
        size={26}
        strokeWidth={1.6}
        aria-hidden="true"
        className="text-signal mt-0.5 shrink-0"
        style={{ filter: "drop-shadow(0 0 8px rgb(255 42 42 / 0.45))" }}
      />
      <div className="min-w-0">
        <h2 className="text-t1 font-mono text-[16px] leading-none font-medium tracking-[0.08em] uppercase">
          {title}
        </h2>
        {/* The tick sits BETWEEN the title and the blurb rather than under both, so
            it reads as the underline of the title it belongs to. Aligned to the
            glyph's left edge, not the title's, which is what ties the two together
            across the gap. */}
        <div className="mt-2.5 flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="bg-signal -ml-[40px] block h-px w-[26px] shrink-0"
            style={{ boxShadow: "0 0 8px rgb(255 42 42 / 0.7)" }}
          />
          <p className="text-t2 min-w-0 truncate text-[12.5px] leading-none">{blurb}</p>
        </div>
      </div>
    </div>
  );
}
