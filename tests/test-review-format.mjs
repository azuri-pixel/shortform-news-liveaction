import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { productionReviewTemplate, validateReview } from "../scripts/lib/production/review.mjs";
import { hash } from "../scripts/lib/production/contracts.mjs";

test("검수 템플릿의 문자열 _format은 finish의 검증에서 무시한다", (t) => {
  const repo = mkdtempSync(join(tmpdir(), "review-format-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const w = { repo, production: repo, path: (p) => join(repo, p) };
  const state = { receipts: { render: { id: "render", source_commit: null, validation: { contract: "production-review@1", kind: "render", artifact: { path: "video.mp4", sha256: "a".repeat(64) }, media: { width: 1080, height: 1920 } } } }, attempts: [] };
  writeFileSync(join(repo, "timeline.json"), JSON.stringify({ total_frames: 30, concepts: [] }));
  writeFileSync(join(repo, "raw.txt"), "미청취");
  const report = productionReviewTemplate(w, state, "review_audio");
  assert.equal(Object.keys(report._format).length, 3);
  assert.ok(Object.values(report._format).every(v => typeof v === "string"));
  report.reviewer = { id: "tester", tool: "fixture", role: "audio-reviewer", independent: false };
  report.raw_report = { path: "raw.txt", sha256: hash("미청취") };
  const validate = () => {
    const data = JSON.stringify(report);
    writeFileSync(join(repo, "review.json"), data);
    return validateReview(w, state, { action: "review_audio" }, { "review.json": hash(data) }).validation.gaps;
  };
  const withFormat = validate();
  delete report._format;
  assert.deepEqual(validate(), withFormat);
});
