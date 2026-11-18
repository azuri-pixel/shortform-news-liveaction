import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, Interactive, interpolate, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { ConceptSequence, eventInConcept, eventOpacity, eventProgress } from "../../lib/editorial";
import type { CompiledEvent, EditorialTimeline } from "../../lib/editorial";
import type { EditorialEpisodeProps, EditorialPilotData } from "../pilot";

/**
 * 청량음료와 치아 부식 (한겨레 곽노필, 2020-07-22 / KAIST 홍승범 교수팀).
 * 3D 지형은 KAIST 보도자료 그림 2의 원자간력 현미경(AFM) 실측 이미지를 그 그림의 색 막대(-100~100 nm)로
 * 높이로 역산해 코드로 세운 시각화다(높이 방향 과장, 생성 이미지 아님). 색도 같은 색 막대를 쓴다.
 * 막대그래프는 논문 그래프(Li et al. 2020)의 평균값을 재작도한 것이다. 시간은 timeline 사건에서만 받는다.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeInOut = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) };
const YELLOW = "#FFD16A";
const BG = "#0b0d12";

const useEvent = (timeline: EditorialTimeline, conceptId: string, eventId: string): CompiledEvent => eventInConcept(timeline, conceptId, eventId);

const Label: React.FC<{ name: string; x: number; y: number; opacity: number; size?: number; color?: string; align?: "left" | "center" | "right"; weight?: number; children: React.ReactNode }> = ({ name, x, y, opacity, size = 52, color = "#fff", align = "left", weight = 700, children }) => (
  <Interactive.Div
    name={name}
    style={{
      position: "absolute",
      left: align === "left" ? x : align === "center" ? x - 540 : undefined,
      right: align === "right" ? 1080 - x : undefined,
      top: y,
      width: align === "center" ? 1080 : undefined,
      textAlign: align,
      opacity,
      fontFamily: "Pretendard",
      fontWeight: weight,
      fontSize: size,
      color,
      whiteSpace: "nowrap",
      textShadow: "0 2px 12px rgba(0,0,0,0.85)",
    }}
  >
    {children}
  </Interactive.Div>
);

// ── AFM 높이 아틀라스(3행 × 5열, 타일 96×96, 회색값 0..255 = -100..100 nm)
const N = 96;
type Atlas = { tile: (r: number, c: number) => Float32Array } | null;
const useAtlas = (src: string): Atlas => {
  const [atlas, setAtlas] = React.useState<Atlas>(null);
  const [handle] = React.useState(() => delayRender("afm atlas"));
  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height).data;
      const cache = new Map<string, Float32Array>();
      setAtlas({
        tile: (r, c) => {
          const key = `${r}-${c}`;
          const hit = cache.get(key);
          if (hit) return hit;
          const out = new Float32Array(N * N);
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[y * N + x] = (data[((r * N + y) * img.width + c * N + x) * 4] / 255) * 200 - 100;
          cache.set(key, out);
          return out;
        },
      });
      continueRender(handle);
    };
    img.onerror = () => continueRender(handle);
    img.src = src;
  }, [src, handle]);
  return atlas;
};

// KAIST 그림 2 색 막대(-100 → +100 nm) 표본 9개
const CMAP = ["#1e143e", "#3e1558", "#661e5f", "#8a3954", "#8c4b2c", "#b07f2a", "#beab35", "#c5be58", "#f1f1c3"].map((h) => new THREE.Color(h));
const colorAt = (nm: number, out: THREE.Color) => {
  const t = Math.min(1, Math.max(0, (nm + 100) / 200)) * (CMAP.length - 1);
  const i = Math.min(CMAP.length - 2, Math.floor(t));
  return out.copy(CMAP[i]).lerp(CMAP[i + 1], t - i);
};

const Rig: React.FC<{ pos: [number, number, number]; look: [number, number, number] }> = ({ pos, look }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  camera.lookAt(...look);
  camera.updateProjectionMatrix();
  return null;
};

/** 실측 높이 두 장(a→b)을 mix로 섞어 세운 지형. rise=0이면 평면(색만), 1이면 높이 전체. */
const TerrainMesh: React.FC<{ a: Float32Array; b: Float32Array; mix: number; rise: number; x?: number; rotY?: number; size?: number; amp?: number }> = ({ a, b, mix, rise, x = 0, rotY = 0, size = 10, amp = 1.3 }) => {
  const geo = React.useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, N - 1, N - 1);
    g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(N * N * 3), 3));
    return g;
  }, [size]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const c = new THREE.Color();
  for (let i = 0; i < N * N; i++) {
    const h = a[i] + (b[i] - a[i]) * mix;
    pos.setZ(i, (h / 100) * amp * rise);
    colorAt(h, c);
    col.setXYZ(i, c.r, c.g, c.b);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, rotY]}>
      <meshStandardMaterial vertexColors roughness={0.55} metalness={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Lights: React.FC = () => (
  <>
    <ambientLight intensity={1.15} />
    <directionalLight position={[-6, 10, 6]} intensity={2.2} />
    <directionalLight position={[8, 4, -4]} intensity={0.6} />
  </>
);

/** 5개 시간(0,1,3,5,10분)을 p(0..1)로 이어 보간 */
const STAGES = ["0분", "1분", "3분", "5분", "10분"];
const stageMix = (p: number) => {
  const t = Math.min(0.9999, Math.max(0, p)) * 4;
  const i = Math.floor(t);
  return { i, mix: easeSeg(t - i) };
};
const easeSeg = (u: number) => interpolate(u, [0, 0.25, 0.85, 1], [0, 0, 1, 1], easeInOut);

// ── 공통: 키워드 팝업(말자막 위, 핵심어만 색·크기로 강조 — 사용자 addendum-2 §5)
const KwPop: React.FC<{ ev: CompiledEvent; frame: number; text: string; y?: number }> = ({ ev, frame, text, y = 1268 }) => {
  const o = eventOpacity(frame, ev);
  const pop = interpolate(frame, [ev.from, ev.from + 5, ev.from + 10], [0.6, 1.14, 1], clamp);
  return (
    <Interactive.Div name={`키워드 ${text}`} style={{ position: "absolute", left: 0, top: y, width: 1080, textAlign: "center", opacity: o, scale: String(pop) }}>
      <span style={{ fontFamily: "Pretendard", fontWeight: 800, fontSize: 66, color: "#0b0d12", backgroundColor: YELLOW, padding: "6px 26px", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.55)" }}>{text}</span>
    </Interactive.Div>
  );
};

// 결정론적 의사난수(프레임 고정)
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** 글리치: g(0..1) 세기로 화면 흔들림 + 색 번짐 띠 */
const GlitchBands: React.FC<{ g: number; frame: number }> = ({ g, frame }) => {
  if (g <= 0.01) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 9 }, (_, i) => {
        const y = rnd(frame * 13 + i) * 1920;
        const h = 8 + rnd(frame * 7 + i * 3) * 46;
        const dx = (rnd(frame * 3 + i * 11) - 0.5) * 160 * g;
        const c = i % 3 === 0 ? "rgba(255,40,80,0.45)" : i % 3 === 1 ? "rgba(40,220,255,0.40)" : "rgba(255,209,106,0.35)";
        return <div key={i} style={{ position: "absolute", left: dx, top: y, width: 1080, height: h, backgroundColor: c, mixBlendMode: "screen", opacity: g }} />;
      })}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 6px)", opacity: g }} />
    </AbsoluteFill>
  );
};

/** 경고 톤(차가운 청색·붉은 비네트) — 수치 구간 */
const WarnTone: React.FC<{ o: number }> = ({ o }) => (
  <AbsoluteFill style={{ pointerEvents: "none", opacity: o, background: "radial-gradient(ellipse 760px 1150px at 540px 900px, rgba(0,0,0,0) 55%, rgba(150,20,40,0.38) 100%)" }} />
);

// ── hook: 생성 매크로(콜라에 잠기는 치아, 비유) → 실측 지형 화면 분할(처음 | 처음→10분)
const Hook: React.FC<{ pilot: EditorialPilotData; atlas: Atlas }> = ({ pilot, atlas }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const macro = useEvent(t, "hook", "macro_in");
  const bub = useEvent(t, "hook", "bubbles_in");
  const morph = useEvent(t, "hook", "hook_morph");
  const clock = useEvent(t, "hook", "hook_clock_in");
  const tag = useEvent(t, "hook", "hook_tag_in");
  const p = interpolate(frame, [morph.settled, morph.to - 6], [0, 1], clamp);
  const { i, mix } = stageMix(p);
  const rotY = interpolate(frame, [morph.from, morph.end], [-0.35, 0.2], clamp);
  const o = eventOpacity(frame, morph);
  const stage = mix > 0.5 ? i + 1 : i;
  const enter = eventProgress(frame, morph, "enter");
  const macroO = eventOpacity(frame, macro);
  const zoom = interpolate(frame, [macro.from, macro.end], [1.0, 1.1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ opacity: 0.75 * eventOpacity(frame, bub) }}>
        <OffthreadVideo src={pilot.file("editorial/bubbles.mp4")} muted style={{ width: 1080, height: 1920, objectFit: "cover", filter: "blur(5px) brightness(0.6)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 640px 540px at 540px 660px, rgba(0,0,0,0) 30%, rgba(5,6,10,0.8) 100%)", opacity: o }} />
      {atlas ? (
        <>
          {[0, 1].map((k) => (
            <div key={k} style={{ position: "absolute", left: k * 540, top: 430, width: 540, height: 560, opacity: o, translate: `${(k === 0 ? -1 : 1) * (1 - enter) * 120}px 0px` }}>
              <ThreeCanvas width={540} height={560} camera={{ fov: 36, near: 0.5, far: 100, position: [0, 12, 13] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
                <Rig pos={[0, 13, 13.5]} look={[0, -0.6, 0]} />
                <Lights />
                {k === 0 ? <TerrainMesh a={atlas.tile(0, 0)} b={atlas.tile(0, 0)} mix={0} rise={1} rotY={rotY} amp={1.4} size={8.6} /> : <TerrainMesh a={atlas.tile(0, i)} b={atlas.tile(0, Math.min(4, i + 1))} mix={mix} rise={1} rotY={rotY} amp={1.4} size={8.6} />}
              </ThreeCanvas>
            </div>
          ))}
          <div style={{ position: "absolute", left: 537, top: 470, width: 6, height: 500, backgroundColor: "rgba(255,255,255,0.75)", opacity: o, scale: `1 ${enter}` }} />
        </>
      ) : null}
      <Label name="처음" x={270} y={960} opacity={eventOpacity(frame, clock)} size={60} color="#ffffff" align="center" weight={800}>
        처음
      </Label>
      <Label name="시간 칩" x={810} y={960} opacity={eventOpacity(frame, clock)} size={60} color={stage >= 4 ? YELLOW : "#ffffff"} align="center" weight={800}>
        {STAGES[stage]}
      </Label>
      <Label name="치아 표면" x={540} y={392} opacity={eventOpacity(frame, tag)} size={50} color="#ffffff" align="center" weight={800}>
        치아 표면 · 원자간력 현미경
      </Label>
      <AbsoluteFill style={{ opacity: macroO }}>
        <AbsoluteFill style={{ zIndex: 1, background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 56%, rgba(0,0,0,0.62) 70%, rgba(0,0,0,0) 80%)" }} />
        <OffthreadVideo src={pilot.file("editorial/hook_macro.mp4")} muted startFrom={15} playbackRate={0.95} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(zoom) }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── capture: 연구 시료 치아 → 확대경 속 실측 AFM 이미지
const SA = { w: 260, h: 472, cx: 135, cy: 262 }; // sample_a 크롭에서 치아 머리 표면
const Capture: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const tooth = useEvent(t, "capture", "tooth_in");
  const team = useEvent(t, "capture", "team_in");
  const nH = useEvent(t, "capture", "name_hong_in");
  const nO = useEvent(t, "capture", "name_oh_in");
  const teamO = eventOpacity(frame, team);
  const teamZoom = interpolate(frame, [team.from, team.end], [1.0, 1.06], clamp);
  const lens = useEvent(t, "capture", "lens_in");
  const s = interpolate(frame, [tooth.from, tooth.end], [2.55, 2.75], clamp);
  const ax = 540, ay = 1090;
  const lp = eventProgress(frame, lens, "enter");
  const lo = eventOpacity(frame, lens);
  const R = 250 * lp;
  const bx = 540, by = 640;
  return (
    <AbsoluteFill style={{ backgroundColor: BG, opacity: Math.max(teamO, eventOpacity(frame, tooth)) }}>
      <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/sample_a.png")} style={{ position: "absolute", width: 1080, height: 1920, objectFit: "cover", filter: "blur(30px) brightness(0.5)" }} />
      <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/sample_a.png")} style={{ position: "absolute", left: ax - SA.cx * s, top: ay - SA.cy * s, width: SA.w * s, height: SA.h * s }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={lo}>
          <circle cx={ax} cy={ay - 40} r={46} fill="none" stroke={YELLOW} strokeWidth={5} />
          <line x1={ax - 46} y1={ay - 40} x2={bx - R} y2={by} stroke={YELLOW} strokeWidth={3} opacity={0.8} />
          <line x1={ax + 46} y1={ay - 40} x2={bx + R} y2={by} stroke={YELLOW} strokeWidth={3} opacity={0.8} />
        </g>
      </svg>
      {/* 연구진 사진(KAIST 보도자료) + 이름 */}
      <AbsoluteFill style={{ opacity: teamO, backgroundColor: BG }}>
        <div style={{ position: "absolute", left: 0, top: 420, width: 1080, height: 719, overflow: "hidden" }}>
          <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/team_photo.jpg")} style={{ width: 1080, height: 719, scale: String(teamZoom) }} />
        </div>
        <Label name="홍승범 교수" x={324} y={1160} opacity={eventOpacity(frame, nH)} size={54} color="#ffffff" align="center" weight={800}>
          홍승범 교수
        </Label>
        <Label name="오충익 박사" x={700} y={1160} opacity={eventOpacity(frame, nO)} size={54} color="#ffffff" align="center" weight={800}>
          오충익 박사
        </Label>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={324} y1={1150} x2={324} y2={1110} stroke={YELLOW} strokeWidth={4} opacity={eventOpacity(frame, nH)} />
          <line x1={700} y1={1150} x2={700} y2={1110} stroke={YELLOW} strokeWidth={4} opacity={eventOpacity(frame, nO)} />
        </svg>
      </AbsoluteFill>
      {R > 2 ? (
        <div style={{ position: "absolute", left: bx - R, top: by - R, width: 2 * R, height: 2 * R, borderRadius: "50%", overflow: "hidden", border: `6px solid ${YELLOW}`, opacity: lo, boxShadow: "0 10px 40px rgba(0,0,0,0.6)" }}>
          <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/afm_r0c4.png")} style={{ width: "100%", height: "100%", objectFit: "cover", scale: "1.08" }} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ── afm: 실제 탐침 SEM → 3D 탐침이 실측 지형 위를 롤러코스터처럼 훑으며 한 줄씩 높이를 세운다
const PROBE = { w: 622, h: 472, tipX: 300, tipY: 380 };
/** 줄 단위 공개: revealRow 이하 줄만 높이·색이 생기고 나머지는 회색 평면 */
const ScanTerrain: React.FC<{ h: Float32Array; reveal: number; size: number; amp: number }> = ({ h, reveal, size, amp }) => {
  const geo = React.useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, N - 1, N - 1);
    g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(N * N * 3), 3));
    return g;
  }, [size]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const col = geo.attributes.color as THREE.BufferAttribute;
  const c = new THREE.Color();
  const gray = new THREE.Color("#2c313c");
  for (let r = 0; r < N; r++) {
    const k = Math.min(1, Math.max(0, reveal - r + 1));
    for (let q = 0; q < N; q++) {
      const idx = r * N + q;
      pos.setZ(idx, (h[idx] / 100) * amp * k);
      colorAt(h[idx], c);
      c.lerp(gray, 1 - k);
      col.setXYZ(idx, c.r, c.g, c.b);
    }
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial vertexColors roughness={0.55} metalness={0.05} side={THREE.DoubleSide} />
    </mesh>
  );
};
const Afm: React.FC<{ pilot: EditorialPilotData; atlas: Atlas }> = ({ pilot, atlas }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const probe = useEvent(t, "afm", "probe_in");
  const inst = useEvent(t, "afm", "instrument_in");
  const tip = useEvent(t, "afm", "tip_label_in");
  const scan = useEvent(t, "afm", "scan_in");
  const rise = useEvent(t, "afm", "rise_in");
  const key = useEvent(t, "afm", "height_key_in");
  const kw = useEvent(t, "afm", "kw_afm_in");
  const ps = 1080 / PROBE.w;
  const ptop = 400;
  const tipSX = PROBE.tipX * ps, tipSY = ptop + PROBE.tipY * ps;
  const push = interpolate(frame, [probe.from, probe.end], [1, 1.08], clamp);
  const rideO = Math.max(eventOpacity(frame, scan), eventOpacity(frame, rise));
  // 래스터 주사: scan 시작 ~ rise 정착까지 위 줄부터 아래 줄로, 줄마다 좌↔우 왕복
  const prog = interpolate(frame, [scan.from, rise.settled + 10], [0, 1], clamp);
  const SIZE = 10, AMP = 1.5;
  const reveal = prog * (N + 2);
  const row = Math.min(N - 1, Math.floor(reveal));
  const sweeps = 9;
  const u = (prog * sweeps) % 1;
  const across = Math.floor(prog * sweeps) % 2 === 0 ? u : 1 - u;
  const colI = Math.min(N - 1, Math.round(across * (N - 1)));
  const hAt = atlas ? atlas.tile(0, 3)[row * N + colI] : 0;
  const tx = (colI / (N - 1) - 0.5) * SIZE;
  const tz = -(0.5 - row / (N - 1)) * SIZE;
  const ty = (hAt / 100) * AMP + 0.05;
  const keyO = eventOpacity(frame, key);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, probe), backgroundColor: "#000" }}>
        <div style={{ position: "absolute", left: 0, top: ptop, width: 1080, height: PROBE.h * ps, overflow: "hidden" }}>
          <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/probe_sem.png")} style={{ width: 1080, height: PROBE.h * ps, scale: String(push), transformOrigin: `${tipSX}px ${PROBE.tipY * ps}px` }} />
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g opacity={eventOpacity(frame, tip)}>
            <circle cx={tipSX} cy={tipSY + 14} r={26} fill="none" stroke={YELLOW} strokeWidth={5} />
            <line x1={tipSX - 22} y1={tipSY} x2={tipSX - 150} y2={tipSY - 120} stroke={YELLOW} strokeWidth={4} />
          </g>
        </svg>
        <Label name="탐침" x={tipSX - 160} y={tipSY - 215} opacity={eventOpacity(frame, tip)} size={76} color={YELLOW} align="right" weight={800}>
          탐침
        </Label>
      </AbsoluteFill>
      {atlas ? (
        <AbsoluteFill style={{ opacity: rideO }}>
          <AbsoluteFill style={{ background: "linear-gradient(180deg, #06070b 0%, #121620 100%)" }} />
          <div style={{ position: "absolute", left: 0, top: 380, width: 1080, height: 900 }}>
            <ThreeCanvas width={1080} height={900} camera={{ fov: 34, near: 0.3, far: 100, position: [0, 9, 12] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
              <Rig pos={[tx * 0.2, 14, tz * 0.3 + 11.5]} look={[tx * 0.3, 0, tz * 0.3 - 0.5]} />
              <Lights />
              <ScanTerrain h={atlas.tile(0, 3)} reveal={reveal} size={SIZE} amp={AMP} />
              {/* 탐침: 외팔보 + 뾰족한 끝(그림) */}
              <group position={[tx, ty, tz]}>
                <mesh position={[0, 0.9, 0]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.32, 1.8, 4]} />
                  <meshStandardMaterial color="#d8dce3" metalness={0.75} roughness={0.25} />
                </mesh>
                <mesh position={[-1.4, 1.9, 0]}>
                  <boxGeometry args={[3.2, 0.18, 0.7]} />
                  <meshStandardMaterial color="#b9bec8" metalness={0.7} roughness={0.3} />
                </mesh>
                <pointLight position={[0, 0.3, 0]} intensity={4} distance={2.5} color="#ffd16a" />
              </group>
            </ThreeCanvas>
          </div>
          <div style={{ position: "absolute", left: 80, top: 1180, width: 380, height: 30, borderRadius: 6, opacity: keyO, background: `linear-gradient(90deg, ${CMAP.map((c) => "#" + c.getHexString()).join(",")})`, border: "2px solid rgba(255,255,255,0.6)" }} />
          <div style={{ position: "absolute", left: 80, top: 1216, width: 380, display: "flex", justifyContent: "space-between", fontFamily: "Pretendard", fontWeight: 700, fontSize: 44, color: "#cfd3da", opacity: keyO }}><span>낮음</span><span>높음</span></div>
          <Label name="높이" x={480} y={1160} opacity={keyO} size={64} color={YELLOW} weight={800}>
            높이
          </Label>
        </AbsoluteFill>
      ) : null}
      {/* AFM 장비 사진 → 시료대 쪽으로 확대하며 탐침 사진으로 */}
      <AbsoluteFill style={{ opacity: eventOpacity(frame, inst), backgroundColor: "#0b0d12" }}>
        <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/afm_instrument.jpg")} style={{ position: "absolute", left: 0, top: 260, width: 1080, height: 1620, scale: String(interpolate(frame, [inst.from, inst.end], [1.0, 1.9], { ...clamp, easing: Easing.in(Easing.cubic) })), transformOrigin: "432px 690px" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,13,18,0.9) 0%, rgba(11,13,18,0) 22%, rgba(11,13,18,0) 62%, rgba(11,13,18,0.85) 80%)" }} />
      </AbsoluteFill>
      <KwPop ev={kw} frame={frame} text="AFM 현미경" y={1250} />
    </AbsoluteFill>
  );
};

// ── enamel: 치아 단면 그림에서 바깥층(법랑질)만 스포트라이트
const CROWN = { w: 660, h: 800 };
const Enamel: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const crown = useEvent(t, "enamel", "crown_in");
  const trace = useEvent(t, "enamel", "trace_in");
  const lab = useEvent(t, "enamel", "enamel_label_in");
  const s = 1.22;
  const left = 540 - (CROWN.w * s) / 2, top = 420;
  const tp = eventProgress(frame, trace, "enter");
  const pulse = 0.65 + 0.25 * Math.sin((frame - trace.from) / 5);
  const dim = interpolate(tp, [0, 1], [1, 0.32], clamp);
  const fade = "linear-gradient(90deg, transparent 0%, #000 7%, #000 90%, transparent 100%)";
  const maskUrl = `url(${pilot.file("editorial/enamel_mask.png")})`;
  const sweepX = interpolate(tp, [0, 1], [-30, 130]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0f14", opacity: eventOpacity(frame, crown) }}>
      <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/blausen_crown.png")} style={{ position: "absolute", left, top, width: CROWN.w * s, height: CROWN.h * s, filter: `brightness(${dim})`, maskImage: fade, WebkitMaskImage: fade }} />
      {/* 법랑질만 밝게: 같은 그림을 법랑질 마스크로 오려 원래 밝기로 */}
      <div style={{ position: "absolute", left, top, width: CROWN.w * s, height: CROWN.h * s, maskImage: maskUrl, WebkitMaskImage: maskUrl, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", opacity: tp }}>
        <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/blausen_crown.png")} style={{ width: "100%", height: "100%", filter: "brightness(1.15)" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(100deg, rgba(255,209,106,0) ${sweepX - 25}%, rgba(255,240,190,0.85) ${sweepX}%, rgba(255,209,106,0) ${sweepX + 25}%)` }} />
        <div style={{ position: "absolute", inset: 0, backgroundColor: YELLOW, opacity: 0.28 * pulse, mixBlendMode: "screen" }} />
      </div>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 520px 380px at 540px 640px, rgba(255,230,160,${0.12 * tp}) 0%, rgba(0,0,0,0) 70%)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={250} y1={400} x2={300} y2={560} stroke="#ffffff" strokeWidth={4} opacity={eventOpacity(frame, lab)} />
      </svg>
      <Interactive.Div
        name="법랑질"
        style={{ position: "absolute", left: 70, top: 290, width: 400, textAlign: "left", opacity: eventOpacity(frame, lab), scale: String(interpolate(frame, [lab.from, lab.from + 6, lab.from + 10], [0.7, 1.12, 1], clamp)), fontFamily: "Pretendard", fontWeight: 800, fontSize: 84, color: "#1a1a1a" }}
      >
        <span style={{ backgroundColor: YELLOW, padding: "2px 16px", borderRadius: 10 }}>법랑질</span>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

// ── immersion: 세 음료 실사 세 칸 + 1·3·5·10분 눈금
const Strip: React.FC<{ src: string; x: number; ev: CompiledEvent; frame: number; base?: CompiledEvent }> = ({ src, x, ev, frame, base }) => {
  const p = eventProgress(frame, ev, "enter");
  const o = Math.max(eventOpacity(frame, ev), base ? 0.3 * eventOpacity(frame, base) : 0);
  return (
    <AbsoluteFill style={{ clipPath: `inset(0px ${1080 - x - 360}px 0px ${x}px)`, opacity: o }}>
      <AbsoluteFill style={{ left: x - 360, translate: `0 ${(1 - p) * 120}px` }}>
        <Sequence from={ev.from} layout="none">
          <OffthreadVideo src={src} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const Immersion: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const cola = useEvent(t, "immersion", "cola_in");
  const clear = useEvent(t, "immersion", "clear_in");
  const oj = useEvent(t, "immersion", "oj_in");
  const ticks = useEvent(t, "immersion", "ticks_in");
  const drop = useEvent(t, "immersion", "drop_in");
  const dropO = eventOpacity(frame, drop);
  const tp = eventProgress(frame, ticks, "enter");
  const to = eventOpacity(frame, ticks);
  const marks = [1, 3, 5, 10];
  const bx0 = 110, bx1 = 970, by = 1215;
  const mx = (m: number) => bx0 + ((bx1 - bx0) * m) / 10;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: BG, opacity: eventOpacity(frame, cola) }} />
      <Strip src={pilot.file("editorial/cola_pour.mp4")} x={0} ev={cola} frame={frame} />
      <Strip src={pilot.file("editorial/clear_pour.mp4")} x={360} ev={clear} frame={frame} base={cola} />
      <Strip src={pilot.file("editorial/oj_pour.mp4")} x={720} ev={oj} frame={frame} base={cola} />
      <div style={{ position: "absolute", left: 357, top: 0, width: 6, height: 1920, backgroundColor: BG }} />
      <div style={{ position: "absolute", left: 717, top: 0, width: 6, height: 1920, backgroundColor: BG }} />
      {/* 실험 방식 재연(생성): 스포이트로 치아 절편에 음료를 떨어뜨림 */}
      <AbsoluteFill style={{ opacity: dropO }}>
        <Sequence from={drop.from} layout="none">
          <OffthreadVideo src={pilot.file("editorial/drop_macro.mp4")} muted style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: to }}>
        <div style={{ position: "absolute", left: 40, top: 1110, width: 1000, height: 190, borderRadius: 26, backgroundColor: "rgba(8,10,16,0.82)" }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={bx0} y1={by} x2={bx0 + (bx1 - bx0) * tp} y2={by} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <circle cx={bx0} cy={by} r={9} fill="#fff" />
          {marks.map((m, k) => {
            const on = interpolate(tp, [k / 4, k / 4 + 0.2], [0, 1], clamp);
            return <circle key={m} cx={mx(m)} cy={by} r={16 * on} fill={YELLOW} />;
          })}
        </svg>
        {marks.map((m, k) => (
          <Label key={m} name={`눈금 ${m}`} x={mx(m)} y={1128} opacity={interpolate(tp, [k / 4, k / 4 + 0.2], [0, 1], clamp)} size={50} align="center" weight={800}>
            {m === 10 ? "10분" : `${m}`}
          </Label>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── roughness: 실측 격자(3행×5열) 위 시간 열 강조 → 거칠기 막대(기준 1 → 약 5배)
const ROWNAMES = ["콜라", "사이다", "오렌지주스"];
const GRID = { x0: 262, top: 640, cell: 150, gap: 10 };
const Roughness: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const grid = useEvent(t, "roughness", "grid_in");
  const sweep = useEvent(t, "roughness", "sweep_in");
  const bars = useEvent(t, "roughness", "bars_in");
  const five = useEvent(t, "roughness", "five_in");
  const sp = interpolate(frame, [sweep.from + 6, sweep.settled], [0, 4], easeInOut);
  const gx = (c: number) => GRID.x0 + c * (GRID.cell + GRID.gap);
  const gy = (r: number) => GRID.top + r * (GRID.cell + GRID.gap);
  const gO = eventOpacity(frame, grid);
  // 막대: 논문 그래프 평균(처음 ≈19.7 nm, 10분 ≈88.7 nm) — 비율 4.5
  const UNIT = 130;
  const ratio = 4.5;
  const bp = eventProgress(frame, bars, "enter");
  const bO = eventOpacity(frame, bars);
  const base = 1240;
  const h2 = UNIT * (1 + (ratio - 1) * interpolate(bp, [0.35, 1], [0, 1], easeInOut));
  const b1x = 250, b2x = 600, bw = 230;
  const g = interpolate(frame, [five.from, five.from + 3, five.from + 16], [0, 1, 0], clamp);
  const jx = (rnd(frame * 5) - 0.5) * 40 * g, jy = (rnd(frame * 9) - 0.5) * 24 * g;
  const fivePop = interpolate(frame, [five.from, five.from + 4, five.from + 12], [2.6, 1.25, 1], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: BG, opacity: Math.max(gO, bO) }} />
      <WarnTone o={bO} />
      <AbsoluteFill style={{ opacity: gO }}>
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} key={`${r}${c}`} src={pilot.file(`editorial/afm_r${r}c${c}.png`)} style={{ position: "absolute", left: gx(c), top: gy(r), width: GRID.cell, height: GRID.cell, opacity: 0.45 + 0.55 * interpolate(sp, [c - 0.6, c], [0, 1], clamp) }} />
          )),
        )}
        <div style={{ position: "absolute", left: gx(0) - 8 + (GRID.cell + GRID.gap) * sp, top: GRID.top - 8, width: GRID.cell + 16, height: 3 * GRID.cell + 2 * GRID.gap + 16, border: `6px solid ${YELLOW}`, borderRadius: 12, opacity: eventOpacity(frame, sweep) }} />
        {STAGES.map((s, c) => (
          <div key={s} style={{ position: "absolute", left: gx(c), top: GRID.top - 72, width: GRID.cell, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 44, color: Math.round(sp) === c ? YELLOW : "#e8eaee" }}>
            {s}
          </div>
        ))}
        {ROWNAMES.map((n, r) => (
          <div key={n} style={{ position: "absolute", left: 10, top: gy(r) + GRID.cell / 2 - 28, width: 240, textAlign: "right", fontFamily: "Pretendard", fontWeight: 700, fontSize: 44, color: "#cfd3da" }}>
            {n}
          </div>
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: bO, translate: `${jx}px ${jy}px` }}>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={150} y1={base} x2={930} y2={base} stroke="#8a90a0" strokeWidth={4} />
          <rect x={b1x} y={base - UNIT} width={bw} height={UNIT} rx={8} fill="#c9ccd6" />
          <rect x={b2x} y={base - h2} width={bw} height={h2} rx={8} fill={YELLOW} />
          {/* 처음 막대 높이 단위 눈금(4.5칸) */}
          {[1, 2, 3, 4].map((k) => (base - UNIT * k > base - h2 ? <line key={k} x1={b2x} y1={base - UNIT * k} x2={b2x + bw} y2={base - UNIT * k} stroke="#0b0d12" strokeWidth={3} strokeDasharray="12 10" opacity={0.7} /> : null))}
          <line x1={b1x + bw} y1={base - UNIT} x2={b2x} y2={base - UNIT} stroke="#c9ccd6" strokeWidth={2} strokeDasharray="8 8" />
        </svg>
        <div style={{ position: "absolute", left: b1x, top: base + 18, width: bw, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 48, color: "#e8eaee" }}>처음</div>
        <div style={{ position: "absolute", left: b2x, top: base + 18, width: bw, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 48, color: YELLOW }}>10분 뒤</div>
        <div style={{ position: "absolute", left: b1x, top: base - UNIT - 76, width: bw, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 60, color: "#e8eaee" }}>1</div>
        <Interactive.Div name="약 5배" style={{ position: "absolute", left: b2x + bw / 2 - 300, top: base - h2 - 170, width: 600, textAlign: "center", opacity: eventOpacity(frame, five), scale: String(fivePop), fontFamily: "Pretendard", fontWeight: 900, fontSize: 132, color: YELLOW, textShadow: `${6 * g}px 0 rgba(255,40,80,0.8), ${-6 * g}px 0 rgba(40,220,255,0.8), 0 6px 24px rgba(0,0,0,0.8)` }}>
          약 5배
        </Interactive.Div>
      </AbsoluteFill>
      <GlitchBands g={g} frame={frame} />
    </AbsoluteFill>
  );
};

// ── modulus: 탄성 계수 지도(콜라 0·1·3·5분) → 체력바처럼 깎이는 게이지(처음 100% → 5분 뒤 약 7%, 1/5 선 아래)
const Modulus: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const maps = useEvent(t, "modulus", "mod_in");
  const bars = useEvent(t, "modulus", "modbars_in");
  const fifth = useEvent(t, "modulus", "fifth_in");
  const kw = useEvent(t, "modulus", "kw_mod_in");
  const mO = eventOpacity(frame, maps);
  const reveal = interpolate(frame, [maps.from, maps.settled], [0, 4], clamp);
  const cell = 210, gap = 26, x0 = 540 - (4 * cell + 3 * gap) / 2, top = 450;
  // 논문 그래프 평균: 처음 ≈103 GPa, 5분 ≈7 GPa → 남은 비율 0.068
  const bp = eventProgress(frame, bars, "enter");
  const v = interpolate(bp, [0, 1], [1, 7 / 103], { ...clamp, easing: Easing.bezier(0.7, 0, 0.3, 1) });
  const gx = 110, gw = 860, gy = 900, gh = 96;
  const col = v > 0.5 ? "#4ade80" : v > 0.2 ? "#facc15" : "#ef4444";
  const lost = Math.max(0, (bp > 0 && bp < 1 ? 1 : 0));
  const shake = bp > 0.6 && bp < 1 ? (rnd(frame) - 0.5) * 14 : 0;
  const fO = eventOpacity(frame, fifth);
  const gaugeO = interpolate(frame, [maps.settled, maps.settled + 10], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: BG, opacity: mO }}>
      <WarnTone o={interpolate(bp, [0.4, 1], [0, 1], clamp)} />
      {[0, 1, 2, 3].map((c) => (
        <React.Fragment key={c}>
          <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file(`editorial/mod_r0c${c}.png`)} style={{ position: "absolute", left: x0 + c * (cell + gap), top, width: cell, height: cell, imageRendering: "pixelated", opacity: interpolate(reveal, [c, c + 0.6], [0, 1], clamp), borderRadius: 6 }} />
          <div style={{ position: "absolute", left: x0 + c * (cell + gap), top: top - 64, width: cell, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 44, color: c === 3 ? YELLOW : "#e8eaee", opacity: interpolate(reveal, [c, c + 0.6], [0, 1], clamp) }}>
            {STAGES[c]}
          </div>
        </React.Fragment>
      ))}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: gaugeO, translate: `${shake}px 0px` }}>
        <div style={{ position: "absolute", left: gx, top: gy - 70, fontFamily: "Pretendard", fontWeight: 800, fontSize: 50, color: "#e8eaee" }}>단단함</div>
        <div style={{ position: "absolute", left: gx - 6, top: gy - 6, width: gw + 12, height: gh + 12, borderRadius: 18, backgroundColor: "#1d2230", border: "4px solid #e8eaee" }} />
        {/* 깎여 나간 부분 잔상(빨강) */}
        <div style={{ position: "absolute", left: gx + gw * v, top: gy, width: gw * (1 - v) * (1 - bp) , height: gh, backgroundColor: "rgba(239,68,68,0.6)", opacity: lost }} />
        <div style={{ position: "absolute", left: gx, top: gy, width: gw * v, height: gh, borderRadius: 12, background: `linear-gradient(180deg, ${col} 0%, ${col} 55%, rgba(0,0,0,0.25) 100%)` }} />
        {[0.25, 0.5, 0.75].map((k) => <div key={k} style={{ position: "absolute", left: gx + gw * k, top: gy, width: 3, height: gh, backgroundColor: "rgba(13,15,20,0.45)" }} />)}
        <div style={{ position: "absolute", left: gx + gw / 5 - 3, top: gy - 26, width: 6, height: gh + 52, backgroundColor: "#ffffff", opacity: fO }} />
        <Label name="1/5 선" x={gx + gw / 5} y={gy + gh + 30} opacity={fO} size={48} color="#ffffff" align="center" weight={800}>
          1/5 선
        </Label>
        <div style={{ position: "absolute", left: gx + gw - 260, top: gy - 70, width: 260, textAlign: "right", fontFamily: "Pretendard", fontWeight: 800, fontSize: 50, color: bp > 0.5 ? "#ef4444" : "#4ade80" }}>{bp > 0.5 ? "5분 뒤" : "처음"}</div>
      </div>
      <KwPop ev={kw} frame={frame} text="탄성계수 1/5 이하" y={1250} />
    </AbsoluteFill>
  );
};

// ── drinks: 세 음료 10분 실측 표면 + 컵 아이콘 막대(10분 거칠기, 콜라·사이다 강조)
const Cup: React.FC<{ x: number; y: number; fill: string }> = ({ x, y, fill }) => (
  <svg width={110} height={120} style={{ position: "absolute", left: x - 55, top: y }} viewBox="0 0 110 120">
    <path d="M18 8 L92 8 L82 112 L28 112 Z" fill="rgba(255,255,255,0.10)" stroke="#e8eaee" strokeWidth={5} strokeLinejoin="round" />
    <path d="M23 40 L87 40 L82 108 L28 108 Z" fill={fill} />
    <circle cx={45} cy={70} r={4} fill="rgba(255,255,255,0.7)" />
    <circle cx={63} cy={86} r={3} fill="rgba(255,255,255,0.6)" />
    <circle cx={55} cy={56} r={3} fill="rgba(255,255,255,0.6)" />
  </svg>
);
const Drinks: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const ten = useEvent(t, "drinks", "ten_in");
  const bars = useEvent(t, "drinks", "tenbars_in");
  const cell = 280, gap = 40, x0 = 540 - (3 * cell + 2 * gap) / 2, top = 410;
  const bO = eventOpacity(frame, bars);
  const vals = [98, 95, 73]; // 논문 그래프 10분 값(nm)
  const base = 1120, k = 3.0;
  const fills = ["#5a2a14", "rgba(220,235,245,0.75)", "#f59e0b"];
  return (
    <AbsoluteFill style={{ backgroundColor: BG, opacity: eventOpacity(frame, ten) }}>
      {[0, 1, 2].map((r) => {
        const x = x0 + r * (cell + gap);
        const carbon = r < 2;
        const bp = interpolate(frame, [bars.from + r * 4, bars.settled + r * 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
        const hgt = vals[r] * k * bp;
        return (
          <React.Fragment key={r}>
            <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file(`editorial/afm_r${r}c4.png`)} style={{ position: "absolute", left: x, top, width: cell, height: cell, borderRadius: 8 }} />
            <div style={{ position: "absolute", left: x + 55, top: base - hgt, width: cell - 110, height: hgt, borderRadius: "10px 10px 0 0", backgroundColor: carbon ? YELLOW : "#8e94a3", opacity: bO, boxShadow: carbon ? "0 0 30px rgba(255,209,106,0.45)" : undefined }} />
            <Cup x={x + cell / 2} y={base + 14} fill={fills[r]} />
            <div style={{ position: "absolute", left: x, top: base + 140, width: cell, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 46, color: carbon ? YELLOW : "#e8eaee" }}>{ROWNAMES[r]}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 60, top: base, width: 960, height: 4, backgroundColor: "#8a90a0", opacity: bO }} />
      <div style={{ position: "absolute", left: x0, top: 320, width: 3 * cell + 2 * gap, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 44, color: "#e8eaee", opacity: interpolate(frame, [ten.from, ten.settled], [0, 1], clamp) }}>10분</div>
    </AbsoluteFill>
  );
};

// ── caveat: (강조 문구 구간) → 시료 사진 순서 → 침 막 도해
const Caveat: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const steps = useEvent(t, "caveat", "steps_in");
  const nos = useEvent(t, "caveat", "nosaliva_in");
  const film = useEvent(t, "caveat", "film_in");
  const sal = useEvent(t, "caveat", "saliva_label_in");
  const sO = eventOpacity(frame, steps);
  // a(통째) → b(절편) → c(고정 틀): 단어 '잘라'·'조각을'·'침'에 맞춰 바뀐다
  const ph = interpolate(frame, [steps.from, steps.settled, steps.settled + 8, nos.from - 6, nos.from + 4], [0, 0, 1, 1, 2], clamp);
  const imgs = [
    { f: "sample_a.png", w: 260 },
    { f: "sample_b.png", w: 218 },
    { f: "sample_c.png", w: 493 },
  ];
  const H = 780;
  const fp = eventProgress(frame, film, "enter");
  const fO = eventOpacity(frame, film);
  const cut = interpolate(frame, [steps.from, steps.settled], [0, 1], clamp);
  // 산 입자: 결정론적 위치
  const drops = Array.from({ length: 26 }, (_, i) => ({ x: 50 + ((i * 397) % 980), d: (i * 53) % 90 }));
  const surf = 1150, filmTop = surf - 70 * fp;
  const drinkTag = useEvent(t, "caveat", "drinktag_in");
  const kw = useEvent(t, "caveat", "kw_shield_in");
  const warm = interpolate(frame, [film.from, film.settled], [0, 1], clamp);
  const wrap = interpolate(frame, [film.from + 6, film.settled + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const glint = ((frame - film.from) % 45) / 45;
  // 왼쪽 표면 거칠기: 도해가 머무는 동안 점점 커진다(그림, 측정값 아님)
  const amp = interpolate(frame, [film.settled, film.to], [2, 26], clamp);
  const pts: string[] = [];
  for (let x = 0; x <= 535; x += 15) pts.push(`${x},${surf + amp * (Math.sin(x * 0.11) * 0.6 + Math.sin(x * 0.047 + 1.3) * 0.4) + amp}`);
  const roughPath = `M0,${surf + 240} L${pts.join(" L")} L535,${surf + 240} Z`;
  const amp2 = amp * 0.35;
  const pts2: string[] = [];
  for (let x = 545; x <= 1080; x += 15) pts2.push(`${x},${surf + amp2 * (Math.sin(x * 0.11) * 0.6 + Math.sin(x * 0.047 + 1.3) * 0.4) + amp2}`);
  const roughPath2 = `M545,${surf + 240} L${pts2.join(" L")} L1080,${surf + 240} Z`;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ opacity: sO }}>
        {imgs.map((im, k) => {
          const o = k === 0 ? interpolate(ph, [0.4, 0.6], [1, 0], clamp) : k === 1 ? interpolate(ph, [0.4, 0.6, 1.4, 1.6], [0, 1, 1, 0], clamp) : interpolate(ph, [1.4, 1.6], [0, 1], clamp);
          const w = (im.w * H) / 472;
          return <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} key={im.f} src={pilot.file(`editorial/${im.f}`)} style={{ position: "absolute", left: 540 - w / 2, top: 420, width: w, height: H, opacity: o, borderRadius: 12 }} />;
        })}
        {/* (a) 위 자르는 선 강조 */}
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: interpolate(ph, [0, 0.2, 0.6, 0.9], [0, 1, 1, 0], clamp) }}>
          <line x1={540 - 200} y1={420 + 0.495 * H} x2={540 - 200 + 400 * cut} y2={420 + 0.495 * H} stroke={YELLOW} strokeWidth={6} />
          <line x1={540 - 200} y1={420 + 0.54 * H} x2={540 - 200 + 400 * cut} y2={420 + 0.54 * H} stroke={YELLOW} strokeWidth={6} />
        </svg>
        <div style={{ position: "absolute", left: 540 - 260, top: 1225, width: 520, textAlign: "center", opacity: eventOpacity(frame, nos) }}>
          <span style={{ fontFamily: "Pretendard", fontWeight: 800, fontSize: 56, color: "#0b0d12", backgroundColor: "#ffffff", padding: "8px 26px", borderRadius: 40 }}>침 없는 실험실</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: fO }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #0d1018 0%, #141a26 60%, #1a1410 100%)" }} />
        {/* 톤 전환: 경고색 → 따뜻한 민트·파스텔 */}
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #2f5d50 0%, #6fa58c 55%, #e9d9b8 100%)", opacity: 0.85 * warm }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {/* 왼쪽: 침 없음 — 표면이 점점 거칠어진다 / 오른쪽: 침 막 — 입자가 막에서 멈추고 표면은 매끈 */}
          <path d={roughPath} fill="#ece8e0" />
          <path d={roughPath2} fill="#ece8e0" />
          <rect x={0} y={surf + 230} width={1080} height={120} fill="#d8b98e" opacity={0.9} />
          {/* 침 막: 왼→오로 표면을 싹 감싸며 반짝임 */}
          <defs>
            <linearGradient id="filmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e6fbff" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#7cc8ff" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <path d={`M545,${surf} L545,${filmTop + 14} Q${545 + 535 * wrap * 0.5},${filmTop - 18} ${545 + 535 * wrap},${filmTop + 14} L${545 + 535 * wrap},${surf} Z`} fill="url(#filmGrad)" opacity={0.75} />
          <path d={`M545,${filmTop + 14} Q${545 + 535 * wrap * 0.5},${filmTop - 18} ${545 + 535 * wrap},${filmTop + 14}`} fill="none" stroke="#ffffff" strokeWidth={5} opacity={fp} />
          <rect x={545 + 535 * glint - 40} y={filmTop - 10} width={80} height={surf - filmTop + 10} fill="#ffffff" opacity={0.35 * wrap} />
          {/* 방패 아이콘 */}
          <g transform={`translate(810, ${filmTop - 300}) scale(${interpolate(frame, [film.settled, film.settled + 10], [0.4, 1], clamp)})`} opacity={wrap}>
            <path d="M0,-70 L60,-48 L56,18 Q50,62 0,86 Q-50,62 -56,18 L-60,-48 Z" fill="rgba(124,200,255,0.35)" stroke="#e6fbff" strokeWidth={6} />
            <path d="M-22,6 L-6,24 L26,-14" fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <line x1={540} y1={520} x2={540} y2={surf + 350} stroke="#ffffff" strokeWidth={3} strokeDasharray="14 12" opacity={0.6} />
          {drops.map((d, i) => {
            const right = d.x > 545;
            const fall = ((frame - film.from + d.d * 2) % 70) / 70;
            const pass = right && i % 4 === 0; // 일부는 막을 지나 표면에 닿는다
            const stopY = right && !pass ? filmTop - 8 : surf - 4;
            const y = 520 + (stopY - 520) * Math.min(1, fall * 1.15);
            const landed = fall * 1.15 >= 1;
            const op = landed ? (right ? 0.35 : 0.15) : 0.95;
            return <circle key={i} cx={d.x} cy={y} r={12} fill={i % 3 === 2 ? "#f2a33a" : "#a0522d"} opacity={op} />;
          })}
        </svg>
        <div style={{ position: "absolute", left: 0, top: 440, width: 540, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 50, color: "#e8eaee" }}>침 없음</div>
        <div style={{ position: "absolute", left: 540, top: 440, width: 540, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 50, color: "#e6fbff" }}>침 있음</div>
        <div style={{ position: "absolute", left: 40, top: surf + 90, fontFamily: "Pretendard", fontWeight: 700, fontSize: 46, color: "#3a332b" }}>법랑질</div>
        <Label name="침" x={990} y={filmTop - 110} opacity={eventOpacity(frame, sal)} size={80} color="#a9d6ff" align="right" weight={800}>
          침
        </Label>
        <KwPop ev={kw} frame={frame} text="침의 방패" y={980} />
        <Interactive.Div name="음료" style={{ position: "absolute", left: 50, top: 540, opacity: eventOpacity(frame, drinkTag), zIndex: 2, fontFamily: "Pretendard", fontWeight: 800, fontSize: 56, color: "#f2a33a", backgroundColor: "rgba(13,16,24,0.92)", padding: "2px 16px", borderRadius: 12 }}>
          음료
        </Interactive.Div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── close: 처음·10분 지형 나란히 + nm 눈금 → 기포 실사
const Close: React.FC<{ pilot: EditorialPilotData; atlas: Atlas }> = ({ pilot, atlas }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const pair = useEvent(t, "close", "pair_in");
  const nm = useEvent(t, "close", "nm_in");
  const bub = useEvent(t, "close", "closebub_in");
  const rot = interpolate(frame, [pair.from, pair.end], [-0.35, 0.35], clamp);
  const nO = eventOpacity(frame, nm);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: BG, opacity: Math.max(eventOpacity(frame, pair), eventOpacity(frame, bub)) }} />
      <AbsoluteFill style={{ opacity: eventOpacity(frame, pair) }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #06070b 0%, #121620 100%)" }} />
        {atlas ? (
          <>
            <div style={{ position: "absolute", left: 0, top: 380, width: 1080, height: 460 }}>
              <ThreeCanvas width={1080} height={460} camera={{ fov: 30, near: 0.5, far: 100, position: [0, 8, 12] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
                <Rig pos={[0, 11, 15.5]} look={[0, -0.3, 0]} />
                <Lights />
                <TerrainMesh a={atlas.tile(0, 0)} b={atlas.tile(0, 0)} mix={0} rise={1} rotY={rot} amp={1.5} size={9} />
              </ThreeCanvas>
            </div>
            <div style={{ position: "absolute", left: -60, top: 860, width: 1080, height: 460 }}>
              <ThreeCanvas width={1080} height={460} camera={{ fov: 30, near: 0.5, far: 100, position: [0, 8, 12] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
                <Rig pos={[0, 11, 15.5]} look={[0, -0.3, 0]} />
                <Lights />
                <TerrainMesh a={atlas.tile(0, 4)} b={atlas.tile(0, 4)} mix={0} rise={1} rotY={rot} amp={1.5} size={9} />
              </ThreeCanvas>
            </div>
          </>
        ) : null}
        <div style={{ position: "absolute", left: 70, top: 410, fontFamily: "Pretendard", fontWeight: 800, fontSize: 52, color: "#e8eaee" }}>처음</div>
        <div style={{ position: "absolute", left: 70, top: 890, fontFamily: "Pretendard", fontWeight: 800, fontSize: 52, color: YELLOW }}>10분</div>
        {/* nm 눈금: 색 막대 기준 ±100 nm */}
        <div style={{ position: "absolute", left: 990, top: 900, width: 30, height: 300, borderRadius: 6, opacity: nO, background: `linear-gradient(0deg, ${CMAP.map((c) => "#" + c.getHexString()).join(",")})`, border: "2px solid rgba(255,255,255,0.6)" }} />
        <Label name="+100 nm" x={975} y={880} opacity={nO} size={44} color={YELLOW} align="right" weight={800}>
          +100 nm
        </Label>
        <Label name="-100 nm" x={975} y={1160} opacity={nO} size={44} color={YELLOW} align="right" weight={800}>
          −100 nm
        </Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, bub) }}>
        <Sequence from={bub.from} layout="none">
          <OffthreadVideo src={pilot.file("editorial/bubbles.mp4")} muted style={{ width: 1080, height: 1920, objectFit: "cover", filter: "brightness(0.8)" }} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const EditorialEpisode: React.FC<EditorialEpisodeProps> = ({ pilot }) => {
  const atlas = useAtlas(pilot.file("editorial/afm_height_atlas.png"));
  const scenes: Record<string, React.ReactNode> = {
    hook: <Hook pilot={pilot} atlas={atlas} />,
    capture: <Capture pilot={pilot} />,
    afm: <Afm pilot={pilot} atlas={atlas} />,
    enamel: <Enamel pilot={pilot} />,
    immersion: <Immersion pilot={pilot} />,
    roughness: <Roughness pilot={pilot} />,
    modulus: <Modulus pilot={pilot} />,
    drinks: <Drinks pilot={pilot} />,
    caveat: <Caveat pilot={pilot} />,
    close: <Close pilot={pilot} atlas={atlas} />,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {pilot.timeline.concepts.map((concept) => (
        <ConceptSequence key={concept.id} timeline={pilot.timeline} conceptId={concept.id}>
          {scenes[concept.id] ?? null}
        </ConceptSequence>
      ))}
    </AbsoluteFill>
  );
};
