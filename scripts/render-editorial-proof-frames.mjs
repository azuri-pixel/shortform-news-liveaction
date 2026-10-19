#!/usr/bin/env node
// 본편 composition의 실제 frame을 직접 렌더한다. 비선형 proof frame을 짧은 Slides composition 안에서
// 시간 이동하면 Remotion의 Sequence 등록이 프레임마다 달라져 요소가 간헐적으로 빠질 수 있다.
//
// --sheet 를 붙이면 그렇게 나온 JPEG 만 모아 **페이지형 연락지**(page-01.png …)를 만든다.
// 옛 BeatSheet-<편> Still 은 proof 를 한 장(1200x40944)에 동시에 마운트해 263장에서 10분 넘게 멎었다.
// 그 거대 합성은 이 경로에서 쓰지 않는다 — 페이지는 <Img> 만 얹는다(scripts/lib/proof-sheet-render.mjs).
//
//   node scripts/render-editorial-proof-frames.mjs --pilot <id>                  # proof JPEG 만
//   node scripts/render-editorial-proof-frames.mjs --pilot <id> --sheet          # + 연락지 페이지
//   node scripts/render-editorial-proof-frames.mjs --pilot <id> --sheet --out <경로.png>
import { pathToFileURL } from "node:url";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync } from "node:fs";
import { basename, dirname, join, resolve, relative } from "node:path";
import { REPO, compId, dirs } from "./lib/pilot.mjs";
import { buildSheetPlan, proofImageName, sheetCoverageErrors } from "./lib/proof-sheet.mjs";
import { renderProofPages } from "./lib/proof-sheet-render.mjs";

const USAGE = "usage: render-editorial-proof-frames.mjs --pilot <id> [--sheet] [--out <경로.png>] [--at <sec,sec,...>] [--frames <n,n,...>] [--range <start>-<end> --step <sec>]";
const DECIMAL = /^(?:\d+(?:\.\d*)?|\.\d+)$/;

export function parseArgs(argv) {
  const options = { id: null, wantSheet: false, outArg: null, at: [], frames: [], range: null, step: null, selected: false };
  const seen = new Set();
  const number = (value, flag) => {
    if (!DECIMAL.test(value) || !Number.isFinite(Number(value))) throw new Error(`${flag}: 0 이상의 유한한 숫자가 필요하다`);
    return Number(value);
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("-")) {
      if (options.id) throw new Error("편 id는 한 번만 지정한다");
      options.id = arg;
      continue;
    }
    if (!["--pilot", "--sheet", "--out", "--at", "--frames", "--range", "--step"].includes(arg)) throw new Error(`알 수 없는 옵션: ${arg}`);
    if (seen.has(arg)) throw new Error(`중복 옵션: ${arg}`);
    seen.add(arg);
    if (arg === "--sheet") { options.wantSheet = true; continue; }
    const value = argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`${arg}: 값이 필요하다`);
    if (arg === "--pilot") {
      if (options.id) throw new Error("편 id는 한 번만 지정한다");
      options.id = value;
    } else if (arg === "--out") options.outArg = value;
    else if (arg === "--step") options.step = number(value, arg);
    else if (arg === "--range") {
      const parts = value.split("-");
      if (parts.length !== 2) throw new Error("--range: 시작초-끝초 형식이 필요하다");
      options.range = parts.map((part) => number(part, arg));
      if (options.range[0] > options.range[1]) throw new Error("--range: 끝은 시작 이상이어야 한다");
    } else {
      const values = value.split(",").map((part) => number(part.trim(), arg));
      if (arg === "--frames" && values.some((v) => !Number.isSafeInteger(v))) throw new Error("--frames: 0 이상의 안전한 정수가 필요하다");
      options[arg === "--at" ? "at" : "frames"] = values;
    }
  }
  if (!options.id) throw new Error(USAGE);
  if ((options.range !== null) !== (options.step !== null) || options.step === 0) throw new Error("--range와 양수 --step을 함께 지정한다");
  options.selected = options.at.length > 0 || options.frames.length > 0 || options.range !== null;
  if (options.outArg && !options.wantSheet) throw new Error("--out은 --sheet와 함께 지정한다");
  return options;
}

// 초는 가장 가까운 composition 프레임으로 반올림한다. 범위 끝은 step으로 도달할 때만 포함한다.
export function selectedFrames(options, { fps, durationInFrames }) {
  if (!Number.isFinite(fps) || fps <= 0 || !Number.isSafeInteger(durationInFrames) || durationInFrames <= 0) throw new Error("composition fps/길이가 잘못됐다");
  const frames = new Set();
  const add = (frame) => {
    if (!Number.isSafeInteger(frame) || frame < 0 || frame >= durationInFrames) throw new Error(`프레임 ${frame}: 허용 범위 0-${durationInFrames - 1}`);
    frames.add(frame);
  };
  const at = (seconds) => {
    if (seconds >= durationInFrames / fps) throw new Error(`시각 ${seconds}초: composition 길이 밖이다`);
    add(Math.round(seconds * fps));
  };
  options.frames.forEach(add);
  options.at.forEach(at);
  if (options.range) {
    const [start, end] = options.range;
    at(start);
    if (end >= durationInFrames / fps) throw new Error("--range: composition 길이 밖이다");
    const count = Math.floor((end - start) / options.step + 1e-9);
    if (!Number.isSafeInteger(count) || count > 100_000) throw new Error("--range: 표본이 너무 많다 (최대 100001개)");
    for (let i = 1; i <= count; i++) at(start + i * options.step);
  }
  return [...frames].sort((a, b) => a - b);
}

export const frameSheetPlan = ({ selected = false, ...options }) => {
  const plan = buildSheetPlan(options);
  if (selected) {
    plan.images.name_pattern = "frame-<frame>.jpeg";
    for (const page of plan.pages) for (const tile of page.tiles) tile.image = `frame-${tile.frame}.jpeg`;
  }
  return plan;
};

async function main(argv) {
  const options = parseArgs(argv);
  const { id, wantSheet, outArg, selected } = options;
  const target = outArg ? resolve(outArg) : join(dirs(id).out, "qa", selected ? "preview-sheet" : "beatsheet", "page.png");
  const sheetDir = dirname(target);
  const stem = basename(target).replace(/\.png$/i, "") || "page";
  const manifestName = outArg ? `${stem}-manifest.json` : "manifest.json";
  const indexName = outArg ? `${stem}-index.html` : "index.html";
  // A failed rerun must not leave an old successful manifest/index pointing at
  // replaced proof images. Keep page images for inspection, invalidate the receipt.
  if (wantSheet) for (const name of [manifestName, indexName]) rmSync(join(sheetDir, name), { force: true });

  const { data, out } = dirs(id);
  const timeline = JSON.parse(readFileSync(join(data, "timeline.json"), "utf8"));
  let proofs = timeline.proof_frames ?? [];
  if (!selected && !proofs.length) throw new Error(`${id}: proof_frames가 없다`);
  const slideDir = join(out, "qa", selected ? "preview-frames" : "slides");
  mkdirSync(slideDir, { recursive: true });

  // 지난 세대의 element-*.jpeg 가 남아 있으면 이번 proof 목록과 섞인다. narration.mp3 등 다른 파일은 건드리지 않는다.
  const STALE = /^element-\d+\.jpe?g$/;
  const stale = selected ? [] : readdirSync(slideDir).filter((f) => STALE.test(f));
  const imageName = (index) => selected ? `frame-${proofs[index].frame}.jpeg` : proofImageName(index);
  for (const file of stale) unlinkSync(join(slideDir, file));
  if (stale.length) console.log(`이전 proof JPEG ${stale.length}장 정리`);

  const startedAt = Date.now();
  const serveUrl = await bundle({
    entryPoint: join(REPO, "src", "index.ts"),
    onProgress: () => undefined,
  });
  const browser = await openBrowser("chrome", { chromeMode: "headless-shell", logLevel: "warn" });

  try {
    const inputProps = { pilotId: id };
    const composition = await selectComposition({
      serveUrl,
      id: `ShortformNews-${compId(id)}`,
      inputProps,
      puppeteerInstance: browser,
      logLevel: "warn",
    });
    if (selected) proofs = selectedFrames(options, composition).map((frame) => ({ frame }));
    let cursor = 0;
    let completed = 0;
    const worker = async () => {
      while (cursor < proofs.length) {
        const index = cursor++;
        await renderStill({
          serveUrl,
          composition,
          inputProps,
          puppeteerInstance: browser,
          frame: proofs[index].frame,
          imageFormat: "jpeg",
          jpegQuality: 88,
          output: join(slideDir, imageName(index)),
          overwrite: true,
          logLevel: "warn",
          timeoutInMilliseconds: 60_000,
        });
        completed++;
        if (completed % 10 === 0 || completed === proofs.length) {
          console.log(`proof frame ${completed}/${proofs.length}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, proofs.length) }, worker));
  } finally {
    await browser.close({ silent: false });
    rmSync(serveUrl, { recursive: true, force: true });
  }

  const missing = proofs.map((_, index) => imageName(index)).filter((name) => !existsSync(join(slideDir, name)));
  if (missing.length) {
    console.error(`proof JPEG ${missing.length}장이 안 나왔다: ${missing.slice(0, 5).join(", ")}`);
    process.exit(1);
  }
  console.log(`editorial proof frames → ${slideDir} (${proofs.length}장, ${((Date.now() - startedAt) / 1000).toFixed(1)}초)`);

  if (!wantSheet) return;

  // ── 연락지 ────────────────────────────────────────────────────────────────────
  const plan = frameSheetPlan({ selected, pilotId: id, proofs, fps: timeline.fps, stem, imageDir: relative(sheetDir, slideDir) });
  const planErrors = sheetCoverageErrors(plan, proofs);
  if (planErrors.length) {
    for (const error of planErrors) console.error(`ERROR ${error}`);
    process.exit(1);
  }

  // 지난 세대의 페이지가 남아 있으면 proof 수가 줄었을 때 없는 proof 를 보게 된다.
  if (existsSync(sheetDir)) {
    const old = readdirSync(sheetDir).filter((f) => f.startsWith(stem + "-") && /^\d+\.png$/.test(f.slice(stem.length + 1)));
    for (const file of old) unlinkSync(join(sheetDir, file));
    if (old.length) console.log(`이전 연락지 페이지 ${old.length}장 정리`);
  }

  const sheetStartedAt = Date.now();
  const { pagePaths, manifestPath, indexPath } = await renderProofPages({
    plan,
    imageDir: slideDir,
    outDir: sheetDir,
    manifestName, indexName,
    onProgress: (done, total, file) => console.log(`sheet page ${done}/${total} · ${file}`),
  });

  const legacy = join(out, "qa", "beatsheet.png");
  console.log(`\neditorial proof sheet — 한 장짜리 beatsheet.png 를 만들지 않는다(263장 동시 마운트가 멎은 경로).`);
  console.log(`  index    : ${indexPath}`);
  console.log(`  page 1   : ${pagePaths[0]}`);
  console.log(`  pages    : ${pagePaths.length}장 · 각 ${plan.page.width}x${plan.page.height}px · 페이지당 최대 ${plan.per_page}장`);
  console.log(`  manifest : ${manifestPath}`);
  console.log(`  proofs   : ${plan.proof_count}장 전부 수록 · 원본 JPEG ${slideDir}`);
  console.log(`  걸린 시간: 연락지 ${((Date.now() - sheetStartedAt) / 1000).toFixed(1)}초 · 전체 ${((Date.now() - startedAt) / 1000).toFixed(1)}초`);
  if (existsSync(legacy)) console.log(`  ⚠ 옛 ${legacy} 은 이번 실행이 갱신하지 않았다(구형 단일 합성).`);

}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = error.message === USAGE ? 2 : 1;
  });
}
