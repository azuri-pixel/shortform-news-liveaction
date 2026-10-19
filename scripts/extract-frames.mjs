#!/usr/bin/env node
// 사용: npm run frames -- video.mp4 --at 1.5,3.6 --out out/frames --sheet 7x3 --width 270
import { parseArgs } from "node:util";
import { extractFrames } from "./lib/frame-extract.mjs";

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    at: { type: "string" }, out: { type: "string", default: "out/frames" },
    sheet: { type: "string" }, width: { type: "string", default: "270" },
    help: { type: "boolean", short: "h" },
  } });
  if (values.help) {
    console.log("사용: npm run frames -- <mp4> --at 1.5,3.6 [--out dir] [--sheet 7x3] [--width 270]");
  } else {
    if (positionals.length !== 1 || !values.at || values.at.split(",").some((s) => !s.trim()))
      throw new Error("영상 하나와 --at 초,초 값이 필요합니다 (--help 참고)");
    const grid = values.sheet?.match(/^(\d+)x(\d+)$/);
    if (values.sheet !== undefined && !grid) throw new Error("--sheet 형식: 7x3");
    const result = await extractFrames({ video: positionals[0], times: values.at.split(",").map(Number),
      outDir: values.out, width: Number(values.width),
      ...(grid ? { sheet: { cols: Number(grid[1]), rows: Number(grid[2]) } } : {}),
    });
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) {
  console.error(`프레임 추출 실패: ${error.message}`);
  process.exitCode = 1;
}
