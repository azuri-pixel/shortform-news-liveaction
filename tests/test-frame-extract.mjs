// 합성 영상만 사용한다. 실제 ffmpeg와 멈추는 대역 프로세스를 각각 검증한다.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { extractFrames } from "../scripts/lib/frame-extract.mjs";

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "frame-extract-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
const dimensions = (path) => {
  const png = readFileSync(path);
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

test("2초 lavfi 영상 → 프레임 3장 + 빈 칸 있는 시트, CLI", { timeout: 30000 }, async (t) => {
  const dir = fixture(t), video = join(dir, "sample video.mp4");
  execFileSync(process.env.FFMPEG_PATH || "ffmpeg", ["-nostdin", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=320x240:rate=10:duration=2", "-c:v", "mpeg4", video], { stdio: ["ignore", "ignore", "pipe"], timeout: 10000, killSignal: "SIGKILL" });
  const outDir = join(dir, "frames");
  const result = await extractFrames({ video, times: [0, 0.7, 1.5], outDir, width: 160, sheet: { cols: 2, rows: 2 } });
  assert.equal(result.frames.length, 3);
  for (const frame of result.frames) assert.deepEqual(dimensions(frame), [160, 120]);
  assert.deepEqual(dimensions(result.sheet), [320, 240]);
  assert.notDeepEqual(readFileSync(result.frames[0]), readFileSync(result.frames[2]));
  const cli = JSON.parse(execFileSync(process.execPath, [resolve("scripts/extract-frames.mjs"), video, "--at", "0,0.7,1.5", "--out", outDir, "--sheet", "2x2", "--width", "160"], { encoding: "utf8", timeout: 15000 }));
  assert.deepEqual(cli, result);
  await assert.rejects(extractFrames({ video, times: [20], outDir }), /프레임 없음/);
  assert.equal(readdirSync(outDir).some((n) => n.startsWith(".frames-")), false);
});

function fake(t, source) {
  const dir = fixture(t), command = join(dir, "ffmpeg.mjs");
  writeFileSync(command, `#!${process.execPath}\n${source}`, { mode: 0o755 });
  const old = process.env.FFMPEG_PATH;
  process.env.FFMPEG_PATH = command;
  t.after(() => { if (old === undefined) delete process.env.FFMPEG_PATH; else process.env.FFMPEG_PATH = old; });
  return dir;
}

for (const phase of ["frame", "sheet"]) {
  test(`${phase} timeout은 SIGKILL로 종료하고 임시 파일을 정리한다`, { timeout: 10000 }, async (t) => {
    const dir = fake(t, `
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const args = process.argv.slice(2);
if (!args.includes('-nostdin') || readFileSync(0).length) process.exit(7);
const isSheet = args.at(-1).endsWith('sheet.png');
if (${JSON.stringify(phase)} === 'sheet' && !isSheet) writeFileSync(args.at(-1), 'fixture');
else {
  writeFileSync(fileURLToPath(new URL('pid', import.meta.url)), String(process.pid));
  process.on('SIGTERM', () => {});
  setInterval(() => {}, 1000);
}
`);
    const outDir = join(dir, "out");
    const start = Date.now();
    await assert.rejects(extractFrames({ video: "fixture.mp4", times: [0], outDir, timeoutMs: 1500, ...(phase === "sheet" ? { sheet: { cols: 1, rows: 1 } } : {}) }), /ffmpeg timeout: 1500ms.*SIGKILL/);
    assert.ok(Date.now() - start < 6000);
    const pid = Number(readFileSync(join(dir, "pid"), "utf8"));
    // 종료 이벤트가 전달될 기회를 준 뒤 실제 프로세스 소멸 확인.
    for (let i = 0; i < 50; i++) {
      try { process.kill(pid, 0); } catch { break; }
      await new Promise((r) => setTimeout(r, 10));
    }
    assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
    assert.deepEqual(readdirSync(outDir), []);
  });
}

test("실행 실패·비정상 종료·잘못된 인수를 명확히 거부한다", async (t) => {
  const dir = fake(t, "process.stderr.write('fixture failure'); process.exit(3);\n");
  const options = { video: "missing.mp4", times: [0], outDir: join(dir, "out") };
  await assert.rejects(extractFrames(options), /code=3.*fixture failure/);
  process.env.FFMPEG_PATH = join(dir, "missing-command");
  await assert.rejects(extractFrames(options), /ffmpeg 실행 실패.*ENOENT/);
  for (const bad of [{ times: [] }, { times: [NaN] }, { times: [-1] }, { times: [Infinity] }, { width: 0 }, { timeoutMs: 0 }, { timeoutMs: 2147483648 }, { sheet: { cols: 0, rows: 1 } }, { times: [0, 1], sheet: { cols: 1, rows: 1 } }]) {
    await assert.rejects(extractFrames({ ...options, ...bad }), /times|width|timeoutMs|sheet/);
  }
});
