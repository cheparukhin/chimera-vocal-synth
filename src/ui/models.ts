import { VoiceModel } from "./analysis.ts";
import { bodyKey, type BodyMix } from "./body.ts";

/**
 * Shared main-thread acoustic models, most recent last (rebuilt on body / sample-rate change).
 * The engine hands out one model per body and simulation rate (48 kHz oversampled twice is the
 * 96 kHz model), so the cache is keyed by the engine's model id and everything goes through it:
 * a model freed elsewhere, or under another rate's entry, would be freed under its other users.
 * A body is continuous, so only the last few are kept; an evicted one is freed in the engine too
 * (users read the current body's model when they need it, so none holds an evicted one).
 */
const cache = new Map<number, VoiceModel>();
/** "body@rate" to the engine's model id */
const ids = new Map<string, number>();
const KEEP = 8;

export function getModel(body: BodyMix, sampleRate: number): VoiceModel {
  const key = `${bodyKey(body)}@${sampleRate}`;
  const id = ids.get(key);
  let m = id === undefined ? undefined : cache.get(id);
  if (!m) {
    const fresh = new VoiceModel(body, sampleRate);
    m = cache.get(fresh.id) ?? fresh; // already held under another rate
    ids.set(key, m.id);
  }
  cache.delete(m.id);
  cache.set(m.id, m);
  if (cache.size > KEEP) {
    const [oldest, old] = cache.entries().next().value!;
    cache.delete(oldest);
    for (const [k, v] of ids) if (v === oldest) ids.delete(k);
    old.dispose();
  }
  return m;
}
