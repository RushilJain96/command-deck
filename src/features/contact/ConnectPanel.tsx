"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink, Send } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { HudPanel } from "@/features/hud/HudPanel";
import { cn } from "@/lib/cn";
import { CHANNELS } from "./data";
import { SectionHeading } from "./SectionHeading";
import type { Channel } from "./types";

export function ConnectPanel() {
  return (
    <HudPanel corners className="flex h-full min-h-0 flex-col" bodyClassName="min-h-0 flex-1 px-6 py-6">
      <div className="flex h-full min-h-0 flex-col">
        <SectionHeading
          icon={Send}
          title="Let's Connect"
          blurb="Reach out or connect with me on any platform."
        />

        <ul className="mt-6 flex min-h-0 flex-1 flex-col gap-3">
          {CHANNELS.map((channel, index) => (
            <ChannelRow key={channel.id} channel={channel} index={index} />
          ))}
        </ul>
      </div>
    </HudPanel>
  );
}

function ChannelRow({ channel, index }: { channel: Channel; index: number }) {
  const Icon = channel.icon;
  const resolved = channel.href !== null && channel.handle !== null;

  return (
    <motion.li
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.16 + index * 0.06 }}
      style={{ "--channel-accent": channel.accent } as CSSProperties}
      className="group border-panel-rule flex flex-1 items-center gap-4 rounded-[4px] border bg-[linear-gradient(180deg,#0a0e14,#06080d)] px-4 transition-colors duration-200 hover:border-[var(--channel-accent)]"
    >
      {/* THE MARK KEEPS ITS PLATE HERE, unlike everywhere else on the deck.
          These are other companies' logos, not this system's own line art — a
          brand mark floating loose in a row reads as an endorsement badge, and the
          box is what makes it read as an ICON identifying a row instead. It is also
          the only thing giving four differently-shaped logos a common footprint. */}
      <span
        aria-hidden="true"
        className={cn(
          "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[4px] border transition-[filter] duration-200",
          resolved ? "group-hover:brightness-110" : "opacity-45 grayscale",
        )}
        style={{
          color: channel.accent,
          borderColor: `${channel.accent}59`,
          background: `linear-gradient(180deg, ${channel.accent}1f, ${channel.accent}08)`,
        }}
      >
        <Icon size={20} />
      </span>

      <div className="min-w-0 shrink-0">
        <p className="text-t1 font-mono text-[13px] leading-none font-medium">{channel.label}</p>
        <p className="text-t2 mt-2 text-[11.5px] leading-none">{channel.blurb}</p>
      </div>

      {/* THE ADDRESS, OR THE ABSENCE OF ONE, and the absence says so in words.
          An unresolved channel could render an empty cell, which reads as a layout
          bug, or a plausible-looking address, which is the one thing a contact page
          must never do — see the note on `Channel.href`. "NOT PUBLISHED YET" is the
          only version a reader can act on correctly. */}
      <div className="ml-auto min-w-0 pl-4 text-right">
        {resolved ? (
          <p className="text-t2 truncate font-mono text-[12.5px] leading-none">{channel.handle}</p>
        ) : (
          <p className="text-t4 tracking-micro truncate font-mono text-[10.5px] leading-none uppercase">
            Not published yet
          </p>
        )}
      </div>

      <div className="shrink-0">
        {!resolved ? (
          <PendingChip />
        ) : channel.action === "copy" ? (
          <CopyButton value={channel.handle ?? ""} label={channel.label} accent={channel.accent} />
        ) : (
          <OpenButton href={channel.href ?? ""} label={channel.label} accent={channel.accent} />
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
 * A copy button that does nothing visible is indistinguishable from a copy button
 * that failed, and the clipboard is invisible by definition — the reader has no way
 * to check without pasting somewhere. So the label swaps to COPIED for a beat.
 *
 * The timer is cleared on unmount, which matters because leaving this scene while
 * the confirmation is up would otherwise set state on a component that is gone.
 * And the failure is SHOWN rather than swallowed: a copy that quietly does nothing
 * leaves the reader pasting an old clipboard into an email to somebody else.
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
        "tracking-micro focus-visible:ring-signal/70 flex h-[38px] w-[96px] items-center justify-center gap-1.5 rounded-[3px] border font-mono text-[10.5px] uppercase",
        "outline-none transition-colors duration-200 focus-visible:ring-2",
        state === "done"
          ? "border-nominal/60 bg-nominal/10 text-nominal"
          : state === "failed"
            ? "border-caution/60 bg-caution/10 text-caution"
            : "hover:bg-signal/10 border-[rgb(255_42_42/0.5)] text-[var(--channel-accent)]",
      )}
      style={{ "--channel-accent": accent } as CSSProperties}
    >
      {state === "done" && <Check size={12} strokeWidth={2.4} aria-hidden="true" />}
      {state === "done" ? "Copied" : state === "failed" ? "Failed" : "Copy"}
    </button>
  );
}

function OpenButton({ href, label, accent }: { href: string; label: string; accent: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} in a new tab`}
      style={{ "--channel-accent": accent } as CSSProperties}
      className="focus-visible:ring-signal/70 flex h-[38px] w-[96px] items-center justify-center rounded-[3px] border border-[color-mix(in_srgb,var(--channel-accent)_45%,transparent)] text-[var(--channel-accent)] outline-none transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--channel-accent)_12%,transparent)] focus-visible:ring-2"
    >
      <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
    </a>
  );
}

/** Not a button. There is nothing behind it yet, and a dead control is worse than none. */
function PendingChip() {
  return (
    <span className="border-panel-rule text-t4 tracking-micro flex h-[38px] w-[96px] items-center justify-center rounded-[3px] border border-dashed font-mono text-[10px] uppercase">
      Pending
    </span>
  );
}
