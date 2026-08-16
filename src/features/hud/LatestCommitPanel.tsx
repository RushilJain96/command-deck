import { LATEST_COMMIT } from "./commit";
import { HudPanel } from "./HudPanel";

/**
 * The last thing that changed here.
 *
 * Closes the rail with the one reading that is about the deck itself rather
 * than about the operator's record above it: the record says what has been
 * built, this says the machine is still being worked on. A portfolio that shows
 * a commit from this morning is making a claim nothing else on the page can.
 *
 * The subject is set in mono because it is a commit subject — the reader should
 * recognise the register before reading the words. Two lines, clamped: a commit
 * subject longer than that is a commit subject with a problem, and letting it
 * run would push the panel past the footer.
 *
 * THE PROVENANCE PIP IS STILL UNLIT, and that is not an oversight. `commit.ts`
 * is a constant, so `live` is false, so the lamp is grey. The reference shows it
 * green — which is the correct appearance for this panel the moment the subject
 * comes from a real source and not one moment before. Wiring that source is the
 * only change that should ever turn this lamp on.
 */
export function LatestCommitPanel() {
  return (
    <HudPanel label="Latest Commit">
      <p className="text-t2 line-clamp-2 font-mono text-[11px] leading-[1.45]">
        {LATEST_COMMIT.subject}
      </p>

      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className={
            LATEST_COMMIT.live
              ? "bg-nominal signal-blink h-1 w-1 shrink-0"
              : "bg-t4 h-1 w-1 shrink-0"
          }
        />
        <span className="text-t3 tracking-micro font-mono text-[9px] uppercase">
          {LATEST_COMMIT.relative}
        </span>
      </div>
    </HudPanel>
  );
}
