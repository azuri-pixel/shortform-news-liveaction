import React from "react";
import { AbsoluteFill, Easing, Img, Interactive, interpolate, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { ConceptSequence, eventInConcept, eventOpacity, eventProgress } from "../../lib/editorial";
import type { CompiledEvent, EditorialTimeline } from "../../lib/editorial";
import type { EditorialEpisodeProps, EditorialPilotData } from "../pilot";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";

/**
 * 코골이 = 클라리넷 리드 같은 연구개 떨림 (한겨레 곽노필, 2026-09-09).
 * 실사: 침실(Mixkit), 클라리넷 연주(미 해군 밴드, 공공저작물). 해부도: Patrick J. Lynch(CC BY 2.5).
 * 관+판 모델은 논문(Li et al., Physics of Fluids 2026, CC BY 4.0)의 '곧은 관 속 판' 구조를 코드로 재작도한 설명도다.
 * 판의 떨림 속도·휨 크기는 보이게 과장한 그림이며 측정값이 아니다(진동 폭 수치는 c_numbers 눈금에만 쓴다).
 * 깃발은 Higgsfield 생성(비유). 리드 사진은 あにやら(CC BY 4.0), 상표 각인은 흐리게 처리했다.
 * 시간은 timeline 사건에서만 받는다.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YELLOW = "#FFD16A";
const PINK = "#F29AA8";
const AIR = "#8FD3FF";
const BG = "#070B12";
const ACCENT = "#4EA8DE"; // 핵심 키워드 포인트 색(사용자 지정, addendum-18)

const ev = (t: EditorialTimeline, c: string, e: string): CompiledEvent => eventInConcept(t, c, e);
/** 전역 프레임 기준 사건(개념 밖 공용 층에서 사용) */
const gev = (t: EditorialTimeline, id: string): CompiledEvent => {
  const e = t.events.find((x) => x.id === id);
  if (!e) throw new Error(`event ${id}`);
  return e;
};
const concept = (t: EditorialTimeline, id: string) => {
  const c = t.concepts.find((x) => x.id === id);
  if (!c) throw new Error(`concept ${id}`);
  return c;
};

const Label: React.FC<{ name: string; x: number; y: number; opacity: number; size?: number; color?: string; align?: "left" | "center" | "right"; bg?: boolean; pill?: boolean; weight?: number; children: React.ReactNode }> = ({ name, x, y, opacity, size = 48, color = "#fff", align = "center", bg = false, pill = false, weight = 800, children }) => (
  <Interactive.Div
    name={name}
    style={{
      position: "absolute",
      left: x,
      top: y,
      translate: align === "center" ? "-50% -50%" : align === "right" ? "-100% -50%" : "0 -50%",
      opacity,
      fontFamily: "Pretendard",
      fontWeight: weight,
      fontSize: size,
      color,
      whiteSpace: "nowrap",
      textShadow: "0 2px 12px rgba(0,0,0,0.9)",
      backgroundColor: pill ? "rgba(6,10,18,0.8)" : bg ? "rgba(6,10,18,0.72)" : undefined,
      padding: pill ? "8px 30px" : bg ? "8px 22px" : undefined,
      borderRadius: pill ? 999 : bg ? 12 : undefined,
      border: pill ? "1.5px solid rgba(255,255,255,0.14)" : undefined,
      boxShadow: pill ? "0 4px 18px rgba(0,0,0,0.45)" : undefined,
    }}
  >
    {children}
  </Interactive.Div>
);

const Video: React.FC<{ pilot: EditorialPilotData; file: string; ev: CompiledEvent; startFrom?: number; rate?: number; style?: React.CSSProperties }> = ({ pilot, file, ev: e, startFrom = 0, rate = 1, style }) => (
  <Sequence from={e.from} durationInFrames={Math.max(1, e.end - e.from)} layout="none">
    <OffthreadVideo src={pilot.file(file)} muted startFrom={startFrom} playbackRate={rate} style={{ width: 1080, height: 1920, objectFit: "cover", ...style }} />
  </Sequence>
);

// ── 관+판 모델 그림 ────────────────────────────────────────────────
// 관 좌표계: 관 길이 900 × 안지름 280, 판은 왼쪽 벽쪽에서 시작해 관 가운데에 놓인다(논문 Fig.1 구조).
const TUBE_W = 900;
// 깃발·리드 좌우 비교 칸
const SPLIT_CY = 860;
const PANEL_W = 500;
const PANEL_H = 760;
const RPX = 560;
const RS = 0.7; // 리드 사진 배율
const TUBE_H = 280;
const PLATE_X0 = 150;
const PLATE_L = 300;

/** 판 끝의 세로 변위(px). 시각용 과장값 */
const plateTip = (frame: number, amp: number, bend: number) => bend + amp * Math.sin((frame / 30) * Math.PI * 2 * 2.2);

const platePath = (tip: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const x = PLATE_X0 + PLATE_L * u;
    const y = TUBE_H / 2 + tip * u * u;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts;
};

/** 흐름선: 판 근처에서 판 모양을 따라 휜다(flowBend 0~1) */
const streamPath = (row: number, tip: number, flowBend: number) => {
  const y0 = 30 + row * ((TUBE_H - 60) / 6);
  const near = 1 - Math.min(1, Math.abs(y0 - TUBE_H / 2) / (TUBE_H / 2));
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = (TUBE_W * i) / 40;
    let dy = 0;
    if (x > PLATE_X0) {
      const u = Math.min(1, (x - PLATE_X0) / PLATE_L);
      const after = x > PLATE_X0 + PLATE_L ? Math.exp(-(x - PLATE_X0 - PLATE_L) / 180) : 1;
      dy = tip * u * u * after * near * flowBend * 0.9;
    }
    pts.push(`${x.toFixed(1)},${(y0 + dy).toFixed(1)}`);
  }
  return `M${pts.join(" L")}`;
};

const TubeModel: React.FC<{
  frame: number;
  tip: number;
  flowOpacity: number;
  flowBend: number;
  plateGlow?: number;
  envelope?: number;
  envAmp?: number;
  gapMark?: number;
  dashed?: boolean;
}> = ({ frame, tip, flowOpacity, flowBend, plateGlow = 0, envelope = 0, envAmp = 0, gapMark = 0 }) => {
  const plate = platePath(tip);
  const top = plate.map((p) => { const [x, y] = p.split(",").map(Number); return `${x},${y - 9}`; });
  const bot = plate.map((p) => { const [x, y] = p.split(",").map(Number); return `${x},${y + 9}`; }).reverse();
  const dashOffset = -frame * 9;
  const tipX = PLATE_X0 + PLATE_L;
  return (
    <svg width={TUBE_W} height={TUBE_H + 80} viewBox={`0 -40 ${TUBE_W} ${TUBE_H + 80}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2A3446" />
          <stop offset="1" stopColor="#121A27" />
        </linearGradient>
      </defs>
      {/* 관 안쪽 */}
      <rect x={0} y={0} width={TUBE_W} height={TUBE_H} fill="rgba(143,211,255,0.06)" />
      {/* 관 벽 */}
      <rect x={0} y={-22} width={TUBE_W} height={22} rx={6} fill="url(#wall)" stroke="#5D6B84" strokeWidth={2} />
      <rect x={0} y={TUBE_H} width={TUBE_W} height={22} rx={6} fill="url(#wall)" stroke="#5D6B84" strokeWidth={2} />
      {/* 흐름선 */}
      <g opacity={flowOpacity}>
        {[0, 1, 2, 4, 5, 6].map((r) => (
          <path key={r} d={streamPath(r, tip, flowBend)} fill="none" stroke={AIR} strokeWidth={4} strokeLinecap="round" strokeDasharray="26 22" strokeDashoffset={dashOffset} opacity={0.85} />
        ))}
      </g>
      {/* 진동 범위(연구진이 줄이자고 한 떨림) */}
      {envelope > 0 ? (
        <g opacity={envelope} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" fill="none">
          {/* 판 끝이 오가는 범위를 대괄호로 짚는다(무엇이 '이 진동'인지) */}
          <path d={`M${tipX - 46},${TUBE_H / 2 - envAmp - 14} L${tipX - 26},${TUBE_H / 2 - envAmp - 14} L${tipX - 26},${TUBE_H / 2 + envAmp + 14} L${tipX - 46},${TUBE_H / 2 + envAmp + 14}`} />
        </g>
      ) : null}
      {/* 판(연구개) */}
      <polygon points={[...top, ...bot].join(" ")} fill={PINK} stroke="#FFD0D7" strokeWidth={2} style={{ filter: plateGlow > 0 ? `drop-shadow(0 0 ${18 * plateGlow}px rgba(255,209,106,${0.9 * plateGlow}))` : undefined }} />
      {/* 판 고정단 */}
      <rect x={PLATE_X0 - 150} y={TUBE_H / 2 - 12} width={150} height={24} fill="#C7CDD8" opacity={0.9} rx={4} />
      {/* 열린 틈 표시 */}
      {gapMark > 0 ? (
        <g opacity={gapMark}>
          <line x1={tipX + 40} x2={tipX + 40} y1={TUBE_H / 2 + Math.max(0, tip) + 20} y2={TUBE_H - 6} stroke={YELLOW} strokeWidth={5} />
          <polygon points={`${tipX + 28},${TUBE_H - 22} ${tipX + 52},${TUBE_H - 22} ${tipX + 40},${TUBE_H - 4}`} fill={YELLOW} />
          <polygon points={`${tipX + 28},${TUBE_H / 2 + Math.max(0, tip) + 36} ${tipX + 52},${TUBE_H / 2 + Math.max(0, tip) + 36} ${tipX + 40},${TUBE_H / 2 + Math.max(0, tip) + 18}`} fill={YELLOW} />
        </g>
      ) : null}
    </svg>
  );
};

void TubeModel; // 2D 관(이전 판) — r5부터 3D 관으로 대체, 비교용으로 남김

// ── 공용 모델 층: c_model ~ c_key 동안 끊기지 않게 관을 유지한다(전역 프레임) ─────────
const ModelLayer: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const cm = concept(t, "c_model"), cf = concept(t, "c_flutter"), cn = concept(t, "c_numbers"), ck = concept(t, "c_key");
  if (frame < cm.from || frame > ck.from + ck.duration) return null;
  const modelIn = gev(t, "model_in");
  const push = gev(t, "push_in"), bend = gev(t, "bend_in"), fb = gev(t, "flowbend_in");
  const aip = gev(t, "aip_in"), flag = gev(t, "flag_in"), reed = gev(t, "reed_in");
  const gap = gev(t, "gap_in"), vib = gev(t, "vib_in");
  const callout = t.key_callouts?.[0];

  const appear = eventProgress(frame, modelIn, "enter");
  const p = (e: CompiledEvent) => eventProgress(frame, e, "enter");
  // 휨: 상호작용 구간에서 판이 아래로 휜다 → 떨림 구간부터 진동
  const bendAmt = interpolate(p(bend), [0, 1], [0, 46], clamp);
  const vibOn = interpolate(frame, [cf.from, cf.from + 12], [0, 1], clamp);
  const splitAmp = eventProgress(frame, gev(t, "link_in"), "enter") * (1 - interpolate(frame, [cn.from - 4, cn.from + 14], [0, 1], clamp));
  const amp = (40 + 34 * splitAmp) * vibOn;
  const settleBend = bendAmt * (1 - vibOn);
  // c_key 「이 진동을 줄이는 게」: 크게 펄럭이던 판이 진폭·빠르기 모두 천천히 잦아든다(위상 연속)
  const calmE = gev(t, "calm_in");
  const calm = eventProgress(frame, calmE, "enter");
  let phase = (Math.min(frame, calmE.from) / 30) * Math.PI * 2 * 2.2;
  for (let f = calmE.from; f < frame; f++) phase += ((2.2 * (1 - 0.6 * eventProgress(f, calmE, "enter"))) / 30) * Math.PI * 2;
  const calmAmp = amp * (1 - 0.8 * calm);
  const tip = settleBend + calmAmp * Math.sin(phase);
  const ci = concept(t, "c_interaction");
  const idle = interpolate(frame, [ci.from - 8, ci.from + 10], [0, 0.4], clamp); // 빈 관 정지 구간에 흐린 흐름
  const flowOpacity = Math.max(idle, p(push) * 0.95, frame >= cf.from ? 0.95 : 0);
  const flowBend = Math.max(p(fb), frame >= cf.from ? 1 : 0);

  // 위치: 기본 중앙(y 1000) → c_numbers 동안 위쪽 작게 → c_key 다시 중앙 아래
  const toMini = interpolate(frame, [cn.from - 4, cn.from + 14], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const fromMini = interpolate(frame, [ck.from, ck.from + 16], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const mini = toMini * (1 - fromMini);
  // 깃발·리드 구간: 관을 왼쪽 칸으로 줄여 옮기고 오른쪽 칸과 나란히 비교한다
  const split = eventProgress(frame, gev(t, "link_in"), "enter") * (1 - toMini);
  const scale = interpolate(mini, [0, 1], [1, 0.62]) * interpolate(split, [0, 1], [1, 0.54]);
  const cx = interpolate(split, [0, 1], [540, 270]);
  const cy = interpolate(mini, [0, 1], [1010, 470]) + 70 * fromMini + (SPLIT_CY - 1010) * split;
  // AIP 계산 그림이 화면을 덮는 구간에는 관을 숨긴다
  const hideAip = eventOpacity(frame, aip);
  const onFlag = Math.max(eventOpacity(frame, flag), eventOpacity(frame, reed));
  void reed;
  const dimCallout = callout ? interpolate(frame, [callout.from, callout.from + 6, callout.end - 4, callout.end], [1, 0.25, 0.25, 1], clamp) : 1;
  const ciEnd = ci.from + ci.duration;
  const in3d = interpolate(frame, [ci.from, ci.from + 10, ciEnd - 10, ciEnd], [0, 1, 1, 0], clamp);
  const focusE = gev(t, "focus_in");
  const dimFocus = 1 - 0.82 * eventOpacity(frame, focusE);
  // c_model(「~들여다봤습니다」)까지는 관을 빼고 해부도만 둔다(사용자 addendum-29) — 관은 c_interaction 3D에서 처음 등장
  const preCi = interpolate(frame, [ci.from, ci.from + 10], [0, 1], clamp);
  const opacity = appear * (1 - hideAip) * dimCallout * (1 - in3d) * dimFocus * preCi;
  const gapMark = eventOpacity(frame, gap);
  const envelope = eventOpacity(frame, vib);
  // 3D 기울기: c_model까지는 측면(연결선과 맞춤), 계산 그림이 화면을 덮는 동안 비스듬히 돌려 둔다
  const tilt = interpolate(frame, [aip.from + 6, aip.settled + 20], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1) });
  // c_key: 떨림이 잘 보이게 관을 옆모습으로 되돌리고 키운다
  const side = interpolate(frame, [ck.from, ck.from + 24], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const yaw3 = (((24 * Math.PI) / 180) * tilt + Math.sin(frame / 70) * 0.04 * tilt) * (1 - side) + ((10 * Math.PI) / 180) * side;
  const pitch3 = ((14 * Math.PI) / 180) * tilt * (1 - side) + ((24 * Math.PI) / 180) * side;
  const ghost = envelope;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <TubePlaced cx={cx} cy={cy + 40 * side} scale={scale * (0.92 + 0.08 * appear) * (1 - 0.06 * side)} yaw={yaw3} pitch={pitch3} opacity={opacity} frame={frame} tip={tip} flowOpacity={flowOpacity} flowBend={flowBend} glow={onFlag} envelope={envelope} envAmp={calmAmp} gap={gapMark} ghost={ghost} />
    </AbsoluteFill>
  );
};

/** 공통 로고(오른쪽 위) 뒤를 눌러 밝은 해부도 위에서도 로고가 보이게 한다 */
const LogoShade: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill style={{ opacity, background: "radial-gradient(circle 92px at 928px 320px, rgba(7,11,18,0.7) 0%, rgba(7,11,18,0.5) 70%, rgba(7,11,18,0) 100%)" }} />
);

// ── c_hook: 침실 → 클라리넷 ────────────────────────────────────────
const Hook: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const bed = ev(t, "c_hook", "bed_in");
  const clar = ev(t, "c_hook", "clar_in");
  const hook = ev(t, "c_hook", "hook_text");
  const push = interpolate(frame, [0, clar.from], [1.0, 1.06], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, bed), scale: String(push) }}>
        <Video pilot={pilot} file="editorial/snore_bed.mp4" ev={bed} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, clar) }}>
        <Video pilot={pilot} file="editorial/clarinet_play.mp4" ev={clar} startFrom={15} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, hook), background: "linear-gradient(180deg, rgba(5,8,14,0) 45%, rgba(5,8,14,0.72) 58%, rgba(5,8,14,0.72) 70%, rgba(5,8,14,0.1) 82%)" }} />
    </AbsoluteFill>
  );
};

// ── c_common: 흔함(범위 띠) → 해부도 속 난기류 추정 ─────────────────
const LYNCH_SCALE = 1080 / 1374;
const LYNCH_TOP = 230;
/** 해부도 원본 좌표 → 화면 좌표 */
const L = (x: number, y: number) => [x * LYNCH_SCALE, LYNCH_TOP + y * LYNCH_SCALE] as const;

// ── 흐름장: 바람 지도처럼 빛나는 짧은 입자 꼬리가 흐름을 따라 내려온다 ─────────────
// 위쪽은 매끄러운 층류, 가운데 구간(난류대)에서 소용돌이 셋과 잡음이 입자를 휘감아 엉키게 한다. 설명용 그림이며 계산 결과가 아니다.
const FLOW_N = 230;
const FLOW_LIFE = 170;
const FLOW_TRAIL = 14;
const rnd = (i: number, k: number) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };

const FlowField: React.FC<{ frame: number; w: number; h: number; turb: number }> = ({ frame, w, h, turb }) => {
  const zoneY = h * 0.64, zoneH = h * 0.17;
  const vort = (t: number) => [
    { x: w * 0.27 + Math.sin(t * 0.021) * 14, y: h * 0.52 + Math.cos(t * 0.017) * 10, s: 17, r: 66 },
    { x: w * 0.68 + Math.cos(t * 0.019) * 14, y: h * 0.58 + Math.sin(t * 0.023) * 12, s: -18, r: 72 },
    { x: w * 0.45 + Math.sin(t * 0.027) * 16, y: h * 0.72 + Math.cos(t * 0.02) * 10, s: 15, r: 62 },
    { x: w * 0.8 + Math.sin(t * 0.024) * 10, y: h * 0.8 + Math.cos(t * 0.018) * 10, s: -13, r: 52 },
  ];
  const vel = (x: number, y: number, t: number) => {
    const zone = turb * Math.exp(-((y - zoneY) ** 2) / (2 * zoneH * zoneH));
    let u = Math.sin(y * 0.012 + x * 0.004) * 0.35; // 층류: 거의 곧게 아래로
    let v = 0;
    for (const c of vort(t)) {
      const dx = x - c.x, dy = y - c.y;
      const f = Math.exp(-(dx * dx + dy * dy) / (c.r * c.r)) * c.s * turb;
      u += (-dy / c.r) * f;
      v += (dx / c.r) * f;
    }
    v += 5.6 * (1 - 0.55 * zone);
    u += zone * 3.6 * Math.sin(y * 0.045 + t * 0.09 + x * 0.03);
    v += zone * 2.6 * Math.cos(x * 0.05 - t * 0.07 + y * 0.02);
    return [u, v, zone] as const;
  };
  const paths: React.ReactNode[] = [];
  for (let i = 0; i < FLOW_N; i++) {
    const phase = Math.floor(rnd(i, 1) * FLOW_LIFE);
    const age = (frame + phase) % FLOW_LIFE;
    const born = frame - age;
    let x = rnd(i, 2) * w, y = -20 + rnd(i, 3) * h * 0.35 - h * 0.2;
    const trail: number[][] = [];
    let zoneMax = 0;
    for (let k = 0; k <= age; k++) {
      const [u, v, z] = vel(x, y, born + k);
      x += u; y += v;
      if (k > age - FLOW_TRAIL) { trail.push([x, y]); zoneMax = Math.max(zoneMax, z); }
    }
    if (trail.length < 2 || y > h + 30) continue;
    const fade = Math.min(1, age / 12, (FLOW_LIFE - age) / 12);
    // 난류대 입자는 더 밝고 하얗게(엉킴이 눈에 띄게)
    const col = zoneMax > 0.45 ? "#E8F7FF" : zoneMax > 0.2 ? "#B8E6FF" : AIR;
    paths.push(<polyline key={i} points={trail.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} fill="none" stroke={col} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" opacity={(0.55 + 0.45 * zoneMax) * fade} />);
  }
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id="flowGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="zoneTint" cx="50%" cy="62%" r="45%">
          <stop offset="0" stopColor="#5FB4FF" stopOpacity={0.16 * turb} />
          <stop offset="1" stopColor="#5FB4FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill="url(#zoneTint)" />
      <g filter="url(#flowGlow)">{paths}</g>
    </svg>
  );
};

const Common: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const bed = ev(t, "c_common", "bed2_in");
  const range = ev(t, "c_common", "range_in");
  const air = ev(t, "c_common", "airway_in");
  const swirl = ev(t, "c_common", "swirl_in");
  const rp = eventProgress(frame, range, "enter");
  const BAR_X = 140, BAR_W = 800, BAR_Y = 1120;
  const a = BAR_X + BAR_W * 0.25, b = BAR_X + BAR_W * (0.25 + 0.25 * rp);
  const sp = eventProgress(frame, swirl, "enter");
  const why = ev(t, "c_common", "why_in");
  const wp = eventProgress(frame, why, "enter");
  // 카운터: 25 → 50 이 범위 띠와 함께 올라간다
  const lo = Math.round(interpolate(rp, [0, 0.5], [0, 25], clamp));
  const counter = rp < 0.5 ? `약 ${lo}%` : "약 25~50%";
  // 좌우 분할: 왼쪽 해부도(목 부분 확대), 오른쪽 불규칙한 흐름 벡터
  const PT = 470, PH = 720, LW = 500, RX = 560, RW = 500;
  const Z = 0.82; // 해부도 원본 배율
  const ox = LW / 2 - 700 * Z, oy = PH / 2 - 980 * Z; // 원본 (700,980) 목 안쪽을 칸 중앙에
  const [sx, sy] = [20 + 722 * Z + ox, PT + 1010 * Z + oy];
  const qBounce = Math.abs(Math.sin((frame / 30) * Math.PI * 1.6)) * 14 * wp;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, bed) }}>
        <Video pilot={pilot} file="editorial/snore_bed.mp4" ev={bed} startFrom={Math.round(5.6 * 30)} style={{ filter: "brightness(1.35)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, range) }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,11,18,0) 26%, rgba(7,11,18,0.58) 33%, rgba(7,11,18,0.58) 59%, rgba(7,11,18,0) 66%)" }} />
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <rect x={BAR_X} y={BAR_Y - 14} width={BAR_W} height={28} rx={14} fill="rgba(255,255,255,0.18)" />
          <rect x={a} y={BAR_Y - 22} width={Math.max(0, b - a)} height={44} rx={10} fill={YELLOW} />
          <line x1={BAR_X} x2={BAR_X} y1={BAR_Y - 30} y2={BAR_Y + 30} stroke="#fff" strokeWidth={4} opacity={0.7} />
          <line x1={BAR_X + BAR_W} x2={BAR_X + BAR_W} y1={BAR_Y - 30} y2={BAR_Y + 30} stroke="#fff" strokeWidth={4} opacity={0.7} />
          {/* 성인 4명 중 1~2명: 첫 사람은 꽉 찬 노랑, 둘째는 점선 테두리(범위) */}
          {[0, 1, 2, 3].map((i) => {
            const cx = 540 + (i - 1.5) * 150, cy = 960;
            const show = interpolate(rp, [i * 0.12, i * 0.12 + 0.3], [0, 1], clamp);
            const fill = i === 0 ? YELLOW : i === 1 ? "rgba(255,209,106,0.25)" : "rgba(255,255,255,0.22)";
            const stroke = i === 1 ? YELLOW : "none";
            return (
              <g key={i} opacity={show} transform={`translate(${cx},${cy + (1 - show) * 20})`}>
                <circle cx={0} cy={-46} r={24} fill={fill} stroke={stroke} strokeWidth={4} strokeDasharray="8 6" />
                <path d="M -40 30 Q -40 -14 0 -14 Q 40 -14 40 30 Z" fill={fill} stroke={stroke} strokeWidth={4} strokeDasharray="8 6" />
              </g>
            );
          })}
        </svg>
        <Label name="성인 카운터" x={540} y={790} opacity={Math.min(1, rp * 3)} size={124} color={YELLOW}>{counter}</Label>
        <Label name="성인" x={540} y={680} opacity={Math.min(1, rp * 3)} size={50} color="#fff">성인 넷 중 한두 명</Label>
        <Label name="0%" x={BAR_X} y={BAR_Y + 64} opacity={1} size={40} color="#C9D1DC">0%</Label>
        <Label name="100%" x={BAR_X + BAR_W} y={BAR_Y + 64} opacity={1} size={40} color="#C9D1DC">100%</Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, air), backgroundColor: BG }}>
        {/* 왼쪽 칸: 잠자는 사람 머리 단면(해부도)의 목 부분 */}
        <div style={{ position: "absolute", left: 20, top: PT, width: LW, height: PH, overflow: "hidden", borderRadius: 24, backgroundColor: "#F4EEE6" }}>
          <Img src={pilot.file("editorial/lynch_head.jpg")} style={{ position: "absolute", left: ox, top: oy, width: 1374 * Z, height: 1510 * Z, maxWidth: "none" }} />
        </div>
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: sp }}>
          {[0, 1, 2].map((i) => {
            const cx = sx + (i - 1) * 6, cy = sy - 110 + i * 110;
            const rot = frame * 7 + i * 80;
            return (
              <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`}>
                <path d="M 0 -30 A 30 30 0 1 1 -26 14 M -26 14 A 18 18 0 1 0 10 -7" fill="none" stroke="#2D7FD3" strokeWidth={7} strokeLinecap="round" />
              </g>
            );
          })}
        </svg>
        {/* 오른쪽 칸: 불규칙한 공기 흐름(난기류) 벡터 */}
        <div style={{ position: "absolute", left: RX, top: PT, width: RW, height: PH, borderRadius: 24, backgroundColor: "#0E1624", border: "2px solid #26324A" }} />
        <div style={{ position: "absolute", left: RX, top: PT, width: RW, height: PH, borderRadius: 24, overflow: "hidden", opacity: eventProgress(frame, air, "enter") }}>
          <FlowField frame={frame} w={RW} h={PH} turb={interpolate(sp, [0, 1], [0.55, 1])} />
        </div>
        <Label name="목 속 공기 길" x={20 + LW / 2} y={PT - 50} opacity={eventOpacity(frame, air)} size={46} color="#DDE6F2">목 속 공기 길</Label>
        <Label name="불규칙한 흐름" x={RX + RW / 2} y={PT - 50} opacity={eventOpacity(frame, air)} size={46} color={AIR}>불규칙한 흐름</Label>
        <Label name="난기류?" x={RX + RW / 2} y={PT + PH - 70} opacity={sp} size={72} color="#fff" bg>난기류?</Label>
        <svg width={1080} height={1920} style={{ position: "absolute", opacity: wp }}>
          <circle cx={540} cy={800 - qBounce} r={64 * (0.8 + 0.2 * wp)} fill={YELLOW} stroke={BG} strokeWidth={8} />
        </svg>
        <Label name="물음표" x={540} y={804 - qBounce} opacity={wp} size={96} color={BG}>?</Label>
        <Label name="왜 소리가" x={540} y={1290} opacity={wp} size={58} color={YELLOW} bg>정확히 왜 소리가 날까?</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 숨길 공기 흐름(측면 해부도 위, 설명용 그림) ───────────────────────────────
// 해부도 원본 좌표(1374x1510) 기준 [x, y, 반폭]. 비강 바닥을 따라 퍼졌다가 코인두(연구개 뒤)에서 꺾이며 좁아지고 목에서 모인다.
const AIR_NASAL: [number, number, number][] = [
  [-90, 812, 6], [0, 790, 16], [70, 760, 34], [150, 725, 52], [260, 703, 60], [380, 695, 60], [490, 702, 52],
  [575, 718, 40], [640, 742, 28], [684, 778, 20], [705, 828, 16], [716, 890, 14], [726, 960, 15], [734, 1050, 16],
  [728, 1150, 14], [716, 1260, 12], [706, 1380, 11], [704, 1500, 10], [704, 1600, 8],
];
// 입 쪽: 입술 사이 → 혀 윗면과 입천장 사이 좁은 틈 → 목에서 합류(해부도의 입은 다물려 있어 옅게)
const AIR_ORAL: [number, number, number][] = [
  [-90, 1000, 4], [20, 995, 8], [110, 975, 12], [200, 925, 12], [320, 893, 10], [450, 888, 10], [570, 902, 10],
  [660, 930, 9], [712, 975, 8], [730, 1050, 8], [726, 1150, 7],
];
type AirPt = { x: number; y: number; w: number; nx: number; ny: number };
const sampleAir = (P: [number, number, number][], per = 12): AirPt[] => {
  const pts: AirPt[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const u = k / per, u2 = u * u, u3 = u2 * u;
      const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
      const s = u * u * (3 - 2 * u);
      pts.push({ x: cr(p0[0], p1[0], p2[0], p3[0]), y: cr(p0[1], p1[1], p2[1], p3[1]), w: p1[2] + (p2[2] - p1[2]) * s, nx: 0, ny: 0 });
    }
  }
  const last = P[P.length - 1];
  pts.push({ x: last[0], y: last[1], w: last[2], nx: 0, ny: 0 });
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    pts[i].nx = -dy / l; pts[i].ny = dx / l;
  }
  return pts;
};
const NASAL_S = sampleAir(AIR_NASAL);
const ORAL_S = sampleAir(AIR_ORAL);

const AirFlow: React.FC<{ frame: number; z: number; opacity: number; map: (x: number, y: number) => readonly [number, number] }> = ({ frame, z, opacity, map }) => {
  if (opacity <= 0) return null;
  const sw = 1 / Math.sqrt(z);
  // 호흡 리듬: 약 3.5초 주기로 흐름 속도와 밝기가 부풀었다 가라앉는다
  const T = 105;
  const breath = 0.5 - 0.5 * Math.cos((2 * Math.PI * frame) / T); // 0..1
  const travel = frame * 0.0062 + (0.0062 * 0.55 * T / (2 * Math.PI)) * Math.sin((2 * Math.PI * frame) / T); // 누적 진행(속도 = 기본 × (1 + 0.55 sin))
  const edge = (f: number) => Math.min(1, f / 0.12, (1 - f) / 0.14); // 가닥 시작·끝 페이드
  const strand = (S: AirPt[], k: number, K: number, spread: number) => S.map((q, i) => {
    const f = K === 1 ? 0 : (k / (K - 1)) * 2 - 1;
    const wob = Math.sin(i * 0.16 - frame * 0.07 + k * 1.9) * q.w * 0.18 + Math.sin(i * 0.05 + frame * 0.03 + k) * q.w * 0.1;
    const off = q.w * f * spread + wob;
    const [x, y] = map(q.x + q.nx * off, q.y + q.ny * off);
    return [x, y] as [number, number];
  });
  const chunks = (pts: [number, number][], base: number, color: string, width: number, key: string) => {
    const out: React.ReactNode[] = [];
    const N = pts.length, step = 6;
    for (let a = 0; a < N - 1; a += step) {
      const b = Math.min(N - 1, a + step);
      const f = (a + b) / 2 / (N - 1);
      out.push(<polyline key={`${key}${a}`} points={pts.slice(a, b + 1).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" opacity={base * edge(f)} />);
    }
    return out;
  };
  // 혜성: 머리는 밝고 꼬리로 갈수록 투명. 가닥마다 둘씩
  const comets = (pts: [number, number][], k: number, key: string, bright: number) => {
    const out: React.ReactNode[] = [];
    const N = pts.length, tail = Math.round(N * 0.16);
    for (let c = 0; c < 2; c++) {
      const head = ((travel * (0.92 + 0.08 * (k % 3)) + rnd(k, c + 3) + c * 0.5) % 1) * (N + tail);
      for (let s = 0; s < 6; s++) {
        const a = Math.round(head - tail + (tail * s) / 6), b = Math.round(head - tail + (tail * (s + 1)) / 6);
        const lo = Math.max(0, a), hi = Math.min(N - 1, b);
        if (hi - lo < 1) continue;
        const f = (lo + hi) / 2 / (N - 1);
        const alpha = ((s + 1) / 6) ** 1.6 * edge(f) * bright * (0.7 + 0.3 * breath);
        out.push(<polyline key={`${key}c${c}s${s}`} points={pts.slice(lo, hi + 1).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")} fill="none" stroke="#F2FAFF" strokeWidth={(3 + 3.2 * ((s + 1) / 6)) * sw} strokeLinecap="round" strokeLinejoin="round" opacity={alpha} />);
      }
    }
    return out;
  };
  const NK = 7, OK = 3;
  const nasal = Array.from({ length: NK }, (_, k) => strand(NASAL_S, k, NK, 0.9));
  const oral = Array.from({ length: OK }, (_, k) => strand(ORAL_S, k, OK, 0.8));
  const glowA = 0.42 + 0.24 * breath;
  return (
    <g opacity={opacity}>
      {/* 넓고 은은한 빛번짐(호흡에 맞춰 부풂) */}
      <g style={{ filter: `blur(${12 + 4 * breath}px)` }}>
        {nasal.filter((_, k) => k % 2 === 0).map((pts, k) => chunks(pts, glowA, "#2F8BFF", (16 + 6 * breath) * sw, `g${k}`))}
        {oral.filter((_, k) => k === 1).map((pts, k) => chunks(pts, glowA * 0.6, "#2F8BFF", 10 * sw, `go${k}`))}
      </g>
      {/* 가는 빛줄기 */}
      {nasal.map((pts, k) => chunks(pts, k === 3 ? 0.85 : 0.6, k === 3 ? "#A8D8FF" : "#5AAAFF", (k === 3 ? 3.4 : 2.4) * sw, `n${k}`))}
      {oral.map((pts, k) => chunks(pts, 0.32, "#5AAAFF", 2 * sw, `o${k}`))}
      {/* 흐르는 빛 */}
      <g style={{ filter: "drop-shadow(0 0 8px rgba(130,205,255,0.95))" }}>
        {nasal.map((pts, k) => comets(pts, k, `cn${k}`, k === 3 ? 1 : 0.8))}
        {oral.map((pts, k) => comets(pts, k + 11, `co${k}`, 0.45))}
      </g>
    </g>
  );
};

// ── c_model: 해부도(연구개) → 연구진의 관 모델 ──────────────────────
const Model: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const anat = ev(t, "c_model", "anat_in");
  const model = ev(t, "c_model", "model_in");
  const hi = ev(t, "c_model", "palate_hi");
  const mp = eventProgress(frame, model, "enter");
  const hp = eventProgress(frame, hi, "enter");
  const grid = ev(t, "c_model", "grid_in");
  const [px, py] = L(632, 862); // 연구개 중심(경구개 뒤 휘어 내려오는 부분)
  // 1) 머리 전체 → 목구멍 쪽으로 천천히 확대  2) 모델이 나오면 위쪽 창으로 잘려 들어가며 더 확대
  const zoomIn = interpolate(frame, [anat.from, model.from], [1, 1.45], { ...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1) });
  const z = zoomIn * interpolate(mp, [0, 1], [1, 1.25]);
  // 순차 보기(사용자 addendum-30): 「입천장」 옆모습을 크게 두고 연구개를 짚는다 → 「연구개」에 입안 정면으로 바꿔 크게 보여 준다
  const front = ev(t, "c_model", "front_in");
  const hpS = eventProgress(frame, front, "enter"); // 옆모습 연구개 표시
  const swap = interpolate(frame, [hi.from - 4, hi.from + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const WIN = { l: 110, r: 970, t: 300, b: 830 };
  const target = { x: interpolate(mp, [0, 1], [px, 540]), y: interpolate(mp, [0, 1], [py, 560]) };
  // 정면도 카드: 원본 크롭(460x570) → 420x420 좌표계로 그린 뒤 통째로 k배 키워 화면 가운데(540, 565)에 둔다
  const FC = { l: 550, t: 410, w: 420, h: 420 };
  const FS = 420 / 460;
  const K = 760 / 420;
  const fx = (ox: number) => FC.l + (ox - 300) * FS, fy = (oy: number) => FC.t + (oy - 20) * FS;
  const clip = `inset(${WIN.t * mp}px ${(1080 - WIN.r) * mp}px ${(1920 - WIN.b) * mp}px ${WIN.l * mp}px round ${28 * mp}px)`;
  const winOpacity = eventOpacity(frame, anat);
  const airOn = interpolate(frame, [anat.from + 4, anat.from + 22], [0, 1], clamp);
  const fo = eventOpacity(frame, front) * swap;
  const pulse = 0.5 + 0.5 * Math.sin((frame - hi.from) / 5);
  const pinkA = hp * (0.7 + 0.3 * pulse);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={eventOpacity(frame, grid)} frame={frame} />
      {/* 관을 뺀 만큼 그림을 화면 가운데로 내린다 */}
      <AbsoluteFill style={{ translate: `0px ${250 * mp}px` }}>
        {/* 1) 옆모습(크게) */}
        <AbsoluteFill style={{ opacity: 1 - swap, translate: `${-70 * swap}px 0px` }}>
          <AbsoluteFill style={{ opacity: winOpacity, clipPath: clip }}>
            <AbsoluteFill style={{ backgroundColor: "#F4EEE6" }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", translate: `${target.x - px * z}px ${target.y - py * z}px`, scale: String(z) }}>
              <Img src={pilot.file("editorial/lynch_head.jpg")} style={{ position: "absolute", left: 0, top: LYNCH_TOP, width: 1080 }} />
              <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
                {/* 숨길: 코 → 비강 → 연구개 위·뒤 → 목구멍 → 기관으로 흐르는 빛나는 공기 줄기(설명용 그림) */}
                <AirFlow frame={frame} z={z} opacity={airOn * (1 - 0.6 * hpS)} map={L} />
                <ellipse cx={px} cy={py} rx={90} ry={34} transform={`rotate(36 ${px} ${py})`} fill="none" stroke={YELLOW} strokeWidth={9 / z} opacity={hpS} strokeDasharray={`${540 * hpS} 600`} />
              </svg>
            </div>
          </AbsoluteFill>
          {/* 창 테두리: 시뮬레이션 화면처럼 */}
          <svg width={1080} height={1920} style={{ position: "absolute", opacity: mp }}>
            <rect x={WIN.l} y={WIN.t} width={WIN.r - WIN.l} height={WIN.b - WIN.t} rx={28} fill="none" stroke="#5FB4FF" strokeWidth={3} opacity={0.7} />
          </svg>
          <svg width={1080} height={1920} style={{ position: "absolute", opacity: hpS }}>
            <defs>
              <marker id="pa" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={YELLOW} /></marker>
            </defs>
            <line x1={target.x + 150} y1={745} x2={target.x + 12} y2={target.y + 34} stroke={YELLOW} strokeWidth={7} markerEnd="url(#pa)" />
          </svg>
          <Label name="연구개" x={target.x + 150} y={780} opacity={hpS} size={56} color={YELLOW} bg>연구개</Label>
          <Label name="옆모습" x={540} y={WIN.t - 40} opacity={mp} size={44} color="#AEB8C6">옆모습</Label>
        </AbsoluteFill>
        <LogoShade opacity={winOpacity * (1 - mp)} />
        {/* 2) 입안 정면(크게): 경구개(옅게) 뒤쪽의 연구개가 빛나며 깜빡인다 */}
        <AbsoluteFill style={{ opacity: fo, translate: `${70 * (1 - swap)}px 0px` }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: `${FC.l + FC.w / 2}px ${FC.t + FC.h / 2}px`, translate: `${540 - (FC.l + FC.w / 2)}px ${565 - (FC.t + FC.h / 2)}px`, scale: String(K) }}>
            <div style={{ position: "absolute", left: FC.l, top: FC.t, width: FC.w, height: FC.h, borderRadius: 16, overflow: "hidden", backgroundColor: "#FFFFFF", border: "2px solid #5FB4FF" }}>
              <Img src={pilot.file("editorial/palate_front.png")} style={{ width: FC.w, height: 570 * FS, maxWidth: "none" }} />
            </div>
            <svg width={1080} height={1920} style={{ position: "absolute" }}>
              <ellipse cx={fx(530)} cy={fy(280)} rx={128 * FS} ry={66 * FS} fill="#2D7FD3" opacity={0.3} />
              <path d={`M ${fx(420)} ${fy(350)} Q ${fx(520)} ${fy(330)} ${fx(620)} ${fy(350)} L ${fx(610)} ${fy(398)} Q ${fx(520)} ${fy(380)} ${fx(430)} ${fy(398)} Z`} fill={PINK} opacity={0.85 * pinkA} stroke={YELLOW} strokeWidth={2.4} strokeOpacity={hp} style={{ filter: `drop-shadow(0 0 ${8 * pinkA}px rgba(242,154,168,0.95))` }} />
              <ellipse cx={fx(525)} cy={fy(432)} rx={30 * FS} ry={40 * FS} fill="#F7E1E5" opacity={0.5 * hp} />
            </svg>
            <Label name="경구개" x={fx(530)} y={fy(280)} opacity={0.85} size={22} color="#FFFFFF" bg>경구개</Label>
            <Label name="정면 연구개" x={FC.l + FC.w - 10} y={fy(372)} opacity={hp} size={29} color={YELLOW} align="right" bg>연구개</Label>
          </div>
          <Label name="입안 정면" x={540} y={565 - 380 - 40} opacity={1} size={44} color="#AEB8C6">입안 정면</Label>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 시뮬레이션 느낌: 가장자리로 갈수록 진해지는 격자와 모서리 표시 */
const SimGrid: React.FC<{ opacity: number; frame: number }> = ({ opacity, frame }) => {
  if (opacity <= 0) return null;
  const lines: React.ReactNode[] = [];
  for (let x = 0; x <= 1080; x += 60) lines.push(<line key={`x${x}`} x1={x} x2={x} y1={0} y2={1920} />);
  for (let y = 0; y <= 1920; y += 60) lines.push(<line key={`y${y}`} x1={0} x2={1080} y1={y} y2={y} />);
  const scan = (frame * 6) % 1920;
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.25) 40%, #000 100%)", maskImage: "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.25) 40%, #000 100%)" }}>
        <g stroke="#5FB4FF" strokeWidth={1.5} opacity={0.22}>{lines}</g>
        <rect x={0} y={scan} width={1080} height={3} fill="#5FB4FF" opacity={0.18} />
      </svg>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <g stroke="#5FB4FF" strokeWidth={5} fill="none" opacity={0.75}>
          <path d="M 40 200 L 40 140 L 100 140" />
          <path d="M 1040 1800 L 1040 1860 L 980 1860" />
          <path d="M 40 1800 L 40 1860 L 100 1860" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};


// ── 3D 관 모델(공용): 1단위 = 화면 100px. 관 길이 9·반지름 1.4, 판은 x -3~0(2D 관과 같은 배치) ─────────
// 판 휨·떨림 크기는 보이게 과장한 그림이며 측정값이 아니다.
const U = 100;
const CAM_D = 35.8; // fov 30에서 z=0 평면이 1단위 = 100px
const Rig3: React.FC<{ pos: [number, number, number]; look: [number, number, number] }> = ({ pos, look }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  camera.lookAt(...look);
  camera.updateProjectionMatrix();
  return null;
};

type TubeMeshProps = { frame: number; tip: number; flowOpacity: number; flowBend: number; push?: number; pushDrop?: number; glow?: number; envelope?: number; envAmp?: number; gap?: number; ghost?: number; heat?: number };

const TubeMeshes: React.FC<TubeMeshProps> = ({ frame, tip, flowOpacity, flowBend, push = 0, pushDrop = 0, glow = 0, envelope = 0, envAmp = 0, gap = 0, ghost = 0, heat = 0 }) => {
  const tipU = tip / U;
  const PX = 30, PZ = 4;
  const plateGeo = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((PX + 1) * (PZ + 1) * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < PX; i++) for (let j = 0; j < PZ; j++) {
      const a = i * (PZ + 1) + j, b = a + PZ + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    g.setIndex(idx);
    return g;
  }, []);
  {
    const a = plateGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i <= PX; i++) for (let j = 0; j <= PZ; j++) {
      const u = i / PX;
      a.setXYZ(i * (PZ + 1) + j, -3 + 3 * u, -tipU * u * u, (j / PZ - 0.5) * 2.2);
    }
    a.needsUpdate = true;
    plateGeo.computeVertexNormals();
  }
  const N = 520;
  const streakGeo = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(N * 6), 3));
    return g;
  }, []);
  {
    const arr = (streakGeo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const col = (streakGeo.attributes.color as THREE.BufferAttribute).array as Float32Array;
    const defl = (x: number, y0: number) => {
      if (x <= -3) return 0;
      const u = Math.min(1, (x + 3) / 3);
      const after = x > 0 ? Math.exp(-x / 1.8) : 1;
      const near = 1 - Math.min(1, Math.abs(y0) / 1.4);
      // 바뀐 흐름: 판 뒤쪽 줄기가 물결치며 꺾인다(heat일 때만, 가운데 줄기일수록 크게)
      const wake = x > 0 ? (1 - Math.exp(-x / 0.9)) * Math.exp(-x / 6) : 0;
      const near2 = 1 - Math.min(1, Math.abs(y0) / 1.1);
      return -tipU * u * u * after * near * flowBend * 0.9 + heat * near2 * wake * 0.32 * Math.sin(x * 2.1 - frame * 0.22);
    };
    for (let i = 0; i < N; i++) {
      const ang = rnd(i, 7) * Math.PI * 2, rr = Math.sqrt(rnd(i, 8)) * 1.25;
      let y0 = Math.sin(ang) * rr;
      const z = Math.cos(ang) * rr;
      if (Math.abs(y0) < 0.12) y0 += 0.12 * (y0 < 0 ? -1 : 1);
      const x = -4.5 + ((frame * 0.11 + rnd(i, 9) * 9) % 9);
      const x0 = Math.max(-4.5, x - 0.45);
      const d0 = defl(x0, y0), d1 = defl(x, y0);
      arr.set([x0, y0 + d0, z, x, y0 + d1, z], i * 6);
      // 색으로 주고받음: heat가 있으면 판 앞(상류)은 또렷한 파랑, 판 끝(x=0)을 지나며 하류 흐름이 주황으로 물든다
      const zone = (xx: number) => Math.min(1, Math.max(0, xx / 1.2));
      const h0 = zone(x0) * heat, h1 = zone(x) * heat;
      const blue = Math.min(1, heat * 3);
      const c = (h: number) => [0.74 - 0.34 * blue * (1 - h) + (1 - 0.74 + 0.34 * blue) * h, 0.9 - 0.1 * blue * (1 - h) - (0.45 - 0.1 * blue) * h, 1 - 0.85 * h];
      col.set([...c(h0), ...c(h1)], i * 6);
    }
    (streakGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    streakGeo.attributes.position.needsUpdate = true;
  }
  const tubeGeo = React.useMemo(() => new THREE.CylinderGeometry(1.4, 1.4, 9, 64, 1, true), []);
  const tipDown = Math.max(0, tipU);
  const envU = envAmp / U;
  return (
    <>
      <mesh geometry={tubeGeo} rotation={[0, 0, Math.PI / 2]}>
        <meshPhysicalMaterial color="#8FA6C8" transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} roughness={0.2} />
      </mesh>
      {[-4.5, -2.25, 0, 2.25, 4.5].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.4, x === -4.5 || x === 4.5 ? 0.05 : 0.02, 8, 64]} />
          <meshBasicMaterial color="#5D6B84" />
        </mesh>
      ))}
      {[0, 1].map((k) => (
        <mesh key={k} position={[0, k ? -1.4 : 1.4, 0]}>
          <boxGeometry args={[9, 0.04, 0.04]} />
          <meshBasicMaterial color="#5D6B84" />
        </mesh>
      ))}
      <mesh position={[-3.75, 0, 0]}>
        <boxGeometry args={[1.5, 0.22, 2.2]} />
        <meshStandardMaterial color="#C7CDD8" />
      </mesh>
      <mesh geometry={plateGeo}>
        <meshStandardMaterial color={PINK} emissive={PINK} emissiveIntensity={0.25 + 1.1 * glow} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      {/* 떨림 폭 잔상: 판 끝이 오가는 위·아래 끝자리에 흐린 판 — 진동이 잦아들면 두 잔상이 가운데로 모인다 */}
      {ghost > 0 ? [1, -1].map((sgn) => <PlateGhost key={sgn} tipU={sgn * envU} opacity={ghost} />) : null}
      {/* 색으로 주고받음: 판 앞 공기(파랑) / 판 뒤 바뀐 공기(주황)를 관 속 빛으로 채운다 */}
      {heat > 0 ? (
        <>
          <mesh position={[-2.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.3, 1.3, 3.8, 48, 1, true]} />
            <meshBasicMaterial color="#3C8CFF" transparent opacity={0.16 * Math.min(1, heat * 2)} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[2.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[1.3, 1.3, 4.2, 48, 1, true]} />
            <meshBasicMaterial color="#FF8A2A" transparent opacity={0.24 * heat} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </>
      ) : null}
      <lineSegments geometry={streakGeo}>
        <lineBasicMaterial vertexColors transparent opacity={flowOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {push > 0
        ? [-2.0, -1.2, -0.45].map((x, i) => (
            <group key={i} position={[x, 0.62 + pushDrop, 0]}>
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
                <meshBasicMaterial color={AIR} transparent opacity={push} />
              </mesh>
              <mesh rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.15, 0.3, 16]} />
                <meshBasicMaterial color={AIR} transparent opacity={push} />
              </mesh>
            </group>
          ))
        : null}
      {/* 「이 진동」: 판 끝이 오가는 범위를 앞쪽 가장자리에서 괄호로 짚는다 */}
      {envelope > 0 ? (
        <group position={[-0.36, 0, 1.2]}>
          <mesh><boxGeometry args={[0.06, 2 * (envU + 0.14), 0.06]} /><meshBasicMaterial color={YELLOW} transparent opacity={envelope} /></mesh>
          {[1, -1].map((sgn) => (
            <mesh key={sgn} position={[-0.1, sgn * (envU + 0.14), 0]}><boxGeometry args={[0.2, 0.06, 0.06]} /><meshBasicMaterial color={YELLOW} transparent opacity={envelope} /></mesh>
          ))}
        </group>
      ) : null}
      {/* 열린 기도: 판 끝 아래 관 벽까지 비어 있는 틈 */}
      {gap > 0 ? (
        <group position={[0.4, 0, 0]}>
          <mesh position={[0, -(tipDown + 0.2 + 1.34) / 2, 0]}><cylinderGeometry args={[0.04, 0.04, Math.max(0.1, 1.34 - tipDown - 0.2), 10]} /><meshBasicMaterial color={YELLOW} transparent opacity={gap} /></mesh>
          <mesh position={[0, -1.24, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.12, 0.2, 14]} /><meshBasicMaterial color={YELLOW} transparent opacity={gap} /></mesh>
          <mesh position={[0, -tipDown - 0.24, 0]}><coneGeometry args={[0.12, 0.2, 14]} /><meshBasicMaterial color={YELLOW} transparent opacity={gap} /></mesh>
        </group>
      ) : null}
    </>
  );
};

const PlateGhost: React.FC<{ tipU: number; opacity: number }> = ({ tipU, opacity }) => {
  const PX = 30, PZ = 4;
  const geo = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((PX + 1) * (PZ + 1) * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < PX; i++) for (let j = 0; j < PZ; j++) {
      const a = i * (PZ + 1) + j, b = a + PZ + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    g.setIndex(idx);
    return g;
  }, []);
  const a = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i <= PX; i++) for (let j = 0; j <= PZ; j++) {
    const u = i / PX;
    a.setXYZ(i * (PZ + 1) + j, -3 + 3 * u, -tipU * u * u, (j / PZ - 0.5) * 2.2);
  }
  a.needsUpdate = true;
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={PINK} transparent opacity={0.34 * opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

/** c_interaction 전용: 측면에서 시작해 비스듬히 돌았다가 다시 측면으로 돌아온다 */
const Tube3D: React.FC<{ frame: number; dur: number; tip: number; flowOpacity: number; flowBend: number; push: number; pushDrop: number; heat?: number; glow?: number; zoom?: number; lookUp?: number }> = ({ frame, dur, tip, flowOpacity, flowBend, push, pushDrop, heat = 0, glow = 0, zoom = 1, lookUp = 0 }) => {
  const CY = -0.5;
  const turn = interpolate(frame, [12, 70, dur - 46, dur - 10], [0, 1, 1, 0], { ...clamp, easing: Easing.bezier(0.45, 0, 0.55, 1) });
  const yaw = ((30 * Math.PI) / 180) * turn + Math.sin(frame / 60) * 0.03 * turn;
  const pitch = ((18 * Math.PI) / 180) * turn;
  const D3 = CAM_D / zoom;
  const look: [number, number, number] = [0, CY + lookUp, 0];
  const pos: [number, number, number] = [D3 * Math.sin(yaw) * Math.cos(pitch), CY + lookUp + D3 * Math.sin(pitch), D3 * Math.cos(yaw) * Math.cos(pitch)];
  return (
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 30, near: 1, far: 200, position: pos }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
      <Rig3 pos={pos} look={look} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 8, 6]} intensity={1.4} />
      <group position={[0, CY, 0]}>
        <TubeMeshes frame={frame} tip={tip} flowOpacity={flowOpacity} flowBend={flowBend} push={push} pushDrop={pushDrop} heat={heat} glow={glow} />
      </group>
      <gridHelper args={[14, 14, "#2B4A6E", "#1A2C44"]} position={[0, CY - 2.2, 0]} />
    </ThreeCanvas>
  );
};

/** 화면 좌표(cx, cy)에 관 중심을 두고 제자리에서 비스듬히 돌린 3D 관. 판 끝(관 중심)은 회전해도 같은 자리에 남는다 */
const TubePlaced: React.FC<TubeMeshProps & { cx: number; cy: number; scale: number; yaw: number; pitch: number; roll?: number; opacity: number }> = ({ cx, cy, scale, yaw, pitch, roll = 0, opacity, ...mesh }) => {
  if (opacity <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 30, near: 1, far: 200, position: [0, 0, CAM_D] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
        <Rig3 pos={[0, 0, CAM_D]} look={[0, 0, 0]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 8, 6]} intensity={1.4} />
        <group position={[(cx - 540) / U, (960 - cy) / U, 0]} scale={scale}>
          <group rotation={[pitch, yaw, roll]}>
            <TubeMeshes {...mesh} />
          </group>
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};


// ── c_interaction: 밀고 → 휘고 → 꺾이고 → 서로 ───────────────────────
const Interaction: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const push = ev(t, "c_interaction", "push_in");
  const bend = ev(t, "c_interaction", "bend_in");
  const fb = ev(t, "c_interaction", "flowbend_in");
  const mu = ev(t, "c_interaction", "mutual_in");
  const mp = eventProgress(frame, mu, "enter");
  const dur = concept(t, "c_interaction").duration;
  // 2D 공용 층과 같은 값(휨·흐름)
  const bendAmt = interpolate(eventProgress(frame, bend, "enter"), [0, 1], [0, 46], clamp);
  const flowOpacity = Math.max(interpolate(frame, [-8, 10], [0, 0.4], clamp), eventProgress(frame, push, "enter") * 0.95);
  const flowBend = eventProgress(frame, fb, "enter");
  const pushArrows = eventOpacity(frame, push) * (frame < bend.settled ? 1 : 0);
  const pushDrop = interpolate(frame, [push.from, push.settled], [0.4, 0], clamp);
  // 관 하나로, 색으로 주고받음을 보여 준다(사용자 addendum-32): 파랑 공기가 판을 밀고 → 판(분홍)이 빛나며 움직이고 → 판 뒤 흐름이 주황으로 바뀐다 → 상호작용 동안 판 떨림과 같은 박자로 분홍·주황이 번갈아 맥동
  const ZM = 1.2, LOOK_UP = 0.3;
  const heatIn = eventProgress(frame, fb, "enter");
  const p2 = eventProgress(frame, bend, "enter");
  const ph = mp > 0 ? ((frame - mu.from) / 45) * Math.PI * 2 : 0;
  const flutter = mp * 22 * Math.sin(ph);
  // 상호작용: 판이 내려갈 때 판이 밝아지고(공기 → 조직), 올라올 때 뒤 흐름이 진해진다(조직 → 공기)
  const heat = heatIn * (mp > 0 ? 0.55 + 0.45 * Math.max(0, -Math.sin(ph)) : 1);
  const plateGlow = Math.max(p2 * (1 - heatIn) * (0.65 + 0.35 * Math.sin(frame / 3)), mp * (0.3 + 0.7 * Math.max(0, Math.sin(ph))));
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={0.6} frame={frame} />
      {/* 3D 관 모델: 측면에서 시작해 비스듬히 돌아 속을 보여주고, 끝에서 다시 측면으로 돌아와 2D 관과 이어진다 */}
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], clamp) }}>
        <Tube3D frame={frame} dur={dur} tip={bendAmt + flutter} flowOpacity={flowOpacity} flowBend={flowBend} push={pushArrows} pushDrop={pushDrop} heat={heat} glow={plateGlow} zoom={ZM} lookUp={LOOK_UP} />
      </AbsoluteFill>
      <Label name="공기" x={70} y={720} opacity={eventOpacity(frame, push)} size={52} color={AIR} align="left" pill>공기 →</Label>
      <Label name="바뀐 흐름" x={790} y={790} opacity={heatIn * (1 - mp)} size={48} color="#FFB36B" pill>바뀐 흐름 ↓</Label>
      <Label name="상호작용" x={540} y={560} opacity={mp} size={64} color={ACCENT} pill>양방향 상호작용</Label>
    </AbsoluteFill>
  );
};


// ── 0:38 클라리넷 엑스레이: 실사 마우스피스 위로 스캔선이 지나가며 3D 와이어프레임으로 바뀌고 리드만 빛나며 떨린다 ─────
// 1단위 = 칸 안 100px. 클라리넷 축은 실사와 같은 기울기(위 왼쪽 → 아래 오른쪽). 떨림 크기는 보이게 과장한 그림이다.
const XRAY = "#7FE3FF";
const reedGeoBuild = () => {
  const g = new THREE.BufferGeometry();
  const NX = 4, NY = 24;
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array((NX + 1) * (NY + 1) * 3), 3));
  const idx: number[] = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const a = j * (NX + 1) + i, b = a + NX + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  g.setIndex(idx);
  return { g, NX, NY };
};

const ClarinetXray: React.FC<{ frame: number; w: number; h: number; glow: number; wire: number; focus?: number }> = ({ frame, w, h, glow, wire, focus = 0 }) => {
  const D = h / (2 * Math.tan((15 * Math.PI) / 180) * 100);
  const reed = React.useMemo(reedGeoBuild, []);
  const ghostHi = React.useMemo(reedGeoBuild, []);
  const ghostLo = React.useMemo(reedGeoBuild, []);
  const L = 2.3, W = 0.34;
  // 실제 리드: 묶인 아래쪽은 고정, 얇은 끝만 마우스피스 쪽으로 닫혔다(틈 0) 열렸다 한다 — 바깥으로 젖혀지지 않는다.
  // 끝 틈은 확대 때 보이게 넓혀 그린다(실제는 1mm 안팎·초당 수백 번, 설명용으로 느리고 크게).
  const restOpen = 0.26 * focus;
  const closeD = (0.3 + restOpen - 0.152) * glow; // 쉬는 자리 → 마우스피스 끝면까지
  const shape = (geo: { g: THREE.BufferGeometry; NX: number; NY: number }, close: number) => {
    const a = geo.g.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j <= geo.NY; j++) for (let i = 0; i <= geo.NX; i++) {
      const v = j / geo.NY; // 0 = 끝(위), 1 = 고정부(아래)
      const free = Math.max(0, 1 - v / 0.55);
      a.setXYZ(j * (geo.NX + 1) + i, (i / geo.NX - 0.5) * W, -0.05 - v * L, 0.3 + (restOpen - close * closeD) * free * free);
    }
    a.needsUpdate = true;
  };
  const cyc = 0.5 - 0.5 * Math.cos((frame / 30) * Math.PI * 2 * 2.6);
  shape(reed, Math.pow(cyc, 0.55)); // 닫히는 쪽에서 「탁」 붙는 느낌
  shape(ghostHi, 0);
  shape(ghostLo, 1);
  // 확대(focus): 마우스피스를 옆모습으로 돌려(리드 떨림이 화면 좌우로 보이게) 칸 가운데로 키운다
  const spin = Math.sin(frame / 22) * 0.35 * (1 - focus) + (Math.PI / 3) * focus;
  const S = 1 + 1.0 * focus;
  // 칸 좌표: 마우스피스 끝 ≈ (210, 260)px → 3D 원점, 칸 중심 (w/2, h/2)
  const ox = ((210 - w / 2) / 100) * (1 - focus) + -0.26 * S * focus, oy = (-(260 - h / 2) / 100) * (1 - focus) + 1.2 * S * focus;
  const body = (r1: number, r2: number, y0: number, y1: number, k: string) => (
    <mesh key={k} position={[0, (y0 + y1) / 2, 0]}>
      <cylinderGeometry args={[r1, r2, Math.abs(y1 - y0), 14, 3, true]} />
      <meshBasicMaterial color={XRAY} wireframe transparent opacity={0.45 * wire * (1 - 0.6 * focus)} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
  return (
    <ThreeCanvas width={w} height={h} camera={{ fov: 30, near: 0.5, far: 100, position: [0, 0, D] }} gl={{ alpha: true, antialias: true }} style={{ position: "absolute", inset: 0 }}>
      <group position={[ox, oy, 0]} rotation={[0, 0, ((22 * Math.PI) / 180) * (1 - focus)]} scale={S}>
        <group rotation={[0, spin, 0]}>
          {/* 투과 몸체(엑스레이 음영) */}
          <mesh position={[0, -4, 0]}>
            <cylinderGeometry args={[0.3, 0.34, 8, 28, 1, true]} />
            <meshBasicMaterial color={XRAY} transparent opacity={0.07 * wire} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {body(0.15, 0.3, 0, -2.4, "mp")}
          {body(0.38, 0.38, -2.4, -4.0, "barrel")}
          {body(0.3, 0.3, -4.0, -8.5, "upper")}
          {[-2.4, -4.0].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.39, 0.025, 8, 40]} />
              <meshBasicMaterial color={XRAY} transparent opacity={0.9 * wire} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
          {/* 리가처(고정 링) */}
          {[-0.95, -1.35].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.31, 0.035, 8, 40]} />
              <meshBasicMaterial color="#9FB8D0" transparent opacity={0.8 * wire} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ))}
          {/* 리드: 빛나는 판 + 바깥 번짐 */}
          <mesh geometry={reed.g}>
            <meshBasicMaterial color="#C9921F" transparent opacity={0.25 * wire + 0.5 * glow} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh geometry={reed.g}>
            <meshBasicMaterial color={YELLOW} wireframe transparent opacity={0.3 * wire + 0.7 * glow} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {/* 마우스피스 면: 리드 끝이 닫히며 붙는 자리 */}
          {focus > 0 ? (
            <mesh position={[0, -0.65, 0.19]} rotation={[-0.062, 0, 0]}>
              <boxGeometry args={[W, 1.3, 0.02]} />
              <meshBasicMaterial color={XRAY} transparent opacity={0.3 * focus} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          ) : null}
          {/* 떨림 폭 잔상(양 끝자리) */}
          {focus > 0
            ? [ghostHi, ghostLo].map((gg, k) => (
                <mesh key={k} geometry={gg.g}>
                  <meshBasicMaterial color={YELLOW} transparent opacity={0.3 * focus} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
              ))
            : null}
          {/* 숨: 리드와 마우스피스 사이 틈으로 들어가는 공기 */}
          {focus > 0
            ? Array.from({ length: 7 }, (_, k) => {
                const ph = ((frame * 0.045 + k / 7) % 1);
                const y = 0.45 - ph * 1.9;
                return (
                  <mesh key={`air${k}`} position={[((k % 3) - 1) * 0.09, y, 0.3]}>
                    <boxGeometry args={[0.025, 0.32, 0.025]} />
                    <meshBasicMaterial color={AIR} transparent opacity={focus * Math.min(1, ph / 0.15, (1 - ph) / 0.2) * 0.95} depthWrite={false} />
                  </mesh>
                );
              })
            : null}
          <mesh geometry={reed.g} scale={[1.6, 1.02, 1]}>
            <meshBasicMaterial color={YELLOW} transparent opacity={0.18 * glow} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      </group>
    </ThreeCanvas>
  );
};


// ── c_flutter: 실제 모델 계산 그림 → 깃발처럼 → 클라리넷 리드처럼 ─────────
const Flutter: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const aip = ev(t, "c_flutter", "aip_in");
  const flag = ev(t, "c_flutter", "flag_in");
  const reed = ev(t, "c_flutter", "reed_in");
  const ao = eventOpacity(frame, aip);
  const ro = eventOpacity(frame, reed);
  const BAND_H = 380; // 좌우를 잘라(cover) 띠를 키운다 — 모바일에서 판·유선이 보이게
  const lo = eventOpacity(frame, ev(t, "c_flutter", "link_in"));
  // 리드 끝(위쪽) 위치: 원본 x≈455, y≈60 → 오른쪽 칸 좌표
  const rTipX = PANEL_W / 2, rTipY = 70 + 60 * RS;
  void rTipX; void rTipY;
  // 실사 → 엑스레이: 「클라리넷의」에 스캔선이 위에서 아래로, 「리드처럼」에 리드가 빛난다
  const xp = eventProgress(frame, ev(t, "c_flutter", "xray_in"), "enter");
  const gp = eventProgress(frame, ev(t, "c_flutter", "reedglow_in"), "enter");
  // 「말이죠」 뒤 쉼(클라리넷 단음): 리드를 확대해 떨림을 보여주고 리드가 무엇인지 짧게 붙인다
  const rcl = ev(t, "c_flutter", "reedclar_in");
  const rf = interpolate(frame, [rcl.from - 6, rcl.from + 16], [0, 1], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) }) * (1 - interpolate(frame, [rcl.to, rcl.end], [0, 1], clamp));
  const scanY = PANEL_H * xp;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={0.45} frame={frame} />
      <AbsoluteFill style={{ opacity: ao }}>
        <div style={{ position: "absolute", left: 0, top: 820 - BAND_H / 2, width: 1080, height: BAND_H, overflow: "hidden" }}>
          <Img src={pilot.file("editorial/aip_model_band.png")} style={{ width: 1080, height: BAND_H, objectFit: "cover", objectPosition: "30% 50%", filter: "saturate(0.18) brightness(0.8) contrast(1.15)" }} />
        </div>
        <Label name="논문 시뮬레이션" x={540} y={820 - BAND_H / 2 - 60} opacity={1} size={48} color="#DDE6F2" weight={400}>「연구개 위 공기 흐름 시뮬레이션」</Label>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* 띠 속 회색 판의 끝(원본 x≈305, y≈170 → cover 배율 380/160)을 가리킨다 */}
          <line x1={560} y1={820 + BAND_H / 2 + 28} x2={(305 * 380) / 160 - (((710 * 380) / 160 - 1080) * 0.3) - 10} y2={820 - BAND_H / 2 + ((170 - 96) * 380) / 160 + 6} stroke={PINK} strokeWidth={5} />
          <circle cx={(305 * 380) / 160 - (((710 * 380) / 160 - 1080) * 0.3) - 10} cy={820 - BAND_H / 2 + ((170 - 96) * 380) / 160 + 6} r={10} fill={PINK} />
        </svg>
        <Label name="떨리는 연구개" x={560} y={820 + BAND_H / 2 + 60} opacity={1} size={50} color={PINK}>떨리는 연구개</Label>
      </AbsoluteFill>
      {/* 좌우 비교: 왼쪽 칸 = 연구개(모델, 공용 층의 관), 오른쪽 칸 = 깃발 → 클라리넷 리드 */}
      <AbsoluteFill style={{ opacity: lo }}>
        <div style={{ position: "absolute", left: 20, top: SPLIT_CY - PANEL_H / 2, width: PANEL_W, height: PANEL_H, borderRadius: 24, backgroundColor: "#0E1624", border: "2px solid #26324A" }} />
        <div style={{ position: "absolute", left: RPX, top: SPLIT_CY - PANEL_H / 2, width: PANEL_W, height: PANEL_H, borderRadius: 24, overflow: "hidden", backgroundColor: "#0B0F16", border: "2px solid #26324A" }}>
          <AbsoluteFill style={{ opacity: eventOpacity(frame, flag) }}>
            <Sequence from={flag.from} durationInFrames={Math.max(1, flag.end - flag.from)} layout="none">
              <OffthreadVideo src={pilot.file("editorial/flag_wave.mp4")} muted style={{ width: PANEL_W, height: PANEL_H, objectFit: "cover", objectPosition: "30% 40%" }} />
            </Sequence>
          </AbsoluteFill>
          <AbsoluteFill style={{ opacity: ro }}>
            {/* 실사(마우스피스 부분) — 스캔선 아래쪽만 남는다 */}
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(${scanY}px 0px 0px 0px)` }}>
              <Sequence from={reed.from} durationInFrames={Math.max(1, reed.end - reed.from)} layout="none">
                <OffthreadVideo src={pilot.file("editorial/clarinet_play.mp4")} muted startFrom={30} style={{ position: "absolute", left: -550, top: -520, width: 1080, height: 1920, maxWidth: "none" }} />
              </Sequence>
            </div>
            {/* 스캔선 위쪽: 3D 엑스레이 와이어프레임 */}
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px 0px ${PANEL_H - scanY}px 0px)`, backgroundColor: "#04121C" }}>
              <svg width={PANEL_W} height={PANEL_H} style={{ position: "absolute", opacity: 0.35 }}>
                {Array.from({ length: 13 }, (_, i) => <line key={`gx${i}`} x1={i * 40} x2={i * 40} y1={0} y2={PANEL_H} stroke={XRAY} strokeWidth={1} opacity={0.25} />)}
                {Array.from({ length: 20 }, (_, i) => <line key={`gy${i}`} x1={0} x2={PANEL_W} y1={i * 40} y2={i * 40} stroke={XRAY} strokeWidth={1} opacity={0.25} />)}
              </svg>
              {xp > 0 ? <ClarinetXray frame={frame} w={PANEL_W} h={PANEL_H} glow={gp} wire={1} focus={rf} /> : null}
            </div>
            {/* 스캔선 */}
            <div style={{ position: "absolute", left: 0, top: scanY - 3, width: PANEL_W, height: 6, backgroundColor: XRAY, boxShadow: `0 0 24px 8px rgba(127,227,255,0.7)`, opacity: xp > 0 && xp < 1 ? 1 : 0 }} />
          </AbsoluteFill>
        </div>
        {/* 두 칸을 잇는 공기 파동선: 관 속 판과 같은 주기로 출렁인다 */}
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {[-60, 0, 60].map((dy, i) => {
            const pts: string[] = [];
            for (let k = 0; k <= 24; k++) {
              const x = 470 + (140 * k) / 24;
              const y = SPLIT_CY + dy + Math.sin((k / 24) * Math.PI * 2 - (frame / 30) * Math.PI * 2 * 2.2) * 16;
              pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
            }
            return <polyline key={i} points={pts.join(" ")} fill="none" stroke={AIR} strokeWidth={6} strokeLinecap="round" opacity={0.9 - Math.abs(dy) / 150} />;
          })}
        </svg>
        <Label name="공기 흐름 떨림" x={540} y={SPLIT_CY - PANEL_H / 2 - 60} opacity={1} size={54} color={AIR}>공기 흐름 ⇄ 떨림</Label>
        <Label name="연구개 모델" x={20 + PANEL_W / 2} y={SPLIT_CY + PANEL_H / 2 + 56} opacity={1} size={50} color={PINK}>연구개(모델)</Label>
        <Label name="깃발" x={RPX + PANEL_W / 2} y={SPLIT_CY + PANEL_H / 2 + 56} opacity={eventOpacity(frame, flag) * (1 - ro)} size={50} color="#fff">깃발</Label>
        <Label name="리드" x={RPX + PANEL_W / 2} y={SPLIT_CY + PANEL_H / 2 + 56} opacity={ro} size={50} color={YELLOW}>{gp > 0.3 ? "리드" : "클라리넷"}</Label>
        <Label name="리드 설명" x={RPX + PANEL_W / 2} y={SPLIT_CY + PANEL_H / 2 + 118} opacity={ro * rf} size={38} color="#DDE6F2">입에 무는 얇은 판</Label>
        <Label name="숨" x={RPX + 170} y={SPLIT_CY - PANEL_H / 2 + 70} opacity={ro * rf} size={44} color={AIR}>숨 ↓</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c_numbers: 판 끝 진동 폭 눈금 → 90Hz → 실제 코골이 범위 ────────────
const Numbers: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const amp = ev(t, "c_numbers", "amp_in");
  const hz = ev(t, "c_numbers", "hz_in");
  const band = ev(t, "c_numbers", "band_in");
  const loud = ev(t, "c_numbers", "loud_in");
  const pitch = ev(t, "c_numbers", "pitch_in");
  const ap = eventProgress(frame, amp, "enter");
  // 확대 창: 판 끝을 크게. 진동 폭 띠 2.8~4.2mm를 눈금(0~6mm) 위에 표시
  const ZX = 450, ZY = 780, MM = 44; // 1mm = 46px
  // 판 끝 위아래 변위는 ±2.1mm(전체 4.2mm)를 넘지 않게 — 띠와 같은 눈금
  const gframe = frame + concept(t, "c_numbers").from; // 위 관의 판과 같은 위상·주기로 움직인다
  const tipY = Math.sin((gframe / 30) * Math.PI * 2 * 2.2) * 2.1 * MM * ap;
  const AX = 140, AW = 800, AY = 1120;
  const hzX = (h: number) => AX + (AW * h) / 200;
  const hp = eventProgress(frame, hz, "enter");
  const bp = eventProgress(frame, band, "enter");
  const scope = ev(t, "c_numbers", "scope_in");
  const sp = eventProgress(frame, scope, "enter");
  // 90Hz가 나오면 확대 창은 작은 요약 칩으로 접히고, 그 자리에 예시 파형 화면이 뜬다
  const ampFull = eventOpacity(frame, amp) * (1 - sp);
  const OX = 140, OW = 800, OY = 690, OH = 280;
  // 집중 구간: 90Hz 예시음만 울리는 동안 파형 창만 남기고 나머지를 누른다. 박동은 예시음 포락선과 같은 식
  const focus = ev(t, "c_numbers", "focus_in");
  const fo = eventOpacity(frame, focus);
  const fpop = eventProgress(frame, focus, "enter");
  const tau = Math.max(0, (frame - focus.from) / 30);
  const tonePulse = 0.55 + 0.45 * Math.abs(Math.sin(Math.PI * 1.5 * tau + Math.PI / 2));
  const pulse = fo > 0 ? tonePulse : 0.55 + 0.45 * Math.abs(Math.sin((frame / 30) * Math.PI * 1.5));
  const zs = 1 + 0.07 * fo;
  const wave: string[] = [];
  for (let k = 0; k <= 160; k++) {
    const x = OX + 20 + ((OW - 40) * k) / 160;
    const y = OY + OH / 2 + Math.sin((k / 160) * Math.PI * 2 * 6 - frame * 0.5) * (OH / 2 - 50) * pulse * sp;
    wave.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={0.45} frame={frame} />
      <AbsoluteFill style={{ opacity: eventOpacity(frame, scope), scale: String(zs), transformOrigin: `${OX + OW / 2}px ${OY + OH / 2}px`, zIndex: 2 }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <rect x={OX} y={OY} width={OW} height={OH} rx={22} fill="#06140F" stroke={fo > 0 ? "#6CFFB4" : "#2C5A47"} strokeWidth={3 + 3 * fo} style={{ filter: fo > 0 ? `drop-shadow(0 0 ${22 * fo * tonePulse}px rgba(108,255,180,0.8))` : undefined }} />
          <g stroke="#2C5A47" strokeWidth={1.5} opacity={0.8}>
            {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={OX + (OW * (i + 1)) / 10} x2={OX + (OW * (i + 1)) / 10} y1={OY + 10} y2={OY + OH - 10} />)}
            {Array.from({ length: 3 }, (_, i) => <line key={`h${i}`} x1={OX + 10} x2={OX + OW - 10} y1={OY + (OH * (i + 1)) / 4} y2={OY + (OH * (i + 1)) / 4} />)}
          </g>
          <polyline points={wave.join(" ")} fill="none" stroke="#6CFFB4" strokeWidth={6} strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(108,255,180,0.8))" }} />
        </svg>
        <Label name="예시 파형" x={OX + 30} y={OY + 40} opacity={sp} size={32} color="#7FBFA4" align="left">소리 · 예시 파형(그림)</Label>
        <Label name="진동 폭 칩" x={540} y={612} opacity={sp * (1 - Math.max(fo, interpolate(frame, [focus.from - 10, focus.from], [0, 1], clamp) * (frame < focus.end ? 1 : 0)))} size={36} color={PINK}>연구개 끝 진동 폭 2.8~4.2mm</Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: ampFull }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* 미니 관(공용 층) 속 판 끝을 가리키는 확대 연결 */}
          <rect x={ZX - 320} y={ZY - 4.5 * MM - 30} width={640} height={9 * MM + 60} rx={22} fill="rgba(255,255,255,0.04)" stroke="#3A475C" strokeWidth={3} />
          <line x1={540 - 0.62 * (TUBE_W / 2) + 0.62 * (PLATE_X0 + PLATE_L)} y1={470 + 20} x2={ZX + 60} y2={ZY - 4.5 * MM - 30} stroke="#3A475C" strokeWidth={3} strokeDasharray="10 8" />
          {/* 돋보기 손잡이: 확대해서 본 장면임을 표시 */}
          <circle cx={ZX + 320} cy={ZY + 4.5 * MM + 30} r={34} fill={BG} stroke="#C9D1DC" strokeWidth={6} />
          <line x1={ZX + 344} y1={ZY + 4.5 * MM + 54} x2={ZX + 384} y2={ZY + 4.5 * MM + 94} stroke="#C9D1DC" strokeWidth={12} strokeLinecap="round" />
          {/* 판 끝 */}
          <path d={`M ${ZX - 300} ${ZY} Q ${ZX - 60} ${ZY + tipY * 0.2} ${ZX + 60} ${ZY + tipY}`} stroke={PINK} strokeWidth={26} strokeLinecap="round" fill="none" />
          {/* 눈금 */}
          <line x1={ZX + 160} x2={ZX + 160} y1={ZY - 3 * MM} y2={ZY + 3 * MM} stroke="#C9D1DC" strokeWidth={4} />
          {[-3, -2, -1, 0, 1, 2, 3].map((m) => (
            <line key={m} x1={ZX + 150} x2={ZX + 170} y1={ZY + m * MM} y2={ZY + m * MM} stroke="#C9D1DC" strokeWidth={3} />
          ))}
          {/* 진동 폭 띠: 끝 위아래 흔들림 전체 폭 2.8~4.2mm → 반폭 1.4~2.1mm */}
          <rect x={ZX + 40} y={ZY - 2.1 * MM} width={110} height={4.2 * MM} rx={6} fill={YELLOW} opacity={0.16 * ap} />
          <rect x={ZX + 40} y={ZY - 1.4 * MM} width={110} height={2.8 * MM} rx={6} fill={YELLOW} opacity={0.22 * ap} />
        </svg>
        {[-2, 0, 2].map((m) => (
          <Label key={m} name={`눈금 ${m}`} x={ZX + 180} y={ZY + m * MM} opacity={ap} size={32} color="#C9D1DC" align="left">{`${m > 0 ? "+" : ""}${m}`}</Label>
        ))}
        <Label name="확대" x={ZX - 300} y={ZY - 4.5 * MM + 14} opacity={ap} size={32} color="#9AA6B6" align="left">확대 · 눈금 단위 mm</Label>
        <Label name="진동 폭" x={ZX + 230} y={ZY - 40} opacity={ap} size={48} color="#DDE6F2" align="left">진동 폭</Label>
        <Label name="2.8~4.2mm" x={ZX + 230} y={ZY + 30} opacity={ap} size={64} color={YELLOW} align="left">2.8~4.2mm</Label>
        <Label name="연구개 끝" x={ZX - 300} y={ZY + 120} opacity={ap} size={44} color={PINK} align="left">연구개 끝</Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, hz) }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <rect x={hzX(68)} y={AY - 40} width={(hzX(138) - hzX(68)) * bp} height={80} rx={10} fill="#5FB4FF" opacity={0.35} />
          <line x1={AX} x2={AX + AW} y1={AY} y2={AY} stroke="#C9D1DC" strokeWidth={4} />
          {[0, 50, 100, 150, 200].map((h) => (
            <line key={h} x1={hzX(h)} x2={hzX(h)} y1={AY - 12} y2={AY + 12} stroke="#C9D1DC" strokeWidth={3} />
          ))}
          <line x1={hzX(90)} x2={hzX(90)} y1={AY - 56 * hp} y2={AY + 4} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
          <circle cx={hzX(90)} cy={AY - 56 * hp} r={12 * hp} fill={YELLOW} />
        </svg>
        {[0, 100, 200].map((h) => (
          <Label key={h} name={`${h}Hz`} x={hzX(h)} y={AY + 62} opacity={1} size={36} color="#9AA6B6">{`${h}`}</Label>
        ))}
        <Label name="Hz 단위" x={AX + AW + 50} y={AY} opacity={1} size={36} color="#9AA6B6" align="right">Hz</Label>
        <Label name="90Hz" x={hzX(90)} y={AY - 100} opacity={hp * (1 - fo)} size={64} color={YELLOW}>90Hz</Label>
        <Label name="실제 코골이 녹음" x={(hzX(68) + hzX(138)) / 2} y={AY + 116} opacity={bp} size={44} color="#D6ECFF">실제 코골이 녹음 범위</Label>
      </AbsoluteFill>
      <Label name="소리 크기 체크" x={370} y={1318} opacity={eventOpacity(frame, loud)} size={48} color="#fff" bg>소리 크기 ✓</Label>
      <Label name="음높이 체크" x={710} y={1318} opacity={eventOpacity(frame, pitch)} size={48} color="#fff" bg>음높이 ✓</Label>
      {/* 집중: 파형 창 밖을 어둡게 누르고, 창 안에 90Hz 표시가 소리 박동에 맞춰 빛난다 */}
      <AbsoluteFill style={{ opacity: fo, zIndex: 1, background: "rgba(4,7,12,0.82)" }} />
      <AbsoluteFill style={{ opacity: fo, zIndex: 3, pointerEvents: "none" }}>
        <Label name="90Hz 집중" x={OX + OW / 2} y={OY - 70 - 10 * fpop} opacity={1} size={84} color={YELLOW}>
          <span style={{ textShadow: `0 0 ${30 * tonePulse}px rgba(255,209,106,0.95)` }}>♪ 90Hz</span>
        </Label>
        <Label name="예시음" x={OX + OW / 2} y={OY + OH + 150} opacity={1} size={34} color="#AEB8C6">예시음 · 실제 녹음 아님</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c_key: 열린 기도에서도 떨림 / 떨림을 줄이는 게 핵심(연구진) ────────────
const Key: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const gap = ev(t, "c_key", "gap_in");
  const vib = ev(t, "c_key", "vib_in");
  const card = ev(t, "c_key", "card_in");
  const hl = ev(t, "c_key", "hl_in");
  const co = eventOpacity(frame, card);
  const cp = eventProgress(frame, card, "enter");
  const hp = eventProgress(frame, hl, "enter");
  const tubeLeft = 540 - TUBE_W / 2;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={0.45} frame={frame} />
      <Label name="열린 기도" x={tubeLeft + PLATE_X0 + PLATE_L + 100} y={1080 + 80} opacity={eventOpacity(frame, gap)} size={60} color={YELLOW} align="left" bg>열린 기도</Label>
      <Label name="이 진동" x={tubeLeft + PLATE_X0 + PLATE_L - 40} y={1080 - 220} opacity={eventOpacity(frame, vib)} size={56} color={YELLOW} bg>이 진동</Label>
      {/* 연구진 견해 카드: 귀속 머리말 + 원고 문구, '치료의 핵심'에 형광펜·체크 */}
      <AbsoluteFill style={{ opacity: co, translate: `0px ${(1 - cp) * 24}px` }}>
        <div style={{ position: "absolute", left: 110, top: 470, width: 860, height: 310, borderRadius: 26, backgroundColor: "rgba(14,22,36,0.94)", border: `3px solid ${YELLOW}` }} />
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {/* 진동 아이콘: 큰 물결 → 잦아드는 물결 + 아래 화살표(줄이기) */}
          {[0, 1].map((k) => {
            const pts: string[] = [];
            for (let i = 0; i <= 40; i++) {
              const x = 300 + k * 230 + (170 * i) / 40;
              const a = k === 0 ? 34 : 34 * (1 - 0.8 * hp);
              pts.push(`${x.toFixed(1)},${(610 + Math.sin((i / 40) * Math.PI * 6 - frame * 0.45) * a).toFixed(1)}`);
            }
            return <polyline key={k} points={pts.join(" ")} fill="none" stroke={PINK} strokeWidth={7} strokeLinecap="round" />;
          })}
          <path d="M 486 610 L 510 610" stroke="#AEB8C6" strokeWidth={6} />
          <polygon points="506,596 526,610 506,624" fill="#AEB8C6" />
          <line x1={740} y1={578} x2={740} y2={630} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" />
          <polygon points="724,622 756,622 740,648" fill={YELLOW} />
          {/* 형광펜: '치료의 실마리' 뒤를 칠하고 끝에서 반짝인다(체크 표시는 확정처럼 읽혀 쓰지 않음) */}
          <rect x={360} y={688} width={360 * hp} height={62} rx={8} fill={YELLOW} opacity={0.42} />
          {[0, 1].map((k) => {
            const tw = hp >= 1 ? 0.5 + 0.5 * Math.sin(frame / 4 + k * 2) : 0;
            const sx = 742 + k * 34, sy = 682 + k * 30, r = (k ? 12 : 20) * tw;
            return <path key={k} d={`M ${sx} ${sy - r} L ${sx + r * 0.25} ${sy - r * 0.25} L ${sx + r} ${sy} L ${sx + r * 0.25} ${sy + r * 0.25} L ${sx} ${sy + r} L ${sx - r * 0.25} ${sy + r * 0.25} L ${sx - r} ${sy} L ${sx - r * 0.25} ${sy - r * 0.25} Z`} fill={YELLOW} />;
          })}
        </svg>
        <Label name="연구진의 견해" x={540} y={520} opacity={1} size={40} color="#AEB8C6">연구진의 견해</Label>
        <Label name="치료의 실마리" x={540} y={720} opacity={1} size={64} color="#fff">치료의 실마리</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c_limit: 실제 목구멍 vs 곧은 관 모델 ──────────────────────────────
const Limit: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const real = ev(t, "c_limit", "realair_in");
  const dim = ev(t, "c_limit", "dim_in");
  const rp = eventProgress(frame, real, "enter");
  const dp = eventProgress(frame, dim, "enter");
  const mag = ev(t, "c_limit", "mag_in");
  const mgp = eventProgress(frame, mag, "enter");
  const bob = Math.sin((frame / 30) * Math.PI * 0.9) * 10;
  // 해부도에서 입·목 부분(원본 x 380~880, y 560~1500)을 왼쪽 칸에
  const CW = 420, CH = 900, cx = 80, cy = 340;
    const TX = 665, TW = 250, TY = 440, TH = 800;
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={0.45} frame={frame} />
      <AbsoluteFill style={{ opacity: eventOpacity(frame, real) }}>
        <div style={{ position: "absolute", left: cx, top: cy, width: CW, height: CH, overflow: "hidden", borderRadius: 24, backgroundColor: "#F4EEE6", scale: String(0.96 + 0.04 * rp) }}>
          <Img src={pilot.file("editorial/lynch_throat.jpg")} style={{ width: CW, height: CH, objectFit: "cover" }} />
        </div>
        <Label name="실제 목구멍" x={cx + CW / 2} y={cy + CH + 60} opacity={rp} size={52} color="#fff">실제 목구멍</Label>
      </AbsoluteFill>
      <TubePlaced cx={TX + TW / 2} cy={TY + TH / 2} scale={0.89 * (0.94 + 0.06 * dp)} yaw={0.5 + Math.sin(frame / 50) * 0.12} pitch={0.18} roll={-Math.PI / 2} opacity={Math.max(eventOpacity(frame, dim), 0.35 * eventOpacity(frame, real))} frame={frame} tip={plateTip(frame, 14, 0)} flowOpacity={0.8} flowBend={1} />
      <AbsoluteFill style={{ opacity: eventOpacity(frame, dim) }}>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <g opacity={dp}>
            <line x1={TX} x2={TX + TW} y1={TY + TH * 0.62} y2={TY + TH * 0.62} stroke={YELLOW} strokeWidth={5} />
            <polygon points={`${TX + 4},${TY + TH * 0.62} ${TX + 24},${TY + TH * 0.62 - 12} ${TX + 24},${TY + TH * 0.62 + 12}`} fill={YELLOW} />
            <polygon points={`${TX + TW - 4},${TY + TH * 0.62} ${TX + TW - 24},${TY + TH * 0.62 - 12} ${TX + TW - 24},${TY + TH * 0.62 + 12}`} fill={YELLOW} />
          </g>
        </svg>
        <Label name="3.8cm" x={TX + TW / 2} y={TY + TH * 0.62 - 50} opacity={dp} size={60} color={YELLOW} bg>3.8cm</Label>
        <Label name="모델" x={TX + TW / 2} y={cy + CH + 60} opacity={dp} size={52} color="#fff">곧은 관 모델</Label>
        <Label name="다름" x={560} y={790} opacity={dp} size={110} color={YELLOW}>≠</Label>
      </AbsoluteFill>
      {/* 단순화 표시: 관 위를 살짝 떠다니는 돋보기와 '연구의 한계' 꼬리표 */}
      <AbsoluteFill style={{ opacity: eventOpacity(frame, mag) }}>
        <svg width={1080} height={1920} style={{ position: "absolute", translate: `0px ${bob}px`, scale: String(0.85 + 0.15 * mgp) }}>
          <circle cx={TX + TW / 2} cy={690} r={78} fill="rgba(143,211,255,0.12)" stroke="#E6ECF4" strokeWidth={10} />
          <line x1={TX + TW / 2 + 56} y1={746} x2={TX + TW / 2 + 110} y2={800} stroke="#E6ECF4" strokeWidth={20} strokeLinecap="round" />
        </svg>
        <Label name="연구의 한계" x={400} y={250} opacity={mgp} size={48} color={YELLOW} bg>연구의 한계 · 단순화한 모델</Label>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c_close: 떨리는 판 + 클라리넷 ──────────────────────────────────────
const Close: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const plate = ev(t, "c_close", "closeplate_in");
  const clar = ev(t, "c_close", "closeclar_in");
  const tip = plateTip(frame, 40, 0);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <SimGrid opacity={0.45} frame={frame} />
      {/* 위: 클라리넷 연주(얼굴이 자막 위에 오도록), 아래: 떨리는 판 — 자막은 관 아래 */}
      <AbsoluteFill style={{ opacity: eventOpacity(frame, clar), top: 0, height: 960, overflow: "hidden" }}>
        <Sequence from={clar.from} durationInFrames={Math.max(1, clar.end - clar.from)} layout="none">
          <OffthreadVideo src={pilot.file("editorial/clarinet_play.mp4")} muted startFrom={10} playbackRate={0.7} style={{ width: 1080, height: 960, objectFit: "cover", objectPosition: "50% 12%" }} />
        </Sequence>
        <AbsoluteFill style={{ top: 860, height: 100, background: "linear-gradient(180deg, rgba(7,11,18,0), rgba(7,11,18,1))" }} />
      </AbsoluteFill>
      <TubePlaced cx={540} cy={1180} scale={0.92} yaw={(24 * Math.PI) / 180 + Math.sin(frame / 70) * 0.05} pitch={(14 * Math.PI) / 180} opacity={eventOpacity(frame, plate)} frame={frame} tip={tip} flowOpacity={0.9} flowBend={1} />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<{ pilot: EditorialPilotData }>> = {
  c_hook: Hook,
  c_common: Common,
  c_model: Model,
  c_interaction: Interaction,
  c_flutter: Flutter,
  c_numbers: Numbers,
  c_key: Key,
  c_limit: Limit,
  c_close: Close,
};

export const EditorialEpisode: React.FC<EditorialEpisodeProps> = ({ pilot }) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    {pilot.timeline.concepts.map((c) => {
      const Scene = SCENES[c.id];
      return (
        <ConceptSequence key={c.id} timeline={pilot.timeline} conceptId={c.id}>
          {Scene ? <Scene pilot={pilot} /> : null}
        </ConceptSequence>
      );
    })}
    <ModelLayer pilot={pilot} />
  </AbsoluteFill>
);
