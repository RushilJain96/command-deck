import { Providers } from "./providers";
import { DeckViewport } from "@/features/app/DeckViewport";
import { Footer } from "@/features/chrome/Footer";
import { TopBar } from "@/features/chrome/TopBar";
import { DeckBackdrop } from "@/features/environment/DeckBackdrop";
import { SceneHost } from "@/features/scenes/SceneHost";

export default function Home() {
  return (
    <Providers>
      {/* Fixed rather than 100dvh: dvh changes as mobile browser chrome hides,
          which would thrash layout and re-resolve the orbit radius mid-motion.

          `overflow-hidden` also does real work now — it clips the design frame
          on the one paint before <DeckViewport>'s effect has measured the
          window, instead of letting an oversized deck add scrollbars. */}
      <div className="fixed inset-0 overflow-hidden">
        {/* THE SKY IS OUTSIDE THE SCALED FRAME, AND ON PURPOSE.
            The deck is a fixed 3:2 composition, so any window that is not 3:2
            letterboxes it. Everything inside the frame stops at the frame's edge
            — which for a starfield means stars ending on a straight line with
            pure black beyond, announcing the rectangle the whole scene exists to
            hide. Space has no frame.

            So the two layers with no PLACE in the composition — the gas and the
            scatter — fill the window instead, behind the deck. Anything whose
            position was chosen (the celestial bodies, the structures) stays in
            the frame with the rest of the arrangement. See <Sky> and <Scenery>.

            It mounts after hydration — both layers park on MotionValue-driven
            transforms that do not serialize, so leaving them in the server tree
            reported a hydration mismatch. See <DeckBackdrop>. */}
        <DeckBackdrop />

        {/* ONE FIXED 1536x1024 COMPOSITION, SCALED TO THE WINDOW. Nothing below
            this point reflows, and nothing is hidden at any size — see the note
            in <DeckViewport> for what that replaced and what it costs.

            The persistent chrome sits inside the scaled frame but still OUTSIDE
            <SceneHost>: it must not fade out and back in on every scene
            transition, and it must not live under a wrapper whose animating
            opacity makes it a backdrop root. Those two constraints are about the
            scene boundary, not about the scale, so they are unaffected. */}
        <DeckViewport>
          <SceneHost />
          <TopBar />
          <Footer />
        </DeckViewport>
      </div>
    </Providers>
  );
}
