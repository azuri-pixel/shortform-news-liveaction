import test from "node:test";
import assert from "node:assert/strict";
import { repairMotionAnchors } from "../scripts/motion-anchor.mjs";
import { narrationWordHash, normalizeNarration } from "../scripts/lib/editorial.mjs";

test("같은 줄의 정확한 단어 중 가까운 인덱스를 고치고 모든 앵커와 해시를 처리한다", () => {
  const narration = { lines: [{ id: "s01", words: ["대상", "변화", "대상", "결과", "대상"].map((text, start) => ({ text, start, end: start + 1 })) }] };
  const motion = { events: [{ timing: { from: { anchor: { line: "s01", word: "대상", token_index: 3 } } } }], extra: { anchor: { line: "s01", word: "없음", token_index: 0 } } };
  const before = structuredClone(motion);
  assert.equal(repairMotionAnchors(motion, narration).changes[0].after, 2);
  assert.deepEqual(motion, before);
  const result = repairMotionAnchors(motion, narration, { fix: true });
  assert.equal(motion.events[0].timing.from.anchor.token_index, 2);
  assert.equal(result.errors.length, 1);
  assert.equal(motion.narration_word_sha256, narrationWordHash(normalizeNarration(narration)));
  assert.equal(repairMotionAnchors(motion, narration, { fix: true }).changes.length, 0);
});
