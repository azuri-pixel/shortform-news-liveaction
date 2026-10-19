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
    fs.writeFileSync(args.at(-1).replace("%04d", "0001"), "fixture image");
    return Buffer.alloc(0);
  });
  syncBuiltinESMExports();
  t.after(() => { mocked.mock.restore(); syncBuiltinESMExports(); });
  const result = buildPacket({ repo, id: "sample", mp4: "video.mp4", round: "r1" });
  assert.equal(result.frames, 1);
  assert.equal(result.sheets, 1);
  assert.deepEqual(calls, ["ffprobe", "ffmpeg", "ffmpeg", "ffmpeg", "bash"]);
  const index = JSON.parse(fs.readFileSync(join(repo, result.packet)));
  assert.equal(index.contract, "review-packet@1");
  assert.equal(index.frames[0].original, "orig/f00000.png");
  assert.equal(index.frames[0].mobile, "mobile/f00000.png");
  assert.equal(index.sheets[0].path, "sheets/sheet-01.jpg");
});
