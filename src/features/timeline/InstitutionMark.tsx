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
 *
 * THE PLATE IS ALWAYS THERE NOW, logo or glyph. It used to appear only with a real
 * image, on the reasoning that this deck's own line art never sits in a box — true
 * everywhere else, and wrong here, because it meant five cards carried marks at two
 * different sizes with two different footprints depending on which files happened
 * to exist. The plate is the card's anchor; what sits inside it can vary.
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

  const useGlyph = src === null || failed;
  const inner = Math.round(size * 0.52);

  return (
    <span
      aria-hidden={useGlyph ? true : undefined}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] border transition-[filter] duration-200 group-hover:brightness-110"
      style={{
        width: size,
        height: size,
        color: accent,
        borderColor: `${accent}4d`,
        // A real logo gets a light surface, because institutional marks are other
        // people's artwork in their own colours and disappear on near-black. The
        // glyph gets the accent's own wash instead, since it IS the accent.
        background: useGlyph
          ? `linear-gradient(180deg, ${accent}1f, ${accent}08)`
          : "rgb(255 255 255 / 0.055)",
        boxShadow: useGlyph ? `inset 0 0 18px -10px ${accent}` : undefined,
      }}
    >
      {useGlyph ? (
        <span style={{ filter: `drop-shadow(0 0 8px ${accent}59)` }}>
          <Icon size={inner} strokeWidth={1.6} />
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={inner}
          height={inner}
          unoptimized
          onError={() => setFailed(true)}
          className="object-contain"
          style={{ width: inner, height: "auto", maxHeight: inner }}
        />
      )}
    </span>
  );
}
