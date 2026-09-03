"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink, Send } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { cn } from "@/lib/cn";
import { PUBLISHED_CHANNELS } from "./data";
import { SectionHeading } from "./SectionHeading";
import type { Channel } from "./types";

/**
 * THE SECOND VOICE ON THE PAGE, NOT AN EQUAL ONE.
 *
 * This panel used to compete with the bio beside it: taller rows, heavier padding
 * and a 42px plate on every mark gave four contact links the same visual weight as
 * the whole of who the operator is. The page answers "who is this" first and "how
 * do I reach them" second, and the reader should be able to tell that at a glance
 * without reading either.
 *
 * So the row is where the weight came out — 58 units tall instead of a stretched
 * ~90, a 36px plate, tighter internal gaps — while the heading is untouched. The
 * heading is what makes this findable; shrinking it too would have made the panel
 * quiet rather than secondary, and those are different things.
 */
export function ConnectPanel() {
  return (
    <HudPanel
      corners
      className="flex flex-col"
      bodyClassName="px-5 py-5"
    >
      <div className="flex flex-col">
        <SectionHeading
          icon={Send}
          title="Let's Connect"
          blurb="Reach out or connect with me on any platform."
        />

        {/* Rows are their own height and stack from the top; they are NOT stretched
            to fill the panel. Four channels nearly fill it, two leave room at the
            foot, and that is the correct behaviour for a list that grows — stretching
            would make the panel look different every time an address is added. */}
        <ul className="mt-5 flex flex-col gap-2.5">
          {PUBLISHED_CHANNELS.map((channel, index) => (
            <ChannelRow key={channel.id} channel={channel} index={index} />
          ))}
        </ul>
      </div>
    </HudPanel>
  );
}

function ChannelRow({ channel, index }: { channel: Channel; index: number }) {
  const Icon = channel.icon;
  // `PUBLISHED_CHANNELS` guarantees both, but the types stay nullable so the
  // roster can hold an unresolved entry. Narrowing here rather than asserting.
  const href = channel.href ?? "";
  const handle = channel.handle ?? "";

  return (
    <motion.li
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.16 + index * 0.06 }}
      style={{ "--channel-accent": channel.accent } as CSSProperties}
      className="group border-panel-rule flex items-center gap-3.5 rounded-[4px] border bg-[linear-gradient(180deg,#0a0e14,#06080d)] px-3.5 py-2.5 transition-colors duration-200 hover:border-[var(--channel-accent)]"
    >
      {/* THE MARK KEEPS ITS PLATE, unlike every other glyph on the deck. These are
          other companies' logos, not this system's line art — a brand mark floating
          loose in a row reads as an endorsement badge, and the box is what makes it
          read as an icon identifying a row. It is also the only thing giving marks
          of four different shapes a common footprint. */}
      <span
        aria-hidden="true"
        className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[4px] border transition-[filter] duration-200 group-hover:brightness-110"
        style={{
          color: channel.accent,
          borderColor: `${channel.accent}59`,
          background: `linear-gradient(180deg, ${channel.accent}1f, ${channel.accent}08)`,
        }}
      >
        <Icon size={18} />
      </span>

      <div className="min-w-0 shrink-0">
        <p className="text-t1 font-mono text-[12.5px] leading-none font-medium">{channel.label}</p>
        <p className="text-t2 mt-1.5 text-[11px] leading-none">{channel.blurb}</p>
      </div>

      {/* The address is hidden below the wide tier rather than wrapped: on a narrow
          frame the row has room for a name, a blurb and one control, and the handle
          is the part the button already carries you to. */}
      <p className="text-t2 ml-auto hidden min-w-0 truncate pl-3 font-mono text-[12px] leading-none @2xl:block">
        {handle}
      </p>

      <div className="ml-auto shrink-0 @2xl:ml-0">
        {channel.action === "copy" ? (
          <CopyButton value={handle} label={channel.label} accent={channel.accent} />
        ) : (
          <OpenButton href={href} label={channel.label} accent={channel.accent} />
        )}
      </div>
    </motion.li>
  );
}

/**
 * Two mechanisms, because the modern one is not always available.
 *
 * `navigator.clipboard.writeText` is the right API and the one that works in a
 * normal tab. It also refuses outright — `NotAllowedError`, synchronously — with no
 * transient user activation, on an insecure origin, and inside some embedded
 * browsers. Verified here: the promise rejects in about a millisecond under
 * automation even with `clipboard-write` permission granted and a secure context,
 * because a scripted click grants no activation.
 *
 * `document.execCommand("copy")` is deprecated and still works in exactly those
 * cases, so it is the fallback rather than the primary. The textarea it needs is
 * positioned off-screen rather than hidden — `display: none` cannot be selected —
 * and is removed in a `finally` so a throw cannot leave it in the document.
 */
async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Fall through to the legacy path.
  }

  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.top = "-1000px";
  field.style.opacity = "0";
  document.body.appendChild(field);
  try {
    field.select();
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
  }
}

/**
 * COPY, AND IT CONFIRMS.
 *
 * A copy button that does nothing visible is indistinguishable from one that
 * failed, and the clipboard is invisible by definition — the reader cannot check
 * without pasting somewhere. So the label swaps for a beat.
 *
 * The timer is cleared on unmount, which matters because leaving this scene while
 * the confirmation is up would otherwise set state on a component that is gone.
 * And the failure is SHOWN rather than swallowed: a copy that quietly does nothing
 * leaves the reader pasting an old clipboard into an email meant for someone else.
 */
function CopyButton({ value, label, accent }: { value: string; label: string; accent: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 1700);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <button
      type="button"
      onClick={async () => {
        setState((await copyToClipboard(value)) ? "done" : "failed");
      }}
      aria-label={`Copy ${label} address`}
      className={cn(
        "tracking-micro focus-visible:ring-signal/70 flex h-[32px] w-[82px] items-center justify-center gap-1.5 rounded-[3px] border font-mono text-[10px] uppercase",
        "outline-none transition-colors duration-200 focus-visible:ring-2",
        state === "done"
          ? "border-nominal/60 bg-nominal/10 text-nominal"
          : state === "failed"
            ? "border-caution/60 bg-caution/10 text-caution"
            : "hover:bg-signal/10 border-[rgb(255_42_42/0.5)] text-[var(--channel-accent)]",
      )}
      style={{ "--channel-accent": accent } as CSSProperties}
    >
      {state === "done" && <Check size={11} strokeWidth={2.4} aria-hidden="true" />}
      {state === "done" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
    </button>
  );
}

function OpenButton({ href, label, accent }: { href: string; label: string; accent: string }) {
  return (
    <a
      href={href}
      // Every one of these leaves the deck, so every one opens away from it, with
      // `noreferrer` riding along as the default pairing for an untrusted target.
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} in a new tab`}
      style={{ "--channel-accent": accent } as CSSProperties}
      className="focus-visible:ring-signal/70 flex h-[32px] w-[82px] items-center justify-center rounded-[3px] border border-[color-mix(in_srgb,var(--channel-accent)_45%,transparent)] text-[var(--channel-accent)] outline-none transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--channel-accent)_12%,transparent)] focus-visible:ring-2"
    >
      <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}
