import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, selectedFrames } from "../scripts/render-editorial-proof-frames.mjs";

const parse = (...args) => parseArgs(["--pilot", "sample", ...args]);
const composition = { fps: 30, durationInFrames: 300 };

test("기존 기본·위치 인자·연락지 옵션을 유지한다", () => {
  assert.equal(parse().selected, false);
  assert.deepEqual(parseArgs(["sample", "--sheet", "--out", "page.png"]), {
    id: "sample", wantSheet: true, outArg: "page.png", at: [], frames: [], range: null, step: null, selected: false,
  });
});

test("초·프레임·구간을 합쳐 반올림·중복 제거·정렬한다", () => {
  const options = parse("--at", "2,0.05,1", "--frames", "60,0,299", "--range", "0.1-0.3", "--step", "0.1");
  assert.deepEqual(selectedFrames(options, composition), [0, 2, 3, 6, 9, 30, 60, 299]);
  assert.deepEqual(selectedFrames(parse("--range", "1-2", "--step", "0.6"), composition), [30, 48]);
  assert.deepEqual(selectedFrames(parse("--at", "1"), { fps: 29.97, durationInFrames: 100 }), [30]);
});

test("잘못된 인자와 위험한 혼용은 렌더 전에 거부한다", () => {
  for (const args of [
    ["--at"], ["--at", ""], ["--at", "1,"], ["--at", "NaN"], ["--at", "Infinity"],
    ["--at", "-1"], ["--frames", "1.5"], ["--frames", "9007199254740992"],
    ["--range", "2-1", "--step", "1"], ["--range", "0-1"], ["--step", "1"],
    ["--range", "0-1", "--step", "0"], ["--range", "0-1-2", "--step", "1"],
    ["--at", "1", "--sheet"], ["--frames", "1", "--out", "page.png"],
    ["--at", "1", "--at", "2"], ["--unknown"], ["extra"],
  ]) assert.throws(() => parse(...args), args.join(" "));
  assert.throws(() => parseArgs([]));
  assert.throws(() => parseArgs(["--pilot"]));
});

test("composition 경계 밖과 과도한 구간 표본을 거부한다", () => {
  for (const args of [
    ["--frames", "300"], ["--at", "10"], ["--at", "9.999"],
    ["--range", "0-10", "--step", "1"], ["--range", "0-1", "--step", "0.0000001"],
  ]) assert.throws(() => selectedFrames(parse(...args), composition));
  assert.throws(() => selectedFrames(parse("--at", "0"), { fps: 0, durationInFrames: 10 }));
});
