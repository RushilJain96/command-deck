import { Providers } from "./providers";
import { Dock } from "@/features/chrome/Dock";
import { TopBar } from "@/features/chrome/TopBar";
import { SceneHost } from "@/features/scenes/SceneHost";

export default function Home() {
  return (
    <Providers>
      {/* Fixed rather than 100dvh: dvh changes as mobile browser chrome hides,
          which would thrash layout and re-resolve the orbit radius mid-motion. */}
      <div className="fixed inset-0 overflow-hidden">
        <SceneHost />
        {/* Persistent chrome sits OUTSIDE <SceneHost>. Inside, it would fade
            out and back in on every scene transition, and it would live under a
            wrapper whose animating opacity makes it a backdrop root. */}
        <TopBar />
        <Dock />
      </div>
    </Providers>
  );
}
