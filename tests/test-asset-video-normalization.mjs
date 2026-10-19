import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FFMPEG, FFPROBE } from "../scripts/lib/tools.mjs";
import { downloadAll, readManifest, planAssets } from "../scripts/lib/asset-download.mjs";

const hash = (data) => createHash("sha256").update(data).digest("hex");
const command = (tool, args) => {
  const result = spawnSync(tool, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 60000, killSignal: "SIGKILL" });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  return result.stdout;
};
const probe = (file) => JSON.parse(command(FFPROBE, ["-v", "error", "-show_streams", "-of", "json", file])).streams;

test("downloads normalize 4K video, preserve receipts, publish manifest paths and recover missing copies", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "asset-video-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, "fixture.mp4");
  command(FFMPEG, ["-nostdin", "-v", "error", "-f", "lavfi", "-i", "color=c=blue:s=3840x2160:r=60:d=2", "-f", "lavfi", "-i", "sine=frequency=440:duration=2", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", source]);
  const bytes = readFileSync(source);
  mkdirSync(join(root, "01_input"));
  const manifest = join(root, "01_input/assets.json");
  writeFileSync(manifest, JSON.stringify({ title: "Sample Daily", assets: [
    { id: "silent", path: "01_input/stock.mp4", source_url: "https://example.com/stock.mp4" },
    { id: "zoom", path: "01_input/zoom.mp4", source_url: "https://example.com/zoom.mp4", normalize: false },
    { id: "sound", path: "01_input/sound.mp4", source_url: "https://example.com/sound.mp4", keep_audio: true },
  ] }));
  const run = async (options = {}) => {
    const assets = readManifest(root);
    const plan = planAssets({ root, assets });
    return downloadAll(plan.downloads, { fetchImpl: async () => new Response(bytes, { headers: { "content-type": "video/mp4" } }), ...options });
  };
  const results = await run();
  assert.ok(results.every((r) => r.ok), JSON.stringify(results));
  const doc = JSON.parse(readFileSync(manifest));
  assert.equal(doc.title, "Sample Daily");
  for (const asset of doc.assets) {
    if (asset.normalize === false) {
      assert.equal(asset.path, "01_input/zoom.mp4");
      assert.equal(hash(readFileSync(join(root, asset.path))), hash(bytes));
      const video = probe(join(root, asset.path))[0];
      assert.deepEqual([video.width, video.height, video.avg_frame_rate], [3840, 2160, "60/1"]);
      continue;
    }
    assert.match(asset.path, /^02_production\/external_assets\/_normalized\//);
    assert.equal(hash(readFileSync(join(root, asset.original_path))), hash(bytes));
    assert.equal(asset.original_sha256, hash(bytes));
    assert.equal(asset.sha256, hash(readFileSync(join(root, asset.path))));
    const streams = probe(join(root, asset.path));
    const video = streams.find((s) => s.codec_type === "video");
    assert.equal(video.width, 1920);
    assert.equal(video.height, 1080);
    assert.equal(video.codec_name, "h264");
    assert.equal(video.avg_frame_rate, "30/1");
    assert.ok(Math.abs(Number(video.duration) - 2) < 0.1);
    assert.equal(streams.some((s) => s.codec_type === "audio"), asset.keep_audio === true);
  }
  assert.deepEqual(await run(), []);
  rmSync(join(root, doc.assets[0].path));
  const restored = await run({ fetchImpl: () => { throw new Error("must reuse original"); } });
  assert.equal(restored[0].ok, true, restored[0].error);
  // A killed probe/transcode leaves the receipt and manifest usable for retry.
  writeFileSync(manifest, JSON.stringify({ assets: [{ id: "retry", path: "01_input/retry.mp4", source_url: "https://example.com/retry.mp4" }] }));
  const failed = await run({ timeoutMs: 1 });
  assert.equal(failed[0].ok, false);
  assert.match(failed[0].error, /시간 초과/);
  assert.equal(hash(readFileSync(join(root, "01_input/retry.mp4"))), hash(bytes));
  assert.equal(readManifest(root)[0].path, "01_input/retry.mp4");
  assert.equal((await run())[0].ok, true);
  assert.ok(readdirSync(join(root, "02_production/external_assets/_normalized")).every((name) => !name.includes(".part")));
});

test("portrait videos fit 1080x1920 without upsampling fps; small videos remain untouched", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "asset-portrait-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "01_input"));
  const manifest = join(root, "01_input/assets.json");
  for (const [name, dimensions, expected] of [
    ["portrait", "1440x2560", [1080, 1920]],
    ["small", "640x360", [640, 360]],
  ]) {
    const original = `01_input/${name}.mp4`;
    command(FFMPEG, ["-nostdin", "-v", "error", "-f", "lavfi", "-i", `color=c=blue:s=${dimensions}:r=24:d=0.25`, "-c:v", "libx264", "-preset", "ultrafast", join(root, original)]);
    const originalHash = hash(readFileSync(join(root, original)));
    writeFileSync(manifest, JSON.stringify([{ id: name, path: original }]));
    const plan = planAssets({ root, assets: readManifest(root) });
    const results = await downloadAll(plan.downloads);
    assert.equal(results[0].ok, true, results[0].error);
    const asset = readManifest(root)[0];
    const video = probe(join(root, asset.path))[0];
    assert.deepEqual([video.width, video.height], expected);
    assert.equal(video.avg_frame_rate, "24/1");
    assert.equal(hash(readFileSync(join(root, original))), originalHash);
    if (name === "small") assert.equal(asset.path, original);
  }
});

test("60fps below 1080p is capped without upscaling; opt-out preserves and restores the original", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "asset-opt-out-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "01_input"));
  const original = "01_input/slow-motion.mp4";
  command(FFMPEG, ["-nostdin", "-v", "error", "-f", "lavfi", "-i", "testsrc2=s=640x360:r=60:d=0.25", "-c:v", "libx264", "-preset", "ultrafast", join(root, original)]);
  const bytes = readFileSync(join(root, original));
  const manifest = join(root, "01_input/assets.json");
  const run = async () => downloadAll(planAssets({ root, assets: readManifest(root) }).downloads, {
    fetchImpl: async () => new Response(bytes),
  });
  writeFileSync(manifest, JSON.stringify([{ path: original, normalize: false }]));
  assert.deepEqual(await run(), []);
  assert.equal(readManifest(root)[0].path, original);
  // New downloads honor opt-out too.
  writeFileSync(manifest, JSON.stringify([{ path: "01_input/download.mp4", source_url: "https://example.com/video", normalize: false }]));
  assert.equal((await run())[0].ok, true);
  assert.deepEqual(readFileSync(join(root, readManifest(root)[0].path)), bytes);
  writeFileSync(manifest, JSON.stringify([{ path: original }]));
  assert.equal((await run())[0].ok, true);
  const normalized = readManifest(root)[0];
  const video = probe(join(root, normalized.path))[0];
  assert.deepEqual([video.width, video.height, video.avg_frame_rate], [640, 360, "30/1"]);
  assert.equal(normalized.original_sha256, hash(bytes));
  writeFileSync(manifest, JSON.stringify([{ ...normalized, normalize: false }]));
  assert.equal((await run())[0].ok, true);
  const restored = readManifest(root)[0];
  assert.equal(restored.path, original);
  assert.equal(restored.sha256, hash(bytes));
  assert.deepEqual(readFileSync(join(root, restored.path)), bytes);
  assert.equal(probe(join(root, restored.path))[0].avg_frame_rate, "60/1");
  writeFileSync(manifest, JSON.stringify([{ ...restored, normalize: true }]));
  assert.equal((await run())[0].ok, true);
  assert.equal(readManifest(root)[0].path, normalized.path);
});

test("sync는 trim과 crop을 함께 적용하고 원본 시각에서 PNG를 추출한다", async (t) => {
  const { syncMedia } = await import("../scripts/lib/sync-media.mjs");
  const root = mkdtempSync(join(tmpdir(), "sync-crop-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, "source.mp4");
  command(FFMPEG, ["-v", "error", "-f", "lavfi", "-i", "testsrc2=s=320x240:r=10:d=1", "-c:v", "libx264", source]);
  const before = hash(readFileSync(source));
  const cropped = join(root, "crop.mp4");
  syncMedia({ trim: { from_sec: 0.2, duration_sec: 0.3 }, crop: { x: 0, y: 0, width: 90, height: 160 } }, source, cropped);
  const video = probe(cropped)[0];
  assert.deepEqual([video.width, video.height, Number(video.nb_frames)], [1080, 1920, 3]);
  const still = join(root, "still.png");
  syncMedia({ frame_at_sec: 0.5, crop: { x: 20, y: 20, width: 100, height: 100 } }, source, still);
  assert.deepEqual(probe(still).map(s => [s.codec_name, s.width, s.height]), [["png", 100, 100]]);
  assert.equal(hash(readFileSync(source)), before);
});
