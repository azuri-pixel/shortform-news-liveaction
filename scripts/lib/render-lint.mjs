// Machine checks that run on a rendered MP4 before any reviewer is called.
// They catch defects a measurement can prove (black flashes, empty edge bands,
// clipping peaks, a missing or stale loudness report), so review rounds are spent
// on judgement instead. Passing is not a viewing or listening verdict.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MEDIA = { stdio: ["ignore", "pipe", "pipe"], timeout: 300_000, killSignal: "SIGKILL", maxBuffer: 64 * 1024 * 1024 };
export const RENDER_LINT = {
  contract: "render-lint@1",
  black_min_sec: 0.03,
  black_pixel_threshold: 0.05,
  true_peak_max_dbtp: -1.0,
  edge_px: 24,
  edge_dark_luma: 12,
  edge_inner_luma: 40,
};

const sha = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

// Last frame of the body (end credits are allowed to be dark).
export const bodyEndFrame = (timeline) => timeline.attribution?.pages?.[0]?.from ?? timeline.total_frames;

export const parseBlackdetect = (stderr, fps, bodyEnd) => [...stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)]
  .map((m) => ({ from: Math.round(Number(m[1]) * fps), end: Math.round(Number(m[2]) * fps) }))
  .filter((r) => r.from < bodyEnd).map((r) => ({ ...r, end: Math.min(r.end, bodyEnd) }));

export const parseTruePeak = (stderr) => {
  const m = /True peak:\s*\n\s*Peak:\s*(-?[\d.]+|-inf)\s*dBFS/.exec(stderr);
  return m ? (m[1] === "-inf" ? -Infinity : Number(m[1])) : null;
};

// gray: Uint8Array width*height. A side band is "empty" when its mean luma is near
// black while the picture just inside it is bright — the cover/shift left a gap.
export const edgeBands = (gray, width, height, { edge, dark, inner }) => {
  const mean = (x0, x1) => { let s = 0, n = 0; for (let y = 0; y < height; y++) for (let x = x0; x < x1; x++) { s += gray[y * width + x]; n++; } return s / n; };
  const bands = [];
  const left = mean(0, edge), leftIn = mean(edge * 2, edge * 3);
  const right = mean(width - edge, width), rightIn = mean(width - edge * 3, width - edge * 2);
  if (left < dark && leftIn > inner) bands.push({ side: "left", luma: Math.round(left), inner: Math.round(leftIn) });
  if (right < dark && rightIn > inner) bands.push({ side: "right", luma: Math.round(right), inner: Math.round(rightIn) });
  return bands;
};

// ffmpeg filters report on stderr; capture it whatever the exit code.
const ffmpegLog = (args) => execFileSync("bash", ["-c", 'ffmpeg -nostdin -nostats "$@" 2>&1', "_", ...args], { ...MEDIA, encoding: "utf8" });

const grayFrame = (png, width, height) => execFileSync("ffmpeg", ["-nostdin", "-v", "error", "-i", png, "-vf", `scale=${width}:${height}`, "-f", "rawvideo", "-pix_fmt", "gray", "-"], MEDIA);

export const lintRender = ({ video, timeline, frames, frameDir, production }) => {
  const fps = timeline.fps, bodyEnd = bodyEndFrame(timeline), failures = [];
  const black = parseBlackdetect(ffmpegLog(["-i", video, "-vf", `blackdetect=d=${RENDER_LINT.black_min_sec}:pix_th=${RENDER_LINT.black_pixel_threshold}`, "-an", "-f", "null", "-"]), fps, bodyEnd);
  for (const r of black) failures.push({ id: "black-frames", range: [r.from, r.end], message: `본문 ${r.from}–${r.end}f가 검정 화면이다 — 미디어 사건 사이 공백인지 확인한다` });

  const W = 108, H = 192, canvas = timeline.production_profile?.canvas?.width ?? 1080;
  const edge = Math.max(2, Math.round((RENDER_LINT.edge_px * W) / canvas));
  for (const f of frames.filter((x) => x.frame < bodyEnd)) {
    const bands = edgeBands(grayFrame(join(frameDir, f.original), W, H), W, H, { edge, dark: RENDER_LINT.edge_dark_luma, inner: RENDER_LINT.edge_inner_luma });
    for (const b of bands) failures.push({ id: "edge-band", range: [f.frame, f.frame + 1], message: `${f.frame}f ${b.side} 가장자리가 비었다(밝기 ${b.luma}, 안쪽 ${b.inner}) — 영상 cover·이동이 화면을 다 채우는지 확인한다` });
  }

  let truePeak = null;
  const hasAudio = execFileSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", video], { ...MEDIA, encoding: "utf8" }).trim() !== "";
  if (hasAudio) {
    truePeak = parseTruePeak(ffmpegLog(["-i", video, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]));
    if (truePeak != null && truePeak > RENDER_LINT.true_peak_max_dbtp) failures.push({ id: "true-peak", range: null, message: `true peak ${truePeak} dBTP > ${RENDER_LINT.true_peak_max_dbtp} — audio.json master_gain_db를 낮춘다` });
  }

  const loudnessFile = join(production, "reviews/audio-loudness.json");
  let loudness = { status: "missing" };
  if (existsSync(loudnessFile)) {
    const report = JSON.parse(readFileSync(loudnessFile, "utf8"));
    loudness = { status: report.verdict?.status ?? "unknown", render_sha256: report.render_sha256, current: report.render_sha256 === sha(video) };
  }
  if (hasAudio && !(loudness.current && loudness.status === "pass"))
    failures.push({ id: "audio-loudness", range: null, message: loudness.status === "missing" ? "reviews/audio-loudness.json이 없다 — npm run audio:loudness -- measure <id>" : !loudness.current ? "audio-loudness.json이 이 MP4를 잰 결과가 아니다 — 다시 measure" : `음량 판정 ${loudness.status} — gain을 고치고 다시 렌더·measure` });

  return { contract: RENDER_LINT.contract, status: failures.length ? "fail" : "pass", body_end_frame: bodyEnd, true_peak_dbtp: truePeak, loudness, failures, thresholds: RENDER_LINT, note: "측정 검사다. 시청·청취·설명 판단을 대신하지 않는다" };
};
