import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * A mark that can be rendered at a size and tinted by `currentColor`.
 *
 * Deliberately a plain component signature rather than the systems console's
 * `Glyph` union. This page draws four marks from three different sources — a
 * lucide icon, a `simple-icons` path and two hand-drawn brand SVGs — and a union
 * that had to enumerate all three would force every consumer to branch on which
 * kind it got. A component takes a size and paints itself; where it came from
 * stops being the caller's problem. `brandMark()` in `data.ts` is the one adapter.
 */
export type ChannelMark = ComponentType<{ size?: number; className?: string }>;

/**
 * A way to reach the operator.
 *
 * `href === null` IS A FIRST-CLASS STATE, not a missing value to be filled in with
 * something plausible. Two of the four channels on this page have no confirmed
 * address yet, and the tempting move — guessing a vanity slug from the operator's
 * name — is the one thing a contact page must never do: `linkedin.com/in/rushil-jain`
 * either reaches nobody or reaches a stranger, and the reader has no way to tell
 * which. `links.ts` already carries that argument as a TODO for the same URL.
 *
 * So an unresolved channel is HIDDEN rather than guessed at — see
 * `PUBLISHED_CHANNELS`. It keeps its entry in the roster so the blurb and the mark
 * survive until the address arrives, and it renders nowhere until it does. The
 * earlier version drew it with a "pending" label, which solved the honesty problem
 * and created a worse one: a visitor being shown the site's own unfinished
 * business.
 */
export interface Channel {
  readonly id: string;
  readonly label: string;
  /** One line under the name: what this channel is GOOD FOR, not what it is. */
  readonly blurb: string;
  readonly icon: ChannelMark;
  readonly accent: string;
  /**
   * What is printed on the right — the address as a human would read it, without
   * the scheme. `null` when unresolved.
   */
  readonly handle: string | null;
  /** Where the action goes. `null` marks the channel unresolved; see above. */
  readonly href: string | null;
  /**
   * `copy` puts the handle on the clipboard, `open` follows the href.
   *
   * An email address is not a destination — clicking `mailto:` on a machine with
   * no mail client configured opens nothing at all, which reads as a broken button.
   * Copying is the action a reader actually wants from an address, and it works
   * identically everywhere.
   */
  readonly action: "copy" | "open";
}

export interface Trait {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}

export interface Opportunity {
  readonly id: string;
  readonly label: string;
  readonly blurb: string;
  readonly icon: LucideIcon;
  readonly accent: string;
}
