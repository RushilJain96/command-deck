import { Providers } from "./providers";
import { SceneHost } from "@/features/scenes/SceneHost";

export default function Home() {
  return (
    <Providers>
      {/* Fixed rather than 100dvh: dvh changes as mobile browser chrome hides,
          which would thrash layout and re-resolve the orbit radius mid-motion. */}
      <div className="fixed inset-0 overflow-hidden">
        <SceneHost />
      </div>
    </Providers>
  );
}
