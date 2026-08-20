import type { LucideIcon } from "lucide-react";
import type { SimpleIcon } from "simple-icons";

/**
 * ONE GLYPH SLOT, TWO KINDS OF GLYPH.
 *
 * The technology and tool libraries want the REAL mark — a reader identifies
 * PostgreSQL by the elephant long before they read the word underneath it, and a
 * generic database cylinder throws that recognition away. `simple-icons` is the
 * library that provides them: it is icon DATA (a path string and the brand's own
 * hex per mark), not a component library and not a second UI framework, so it
 * sits beside `lucide-react` rather than competing with it.
 *
 * THREE ENTRIES STILL HAVE NO MARK, and it is worth naming them so the next
 * person does not go looking: AWS, VS Code and Slack were all removed from
 * `simple-icons` upstream over trademark objections. Drawing them by hand is out
 * — an approximated logo is a wrong logo, and the brief rules it out explicitly —
 * so those three keep the Lucide glyph for what they ARE, which is the same
 * fallback the whole library used before this pass. CI/CD and Terminal keep
 * theirs too, for the simpler reason that neither is a product with a logo.
 *
 * The union is discriminated on `path`, which only a `SimpleIcon` has. Do not
 * discriminate on `typeof === "function"`: Lucide's icons are `forwardRef`
 * objects, not plain functions, so that test silently picks the wrong branch.
 */
export type Glyph = SimpleIcon | LucideIcon;

export function isBrandMark(glyph: Glyph): glyph is SimpleIcon {
  return typeof glyph === "object" && glyph !== null && "path" in glyph;
}

/**
 * A BRAND HEX IS NOT AUTOMATICALLY A USABLE COLOUR ON A BLACK DECK.
 *
 * Django's is #092E20, Pandas' is #150458, Kafka's is #231F20 and both PyCharm
 * and Notion ship #000000. Rendered faithfully, those marks are invisible — the
 * logo is technically correct and communicates nothing, which is worse than not
 * using the brand colour at all.
 *
 * THE FIX IS TO LIFT THE COLOUR, NOT TO REPLACE IT, and that reverses what this
 * function used to do. It swapped anything too dark for one neutral grey, which
 * made the wall correct and lifeless: Django went grey, Pandas went grey, Kafka
 * went grey, and three of the most recognisable marks in the panel lost the one
 * property that makes a logo recognisable at 28px. Hue is what survives scale;
 * lightness is not.
 *
 * So a dark mark is converted to HSL and its LIGHTNESS is raised to a floor while
 * hue and saturation are kept exactly. Django stays green, Pandas stays violet,
 * Redis stays red — they are simply lit rather than buried. The only marks that
 * still land on a neutral are the ones with no hue to preserve: at a saturation
 * below 8% there is nothing to keep, and lifting #000000 in HSL produces grey
 * anyway, so those take the deck's light directly. That is the honest rendering
 * for Notion and PyCharm, whose marks really are monochrome.
 *
 * Rec. 709 coefficients on the raw channels rather than a full sRGB linearise:
 * the only decision being made is "does this disappear against #000", and the
 * gamma step does not change the answer for any hex in this file.
 */
const DARK_MARK_FLOOR = 0.34;
/** Where a lifted mark lands. High enough to read at 28px on near-black. */
const LIFTED_LIGHTNESS = 0.6;
/** Below this there is no hue worth preserving. */
const MIN_CHROMA = 0.08;
const NEUTRAL_MARK = "#c3ccd6";

export function markColor(glyph: Glyph): string {
  if (!isBrandMark(glyph)) return NEUTRAL_MARK;

  const hex = glyph.hex;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  if (0.2126 * r + 0.7152 * g + 0.0722 * b >= DARK_MARK_FLOOR) return `#${hex}`;

  const [h, s] = toHsl(r, g, b);
  if (s < MIN_CHROMA) return NEUTRAL_MARK;
  return fromHsl(h, s, LIFTED_LIGHTNESS);
}

/** Returns [hue 0-1, saturation 0-1, lightness 0-1]. */
function toHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return [0, 0, l];

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  return [(h / 6 + 1) % 1, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h * 6) % 6;
  const [r, g, b] = (
    [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ] as const
  )[sector];

  const channel = (value: number) =>
    Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/**
 * Renders either kind at one call site.
 *
 * `fill="currentColor"` on the brand path against `stroke` on the Lucide one is
 * a real inconsistency and an unavoidable one — filled marks next to a stroked
 * one is exactly the compromise `chrome/Footer.tsx` already made for its GitHub
 * and LinkedIn marks. At 20px it does not read.
 */
export function Mark({
  glyph,
  size,
  className,
}: {
  glyph: Glyph;
  size: number;
  className?: string;
}) {
  if (isBrandMark(glyph)) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d={glyph.path} />
      </svg>
    );
  }
  const Icon = glyph;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" className={className} />;
}
