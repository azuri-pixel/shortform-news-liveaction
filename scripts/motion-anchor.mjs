#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { normalizeNarration, narrationWordHash } from "./lib/editorial.mjs";

export const repairMotionAnchors = (motion, narration, { fix = false } = {}) => {
  const lines = normalizeNarration(narration);
  const byId = new Map(lines.map((line) => [line.id, line]));
  const changes = [], errors = [];
  const walk = (value, where) => {
    if (!value || typeof value !== "object") return;
    if (value.anchor && typeof value.anchor === "object") {
      const anchor = value.anchor;
      const words = byId.get(anchor.line)?.words ?? [];
      if (words[anchor.token_index]?.text !== anchor.word) {
        const matches = words.flatMap((word, index) => word.text === anchor.word ? [index] : []);
        const oldIndex = Number.isInteger(anchor.token_index) ? anchor.token_index : 0;
        matches.sort((a, b) => Math.abs(a - oldIndex) - Math.abs(b - oldIndex) || a - b);
        if (!matches.length) errors.push({ where, message: `${anchor.line}에서 단어 "${anchor.word}"를 찾지 못했다` });
        else {
          changes.push({ where, before: anchor.token_index ?? null, after: matches[0] });
          if (fix) anchor.token_index = matches[0];
        }
      }
    }
    for (const [key, child] of Object.entries(value)) if (key !== "anchor") walk(child, `${where}.${key}`);
  };
  walk(motion, "motion");
  const hash = narrationWordHash(lines);
  if (motion.narration_word_sha256 !== hash) changes.push({ where: "motion.narration_word_sha256", before: motion.narration_word_sha256 ?? null, after: hash });
  if (fix) motion.narration_word_sha256 = hash;
  return { changes, errors };
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [id, ...args] = process.argv.slice(2);
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || args.some((arg) => arg !== "--fix")) throw new Error("사용법: npm run motion:anchor -- <id> [--fix]");
    const production = resolve("news", id, "02_production");
    const read = (name) => JSON.parse(readFileSync(join(production, name), "utf8"));
    const motion = read("motion.json"), fix = args.includes("--fix");
    const result = repairMotionAnchors(motion, read("narration.json"), { fix });
    if (fix) writeFileSync(join(production, "motion.json"), JSON.stringify(motion, null, 2) + "\n");
    console.log(JSON.stringify({ ...result, note: fix ? "일치하는 앵커 위치와 단어 시각 해시를 갱신했다" : "미리보기다. 적용은 --fix" }, null, 2));
    if (result.errors.length) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
