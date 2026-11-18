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
      textShadow: color.startsWith("#1") ? "0 1px 8px rgba(255,255,255,0.85)" : "0 2px 12px rgba(0,0,0,0.85)",
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

/** 생성 영상 표기(실제 촬영이 아님 — 사용자 addendum-10) */
const AiTag: React.FC<{ o: number; text: string }> = ({ o, text }) => (
  // 상단 출처 표기와 같은 서식(config/attribution-style.json source) — 사용자 addendum-43, 기본 프롬프트 v2-original@10
  <Interactive.Div name={text} style={{ position: "absolute", left: 80, top: 320, width: 620, opacity: o, zIndex: 5, fontFamily: "Pretendard", fontWeight: 500, fontSize: 32, lineHeight: "42px", color: "#B8BEC5", textShadow: "0 1px 3px rgba(0,0,0,.65)" }}>
    {text}
  </Interactive.Div>
);

/** 자료 장면 배경 스타일(사용자 addendum-25 비교용): "black" | "blur" | "grid" | "amber" */
const DATA_BG_STYLE: string = "grid";
const DataBG: React.FC<{ pilot: EditorialPilotData; frame: number; o: number }> = ({ pilot, frame, o }) => {
  if (DATA_BG_STYLE === "blur") {
    return (
      <AbsoluteFill style={{ opacity: o, backgroundColor: "#120804" }}>
        <OffthreadVideo src={pilot.file("editorial/bubbles.mp4")} muted style={{ width: 1080, height: 1920, objectFit: "cover", filter: "blur(26px) brightness(0.42) saturate(1.2)", scale: "1.15" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 700px 900px at 540px 860px, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)" }} />
      </AbsoluteFill>
    );
  }
  if (DATA_BG_STYLE === "grid") {
    return (
      <AbsoluteFill style={{ opacity: o, background: "linear-gradient(180deg, #0c2233 0%, #0f3a4a 55%, #0b2a36 100%)" }}>
        <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(140,220,255,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(140,220,255,0.10) 2px, transparent 2px)", backgroundSize: "60px 60px", backgroundPosition: `0px ${(frame * 0.4) % 60}px` }} />
        <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(140,220,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(140,220,255,0.05) 1px, transparent 1px)", backgroundSize: "15px 15px" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 760px 1000px at 540px 860px, rgba(0,0,0,0) 45%, rgba(0,10,20,0.6) 100%)" }} />
      </AbsoluteFill>
    );
  }
  if (DATA_BG_STYLE === "amber") {
    return (
      <AbsoluteFill style={{ opacity: o, background: "linear-gradient(180deg, #2a1206 0%, #5a2a0e 50%, #3a1806 100%)" }}>
        {Array.from({ length: 40 }, (_, k) => {
          const cyc = ((frame * (0.002 + (k % 5) * 0.0008) + k * 0.137) % 1 + 1) % 1;
          return <div key={k} style={{ position: "absolute", left: (k * 271) % 1080, top: 1920 - cyc * 2000, width: 8 + (k % 4) * 6, height: 8 + (k % 4) * 6, borderRadius: "50%", border: "2px solid rgba(255,214,150,0.35)", backgroundColor: "rgba(255,214,150,0.06)" }} />;
        })}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 760px 1000px at 540px 860px, rgba(0,0,0,0) 45%, rgba(10,4,0,0.6) 100%)" }} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ opacity: o, backgroundColor: BG }} />;
};

/** 치과 느낌 배경(사용자 addendum-38·39): light = 밝은 하늘색-흰색, deep = 같은 계열 짙은 청록(흰 글자용) */
const DentalBG: React.FC<{ o?: number; deep?: boolean }> = ({ o = 1 }) => {
  // 배경 통일(사용자 addendum-46): 과학 모눈
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: o, background: "linear-gradient(180deg, #0c2233 0%, #0f3a4a 55%, #0b2a36 100%)" }}>
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(140,220,255,0.10) 2px, transparent 2px), linear-gradient(90deg, rgba(140,220,255,0.10) 2px, transparent 2px)", backgroundSize: "60px 60px", backgroundPosition: `0px ${(frame * 0.4) % 60}px` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(140,220,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(140,220,255,0.05) 1px, transparent 1px)", backgroundSize: "15px 15px" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 760px 1000px at 540px 860px, rgba(0,0,0,0) 45%, rgba(0,10,20,0.6) 100%)" }} />
    </AbsoluteFill>
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
        <OffthreadVideo src={pilot.file("editorial/hook_macro.mp4")} muted startFrom={35} playbackRate={0.7} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(zoom) }} />
        <AiTag o={1} text="AI 활용 영상" />
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
  const s = interpolate(frame, [tooth.from, tooth.end], [1.0, 1.08], clamp);
  const CS = 1080 / SA.w; // 화면 폭에 맞춘 배율(테두리 없이 꽉 채움)
  const ax = SA.cx * CS, ay = 960 + (SA.cy - SA.h / 2) * CS;
  const lp = eventProgress(frame, lens, "enter");
  const lo = eventOpacity(frame, lens);
  const R = 250 * lp;
  const bx = 540, by = 640;
  return (
    <AbsoluteFill style={{ backgroundColor: BG, opacity: Math.max(teamO, eventOpacity(frame, tooth)) }}>
      <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file("editorial/sample_a.png")} style={{ position: "absolute", left: 0, top: 960 - (SA.h * CS) / 2, width: 1080, height: SA.h * CS, scale: String(s), transformOrigin: `${ax}px ${ay - (960 - (SA.h * CS) / 2)}px`, filter: "contrast(1.05) saturate(1.05)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={lo}>
          <circle cx={ax} cy={ay - 40} r={46} fill="none" stroke={YELLOW} strokeWidth={5} />
          <line x1={ax - 46} y1={ay - 40} x2={bx - R} y2={by} stroke={YELLOW} strokeWidth={3} opacity={0.8} />
          <line x1={ax + 46} y1={ay - 40} x2={bx + R} y2={by} stroke={YELLOW} strokeWidth={3} opacity={0.8} />
        </g>
      </svg>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 24%)" }} />
      {/* 연구진 사진(KAIST 보도자료) + 이름 */}
      <AbsoluteFill style={{ opacity: teamO }}>
        <DentalBG />
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
          <DataBG pilot={pilot} frame={frame} o={1} />
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
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,13,18,0.92) 0%, rgba(11,13,18,0.75) 22%, rgba(11,13,18,0) 34%, rgba(11,13,18,0) 62%, rgba(11,13,18,0.85) 80%)" }} />
        <Interactive.Div name="장비 출처" style={{ position: "absolute", left: 80, top: 320, width: 640, fontFamily: "Pretendard", fontWeight: 500, fontSize: 32, lineHeight: "42px", color: "#B8BEC5", textShadow: "0 1px 6px rgba(0,0,0,0.8)", opacity: interpolate(frame, [inst.from + 4, inst.from + 10], [0, 1], clamp) }}>
          연구 장비 MFP-3D Origin(Asylum Research)<br />사진: 같은 종류 장비, Wikimedia Commons
        </Interactive.Div>
      </AbsoluteFill>
      <KwPop ev={kw} frame={frame} text="AFM 현미경" y={1250} />
    </AbsoluteFill>
  );
};

// ── enamel: 치아 단면 그림에서 바깥층(법랑질)만 스포트라이트
// 3D 단면(사용자 addendum-32): 침 장면과 같은 어금니 입체, 법랑질만 발광
const Tooth3D: React.FC<{ hi: number; pulse: number }> = ({ hi, pulse }) => {
  const g = React.useMemo(() => ({
    base: ext(new THREE.Shape(TOOTH_OUT), DEPTH),
    dentin: ext(new THREE.Shape(DENTIN), DEPTH + 0.02),
    pulp: ext(new THREE.Shape(PULP), DEPTH + 0.04),
    enamel: ext(ENAMEL, DEPTH + 0.03),
  }), []);
  const dimC = (hex: string) => new THREE.Color(hex).lerp(new THREE.Color("#1d2a33"), 0.62 * hi);
  return (
    <group position={[0, 0.3, -DEPTH / 2]}>
      <mesh geometry={g.base}><meshStandardMaterial color={dimC("#d9c49c")} roughness={0.6} /></mesh>
      <mesh geometry={g.dentin} position={[0, 0, -0.01]}><meshStandardMaterial color={dimC("#e2bb84")} roughness={0.7} /></mesh>
      <mesh geometry={g.pulp} position={[0, 0, -0.02]}><meshStandardMaterial color={dimC("#c9504a")} roughness={0.7} /></mesh>
      <mesh geometry={g.enamel} position={[0, 0, -0.015]}>
        <meshStandardMaterial color="#fbfaf6" roughness={0.18} metalness={0.05} emissive="#ffc84a" emissiveIntensity={hi * (0.35 + 0.35 * pulse)} />
      </mesh>
    </group>
  );
};
const Enamel: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const crown = useEvent(t, "enamel", "crown_in");
  const trace = useEvent(t, "enamel", "trace_in");
  const lab = useEvent(t, "enamel", "enamel_label_in");
  const tp = eventProgress(frame, trace, "enter");
  const pulse = 0.5 + 0.5 * Math.sin((frame - trace.from) / 5);
  const rot = interpolate(frame, [crown.from, crown.end], [-0.75, -0.25], clamp);
  return (
    <AbsoluteFill style={{ opacity: eventOpacity(frame, crown) }}>
      <DentalBG />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 520px 620px at 540px 760px, rgba(255,200,90,${0.22 * tp}) 0%, rgba(0,0,0,0) 70%)` }} />
      <div style={{ position: "absolute", left: 0, top: 330, width: 1080, height: 1060 }}>
        <ThreeCanvas width={1080} height={1060} camera={{ fov: 30, near: 0.5, far: 100, position: [0, 1.5, 22] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
          <Rig pos={[Math.sin(rot) * 21, 2.2, Math.cos(rot) * 21]} look={[0, -0.2, 0]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[-6, 8, 10]} intensity={2.2} />
          <directionalLight position={[8, 2, -6]} intensity={0.7} />
          <pointLight position={[-2, 5, 4]} intensity={6 * tp} distance={9} color="#ffd16a" />
          <Tooth3D hi={tp} pulse={pulse} />
        </ThreeCanvas>
      </div>
      <Interactive.Div
        name="법랑질"
        style={{ position: "absolute", left: 60, top: 296, width: 400, textAlign: "left", opacity: eventOpacity(frame, lab), scale: String(interpolate(frame, [lab.from, lab.from + 6, lab.from + 10], [0.7, 1.12, 1], clamp)), fontFamily: "Pretendard", fontWeight: 800, fontSize: 84, color: "#1a1a1a" }}
      >
        <span style={{ backgroundColor: YELLOW, padding: "2px 16px", borderRadius: 10 }}>법랑질</span>
      </Interactive.Div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={200} y1={392} x2={LBL_X} y2={LBL_Y} stroke="#ffffff" strokeWidth={4} opacity={eventOpacity(frame, lab)} />
        <circle cx={LBL_X} cy={LBL_Y} r={7} fill="#ffffff" opacity={eventOpacity(frame, lab)} />
      </svg>
    </AbsoluteFill>
  );
};
const LBL_X = 300, LBL_Y = 470;

// ── 실험 방식 재연(코드 그래픽, 사용자 addendum-36~38): 액체셀 홀더 속 치아 절편에 피펫으로 콜라를 떨어뜨려 덮는다(논문 2.2절·KBS 리포트 참고). 아이소메트릭.
const SLICE = (() => {
  const n = 40, out: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 1.55 + 0.12 * Math.sin(a * 3 + 0.6) + 0.07 * Math.cos(a * 5);
    out.push(new THREE.Vector2(Math.cos(a) * r * 1.15, Math.sin(a) * r * 0.92));
  }
  return out;
})();
const DropIso3D: React.FC<{ p: number; frame: number }> = ({ p, frame }) => {
  const g = React.useMemo(() => {
    const enamel = new THREE.ExtrudeGeometry(new THREE.Shape(SLICE), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 });
    const inner = new THREE.ExtrudeGeometry(new THREE.Shape(SLICE.map((v) => v.clone().multiplyScalar(0.78))), { depth: 0.26, bevelEnabled: false });
    return { enamel, inner };
  }, []);
  // 단계: 0~0.15 피펫 내려옴, 0.15~0.8 방울 반복·고임, 0.8~1 정착
  const down = interpolate(p, [0, 0.15], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fill = interpolate(p, [0.15, 0.8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const tipY = 4.2 - 2.0 * down;
  const poolR = 0.4 + 2.35 * Math.min(1, fill * 1.3);
  const poolH = 0.04 + 0.42 * fill;
  const drops = Array.from({ length: 4 }, (_, k) => {
    const ph = (p - 0.15 - k * 0.15) / 0.12;
    if (ph < 0 || ph > 1) return null;
    return { y: tipY - 0.25 - ph * (tipY - 0.6), s: 1 + 0.5 * ph };
  }).filter(Boolean) as { y: number; s: number }[];
  const surf = React.useMemo(() => new THREE.CircleGeometry(1, 48), []);
  const bubbles = Array.from({ length: 16 }, (_, k) => {
    const a = k * 2.4, r = 0.3 + ((k * 0.37) % 1) * 2.0;
    const cyc = ((frame * (0.02 + (k % 4) * 0.006) + k * 0.31) % 1 + 1) % 1;
    return { x: Math.cos(a) * r * 1.1, z: Math.sin(a) * r * 0.9, y: 0.12 + cyc * poolH, show: r < poolR - 0.1 && fill > 0.25 };
  });
  return (
    <group>
      {/* 액체셀 홀더(회색 원형) */}
      <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[3.2, 3.3, 0.5, 64]} /><meshStandardMaterial color="#9aa3ad" roughness={0.5} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[2.85, 2.85, 0.06, 64]} /><meshStandardMaterial color="#c9d0d7" roughness={0.4} /></mesh>
      <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[3.05, 0.24, 16, 80]} /><meshStandardMaterial color="#8a939d" roughness={0.45} /></mesh>
      {/* 치아 절편: 법랑질 테두리 + 상아질 */}
      <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={g.enamel}><meshStandardMaterial color="#fbf8f1" roughness={0.3} /></mesh>
        <mesh geometry={g.inner}><meshStandardMaterial color="#e3c08a" roughness={0.6} /></mesh>
      </group>
      {/* 고인 콜라 */}
      {fill > 0 ? (
        <>
          <mesh position={[0, 0.06 + poolH / 2, 0]} scale={[poolR * 1.1, 1, poolR * 0.92]}>
            <cylinderGeometry args={[1, 1, poolH, 48]} />
            <meshStandardMaterial color="#5a2408" transparent opacity={0.6} roughness={0.08} metalness={0.15} depthWrite={false} />
          </mesh>
          <mesh geometry={surf} position={[0, 0.07 + poolH + 0.01 * Math.sin(frame / 4), 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[poolR * 1.1, poolR * 0.92, 1]}>
            <meshStandardMaterial color="#7a3410" transparent opacity={0.45} roughness={0.02} metalness={0.4} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      {bubbles.map((b, k) => (b.show ? <mesh key={k} position={[b.x, b.y, b.z]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.8} /></mesh> : null))}
      {/* 피펫 */}
      <group position={[0.2, tipY, 0]}>
        <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.16, 0.16, 2.6, 24]} /><meshStandardMaterial color="#dff2ff" transparent opacity={0.45} roughness={0.05} /></mesh>
        <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.13, 0.13, 1.4, 24]} /><meshStandardMaterial color="#6b2a0c" transparent opacity={0.85 - 0.6 * fill} /></mesh>
        <mesh position={[0, 0.15, 0]}><coneGeometry args={[0.16, 0.5, 24]} /><meshStandardMaterial color="#dff2ff" transparent opacity={0.5} roughness={0.05} /></mesh>
        <mesh position={[0, 3.25, 0]}><sphereGeometry args={[0.32, 24, 24]} /><meshStandardMaterial color="#d24b3c" roughness={0.6} /></mesh>
      </group>
      {drops.map((d, k) => (
        <mesh key={k} position={[0.2, d.y, 0]} scale={[1, d.s, 1]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color="#6b2a0c" roughness={0.1} metalness={0.2} /></mesh>
      ))}
    </group>
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
  // 시계: 눈금 진행에 맞춰 0 → 1 → 3 → 5 → 10분
  const mins = interpolate(tp, [0, 0.25, 0.5, 0.75, 1], [0, 1, 3, 5, 10], clamp);
  const mm = Math.floor(mins), ss = Math.floor((mins - mm) * 60);
  const clockTxt = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  const handA = mins * 36; // 10분에 한 바퀴
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
        <DentalBG />
        <div style={{ position: "absolute", left: 0, top: 420, width: 1080, height: 1100 }}>
          <ThreeCanvas orthographic width={1080} height={1100} camera={{ position: [7, 7, 9], zoom: 118, near: 0.1, far: 100 }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
            <Rig pos={[7, 7, 9]} look={[0, 1.0, 0]} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[-5, 10, 6]} intensity={2.0} />
            <directionalLight position={[6, 4, -5]} intensity={0.6} />
            <DropIso3D p={interpolate(frame, [drop.from, drop.end], [0, 1], clamp)} frame={frame} />
          </ThreeCanvas>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: to }}>
        <div style={{ position: "absolute", left: 230, top: 1170, width: 620, height: 180, borderRadius: 28, backgroundColor: "rgba(8,10,16,0.88)", border: "3px solid rgba(255,209,106,0.6)" }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={340} cy={1260} r={62} fill="none" stroke="#ffffff" strokeWidth={6} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => <line key={k} x1={340 + 52 * Math.sin((k * Math.PI) / 5)} y1={1260 - 52 * Math.cos((k * Math.PI) / 5)} x2={340 + 60 * Math.sin((k * Math.PI) / 5)} y2={1260 - 60 * Math.cos((k * Math.PI) / 5)} stroke="#ffffff" strokeWidth={4} />)}
          <line x1={340} y1={1260} x2={340 + 46 * Math.sin((handA * Math.PI) / 180)} y2={1260 - 46 * Math.cos((handA * Math.PI) / 180)} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" />
          <circle cx={340} cy={1260} r={7} fill={YELLOW} />
        </svg>
        <div style={{ position: "absolute", left: 430, top: 1192, width: 400, textAlign: "center", fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 118, letterSpacing: 6, color: "#7CFFB2", textShadow: "0 0 18px rgba(124,255,178,0.75)" }}>{clockTxt}</div>
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
      <DataBG pilot={pilot} frame={frame} o={Math.max(gO, bO)} />
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
        <div style={{ position: "absolute", left: 0, top: 292, width: 1080, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 62, color: "#ffffff" }}>표면 거칠기</div>
        <div style={{ position: "absolute", left: b1x - 40, top: base - UNIT - 78, width: bw + 80, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 52, color: "#e8eaee" }}>약 {Math.round(20 * interpolate(bp, [0, 0.35], [0, 1], clamp))}nm</div>
        <div style={{ position: "absolute", left: b2x - 40, top: base - h2 - 78, width: bw + 80, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 52, color: YELLOW, opacity: interpolate(bp, [0.3, 0.4], [0, 1], clamp) }}>약 {Math.round(20 + 69 * interpolate(bp, [0.35, 1], [0, 1], easeInOut))}nm</div>
        <Interactive.Div name="약 5배" style={{ position: "absolute", left: b2x + bw / 2 - 300, top: base - h2 - 250, width: 600, textAlign: "center", opacity: eventOpacity(frame, five), scale: String(fivePop), fontFamily: "Pretendard", fontWeight: 900, fontSize: 132, color: YELLOW, textShadow: `${6 * g}px 0 rgba(255,40,80,0.8), ${-6 * g}px 0 rgba(40,220,255,0.8), 0 6px 24px rgba(0,0,0,0.8)` }}>
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
  const cell = 210, gap = 26, x0 = 540 - (4 * cell + 3 * gap) / 2, top = 500;
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
    <AbsoluteFill style={{ opacity: mO }}>
      <DataBG pilot={pilot} frame={frame} o={1} />
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
        <div style={{ position: "absolute", left: gx, top: gy - 70, fontFamily: "Pretendard", fontWeight: 800, fontSize: 54, color: "#ffffff" }}>탄성 계수 <span style={{ fontSize: 40, color: "#cfd3da" }}>(단단한 정도)</span></div>
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
/** 음료 잔 아이콘(상표 없음): 콜라(짙은 갈색+거품), 사이다(투명+기포+레몬 조각), 오렌지주스(불투명 주황+과육+오렌지 조각). 액체 표면이 출렁이고 기포가 올라간다 */
const DrinkGlass: React.FC<{ x: number; y: number; kind: "cola" | "cider" | "oj"; frame: number; id: string }> = ({ x, y, kind, frame, id }) => {
  const W = 160, H = 200;
  const top = 62, bot = 186, lx = 26, rx = 134, blx = 40, brx = 120;
  const wave = (k: number) => 3.5 * Math.sin(frame / 6 + k);
  const surf = `M${lx + 3},${top + wave(0)} Q${W / 2},${top - 7 + wave(1.3)} ${rx - 3},${top + wave(2.1)}`;
  const body = `${surf} L${brx - 2},${bot - 4} Q${W / 2},${bot + 2} ${blx + 2},${bot - 4} Z`;
  const liquid = kind === "cola" ? ["#6b2a0c", "#2a0c03"] : kind === "cider" ? ["rgba(235,250,255,0.55)", "rgba(190,230,245,0.75)"] : ["#ffb43a", "#f07a08"];
  const bubbles = kind === "oj" ? [] : Array.from({ length: kind === "cider" ? 16 : 11 }, (_, k) => {
    const cyc = ((frame * (0.012 + (k % 4) * 0.004) + k * 0.29) % 1 + 1) % 1;
    const bx = blx + 8 + ((k * 37) % (brx - blx - 16)) + 4 * Math.sin(frame / 8 + k);
    return { x: bx, y: bot - 10 - cyc * (bot - top - 16), r: 2 + (k % 3), o: 0.85 * (1 - cyc * 0.5) };
  });
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: x - W / 2, top: y }} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id={`liq-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={liquid[0]} />
          <stop offset="100%" stopColor={liquid[1]} />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="18%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="80%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </linearGradient>
        <clipPath id={`cl-${id}`}><path d={body} /></clipPath>
      </defs>
      {/* 액체 */}
      <path d={body} fill={`url(#liq-${id})`} />
      {kind === "oj" ? Array.from({ length: 14 }, (_, k) => <ellipse key={k} cx={blx + 10 + ((k * 23) % 70)} cy={top + 18 + ((k * 31) % 100)} rx={3} ry={1.4} fill="rgba(255,230,150,0.75)" transform={`rotate(${(k * 47) % 180} ${blx + 10 + ((k * 23) % 70)} ${top + 18 + ((k * 31) % 100)})`} clipPath={`url(#cl-${id})`} />) : null}
      {bubbles.map((b, k) => <circle key={k} cx={b.x} cy={b.y} r={b.r} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={1.2} opacity={b.o} clipPath={`url(#cl-${id})`} />)}
      {/* 표면 하이라이트·거품 */}
      <path d={surf} fill="none" stroke={kind === "oj" ? "#ffd27a" : "rgba(255,255,255,0.85)"} strokeWidth={3} />
      {kind === "cola" ? Array.from({ length: 9 }, (_, k) => <circle key={k} cx={lx + 10 + k * 12} cy={top - 3 + wave(k * 0.7) * 0.6} r={5 + (k % 3)} fill="#e9d2b8" opacity={0.9} />) : null}
      {/* 잔 */}
      <path d={`M${lx - 4},14 L${rx + 4},14 L${brx},${bot + 6} Q${W / 2},${bot + 12} ${blx},${bot + 6} Z`} fill={`url(#glass-${id})`} stroke="#eef1f5" strokeWidth={4} strokeLinejoin="round" />
      <ellipse cx={W / 2} cy={14} rx={(rx - lx) / 2 + 4} ry={6} fill="none" stroke="#eef1f5" strokeWidth={3} />
      <path d={`M${lx + 6},26 L${blx + 8},${bot - 10}`} stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeLinecap="round" />
      {/* 장식: 사이다 레몬, 주스 오렌지 조각 */}
      {kind === "cider" ? (
        <g transform={`translate(${rx - 8}, 20) rotate(20)`}>
          <circle r={20} fill="#f8f3a0" stroke="#d9cf3a" strokeWidth={4} />
          {[0, 1, 2, 3, 4, 5].map((k) => <line key={k} x1={0} y1={0} x2={17 * Math.cos((k * Math.PI) / 3)} y2={17 * Math.sin((k * Math.PI) / 3)} stroke="#e6dc55" strokeWidth={2} />)}
        </g>
      ) : null}
      {kind === "oj" ? (
        <g transform={`translate(${rx - 8}, 20) rotate(20)`}>
          <circle r={20} fill="#ffb347" stroke="#f08a12" strokeWidth={4} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <line key={k} x1={0} y1={0} x2={17 * Math.cos((k * Math.PI) / 4)} y2={17 * Math.sin((k * Math.PI) / 4)} stroke="#ffe0a3" strokeWidth={2} />)}
        </g>
      ) : null}
      {kind === "cola" ? <rect x={W / 2 + 18} y={-2} width={7} height={90} rx={3} fill="#e85a5a" transform={`rotate(12 ${W / 2 + 21} 40)`} /> : null}
    </svg>
  );
};
const Drinks: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const ten = useEvent(t, "drinks", "ten_in");
  const bars = useEvent(t, "drinks", "tenbars_in");
  const cell = 280, gap = 40, x0 = 540 - (3 * cell + 2 * gap) / 2, top = 486;
  const bO = eventOpacity(frame, bars);
  const vals = [98, 95, 73]; // 논문 그래프 10분 값(nm)
  const base = 1110, k = 2.6;
  return (
    <AbsoluteFill style={{ opacity: eventOpacity(frame, ten) }}>
      <DataBG pilot={pilot} frame={frame} o={1} />
      {[0, 1, 2].map((r) => {
        const x = x0 + r * (cell + gap);
        const carbon = r < 2;
        const bp = interpolate(frame, [bars.from + r * 4, bars.settled + r * 4], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
        const hgt = vals[r] * k * bp;
        return (
          <React.Fragment key={r}>
            <Img delayRenderTimeoutInMilliseconds={120000} delayRenderRetries={2} src={pilot.file(`editorial/afm_r${r}c4.png`)} style={{ position: "absolute", left: x, top, width: cell, height: cell, borderRadius: 8 }} />
            <div style={{ position: "absolute", left: x + 55, top: base - hgt, width: cell - 110, height: hgt, borderRadius: "10px 10px 0 0", backgroundColor: carbon ? YELLOW : "#8e94a3", opacity: bO, boxShadow: carbon ? "0 0 30px rgba(255,209,106,0.45)" : undefined }} />
            <DrinkGlass x={x + cell / 2} y={base + 10} kind={(["cola", "cider", "oj"] as const)[r]} frame={frame} id={`g${r}`} />
            <div style={{ position: "absolute", left: x, top: base + 214, width: cell, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 46, color: carbon ? YELLOW : "#e8eaee" }}>{ROWNAMES[r]}</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: 60, top: base, width: 960, height: 4, backgroundColor: "#8a90a0", opacity: bO }} />
      <div style={{ position: "absolute", left: x0, top: 420, width: 3 * cell + 2 * gap, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 44, color: "#e8eaee", opacity: interpolate(frame, [ten.from, ten.settled], [0, 1], clamp) }}>10분</div>
    </AbsoluteFill>
  );
};

// ── 아이소메트릭 3D: 세로로 자른 어금니 입체(법랑질·상아질·치수), 왼쪽 침 없음(표면 패임) / 오른쪽 침 막(방패), 치아 머리 주변 음료
const pts = (a: number[][]) => a.map(([x, y]) => new THREE.Vector2(x, y));
// 치아 바깥 윤곽(왼쪽 아래 목에서 시계방향)
const TOOTH_OUT = pts([[-2.1, 0], [-2.8, 1.2], [-3.0, 2.6], [-2.6, 3.6], [-1.7, 4.15], [-0.8, 3.75], [0, 3.35], [0.8, 3.75], [1.7, 4.15], [2.6, 3.6], [3.0, 2.6], [2.8, 1.2], [2.1, 0], [2.0, -1.6], [1.75, -3.6], [1.35, -4.9], [0.95, -4.9], [0.65, -2.6], [0.35, -1.25], [0, -1.0], [-0.35, -1.25], [-0.65, -2.6], [-0.95, -4.9], [-1.35, -4.9], [-1.75, -3.6], [-2.0, -1.6]]);
// 상아질 윤곽(머리 쪽만 안으로 — 그 바깥 띠가 법랑질)
const DENTIN = pts([[-2.0, 0.1], [-2.25, 1.3], [-2.35, 2.5], [-2.0, 3.15], [-1.4, 3.45], [-0.7, 3.1], [0, 2.8], [0.7, 3.1], [1.4, 3.45], [2.0, 3.15], [2.35, 2.5], [2.25, 1.3], [2.0, 0.1], [1.92, -1.6], [1.68, -3.6], [1.3, -4.82], [1.0, -4.82], [0.7, -2.6], [0.38, -1.3], [0, -1.08], [-0.38, -1.3], [-0.7, -2.6], [-1.0, -4.82], [-1.3, -4.82], [-1.68, -3.6], [-1.92, -1.6]]);
const PULP = pts([[-1.1, 0.6], [-1.35, 1.6], [-1.0, 2.4], [-0.4, 2.0], [0, 1.85], [0.4, 2.0], [1.0, 2.4], [1.35, 1.6], [1.1, 0.6], [1.15, -1.5], [0.95, -3.8], [0.85, -3.8], [0.55, -1.2], [0, -0.55], [-0.55, -1.2], [-0.85, -3.8], [-0.95, -3.8], [-1.15, -1.5]]);
// 법랑질 띠 = 머리 바깥 윤곽(목 위) − 상아질 머리
const ENAMEL = (() => {
  const sh = new THREE.Shape(pts([[-2.1, 0], [-2.8, 1.2], [-3.0, 2.6], [-2.6, 3.6], [-1.7, 4.15], [-0.8, 3.75], [0, 3.35], [0.8, 3.75], [1.7, 4.15], [2.6, 3.6], [3.0, 2.6], [2.8, 1.2], [2.1, 0], [2.0, 0.1], [2.25, 1.3], [2.35, 2.5], [2.0, 3.15], [1.4, 3.45], [0.7, 3.1], [0, 2.8], [-0.7, 3.1], [-1.4, 3.45], [-2.0, 3.15], [-2.35, 2.5], [-2.25, 1.3], [-2.0, 0.1]]));
  return sh;
})();
const SALIVA = (() => new THREE.Shape(pts([[-3.25, 0.9], [-3.3, 2.6], [-2.85, 3.85], [-1.75, 4.5], [-0.8, 4.1], [0, 3.7], [0.8, 4.1], [1.75, 4.5], [2.85, 3.85], [3.3, 2.6], [3.25, 0.9], [2.8, 1.2], [3.0, 2.6], [2.6, 3.6], [1.7, 4.15], [0.8, 3.75], [0, 3.35], [-0.8, 3.75], [-1.7, 4.15], [-2.6, 3.6], [-3.0, 2.6], [-2.8, 1.2]])))();
const DEPTH = 2.2;
const ext = (shape: THREE.Shape, depth: number) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 18 });
const ClipOn: React.FC = () => {
  const { gl } = useThree();
  gl.localClippingEnabled = true;
  return null;
};
const IsoSaliva: React.FC<{ frame: number; amp: number; wrap: number; t0: number; saliva: boolean }> = ({ frame, amp, wrap, t0, saliva }) => {
  const g = React.useMemo(() => ({
    base: ext(new THREE.Shape(TOOTH_OUT), DEPTH),
    dentin: ext(new THREE.Shape(DENTIN), DEPTH + 0.02),
    pulp: ext(new THREE.Shape(PULP), DEPTH + 0.04),
    enamel: ext(ENAMEL, DEPTH + 0.03),
    saliva: ext(SALIVA, DEPTH + 0.3),
  }), []);
  const liq = React.useMemo(() => new THREE.PlaneGeometry(8.6, DEPTH + 1.6, 50, 16), []);
  const lp = liq.attributes.position as THREE.BufferAttribute;
  const ph = (frame - t0) / 9;
  for (let i = 0; i < lp.count; i++) lp.setZ(i, 0.09 * Math.sin(lp.getX(i) * 1.5 + ph) + 0.06 * Math.cos(lp.getY(i) * 2.0 - ph * 1.2));
  lp.needsUpdate = true;
  liq.computeVertexNormals();
  // 침 막: 왼쪽 경계 x=0에서 오른쪽으로 감싼다(클리핑)
  const clipL = React.useMemo(() => new THREE.Plane(new THREE.Vector3(1, 0, 0), 0), []);
  const clipR = React.useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  clipL.constant = 3.5; // 전체 폭
  clipR.constant = -3.5 + 7 * wrap; // 왼→오로 감싼다
  // 왼쪽 머리 윗면의 패임(그림): 시간에 따라 늘어남
  const pitN = Math.round(interpolate(amp, [2, 26], [0, saliva ? 8 : 26], clamp));
  const pits = Array.from({ length: 26 }, (_, k) => {
    const u = (k * 0.6180339) % 1;
    const x = -2.9 + u * 5.8;
    const ax = Math.abs(x);
    const y = ax > 2.6 ? 2.6 + (2.9 - ax) * 3.3 : ax > 1.7 ? 3.6 + (2.6 - ax) * 0.6 : 4.15 - (1.7 - ax) * 0.45;
    return { x, y: y - 0.05, z: 0.25 + ((k * 0.37) % 1) * (DEPTH - 0.5), r: 0.08 + (k % 3) * 0.04 };
  }).slice(0, pitN);
  const bubbles = Array.from({ length: 30 }, (_, k) => {
    const cyc = (((frame - t0) * (0.016 + (k % 5) * 0.004) + k * 0.37) % 1 + 1) % 1;
    return { x: -4 + ((k * 2.93) % 8), z: -0.6 + ((k * 1.37) % (DEPTH + 1.2)), y: 2.3 + cyc * 3.4, r: 0.05 + (k % 3) * 0.025 };
  });
  return (
    <group position={[0, -0.6, -DEPTH / 2]}>
      <ClipOn />
      <mesh geometry={g.base}><meshStandardMaterial color="#d9c49c" roughness={0.6} /></mesh>
      <mesh geometry={g.dentin} position={[0, 0, -0.01]}><meshStandardMaterial color="#dcb98a" roughness={0.75} /></mesh>
      <mesh geometry={g.pulp} position={[0, 0, -0.02]}><meshStandardMaterial color="#c4504a" roughness={0.7} /></mesh>
      <mesh geometry={g.enamel} position={[0, 0, -0.015]}><meshStandardMaterial color="#fbf9f4" roughness={0.25} /></mesh>
      {pits.map((p, k) => (
        <mesh key={k} position={[p.x, p.y, p.z]}><sphereGeometry args={[p.r, 10, 10]} /><meshStandardMaterial color="#8a6a4a" roughness={0.9} /></mesh>
      ))}
      {saliva && wrap > 0.02 ? (
        <>
          {/* 침 막: 밝은 하늘색 + 발광 + 바깥 빛무리(더 돋보이게, 사용자 addendum-22) */}
          <mesh geometry={g.saliva} position={[0, 0, -0.15]}>
            <meshStandardMaterial color="#5fd0ff" transparent opacity={0.82} roughness={0.02} metalness={0.15} emissive="#22b0ff" emissiveIntensity={0.9 + 0.25 * Math.sin((frame - t0) / 5)} clippingPlanes={[clipL, clipR]} />
          </mesh>
          <mesh geometry={g.saliva} position={[0, 0.02, -0.3]} scale={[1.05, 1.04, 1.12]}>
            <meshBasicMaterial color="#9fe6ff" transparent opacity={0.28} depthWrite={false} clippingPlanes={[clipL, clipR]} />
          </mesh>
          {Array.from({ length: 10 }, (_, k) => {
            const u = (k * 0.618 + (frame - t0) * 0.004) % 1;
            const px = -2.9 + u * 5.8;
            const ax = Math.abs(px);
            const py = (ax > 2.6 ? 2.6 + (2.9 - ax) * 3.3 : ax > 1.7 ? 3.6 + (2.6 - ax) * 0.6 : 4.15 - (1.7 - ax) * 0.45) + 0.35;
            const tw = 0.5 + 0.5 * Math.sin((frame - t0) / 4 + k * 1.7);
            return px < -3.5 + 7 * wrap ? (
              <mesh key={k} position={[px, py, 0.2 + ((k * 0.43) % 1) * (DEPTH - 0.2)]}>
                <sphereGeometry args={[0.07 + 0.05 * tw, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.4 + 0.6 * tw} />
              </mesh>
            ) : null;
          })}
        </>
      ) : null}
      {/* 치아 머리 주변 음료 */}
      <mesh position={[0, 3.9, DEPTH / 2]}>
        <boxGeometry args={[8.6, 3.4, DEPTH + 1.6]} />
        <meshStandardMaterial color="#7a3a14" transparent opacity={0.22} roughness={0.1} depthWrite={false} />
      </mesh>
      <mesh geometry={liq} rotation={[-Math.PI / 2, 0, 0]} position={[0, 5.6, DEPTH / 2]}>
        <meshStandardMaterial color="#9a4b1c" transparent opacity={0.45} roughness={0.05} metalness={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {bubbles.map((b, k) => (
        <mesh key={k} position={[b.x, b.y, b.z]}><sphereGeometry args={[b.r, 10, 10]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.75} roughness={0.05} /></mesh>
      ))}
    </group>
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
  const surf = 1150, filmTop = surf - 70 * fp;
  const drinkTag = useEvent(t, "caveat", "drinktag_in");
  const kw = useEvent(t, "caveat", "kw_shield_in");
  const warm = interpolate(frame, [film.from, film.settled], [0, 1], clamp);
  const wrap = interpolate(frame, [film.from + 6, film.settled + 8], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // 왼쪽 표면 거칠기: 도해가 머무는 동안 점점 커진다(그림, 측정값 아님)
  const amp = interpolate(frame, [film.settled, film.to], [2, 26], clamp);
  return (
    <AbsoluteFill>
      <DentalBG deep />
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
        {/* 좌우 분할: 침 없음 | 침 있음 */}
        <div style={{ position: "absolute", left: 0, top: 420, width: 540, height: 960, backgroundColor: "rgba(150,40,40,0.16)" }} />
        <div style={{ position: "absolute", left: 540, top: 420, width: 540, height: 960, backgroundColor: "rgba(60,150,230,0.16)" }} />
        {[false, true].map((sal) => (
          <div key={String(sal)} style={{ position: "absolute", left: sal ? 540 : 0, top: 520, width: 540, height: 880 }}>
            <ThreeCanvas orthographic width={540} height={880} camera={{ position: [6, 5, 10], zoom: 50, near: 0.1, far: 100 }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
              <Rig pos={[6, 5, 10]} look={[0, 0.2, 0]} />
              <ambientLight intensity={1.1} />
              <directionalLight position={[-4, 9, 6]} intensity={2.0} />
              <directionalLight position={[6, 3, -5]} intensity={0.6} />
              <IsoSaliva frame={frame} amp={amp} wrap={wrap} t0={film.from} saliva={sal} />
            </ThreeCanvas>
          </div>
        ))}
        <div style={{ position: "absolute", left: 536, top: 420, width: 8, height: 960, backgroundColor: "#ffffff", boxShadow: "0 0 18px rgba(0,0,0,0.35)" }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          {/* 방패 아이콘 */}
          <g transform={`translate(800, 600) scale(${interpolate(frame, [film.settled, film.settled + 10], [0.4, 1], clamp)})`} opacity={wrap}>
            <path d="M0,-70 L60,-48 L56,18 Q50,62 0,86 Q-50,62 -56,18 L-60,-48 Z" fill="rgba(124,200,255,0.35)" stroke="#e6fbff" strokeWidth={6} />
            <path d="M-22,6 L-6,24 L26,-14" fill="none" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
        <div style={{ position: "absolute", left: 0, top: 440, width: 540, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 50, color: "#e8eaee" }}>침 없음</div>
        <div style={{ position: "absolute", left: 540, top: 440, width: 540, textAlign: "center", fontFamily: "Pretendard", fontWeight: 800, fontSize: 50, color: "#e6fbff" }}>침 있음</div>
        <div style={{ position: "absolute", left: 40, top: 790, fontFamily: "Pretendard", fontWeight: 800, fontSize: 46, color: "#3a332b", backgroundColor: "rgba(255,255,255,0.9)", padding: "2px 14px", borderRadius: 10 }}>법랑질</div>
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <line x1={210} y1={826} x2={305} y2={826} stroke="#ffffff" strokeWidth={4} />
          <circle cx={308} cy={826} r={7} fill="#ffffff" />
          <line x1={915} y1={1020} x2={808} y2={950} stroke="#a9d6ff" strokeWidth={4} opacity={eventOpacity(frame, sal)} />
        </svg>
        <Interactive.Div name="침" style={{ position: "absolute", left: 830, top: filmTop - 130, opacity: eventOpacity(frame, sal), fontFamily: "Pretendard", fontWeight: 900, fontSize: 84, color: "#06283d", backgroundColor: "#7fdcff", padding: "0px 22px", borderRadius: 16, boxShadow: "0 0 30px rgba(95,208,255,0.85)" }}>
          침
        </Interactive.Div>
        <KwPop ev={kw} frame={frame} text="침의 방패" y={318} />
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
        <DataBG pilot={pilot} frame={frame} o={1} />
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
          <OffthreadVideo src={pilot.file("editorial/hook_macro.mp4")} muted startFrom={40} style={{ width: 1080, height: 1920, objectFit: "cover", filter: "brightness(0.85)" }} />
        </Sequence>
        <AiTag o={1} text="AI 활용 영상" />
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
