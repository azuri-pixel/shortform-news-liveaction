// 프레임·시트 추출: stdin을 차단하고 모든 ffmpeg 호출에 강제 종료 기한을 둔다.
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rename, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

function ffmpeg(args, timeoutMs) {
  return new Promise((resolveCall, reject) => {
    const child = spawn(process.env.FFMPEG_PATH?.trim() || "ffmpeg", [
      "-nostdin", "-hide_banner", "-loglevel", "error", "-y", ...args,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => { stderr = (stderr + data).slice(-8192); });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      child.stderr.destroy();
      child.unref();
      // close를 기다리면 종료되지 않는 프로세스/파이프에 다시 묶일 수 있다.
      reject(new Error(`ffmpeg timeout: ${timeoutMs}ms 초과 — SIGKILL 전송${stderr ? `\n${stderr.trim()}` : ""}`));
    }, timeoutMs);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`ffmpeg 실행 실패: ${error.message}`, { cause: error }));
    });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      if (code === 0) resolveCall();
      else reject(new Error(`ffmpeg 실패 (code=${code}, signal=${signal}): ${stderr.trim()}`));
    });
  });
}

const positiveInteger = (value) => Number.isSafeInteger(value) && value > 0;

/** 초 단위 시각 순서대로 PNG를 추출한다. 반환값: { frames: 절대경로[], sheet: 절대경로|null }. */
export async function extractFrames({ video, times, outDir, width = 270, sheet, timeoutMs = 60000 }) {
  if (typeof video !== "string" || !video.trim()) throw new Error("video 경로가 필요합니다");
  if (typeof outDir !== "string" || !outDir.trim()) throw new Error("outDir 경로가 필요합니다");
  if (!Array.isArray(times) || !times.length || times.some((t) => typeof t !== "number" || !Number.isFinite(t) || t < 0))
    throw new Error("times는 0 이상 유한한 초 값의 비어 있지 않은 배열이어야 합니다");
  if (!positiveInteger(width)) throw new Error("width는 양의 정수여야 합니다");
  if (!positiveInteger(timeoutMs) || timeoutMs > 2147483647) throw new Error("timeoutMs는 1~2147483647 정수여야 합니다");
  if (sheet !== undefined && (!sheet || !positiveInteger(sheet.cols) || !positiveInteger(sheet.rows) || !Number.isSafeInteger(sheet.cols * sheet.rows) || sheet.cols * sheet.rows < times.length))
    throw new Error("sheet cols·rows는 양의 정수이며 모든 프레임을 담아야 합니다");

  const input = resolve(video), output = resolve(outDir);
  await mkdir(output, { recursive: true });
  const temp = await mkdtemp(join(output, ".frames-"));
  const names = times.map((_, i) => `frame-${String(i + 1).padStart(4, "0")}.png`);
  try {
    for (const [i, second] of times.entries()) {
      const file = join(temp, names[i]);
      await ffmpeg(["-ss", String(second), "-i", input, "-map", "0:v:0", "-frames:v", "1", "-vf", `scale=${width}:-1`, file], timeoutMs);
      // EOF 이후 탐색은 ffmpeg가 성공 코드로 끝나도 이미지가 없을 수 있다.
      if (!(await stat(file).catch(() => null))?.size) throw new Error(`프레임 없음: ${second}초 (${input})`);
    }
    if (sheet) {
      await ffmpeg(["-framerate", "1", "-start_number", "1", "-i", join(temp, "frame-%04d.png"), "-vf", `tile=${sheet.cols}x${sheet.rows}:nb_frames=${times.length}`, "-frames:v", "1", join(temp, "sheet.png")], timeoutMs);
      if (!(await stat(join(temp, "sheet.png")).catch(() => null))?.size) throw new Error("시트 생성 결과가 없습니다");
    }
    for (const name of [...names, ...(sheet ? ["sheet.png"] : [])]) await rename(join(temp, name), join(output, name));
    return { frames: names.map((name) => join(output, name)), sheet: sheet ? join(output, "sheet.png") : null };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
