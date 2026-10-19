import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRanges, selectFrames } from "../scripts/review-packet.mjs";

const proof = [0, 100, 150, 299, 300, 500].map((frame, i) => ({ id: `p${i}`, frame, labels: [`l${i}`] }));

test("full scope keeps every proof frame inside the video", () => {
  assert.deepEqual(selectFrames([...proof, { frame: 900 }], 600, null).map(f => f.frame), [0, 100, 150, 299, 300, 500]);
});

test("recheck scope keeps proof frames in [from,end) and adds both range edges", () => {
  const frames = selectFrames(proof, 600, parseRanges("120-300,590-700"));
  assert.deepEqual(frames.map(f => f.frame), [120, 150, 299, 590, 599]);
  assert.deepEqual(frames[0].labels, ["range-edge"]);
  assert.deepEqual(frames[1].labels, ["l2"]);
});

test("rejects malformed or empty ranges", () => {
  for (const bad of ["300", "300-300", "a-b", "400-300"]) assert.throws(() => parseRanges(bad), /from-end/);
  assert.equal(parseRanges(undefined), null);
});

test("packet subprocesses disconnect stdin, have hard deadlines and preserve packet outputs", async (t) => {
  const cp = await import("node:child_process");
  const { syncBuiltinESMExports } = await import("node:module");
  const fs = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const { buildPacket } = await import("../scripts/review-packet.mjs");
  const repo = fs.mkdtempSync(join(tmpdir(), "review-packet-process-"));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const production = join(repo, "news/sample/02_production");
  fs.mkdirSync(production, { recursive: true });
  fs.writeFileSync(join(production, "timeline.json"), JSON.stringify({ fps: 30, total_frames: 60, proof_frames: [{ frame: 0 }] }));
  fs.writeFileSync(join(repo, "video.mp4"), "fixture video");
  const calls = [];
  const mocked = t.mock.method(cp.default, "execFileSync", (command, args, options) => {
    calls.push(command);
    assert.deepEqual(options.stdio, ["ignore", "pipe", "pipe"]);
    assert.equal(options.timeout, 300_000);
    assert.equal(options.killSignal, "SIGKILL");
    if (command === "ffprobe") return JSON.stringify({ streams: [{ width: 1080, height: 1920, nb_read_packets: "60" }] });
    if (command === "bash") return "audio measurements\n";
    assert.equal(command, "ffmpeg");
    assert.ok(args.includes("-nostdin"));
    if (args.at(-1) === "-") return Buffer.alloc(108 * 192, 128);
    fs.writeFileSync(args.at(-1).replace("%04d", "0001"), "fixture image");
    return Buffer.alloc(0);
  });
  syncBuiltinESMExports();
  t.after(() => { mocked.mock.restore(); syncBuiltinESMExports(); });
  assert.throws(() => buildPacket({ repo, id: "sample", mp4: "video.mp4", round: "r1" }), /render-lint 실패[\s\S]*audio-loudness/);
  calls.length = 0;
  const result = buildPacket({ repo, id: "sample", mp4: "video.mp4", round: "r1", allowLint: true, force: true });
  assert.equal(result.render_lint, "fail");
  assert.equal(result.frames, 1);
  assert.equal(result.sheets, 1);
  assert.deepEqual(calls, ["ffprobe", "ffmpeg", "ffmpeg", "ffmpeg", "bash", "ffmpeg", "ffprobe", "bash", "bash"]);
  const index = JSON.parse(fs.readFileSync(join(repo, result.packet)));
  assert.equal(index.contract, "review-packet@1");
  assert.equal(index.frames[0].original, "orig/f00000.png");
  assert.equal(index.frames[0].mobile, "mobile/f00000.png");
  assert.equal(index.sheets[0].path, "sheets/sheet-01.jpg");
});

test("render lint parses black ranges, true peak, and empty edge bands", async () => {
  const { parseBlackdetect, parseTruePeak, edgeBands } = await import("../scripts/lib/render-lint.mjs");
  const log = "[blackdetect @ 0x1] black_start:8.733 black_end:9.0 black_duration:0.267\n[blackdetect @ 0x1] black_start:57.2 black_end:61.0 black_duration:3.8";
  assert.deepEqual(parseBlackdetect(log, 30, 1740), [{ from: 262, end: 270 }, { from: 1716, end: 1740 }]);
  assert.equal(parseTruePeak("  True peak:\n    Peak:        0.1 dBFS"), 0.1);
  const W = 108, H = 192, gray = new Uint8Array(W * H).fill(120);
  for (let y = 0; y < H; y++) for (let x = W - 3; x < W; x++) gray[y * W + x] = 2;
  assert.deepEqual(edgeBands(gray, W, H, { edge: 3, dark: 12, inner: 40 }).map((b) => b.side), ["right"]);
});

test("review diff finds moved events, changed media, unchanged claims and listen targets", async () => {
  const { diffSnapshots, listenTargets } = await import("../scripts/lib/review-diff.mjs");
  const base = { events: { a: [0, 10, 50, 60], b: [100, 110, 150, 160] }, concepts: { c1: [0, 90], c2: [90, 200] }, concept_assets: { c1: ["v1"], c2: ["v2"] }, media: { v1: "x", v2: "y" }, claims_sha256: "k", scene_sha256: "s", total_frames: 300 };
  const next = { ...base, events: { ...base.events, b: [100, 110, 170, 180] }, media: { v1: "x2", v2: "y" } };
  const diff = diffSnapshots(base, next);
  assert.deepEqual(diff.changed_events, ["b"]);
  assert.deepEqual(diff.changed_media, ["v1"]);
  assert.deepEqual(diff.ranges, [[0, 186]]);
  assert.equal(diff.claims_changed, false);
  const narration = { sentences: [{ id: "s1", words: [{ text: "고도", start: 1, end: 1.3 }, { text: "275킬로미터", start: 1.3, end: 2.4 }] }] };
  const transcript = { segments: [{ words: [{ word: "고도", start: 1, end: 1.3 }, { word: "25km", start: 1.3, end: 2.4 }] }] };
  assert.deepEqual(listenTargets(narration, transcript).map((t) => t.expected), ["275킬로미터"]);
});
