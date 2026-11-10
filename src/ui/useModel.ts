import { useEffect, useRef } from "react";
import type { VoiceModel } from "./analysis.ts";
import { useStore } from "./store.ts";
import { engine } from "../audio/AudioEngine.ts";
import { getModel } from "./models.ts";

export { getModel };

export function useModel(): React.MutableRefObject<VoiceModel | null> {
  const body = useStore((s) => s.body);
  const started = useStore((s) => s.started);
  const ref = useRef<VoiceModel | null>(null);
  ref.current = getModel(body, started ? engine.sampleRate : 48000);
  useEffect(() => {
    ref.current = getModel(body, started ? engine.sampleRate : 48000);
  }, [body, started]);
  return ref;
}
