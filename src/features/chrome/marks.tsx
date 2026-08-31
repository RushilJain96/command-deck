/**
 * HAND-DRAWN BRAND MARKS, for the two brands no icon set will give us.
 *
 * `simple-icons` carries neither GitHub's Octocat wordmark nor LinkedIn's — both
 * were removed on trademark grounds, the same reason AWS is missing from the
 * systems library — and `lucide-react` dropped its brand set entirely at v1. So
 * these two paths are drawn here.
 *
 * They lived as local functions inside <Footer> until the contact console needed
 * the same LinkedIn glyph. Two copies of a hand-transcribed SVG path is the worst
 * possible thing to duplicate: nobody diffs a 400-character `d` attribute, so the
 * copies would drift and the drift would be invisible in review and nearly
 * invisible on screen.
 *
 * The signature matches a lucide icon's — `{ size, className }` — so a mark and an
 * icon are interchangeable wherever a component is taken as data.
 */

export function GithubMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.16v3.2c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function LinkedinMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM2.4 21.5h5.16V9.75H2.4V21.5ZM10.2 9.75h4.95v1.6h.07c.69-1.24 2.37-2.55 4.88-2.55 5.22 0 6.18 3.3 6.18 7.6v5.1h-5.15v-4.52c0-1.08-.02-2.47-1.55-2.47-1.55 0-1.79 1.18-1.79 2.4v4.59H12.2V9.75h-2Z" />
    </svg>
  );
}
