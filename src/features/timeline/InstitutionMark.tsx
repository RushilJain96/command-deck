"use client";

import Image from "next/image";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * AN INSTITUTION'S OWN LOGO, WITH THE LINE-ART GLYPH AS A FALLBACK.
 *
 * A real mark does something the generic mortarboard cannot: it identifies the
 * place. A reader who knows BITS recognises it before reading a word, and on a
 * page whose entire job is "here is where I have been", that recognition is most
 * of the content.
 *
 * IT FALLS BACK RATHER THAN 404s, and that is the whole reason this is a component
 * instead of an `<Image>` at each call site. The files are not in the repository
 * yet — they are somebody else's trademarks and have to be supplied deliberately,
 * not guessed at or scraped — so every entry names a path that may or may not
 * resolve. `onError` swaps in the glyph the card would otherwise have used, which
 * means the page is correct today with no files at all, correct tomorrow with two
 * of five, and correct when they are all there. Nothing has to change but the
 * contents of `public/logos/`.
 *
 * `unoptimized` because these are tiny fixed-size marks inside a CSS-scaled design
 * frame. The optimizer builds a srcset against viewport widths this app does not
 * use — every scene is one 1536x1024 composition scaled by a transform — so it
 * would spend build time producing variants nothing can ever request.
 */
export function InstitutionMark({
  src,
  alt,
  icon: Icon,
  size,
  accent,
}: {
  src: string | null;
  alt: string;
  icon: LucideIcon;
  size: number;
  accent: string;
}) {
  const [failed, setFailed] = useState(false);

  if (src === null || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center transition-[filter] duration-200 group-hover:brightness-110"
        style={{ width: size, height: size, color: accent, filter: `drop-shadow(0 0 8px ${accent}59)` }}
      >
        <Icon size={size} strokeWidth={1.6} />
      </span>
    );
  }

  return (
    <span
      // THE PLATE ONLY APPEARS WITH A REAL LOGO. Institutional marks are other
      // people's artwork in whatever colours they own — a crest on a near-black
      // panel needs a surface to sit on, the way the contact console's brand rows
      // do. The line-art fallback above gets no plate, because this deck's own
      // glyphs never have one.
      className="border-panel-rule flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] border bg-[rgb(255_255_255/0.055)]"
      style={{ width: size + 10, height: size + 10 }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        unoptimized
        onError={() => setFailed(true)}
        className="object-contain"
        style={{ width: size, height: "auto", maxHeight: size }}
      />
    </span>
  );
}
