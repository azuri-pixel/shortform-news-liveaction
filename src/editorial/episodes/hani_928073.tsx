import React from "react";
import { AbsoluteFill, Img, Interactive, interpolate, Easing, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { ConceptSequence, eventInConcept, eventOpacity, eventProgress } from "../../lib/editorial";
import type { CompiledEvent, EditorialTimeline } from "../../lib/editorial";
import type { EditorialEpisodeProps, EditorialPilotData } from "../pilot";

/**
 * 창백한 푸른 점 — 1990 보이저 1호 지구 사진과 2020 재보정.
 * 같은 대상(빛줄기 속 지구 점)을 처음·중간·끝에서 같은 자리로 유지한다.
 * 좌표는 각 자료의 실제 픽셀에서 잰 값이다(지구 점: 2020본 1080×1920 표시 기준 (450,987),
 * 1990본 원본 453×614 기준 (344,344)). 시간은 timeline 사건에서만 받는다.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeInOut = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) };
const YELLOW = "#FFD16A";

// 2020 재보정본(2160×3840 파생본을 1080×1920으로 표시)에서 지구 점
const DOT20 = { x: 450, y: 987 };
// 1990 원본(453×614)에서 지구 점(밝은 화소 2개 중 왼쪽)
const DOT90 = { x: 344, y: 344 };

const useEvent = (timeline: EditorialTimeline, conceptId: string, eventId: string): CompiledEvent =>
  eventInConcept(timeline, conceptId, eventId);

/** 2020본 전체 화면. scale은 점을 중심으로 키운다. */
const Pbd2020: React.FC<{ pilot: EditorialPilotData; scale?: number; opacity?: number }> = ({ pilot, scale = 1, opacity = 1 }) => (
  <AbsoluteFill style={{ opacity }}>
    <Img
      src={pilot.file("editorial/pbd2020.jpg")}
      style={{ width: 1080, height: 1920, scale: String(scale), transformOrigin: `${DOT20.x}px ${DOT20.y}px` }}
    />
  </AbsoluteFill>
);

/**
 * 1990 원본을 화소 그대로(nearest) 확대해 지구 화소 (344,344)의 중심이 화면 (cx,cy)에 오게 놓는다.
 * 큰 배율에서도 보이는 영역만 그리도록 배경 이미지로 그린다(img에 scale을 걸면 수만 px 레이어가 비어 렌더됐다).
 */
const Pbd1990: React.FC<{ pilot: EditorialPilotData; px: number; cx: number; cy: number; opacity?: number }> = ({ pilot, px, cx, cy, opacity = 1 }) => {
  const src = pilot.file("editorial/pbd1990.png");
  return (
    <AbsoluteFill style={{ opacity, backgroundColor: "#05070b" }}>
      <Img src={src} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${src})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${453 * px}px ${614 * px}px`,
          backgroundPosition: `${cx - (DOT90.x + 0.5) * px}px ${cy - (DOT90.y + 0.5) * px}px`,
          imageRendering: "pixelated",
        }}
      />
    </AbsoluteFill>
  );
};

/** 1990 원본의 지구 주변을 작은 상자(w×h)에 화소 그대로 채운다. 지구 화소가 상자 중앙. */
const Pbd1990Box: React.FC<{ pilot: EditorialPilotData; px: number; w: number; h: number }> = ({ pilot, px, w, h }) => {
  const src = pilot.file("editorial/pbd1990.png");
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#05070b", backgroundImage: `url(${src})`, backgroundRepeat: "no-repeat", backgroundSize: `${453 * px}px ${614 * px}px`, backgroundPosition: `${w / 2 - (DOT90.x + 0.5) * px}px ${h / 2 - (DOT90.y + 0.5) * px}px`, imageRendering: "pixelated" }} />
  );
};

const Label: React.FC<{ name: string; x: number; y: number; opacity: number; size?: number; color?: string; align?: "left" | "center" | "right"; children: React.ReactNode }> = ({ name, x, y, opacity, size = 52, color = "#fff", align = "left", children }) => (
  <Interactive.Div
    name={name}
    style={{
      position: "absolute",
      left: align === "left" ? x : undefined,
      right: align === "right" ? 1080 - x : undefined,
      top: y,
      width: align === "center" ? 1080 : undefined,
      marginLeft: align === "center" ? x - 540 : undefined,
      textAlign: align,
      opacity,
      fontFamily: "Pretendard",
      fontWeight: 700,
      fontSize: size,
      color,
      whiteSpace: "nowrap",
      textShadow: "0 2px 12px rgba(0,0,0,0.85)",
    }}
  >
    {children}
  </Interactive.Div>
);

// ── c1 후킹: 2020본, 점 쪽으로 느린 접근, 점 찾기 원
const C1: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const base = useEvent(t, "c1_hook", "pbd2020_in");
  const dot = useEvent(t, "c1_hook", "dot_find");
  const push = interpolate(frame, [base.from, base.end], [1.0, 1.1], clamp);
  const draw = eventProgress(frame, dot, "enter");
  const r = 46 * push;
  const circ = 2 * Math.PI * r;
  const dx = DOT20.x, dy = DOT20.y;
  return (
    <AbsoluteFill>
      <Pbd2020 pilot={pilot} scale={push} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: eventOpacity(frame, dot) }}>
        <circle cx={dx} cy={dy} r={r} fill="none" stroke={YELLOW} strokeWidth={4} strokeDasharray={circ} strokeDashoffset={circ * (1 - draw)} transform={`rotate(-90 ${dx} ${dy})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ── c2 보이저: 1977 발사 실사 → 보이저 시점 시뮬레이션 위 시선선과 60억 km, 안쪽 태양계로 접근
// 시뮬레이션(PIA23681 세로 크롭 1080×1920) 좌표: 보이저 1호, 지구 프레임(E), 태양
const SIM_VOYAGER = { x: 718, y: 913 };
const SIM_INNER = { x: 401, y: 574 };
const SIM_SUN = { x: 437, y: 551 };

/** 시뮬레이션을 배율 z로, 화면 (ax,ay)에 시뮬레이션 점 (fx,fy)가 오게 놓는다. 오버레이는 같은 좌표계로 children에 그린다. */
const SimFrame: React.FC<{ pilot: EditorialPilotData; z: number; fx: number; fy: number; ax: number; ay: number; children?: React.ReactNode }> = ({ pilot, z, fx, fy, ax, ay, children }) => (
  <div style={{ position: "absolute", left: ax - fx * z, top: ay - fy * z, width: 1080, height: 1920, scale: String(z), transformOrigin: "0 0" }}>
    <Img src={pilot.file("editorial/sim.jpg")} style={{ position: "absolute", width: 1080, height: 1920 }} />
    {children}
  </div>
);

const C2: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const launch = useEvent(t, "c2_lookback", "launch_in");
  const sim = useEvent(t, "c2_lookback", "sim_in");
  const dist = useEvent(t, "c2_lookback", "distance_label");
  const tag = useEvent(t, "c2_lookback", "earth_tag_in");
  // 60억 km 이후 안쪽 태양계로 천천히 다가간다(보이저 위치는 화면 아래로 빠진다)
  const k = interpolate(frame, [dist.settled, sim.to], [0, 1], easeInOut);
  const z = 1 + 0.7 * k;
  const fx = SIM_VOYAGER.x + (SIM_INNER.x - SIM_VOYAGER.x) * (0.5 + 0.5 * k);
  const fy = SIM_VOYAGER.y + (SIM_INNER.y - SIM_VOYAGER.y) * (0.5 + 0.5 * k);
  const line = eventProgress(frame, dist, "enter");
  const lx = SIM_VOYAGER.x + (SIM_INNER.x - SIM_VOYAGER.x) * line;
  const ly = SIM_VOYAGER.y + (SIM_INNER.y - SIM_VOYAGER.y) * line;
  const mid = { x: (SIM_VOYAGER.x + SIM_INNER.x) / 2, y: (SIM_VOYAGER.y + SIM_INNER.y) / 2 };
  const distO = eventOpacity(frame, dist);
  const tagO = eventOpacity(frame, tag);
  return (
    <AbsoluteFill style={{ backgroundColor: "#030911" }}>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, sim) }}>
        <SimFrame pilot={pilot} z={z} fx={fx} fy={fy} ax={540} ay={760}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <g opacity={distO}>
              <line x1={SIM_VOYAGER.x} y1={SIM_VOYAGER.y} x2={lx} y2={ly} stroke={YELLOW} strokeWidth={5 / z} strokeDasharray={`${14 / z} ${10 / z}`} strokeLinecap="round" />
            </g>
            <circle cx={SIM_INNER.x} cy={SIM_INNER.y} r={30 / z} fill="none" stroke={YELLOW} strokeWidth={4 / z} opacity={Math.max(distO * line, tagO)} />
          </svg>
        </SimFrame>
        {/* 시뮬레이션 자체 영문 라벨·썸네일이 지시 대상과 겹치지 않게 주변을 강하게 누른다 */}
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 420px 520px at 540px 760px, rgba(0,0,0,0) 30%, rgba(2,4,9,0.9) 100%)" }} />
        <Label name="거리 라벨" x={540 + (mid.x - fx) * z + 40} y={760 + (mid.y - fy) * z - 34} opacity={distO} size={64} color={YELLOW}>
          60억 km
        </Label>
        <Label name="지구 라벨" x={540 + (SIM_INNER.x - fx) * z - 30 / z - 18} y={760 + (SIM_INNER.y - fy) * z - 30} opacity={tagO} size={54} color={YELLOW} align="right">
          지구
        </Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 1 - eventProgress(frame, launch, "exit") }}>
        <Sequence from={launch.from} durationInFrames={Math.max(1, launch.end - launch.from)} layout="none">
          <OffthreadVideo src={pilot.file("editorial/launch.mp4")} muted startFrom={90} style={{ position: "absolute", width: 1080, height: 1920, objectFit: "cover", filter: "blur(28px) brightness(0.45)", scale: "1.1" }} />
          <div style={{ position: "absolute", left: -180, top: 420, width: 1440, height: 1080, overflow: "hidden" }}>
            <OffthreadVideo src={pilot.file("editorial/launch.mp4")} muted startFrom={90} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c3 화소: 1990 원본 확대 → 화소 1칸과 실제 크기 0.12 → 시뮬레이션 속 태양 옆 지구 → 우연한 햇빛 줄기
const P90 = 3.3; // 1990 원본 1화소 = 3.3px (전체 화면)
const CX90 = 720, CY90 = 1135;
const CELL = 220; // 최대 확대에서 원본 화소 1칸의 화면 크기 — 기준 사각형은 지구 화소 한 칸과 정확히 겹친다
const C3: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const base = useEvent(t, "c3_pixel", "pbd1990_in");
  const year = useEvent(t, "c3_pixel", "year90_in");
  const cell = useEvent(t, "c3_pixel", "pixel_cell");
  const size = useEvent(t, "c3_pixel", "true_size_label");
  const sun = useEvent(t, "c3_pixel", "sun_in");
  const sunTag = useEvent(t, "c3_pixel", "sun_tag_in");
  const nearTag = useEvent(t, "c3_pixel", "near_earth_in");
  const beam = useEvent(t, "c3_pixel", "beam_glow");
  // 확대: 등장~settled 동안 화소 1칸이 CELL px이 될 때까지(지수 보간), 햇빛 줄기 구간에서 다시 전체로
  const kIn = interpolate(frame, [base.from, base.settled], [0, 1], easeInOut);
  const kOut = interpolate(frame, [beam.from, beam.settled], [0, 1], easeInOut);
  const k = kIn * (1 - kOut);
  const px = P90 * Math.pow(CELL / P90, k);
  const cellP = eventProgress(frame, cell, "enter");
  const cellO = eventOpacity(frame, cell);
  const trueO = eventOpacity(frame, size);
  const trueSide = CELL * 0.12;
  // 원본의 주 햇빛 줄기 중심선: 원본 좌표 (402,0)→(305,614)를 화면으로(실측 추적값)
  const bx = (x: number) => CX90 + (x - DOT90.x - 0.5) * P90;
  const by = (y: number) => CY90 + (y - DOT90.y - 0.5) * P90;
  const beamO = eventOpacity(frame, beam);
  const beamDraw = eventProgress(frame, beam, "enter");
  const off = 46; // 줄기 중심선에서 양쪽 표시선까지(px)
  const yTop = 430; // 로고(y250–390)·출처 아래에서 시작
  const tTop = (yTop - by(0)) / (by(614) - by(0));
  const xAt = (u: number) => bx(402) + (bx(305) - bx(402)) * u;
  const y0 = yTop, x0 = xAt(tTop);
  const y1 = y0 + (by(614) - y0) * beamDraw, x1 = x0 + (xAt(1) - x0) * beamDraw;
  // 태양 근접: 시뮬레이션 안쪽 태양계를 확대
  const sunO = eventOpacity(frame, sun);
  const sz = interpolate(frame, [sun.from, sun.end], [2.4, 3.6], clamp);
  const smx = (SIM_SUN.x + SIM_INNER.x) / 2, smy = (SIM_SUN.y + SIM_INNER.y) / 2;
  const sx = (x: number) => 540 + (x - smx) * sz, sy = (y: number) => 820 + (y - smy) * sz;
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <Pbd1990 pilot={pilot} px={px} cx={CX90} cy={CY90} opacity={1 - eventProgress(frame, base, "exit")} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={beamO}>
          <line x1={x0 - off} y1={y0} x2={x1 - off} y2={y1} stroke={YELLOW} strokeWidth={4} strokeDasharray="16 12" />
          <line x1={x0 + off} y1={y0} x2={x1 + off} y2={y1} stroke={YELLOW} strokeWidth={4} strokeDasharray="16 12" />
        </g>
        <g opacity={cellO}>
          <rect x={CX90 - (CELL / 2) * cellP} y={CY90 - (CELL / 2) * cellP} width={CELL * cellP} height={CELL * cellP} fill="none" stroke="#ffffff" strokeWidth={4} />
        </g>
        <g opacity={trueO}>
          <rect x={CX90 - trueSide / 2} y={CY90 - trueSide / 2} width={trueSide} height={trueSide} fill="#7fc4ff" />
          <line x1={CX90 - trueSide / 2 - 4} y1={CY90 - trueSide / 2 - 4} x2={CX90 - CELL / 2 - 70} y2={CY90 - CELL / 2 - 70} stroke={YELLOW} strokeWidth={3} />
        </g>
      </svg>
      <Label name="실제 크기 라벨" x={CX90 - CELL / 2 - 70} y={CY90 - CELL / 2 - 140} opacity={trueO} size={54} color={YELLOW} align="right">
        실제 크기 0.12화소
      </Label>
      <AbsoluteFill style={{ opacity: sunO, backgroundColor: "#020308" }}>
        <SimFrame pilot={pilot} z={sz} fx={smx} fy={smy} ax={540} ay={820} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 380px 420px at 540px 820px, rgba(0,0,0,0) 35%, rgba(2,3,8,0.92) 100%)" }} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={sx(SIM_INNER.x)} cy={sy(SIM_INNER.y)} r={44} fill="none" stroke={YELLOW} strokeWidth={4} opacity={eventOpacity(frame, nearTag)} />
        </svg>
        <Label name="태양 라벨" x={sx(SIM_SUN.x) + 60} y={sy(SIM_SUN.y) - 110} opacity={eventOpacity(frame, sunTag)} size={56}>
          태양
        </Label>
        <Label name="지구 라벨" x={sx(SIM_INNER.x) - 60} y={sy(SIM_INNER.y) + 40} opacity={eventOpacity(frame, nearTag)} size={56} color={YELLOW} align="right">
          지구
        </Label>
      </AbsoluteFill>
      <Label name="1990 판본" x={80} y={400} opacity={eventOpacity(frame, year) * (sunO > 0.02 ? 0 : 1)} size={56}>
        1990
      </Label>
    </AbsoluteFill>
  );
};

// ── c4 가족 초상화: 행성 여섯 칸과 이름, 지구 칸 강조, 카메라 꺼짐에 암전
const FAM_SCALE = 1000 / 620;
const FAM_TOP = 470;
// PIA00453 칸 순서(NASA 캡션): 위 금성·지구·목성, 아래 토성·천왕성·해왕성
const FAM_NAMES = [["금성", "지구", "목성"], ["토성", "천왕성", "해왕성"]];
const C4: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const fam = useEvent(pilot.timeline, "c4_family", "family_in");
  const enter = eventProgress(frame, fam, "enter");
  const off = eventProgress(frame, fam, "exit");
  // 지구 칸(원본 220..400 × 20..220)
  const ex = 40 + 220 * FAM_SCALE, ey = FAM_TOP + 20 * FAM_SCALE, ew = 180 * FAM_SCALE, eh = 200 * FAM_SCALE;
  const hi = interpolate(frame, [fam.from, fam.settled], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: enter * (1 - off) }}>
        <Img src={pilot.file("editorial/family6.png")} style={{ position: "absolute", left: 40, top: FAM_TOP, width: 1000, height: 500 * FAM_SCALE }} />
        <div style={{ position: "absolute", left: ex - 6, top: ey - 6, width: ew + 12, height: eh + 12, border: `4px solid ${YELLOW}`, opacity: hi }} />
        {FAM_NAMES.map((row, r) =>
          row.map((name, i) => {
            const cx = 40 + (110 + 200 * i) * FAM_SCALE;
            const top = FAM_TOP + (r === 0 ? 228 : 468) * FAM_SCALE - 6;
            const isEarth = name === "지구";
            return (
              <Label key={name} name={`${name} 칸`} x={cx} y={top} opacity={isEarth ? hi : hi * 0.85} size={isEarth ? 50 : 40} color={isEarth ? YELLOW : "#cfd6de"} align="center">
                {name}
              </Label>
            );
          }),
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c5 재보정: 사진 밖 패널의 세 색 필터 합성 → 1990 위로 2020 와이프(지구 점 정합)
const P90_ALIGN = 5.8;
const C5: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const wipeEv = useEvent(t, "c5_remaster", "wipe");
  const filt = useEvent(t, "c5_remaster", "filters");
  const year = useEvent(t, "c5_remaster", "year_tag");
  // '흰색으로' 발화 전에 와이프가 빛줄기와 점을 지나도록 필터 패널 퇴장과 함께 진행
  const wipe = interpolate(frame, [filt.to - 18, filt.to + 10], [0, 1], easeInOut);
  const wx = 1080 * wipe;
  const merge = eventProgress(frame, filt, "enter");
  const panelO = eventOpacity(frame, filt);
  const colors = ["#3dd68c", "#3d8bff", "#9b5cff"]; // 녹·청·보라(NASA: green, blue and violet)
  const yo = eventOpacity(frame, year);
  return (
    <AbsoluteFill style={{ opacity: 1 - eventProgress(frame, wipeEv, "exit") }}>
      <Pbd1990 pilot={pilot} px={P90_ALIGN} cx={DOT20.x} cy={DOT20.y} />
      <AbsoluteFill style={{ clipPath: `inset(0 ${1080 - wx}px 0 0)` }}>
        <Pbd2020 pilot={pilot} />
      </AbsoluteFill>
      {wipe > 0 && wipe < 1 ? <div style={{ position: "absolute", left: wx - 2, top: 0, width: 4, height: 1920, backgroundColor: "rgba(255,255,255,0.85)" }} /> : null}
      {/* 세 필터: 같은 1990 지구 주변 영역을 녹·청·보라 필터 한 장씩으로 보이고 겹쳐 원본 색 한 장이 된다(원리 표시) */}
      <AbsoluteFill style={{ opacity: panelO }}>
        <AbsoluteFill style={{ backgroundColor: "rgba(3,6,14,0.55)" }} />
        {colors.map((c, i) => {
          const spread = (i - 1) * 300 * (1 - merge);
          const tint = 1 - merge;
          return (
            <div key={c} style={{ position: "absolute", left: 540 - 130 + spread, top: 560, width: 260, height: 340, overflow: "hidden", borderRadius: 14, border: `3px solid ${c}`, mixBlendMode: i === 0 ? "normal" : "screen" }}>
              <div style={{ position: "absolute", inset: 0, filter: `grayscale(${tint})` }}>
                <Pbd1990Box pilot={pilot} px={4.2} w={260} h={340} />
              </div>
              <div style={{ position: "absolute", inset: 0, backgroundColor: c, mixBlendMode: "multiply", opacity: 0.85 * tint }} />
            </div>
          );
        })}
      </AbsoluteFill>
      <Label name="1990" x={80} y={400} opacity={yo * (1 - wipe)} size={56}>
        1990
      </Label>
      <Label name="2020" x={80} y={400} opacity={yo * wipe} size={56} color="#cfe6ff">
        2020
      </Label>
    </AbsoluteFill>
  );
};

// ── c6 세이건: 2020본의 점을 얇은 원으로 유지 → ISS 대륙 실사
const C6: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const dot = useEvent(t, "c6_sagan", "dot_hold");
  const earth = useEvent(t, "c6_sagan", "earth_in");
  const push = interpolate(frame, [dot.from, dot.end], [1.0, 1.35], clamp);
  const ring = eventProgress(frame, dot, "enter");
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <AbsoluteFill style={{ backgroundColor: "#030911" }}>
      <AbsoluteFill style={{ opacity: 1 - eventProgress(frame, dot, "exit") }}>
        <Pbd2020 pilot={pilot} scale={push} />
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <circle cx={DOT20.x} cy={DOT20.y} r={r} fill="none" stroke={YELLOW} strokeWidth={3} opacity={Math.max(0, 1 - 4 * eventProgress(frame, dot, "exit"))} strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} transform={`rotate(-90 ${DOT20.x} ${DOT20.y})`} />
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, earth) }}>
        <Sequence from={earth.from} durationInFrames={Math.max(1, earth.end - earth.from)} layout="none">
          <OffthreadVideo src={pilot.file("editorial/iss.mp4")} muted startFrom={60} style={{ width: 1080, height: 1920, objectFit: "cover", scale: "1.14", transformOrigin: "50% 40%" }} />
        </Sequence>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(2,4,9,0.55) 0%, rgba(2,4,9,0) 28%)" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── c7 마무리: 처음의 점으로 돌아와 멀어진다
const C7: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const ev = useEvent(pilot.timeline, "c7_close", "final_out");
  const scale = interpolate(frame, [ev.from, ev.end], [1.25, 1.0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#030911" }}>
      <Pbd2020 pilot={pilot} scale={scale} opacity={eventProgress(frame, ev, "enter")} />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<{ pilot: EditorialPilotData }>> = {
  c1_hook: C1,
  c2_lookback: C2,
  c3_pixel: C3,
  c4_family: C4,
  c5_remaster: C5,
  c6_sagan: C6,
  c7_close: C7,
};

export const EditorialEpisode: React.FC<EditorialEpisodeProps> = ({ pilot }) => (
  <AbsoluteFill style={{ backgroundColor: "#030911" }}>
    {pilot.timeline.concepts.map((concept) => {
      const Scene = SCENES[concept.id];
      return (
        <ConceptSequence key={concept.id} timeline={pilot.timeline} conceptId={concept.id}>
          {Scene ? <Scene pilot={pilot} /> : null}
        </ConceptSequence>
      );
    })}
  </AbsoluteFill>
);
