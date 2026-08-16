/**
 * The deck's only outbound links.
 *
 * In their own file rather than inline in <Footer> because they are DATA the
 * operator owns, not markup — the same reason `stats.ts` and `commit.ts` exist.
 * When one of these changes it should be a one-line edit to a list, not a hunt
 * through a layout component.
 *
 * `label` is what a screen reader announces; the footer renders glyphs only, so
 * without it these are three unlabelled links.
 */
export interface ExternalLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export const LINKS: readonly ExternalLink[] = [
  { id: "github", label: "GitHub", href: "https://github.com/RushilJain96" },
  // TODO(rushil): replace with the real profile URL. Left as the bare host on
  // purpose — a guessed vanity slug would be a link that silently goes to the
  // wrong person, which is worse than one that obviously needs filling in.
  { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/" },
  { id: "mail", label: "Email", href: "mailto:rushilpjain@gmail.com" },
];
