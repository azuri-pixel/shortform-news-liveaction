/**
 * 자산 다운로드 층 — 인자 검사·경로 경계·URL 색인·진짜 동시 다운로드.
 *
 * 왜 (2026-09-22): `fetch-assets.mjs` 의 워커가 async 였지만 안에서 `spawnSync curl` 을 돌렸다.
 * spawnSync 는 프로세스를 멈춰 세우므로 `--jobs` 를 올려도 실제로는 한 개씩 받았다 —
 * 7편에서 14개 1.1GB 가 10분 timeout 을 친 그 자리다. 여기서는 `fetch` 로 받아 실제로 겹친다.
 * 그리고 curl 은 404 HTML 도 status 0 으로 끝나서 「1KB 넘으면 성공」 규칙만으로는 새어 나왔다.
 *
 * 받은 파일은 `.part` 로 쓰고 검사를 통과한 것만 제자리로 옮긴다. 이미 있는 파일은
 * `--force` 라도 덮어쓰지 않는다 — 내려받은 원본이 곧 수령 자료다(원문 보존).
 */
import {
  closeSync,
  createWriteStream,
  createReadStream,
  writeFileSync,
  renameSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  realpathSync,
  linkSync,
  rmSync,
  statSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { FFMPEG, FFPROBE } from "./tools.mjs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
export const REFERER = "https://www.hani.co.kr/";
export const DEFAULT_JOBS = 4;
export const MAX_JOBS = 16;
export const DEFAULT_TIMEOUT_MS = 900_000;
export const MIN_BYTES = 1024;
export const DEFAULT_MANIFEST = "01_input/assets.json";
export const USAGE =
  "usage: fetch-assets.mjs <root> [--jobs 4] [--dry] [--force] [--manifest <편 상대경로>]";

// ── 인자 ────────────────────────────────────────────────────────────────────
const parseJobs = (raw) => {
  if (!/^\d+$/.test(raw ?? ""))
    throw new Error(`--jobs 값 오류: ${raw ?? "(없음)"} — 1..${MAX_JOBS} 정수`);
  const n = Number(raw);
  if (n < 1 || n > MAX_JOBS)
    throw new Error(`--jobs 값 오류: ${raw} — 1..${MAX_JOBS} 정수`);
  return n;
};
const needValue = (flag, raw) => {
  if (!raw || raw.startsWith("--")) throw new Error(`${flag} 값 없음`);
  return raw;
};

export function parseArgs(argv) {
  const rest = [...argv];
  const root = rest.shift();
  if (!root || root.startsWith("--")) throw new Error(USAGE);
  const opts = {
    root: resolve(root),
    jobs: DEFAULT_JOBS,
    dry: false,
    force: false,
    manifest: null,
  };
  for (let i = 0; i < rest.length; i += 1) {
    const a = rest[i];
    if (a === "--dry") opts.dry = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--jobs") opts.jobs = parseJobs(rest[(i += 1)]);
    else if (a.startsWith("--jobs=")) opts.jobs = parseJobs(a.slice(7));
    else if (a === "--manifest") opts.manifest = needValue(a, rest[(i += 1)]);
    else if (a.startsWith("--manifest="))
      opts.manifest = needValue("--manifest", a.slice(11));
    else throw new Error(`알 수 없는 인자: ${a}\n${USAGE}`);
  }
  return opts;
}

// ── 경로 경계 — 편 폴더 밖으로 한 글자도 나가지 않는다 ───────────────────────
export function episodePath(root, rel, what = "경로") {
  const reject = (why) => new Error(`${what} 거부(${why}): ${rel}`);
  if (typeof rel !== "string" || !rel.trim()) throw new Error(`${what} 없음`);
  if (isAbsolute(rel) || rel.includes("\\") || rel.includes("\0"))
    throw reject("절대경로/제어문자");
  if (rel.split("/").some((p) => !p || p === "." || p === ".."))
    throw reject("편 밖");
  const home = realpathSync(root);
  const file = join(home, rel);
  // No symlink anywhere under the episode: even an internal alias can route
  // a 02_production derivative back into immutable 01_input.
  let probe = home;
  for (const segment of rel.split("/")) {
    probe = join(probe, segment);
    try {
      if (lstatSync(probe).isSymbolicLink()) throw reject("심링크");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return file;
}

const isDerived = (rel) => rel.startsWith("02_production/");

// ── URL 색인 — 기존 네 갈래를 그대로 둔다 ────────────────────────────────────
const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
};

export function buildUrlIndex(root) {
  const searchDir = join(root, "02_production/external_assets/_search");
  const nasa = new Map(); // NASA 이미지: nasa_id → URL
  const d = readJson(join(searchDir, "nasaimg_assets.json"));
  for (const [k, v] of Object.entries(d ?? {}))
    if (v?.chosen) nasa.set(k, v.chosen);

  const files = new Map(); // SVS: 원본 파일명 → URL
  if (existsSync(searchDir))
    for (const f of readdirSync(searchDir).filter((x) =>
      x.startsWith("svs_item_"),
    ))
      for (const g of readJson(join(searchDir, f))?.media_groups ?? [])
        for (const it of g.items ?? []) {
          const u = it.instance?.url;
          if (u) files.set(basename(u), u);
        }

  let hani = []; // 한겨레 게재 사진: imageList 순번
  const dir = join(root, "01_input/01_원문_기사");
  if (existsSync(dir))
    for (const f of readdirSync(dir).filter((x) =>
      x.endsWith(".article.json"),
    )) {
      const a = readJson(join(dir, f));
      if (a?.imageList) {
        hani = a.imageList.map((im) => im.url);
        break;
      }
    }
  return { nasa, files, hani };
}

/** 자산 하나의 URL. 명시된 `source_url`/`url` 이 색인보다 먼저다. */
export function resolveUrl(
  asset,
  index = { nasa: new Map(), files: new Map(), hani: [] },
) {
  const explicit = asset.source_url ?? asset.url;
  if (explicit != null) {
    if (typeof explicit !== "string" || !/^https?:\/\/\S+$/i.test(explicit))
      return { error: `source_url 형식 오류: ${explicit}` };
    return { url: explicit };
  }
  const name = basename(asset.path ?? "");
  // 1) SVS — `source_file` 이 정본, 없으면 파일명 `svs<id>__<원본>` 의 `__` 뒤
  const svs =
    asset.source_file ??
    (name.includes("__") ? name.split("__").slice(1).join("__") : null);
  if (svs && index.files.has(svs)) return { url: index.files.get(svs) };
  // 2) NASA 이미지 — ref 가 nasa_id
  if (asset.ref && index.nasa.has(asset.ref))
    return { url: index.nasa.get(asset.ref) };
  // 3) 한겨레 게재 사진 — 파일명 앞의 imgN 순번
  if (/hani_published/.test(asset.path ?? "")) {
    const m = /img(\d+)/.exec(name);
    if (m && index.hani[Number(m[1]) - 1])
      return { url: index.hani[Number(m[1]) - 1] };
  }
  // 4) Mixkit 음악 — 파일명 끝 숫자가 곡 id (`music/preview/…` 는 403 이다)
  const mk = /^mixkit-.*-(\d+)\.mp3$/.exec(name);
  if (mk)
    return { url: `https://assets.mixkit.co/music/${mk[1]}/${mk[1]}.mp3` };
  return { url: null };
}

/** manifest 문서에서 자산 목록을 모은다 — 배열이거나 기존 키들의 합이다. */
export function collectAssets(doc) {
  if (Array.isArray(doc)) return doc;
  if (!doc || typeof doc !== "object") throw new Error("manifest 형식 오류");
  return [
    ...(doc.assets ?? []),
    ...(doc.external_assets ?? []),
    ...(doc.overlay_assets ?? []),
    ...(doc.audio_assets ?? []),
    ...(doc.brief_assets?.free ?? []),
  ];
}

const manifestContexts = new WeakMap();

export function readManifest(root, rel = DEFAULT_MANIFEST) {
  const file = episodePath(root, rel, "manifest 경로");
  if (!existsSync(file)) throw new Error(`manifest 없음: ${rel}`);
  let doc;
  try {
    doc = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    throw new Error(`manifest 읽기 실패: ${rel} — ${e.message}`);
  }
  const assets = collectAssets(doc);
  assets.forEach((a, index) => manifestContexts.set(a, { root, rel, index }));
  return assets;
}

// ── 계획 ────────────────────────────────────────────────────────────────────
export function planAssets({ root, assets, index, force = false }) {
  const downloads = [],
    derived = [],
    unknown = [],
    reused = [],
    refused = [];
  const destinations = new Set();
  for (const a of assets ?? []) {
    if (!a?.path) continue;
    const label = a.id ?? a.path;
    let dst;
    try {
      dst = episodePath(root, a.normalize === false ? (a.original_path ?? a.path) : a.path, `자산 ${label}`);
      if (destinations.has(dst)) throw new Error(`중복 목적지: ${a.path}`);
      destinations.add(dst);
    } catch (e) {
      refused.push({ a, reason: e.message });
      continue;
    }
    if (a.derive?.from && a.derive?.ffmpeg) {
      if (!isDerived(a.path)) {
        refused.push({
          a,
          reason: `파생물은 02_production/ 아래만: ${a.path}`,
        });
        continue;
      }
      let src;
      try {
        src = episodePath(root, a.derive.from, `파생 원본 ${label}`);
      } catch (e) {
        refused.push({ a, reason: e.message });
        continue;
      }
      if (existsSync(dst) && !force) {
        reused.push({ a, dst, reason: "이미 있음" });
        continue;
      }
      derived.push({ a, dst, src });
      continue;
    }
    if (existsSync(dst) && ((a.normalize === false && a.original_path) ||
      (a.normalize !== false && manifestContexts.has(a) && (!a.original_path || a.path === a.original_path) && videoContainer(dst, a)))) {
      downloads.push({ a, dst, root, normalizeOnly: true });
      continue;
    }
    if (existsSync(dst)) {
      reused.push({
        a,
        dst,
        reason: force
          ? "받아 둔 원본 — --force 로도 덮어쓰지 않는다"
          : "이미 있음",
      });
      continue;
    }
    if (a.original_path) {
      try {
        dst = episodePath(root, a.original_path, `원본 ${label}`);
      } catch (error) {
        refused.push({ a, reason: error.message });
        continue;
      }
      if (existsSync(dst)) {
        downloads.push({ a, dst, root, normalizeOnly: true });
        continue;
      }
    }
    const r = resolveUrl(a, index);
    if (r.error) {
      refused.push({ a, reason: r.error });
      continue;
    }
    if (!r.url) {
      unknown.push(a);
      continue;
    }
    downloads.push({ a, dst, url: r.url, root });
  }
  return { downloads, derived, unknown, reused, refused };
}

// ── 다운로드 ────────────────────────────────────────────────────────────────
const looksLikeHtml = (file) => {
  const fd = openSync(file, "r");
  try {
    const buf = Buffer.alloc(256);
    const n = readSync(fd, buf, 0, 256, 0);
    return /^\s*<(!doctype\s+html|html[\s>])/i.test(
      buf.subarray(0, n).toString("utf8"),
    );
  } finally {
    closeSync(fd);
  }
};

export async function downloadOne(
  job,
  { timeoutMs = DEFAULT_TIMEOUT_MS, referer = REFERER, fetchImpl = fetch } = {},
) {
  const part = `${job.dst}.${randomUUID()}.part`;
  try {
    if (job.normalizeOnly) {
      const normalized = await normalizeDownloadedVideo(job, { timeoutMs });
      return { job, ok: true, size: statSync(job.dst).size, ...normalized };
    }
    if (existsSync(job.dst))
      throw new Error("이미 있다 — 원본을 덮어쓰지 않는다");
    mkdirSync(dirname(job.dst), { recursive: true });
    const res = await fetchImpl(job.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": UA, referer },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (!res.body) throw new Error("본문 없음");
    await pipeline(Readable.fromWeb(res.body), createWriteStream(part, { flags: "wx" }));
    const type = res.headers.get("content-type") ?? "";
    if (/^\s*text\/html/i.test(type))
      throw new Error(`HTML 응답(${type.split(";")[0]})`);
    if (looksLikeHtml(part)) throw new Error("HTML 응답(본문)");
    const { size } = statSync(part);
    if (size < MIN_BYTES)
      throw new Error(`${size}바이트 — ${MIN_BYTES}바이트 미만`);
    if (existsSync(job.dst))
      throw new Error("이미 있다 — 원본을 덮어쓰지 않는다");
    linkSync(part, job.dst); // atomic no-clobber across independent workers
    rmSync(part);
    const normalized = await normalizeDownloadedVideo(job, { timeoutMs });
    return { job, ok: true, size, ...normalized };
  } catch (e) {
    rmSync(part, { force: true });
    return {
      job,
      ok: false,
      error:
        e?.name === "TimeoutError" ? "시간 초과" : (e?.message ?? String(e)),
    };
  }
}

/** 워커 `jobs` 개가 같은 큐를 문다 — 진짜로 겹쳐서 받는다. */
export async function downloadAll(downloads, options = {}) {
  const { jobs = DEFAULT_JOBS, onResult = () => {} } = options;
  const results = new Array(downloads.length);
  let next = 0,
    done = 0;
  const worker = async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= downloads.length) return;
      results[i] = await downloadOne(downloads[i], options);
      done += 1;
      onResult(results[i], done, downloads.length);
    }
  };
  const width = Math.max(1, Math.min(jobs, downloads.length));
  await Promise.all(Array.from({ length: width }, worker));
  return results;
}

// Probe actual video containers, rather than treating every downloaded blob as video.
const videoContainer = (file, asset) => {
  if (asset.type === "video" || asset.kind === "video") return true;
  const fd = openSync(file, "r");
  try {
    const head = Buffer.alloc(384);
    readSync(fd, head, 0, head.length, 0);
    return /ftyp|moov|mdat/.test(head.toString("ascii", 4, 8)) ||
      head.readUInt32BE(0) === 0x1a45dfa3 ||
      head.toString("ascii", 8, 12) === "AVI " ||
      head.readUInt32BE(0) === 0x000001ba ||
      (head[0] === 0x47 && head[188] === 0x47 && head[376] === 0x47);
  } finally {
    closeSync(fd);
  }
};

const mediaCommand = (command, args, timeoutMs) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "", stderr = "", timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);
  child.stdout.on("data", (data) => { stdout += data; });
  child.stderr.on("data", (data) => { stderr = (stderr + data).slice(-4096); });
  child.on("error", (error) => { clearTimeout(timer); reject(error); });
  child.on("close", (code) => {
    clearTimeout(timer);
    if (timedOut) reject(new Error("video normalization 시간 초과"));
    else if (code !== 0) reject(new Error(`${command}: ${stderr}`));
    else resolve(stdout);
  });
});

const sha256 = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};

/** Keep the receipt untouched; only publish a complete rendering derivative. */
export async function normalizeDownloadedVideo(job, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { a, dst } = job;
  if (a.normalize === false) {
    if (!a.original_path) return {};
    const originalHash = await sha256(dst);
    return publishMetadata(job, {
      path: a.original_path, sha256: originalHash,
      original_path: a.original_path, original_sha256: originalHash,
    });
  }
  if (!videoContainer(dst, a)) return {};
  const probe = JSON.parse(await mediaCommand(FFPROBE, [
    "-v", "error", "-select_streams", "v:0", "-show_streams", "-of", "json", dst,
  ], timeoutMs));
  const stream = probe.streams?.[0];
  if (!stream) throw new Error("video stream 없음");
  const portrait = stream.height > stream.width;
  const maxWidth = portrait ? 1080 : 1920;
  const maxHeight = portrait ? 1920 : 1080;
  const rate = String(stream.avg_frame_rate).split("/").map(Number);
  const fps = rate[0] / rate[1];
  const oversized = stream.width > maxWidth || stream.height > maxHeight;
  if (!oversized && !(fps > 30)) return {};
  const context = manifestContexts.get(a);
  const root = context?.root ?? job.root;
  if (!root) throw new Error("video normalization 편 root 없음");
  const originalPath = a.original_path ?? a.path;
  const originalHash = await sha256(dst);
  const path = `02_production/external_assets/_normalized/${originalHash}-${a.keep_audio === true ? "audio" : "silent"}-1080.mp4`;
  const output = episodePath(root, path);
  mkdirSync(dirname(output), { recursive: true });
  const part = `${output}.${randomUUID()}.part.mp4`;
  try {
    await mediaCommand(FFMPEG, [
      "-nostdin", "-v", "error", "-n", "-i", dst, "-map", "0:v:0",
      "-vf", `scale=${Math.min(stream.width, maxWidth)}:${Math.min(stream.height, maxHeight)}:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,fps=${fps > 0 ? Math.min(30, fps) : 30}`,
      "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p",
      ...(a.keep_audio === true ? ["-map", "0:a:0?", "-c:a", "aac"] : ["-an"]),
      "-movflags", "+faststart", part,
    ], timeoutMs);
    // A concurrent worker may already have published the identical derivative.
    try { linkSync(part, output); } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  } finally {
    rmSync(part, { force: true });
  }
  const metadata = { path, sha256: await sha256(output), original_path: originalPath, original_sha256: originalHash };
  return publishMetadata(job, metadata);
}

function publishMetadata(job, metadata) {
  const { a } = job;
  const context = manifestContexts.get(a);
  const root = context?.root ?? job.root;
  if (context) {
    const file = episodePath(root, context.rel, "manifest 경로");
    // Re-read synchronously so parallel downloads retain each other's changes.
    const doc = JSON.parse(readFileSync(file, "utf8"));
    const entry = collectAssets(doc)[context.index];
    if (entry?.path !== a.path) throw new Error("manifest 자산이 변경됨");
    Object.assign(entry, metadata);
    const temp = `${file}.${randomUUID()}.part`;
    try {
      writeFileSync(temp, JSON.stringify(doc, null, 2) + "\n", { flag: "wx" });
      renameSync(temp, file);
    } finally { rmSync(temp, { force: true }); }
  }
  Object.assign(a, metadata);
  return metadata;
}
