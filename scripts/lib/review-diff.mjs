// What changed between two review rounds, and where a human still has to listen.
// The packet stores a snapshot of the timeline and the on-screen claims; the next
// round diffs against it so recheck ranges and the fact-check need are computed,
// not typed by hand.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const hash = (value) => createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");

// Everything a fact-check reads: spoken text, declared screen text, hook, credits.
export const claimsOf = ({ narration, concepts, timeline }) => ({
  narration: (narration.sentences ?? narration.lines ?? []).map((l) => l.caption_text ?? l.text),
  screen_text: (concepts.concepts ?? []).flatMap((c) => (c.elements ?? []).filter((e) => e.kind === "text").map((e) => `${e.id}=${e.text}`)),
  hook: (timeline.hook_overlay?.phrases ?? []).map((p) => (p.rows ?? []).map((r) => (r.runs ?? []).map((x) => x.text).join("")).join("\n")),
  sources: (timeline.attribution?.sources ?? []).map((s) => s.text),
  credits: (timeline.attribution?.pages ?? []).flatMap((p) => (p.categories ?? []).flatMap((c) => [c.title, ...(c.lines ?? [])])),
});

export const snapshotOf = ({ timeline, narration, concepts, visualSystem, sceneFile }) => ({
  events: Object.fromEntries((timeline.events ?? []).map((e) => [e.id, [e.from, e.settled, e.to, e.end]])),
  concepts: Object.fromEntries((timeline.concepts ?? []).map((c) => [c.id, [c.from, c.end]])),
  media: Object.fromEntries((visualSystem?.media?.assets ?? []).map((a) => [a.id, hash({ source: a.source, trim: a.trim ?? null })])),
  concept_assets: Object.fromEntries((concepts.concepts ?? []).map((c) => [c.id, [...new Set([...(c.representation?.assets ?? []), ...(c.visual?.realization?.asset_ids ?? [])])]])),
  claims_sha256: hash(claimsOf({ narration, concepts, timeline })),
  scene_sha256: sceneFile && existsSync(sceneFile) ? hash(readFileSync(sceneFile, "utf8")) : null,
  total_frames: timeline.total_frames,
});

const mergeRanges = (ranges, total) => {
  const sorted = ranges.map(([a, b]) => [Math.max(0, a), Math.min(total, b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const r of sorted) { const last = out.at(-1); if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push([...r]); }
  return out;
};

// Events that moved, appeared, or show media whose source/trim changed. The scene
// code is free-form, so a changed scene file is reported rather than diffed.
export const diffSnapshots = (previous, current, pad = 6) => {
  const ranges = [], changed = [];
  for (const [id, now] of Object.entries(current.events)) {
    const before = previous.events?.[id];
    if (!before || before.some((v, i) => v !== now[i])) { changed.push(id); ranges.push([now[0] - pad, now[3] + pad]); if (before) ranges.push([before[0] - pad, before[3] + pad]); }
  }
  for (const id of Object.keys(previous.events ?? {})) if (!current.events[id]) { changed.push(id); const b = previous.events[id]; ranges.push([b[0] - pad, b[3] + pad]); }
  const changedMedia = Object.keys(current.media).filter((id) => previous.media?.[id] !== current.media[id]);
  for (const [conceptId, assets] of Object.entries(current.concept_assets ?? {})) {
    const range = current.concepts[conceptId];
    if (range && assets.some((a) => changedMedia.includes(a))) ranges.push([range[0] - pad, range[1] + pad]);
  }
  return {
    ranges: mergeRanges(ranges, current.total_frames),
    changed_events: changed,
    changed_media: changedMedia,
    claims_changed: previous.claims_sha256 !== current.claims_sha256,
    scene_changed: previous.scene_sha256 !== current.scene_sha256,
    length_changed: previous.total_frames !== current.total_frames,
  };
};

const normalize = (text) => String(text).replace(/[\s.,?!·'"‘’“”()]/g, "").toLowerCase();
// Share of the expected word's characters found in what the transcript heard there.
// Recall, not symmetric similarity: word boundaries of an ASR rarely match ours.
const recall = (expected, heard) => {
  if (!expected.length) return 1;
  const bag = new Map(); for (const ch of heard) bag.set(ch, (bag.get(ch) ?? 0) + 1);
  let common = 0; for (const ch of expected) if (bag.get(ch)) { common++; bag.set(ch, bag.get(ch) - 1); }
  return common / expected.length;
};

// Narration words whose time window, in an automatic transcript of the final mix,
// reads as something else. These are the seconds a person should actually listen to.
export const listenTargets = (narration, transcript, { threshold = 0.6, substitutions = [] } = {}) => {
  // The episode's substitution table maps transcript spellings (13번) to spoken ones (열세 번).
  const respell = (text) => substitutions.reduce((t, p) => t.split(p.text).join(p.spoken), text);
  const heard = (transcript.segments ?? []).flatMap((s) => s.words ?? []).concat(transcript.word_segments ?? []).concat(transcript.words ?? [])
    .filter((w) => Number.isFinite(w.start) && Number.isFinite(w.end));
  const targets = [];
  for (const line of narration.sentences ?? narration.lines ?? []) for (const word of line.words ?? []) {
    const overlap = heard.filter((w) => w.end > word.start + 0.02 && w.start < word.end - 0.02).map((w) => w.word ?? w.text ?? "").join("");
    const expected = normalize(word.text), got = normalize(respell(overlap));
    if (!expected) continue;
    const score = recall(expected, got);
    if (score < threshold) targets.push({ line: line.id, time: Number(word.start.toFixed(2)), end: Number(word.end.toFixed(2)), expected: word.text, transcript: overlap.trim(), similarity: Number(score.toFixed(2)) });
  }
  return targets;
};
