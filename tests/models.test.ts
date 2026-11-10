/**
 * The main-thread model cache. The engine keeps one airway model per body and simulation rate,
 * and 48 kHz oversampled twice is the 96 kHz model, so two sample rates can name one engine model.
 */
import { expect, test } from "bun:test";
import { initEngine } from "./harness.ts";

await initEngine();
const { NEUTRAL, restTip } = await import("../src/wasm/engine.ts");
const { getModel } = await import("../src/ui/models.ts");

test("48 kHz and 96 kHz name one engine model: evicting one entry must not free it under the other", () => {
  const body = { female: 0.37, child: 0.11 };
  const tip = restTip(NEUTRAL.jaw, NEUTRAL.tbX, NEUTRAL.tbY);
  const mouth = { ...NEUTRAL, ttX: tip.x, ttY: tip.y };
  const before = getModel(body, 48000); // the view before audio starts
  const after = getModel(body, 96000); // the same body once a 96 kHz device is running
  // seven more bodies (a body-pad drag): an entry per rate would now evict, and free, the older one
  for (let i = 1; i <= 7; i++) getModel({ female: 0.37, child: 0.11 + i * 0.01 }, 96000);
  expect(after.frame(mouth).lipArea).toBeGreaterThan(0);
  expect(getModel(body, 96000)).toBe(before);
});
