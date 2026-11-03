import React from "react";
import { AbsoluteFill, Easing, Img, Interactive, interpolate, OffthreadVideo, Sequence, spring, useCurrentFrame } from "remotion";
import { ConceptSequence, eventInConcept, eventOpacity, eventProgress } from "../../lib/editorial";
import type { CompiledEvent, EditorialTimeline } from "../../lib/editorial";
import { EditorialScreenText } from "../ScreenText";
import type { EditorialEpisodeProps, EditorialPilotData } from "../pilot";

/**
 * 버진 갤럭틱 아페론 공개 — 우주여행의 꿈과 11억 원.
 * 실사는 모두 버진 갤럭틱 공식 프레스킷·공식 영상이다. 점화·우주·객실 영상은 이전 기체 유니티라 화면에 표기한다.
 * 고도 눈금은 0~100km 선형, 가격 막대는 20:85 비율, 예약자 사람 아이콘은 정확히 675개다. 비행 고도 곡선의 모양·무중력 구간 폭은 측정값이 아니다.
 * 하늘 단면·어두운 지구 배경은 Higgsfield 생성 재료다(관측 아님).
 * 시간은 timeline 사건에서만 받는다.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeInOut = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) };
const YELLOW = "#FFD16A";

/** 탄성 등장 — 값이 아닌 요소(라벨·패널·표시점)에만 쓴다. 정량 막대 길이에는 반동을 주지 않는다 */
const pop = (frame: number, at: number, damping = 10) => spring({ frame: frame - at, fps: 30, config: { damping, stiffness: 180, mass: 0.6 } });
/** 빠르게 멈추는 스냅(값을 넘지 않음) */
const snap = (frame: number, from: number, to: number) => interpolate(frame, [from, Math.max(from + 1, to)], [0, 1], { ...clamp, easing: Easing.out(Easing.exp) });

const useEvent = (timeline: EditorialTimeline, conceptId: string, eventId: string): CompiledEvent =>
  eventInConcept(timeline, conceptId, eventId);

const Label: React.FC<{ name: string; x: number; y: number; opacity: number; k?: number; size?: number; color?: string; align?: "left" | "center" | "right"; weight?: number; children: React.ReactNode }> = ({ name, x, y, opacity, k = 1, size = 52, color = "#fff", align = "left", weight = 700, children }) => (
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
      scale: String(0.7 + 0.3 * k),
      transformOrigin: align === "right" ? "100% 50%" : align === "center" ? "50% 50%" : "0% 50%",
      fontFamily: "Pretendard",
      fontWeight: weight,
      fontSize: size,
      color,
      whiteSpace: "nowrap",
      textShadow: "0 2px 14px rgba(0,0,0,0.9)",
    }}
  >
    {children}
  </Interactive.Div>
);

/** 정지 사진 전체 화면, 느린 접근 */
const Photo: React.FC<{ pilot: EditorialPilotData; file: string; scale: number; opacity?: number; filter?: string; origin?: string }> = ({ pilot, file, scale, opacity = 1, filter, origin = "50% 50%" }) => (
  <AbsoluteFill style={{ opacity }}>
    <Img src={pilot.file(file)} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(scale), transformOrigin: origin, filter }} />
  </AbsoluteFill>
);

/** 실사 영상 전체 화면(세로 크롭) */
const FullVideo: React.FC<{ pilot: EditorialPilotData; file: string; ev: CompiledEvent; rate: number; position?: string; scale?: number }> = ({ pilot, file, ev, rate, position = "50% 50%", scale = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: eventOpacity(frame, ev) }}>
      <Sequence from={ev.from} durationInFrames={Math.max(1, ev.end - ev.from)} layout="none">
        <OffthreadVideo src={pilot.file(file)} muted playbackRate={rate} style={{ width: 1080, height: 1920, objectFit: "cover", objectPosition: position, scale: String(scale) }} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 가로 실사를 띠로 크게 보이고 같은 영상의 흐린 확대로 화면을 채운다(번인 자막을 잘라낸 1280×520 파생본) */
const BandVideo: React.FC<{ pilot: EditorialPilotData; file: string; ev: CompiledEvent; rate: number; top?: number; width?: number; aspect?: number; still?: boolean; push?: number }> = ({ pilot, file, ev, rate, top = 600, width = 1500, aspect = 520 / 1280, still = false, push = 1 }) => {
  const frame = useCurrentFrame();
  const h = width * aspect;
  const media = (style: React.CSSProperties) =>
    still ? <Img src={pilot.file(file)} style={style} /> : <OffthreadVideo src={pilot.file(file)} muted playbackRate={rate} style={style} />;
  return (
    <AbsoluteFill style={{ opacity: eventOpacity(frame, ev), backgroundColor: "#05070b" }}>
      <Sequence from={ev.from} durationInFrames={Math.max(1, ev.end - ev.from)} layout="none">
        {media({ position: "absolute", width: 1080, height: 1920, objectFit: "cover", filter: "blur(36px) brightness(0.42)", scale: "1.15" })}
        <div style={{ position: "absolute", left: (1080 - width) / 2, top, width, height: h, overflow: "hidden", scale: String(push) }}>
          {media({ width: "100%", height: "100%", objectFit: "cover" })}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

/** 공통 로고(오른쪽 위) 뒤 배경을 살짝 눌러 밝은 화면에서도 로고가 또렷하게 보이게 한다 */
const LogoShade: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <AbsoluteFill style={{ opacity, background: "radial-gradient(circle 170px at 930px 320px, rgba(3,6,12,0.62) 0%, rgba(3,6,12,0.35) 55%, rgba(3,6,12,0) 100%)" }} />
);

/** 이전 기체 영상 표기 — 해당 영상이 보이는 동안 오른쪽 아래(자막 위) */
const UnityTag: React.FC<{ opacity: number; top?: number }> = ({ opacity, top = 1296 }) => (
  <Interactive.Div
    name="유니티 표기"
    style={{ position: "absolute", right: 80, top, opacity, fontFamily: "Pretendard", fontWeight: 700, fontSize: 44, color: "#E9EDF2", backgroundColor: "rgba(6,10,18,0.62)", padding: "10px 22px", borderRadius: 10, whiteSpace: "nowrap" }}
  >
    1세대 우주비행기 VSS 유니티
  </Interactive.Div>
);

// ── 후킹: 석양 활주로의 아페론 꼬리, 문구 구간을 누른다(문구는 공통 후킹 트랙)
const Hook: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const bg = useEvent(pilot.timeline, "hook_dream", "heroone_in");
  const hook = useEvent(pilot.timeline, "hook_dream", "hook_text");
  const push = interpolate(frame, [bg.from, bg.end], [1.0, 1.08], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <Photo pilot={pilot} file="editorial/heroone.jpg" scale={push} opacity={eventOpacity(frame, bg)} origin="60% 45%" />
      <AbsoluteFill style={{ opacity: 0.35 + 0.5 * eventOpacity(frame, hook), background: "linear-gradient(180deg, rgba(4,6,12,0.15) 0%, rgba(4,6,12,0.78) 30%, rgba(4,6,12,0.78) 52%, rgba(4,6,12,0.1) 75%)" }} />
    </AbsoluteFill>
  );
};

// 이륙 영상 속 아페론 머리(보라색 선체 앞끝) 위치(영상 시각 초, 화면 폭·높이 비율). 보라색 화소의 앞쪽 3% 영역 중심을 0.1초마다 실측했다(ch_takeoff 파생본 1280×520). 처음 0.2초는 화면이 어두워 0.3초 값을 쓴다
const TK_TRACK: [number, number, number][] = [[0.1,0.422,0.44], [0.2,0.422,0.44], [0.3,0.422,0.44], [0.4,0.419,0.445], [0.5,0.419,0.433], [0.6,0.412,0.418], [0.7,0.408,0.405], [0.8,0.409,0.391], [0.9,0.405,0.388], [1,0.398,0.403], [1.1,0.397,0.431], [1.2,0.394,0.434], [1.3,0.397,0.447], [1.4,0.402,0.458], [1.5,0.399,0.466], [1.6,0.397,0.47], [1.7,0.39,0.46]];
const trackAt = (t: number): [number, number] => {
  // 실측 점의 잔떨림을 줄이려고 앞뒤 0.2초 평균을 선형 보간한다
  const avg = (i: number) => { const w = TK_TRACK.slice(Math.max(0, i - 2), i + 3); return [w.reduce((a, p) => a + p[1], 0) / w.length, w.reduce((a, p) => a + p[2], 0) / w.length]; };
  const i = Math.max(0, Math.min(TK_TRACK.length - 2, TK_TRACK.findIndex((p) => p[0] > t) - 1));
  const u = Math.max(0, Math.min(1, (t - TK_TRACK[i][0]) / (TK_TRACK[i + 1][0] - TK_TRACK[i][0])));
  const a = avg(i), b = avg(i + 1);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
};
const TK_RATE = 0.33;
const TK_BAND = { top: 620, w: 1500 };

// ── 공개(모두 실제 영상): 스페이스포트 아메리카 공중 → 동체 APEIRON 글자 → 모선에 매달려 이륙하는 아페론(10월 28일)
const Reveal: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const port = useEvent(t, "apeiron_reveal", "spaceport_in");
  const name = useEvent(t, "apeiron_reveal", "name_in");
  const takeoff = useEvent(t, "apeiron_reveal", "takeoff_in");
  const tag = useEvent(t, "apeiron_reveal", "tag_apeiron_in");
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <BandVideo pilot={pilot} file="editorial/spaceport.mp4" ev={port} rate={0.95} top={600} width={1600} />
      <BandVideo pilot={pilot} file="editorial/apeiron_name.mp4" ev={name} rate={0.54} top={600} width={1600} />
      <BandVideo pilot={pilot} file="editorial/ch_takeoff.mp4" ev={takeoff} rate={TK_RATE} top={TK_BAND.top} width={TK_BAND.w} />
      {(() => {
        // 영상 속 아페론(모선 날개 중앙 아래 보라색 기체)을 따라가는 라벨
        const ct = Math.max(0, (frame - takeoff.from) / 30) * TK_RATE;
        const [cx, cy] = trackAt(ct);
        const px = (1080 - TK_BAND.w) / 2 + cx * TK_BAND.w, py = TK_BAND.top + cy * TK_BAND.w * (520 / 1280);
        const o = eventOpacity(frame, tag);
        return (
          <>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
              <line x1={px} y1={py - 112} x2={px} y2={py - 14} stroke={YELLOW} strokeWidth={3} />
              <circle cx={px} cy={py} r={9} fill="none" stroke={YELLOW} strokeWidth={4} />
            </svg>
            <Pill name="아페론 표기" x={px - 92} y={py - 196} opacity={o} k={pop(frame, tag.from)} size={46}>
              아페론
            </Pill>
          </>
        );
      })()}
    </AbsoluteFill>
  );
};

// ── 카메라와 깊이: 도해 묶음은 살짝 기운 채 천천히 돌며 다가오고(Cam), 배경은 반대로 느리게 흐른다(Drift)
const camU = (frame: number, from: number, to: number) => interpolate(frame, [from, Math.max(from + 1, to)], [0, 1], easeInOut);
const Cam: React.FC<{ from: number; to: number; dir?: 1 | -1; children: React.ReactNode }> = ({ from, to, dir = 1, children }) => {
  const frame = useCurrentFrame();
  const u = camU(frame, from, to);
  const ry = dir * (-7 + 10 * u);
  const rx = 6 - 4 * u;
  const sc = 0.96 + 0.06 * u;
  const ty = 14 - 28 * u;
  return (
    <AbsoluteFill style={{ transform: `perspective(1700px) translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc})`, transformOrigin: "50% 48%" }}>
      {children}
    </AbsoluteFill>
  );
};
const Drift: React.FC<{ from: number; to: number; dir?: 1 | -1; children: React.ReactNode }> = ({ from, to, dir = 1, children }) => {
  const frame = useCurrentFrame();
  const u = camU(frame, from, to);
  return <AbsoluteFill style={{ transform: `translateX(${dir * (22 - 44 * u)}px) scale(${1.05 + 0.04 * u})` }}>{children}</AbsoluteFill>;
};

// ── 공통 유리 패널(도해 바탕)
const Panel: React.FC<{ x: number; y: number; w: number; h: number; opacity: number; k?: number; sweepAt?: number; children?: React.ReactNode }> = ({ x, y, w, h, opacity, k = 1, sweepAt, children }) => {
  const frame = useCurrentFrame();
  const sw = sweepAt === undefined ? -1 : interpolate(frame, [sweepAt, sweepAt + 30], [-0.6, 1.6], clamp);
  return (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity, scale: String(0.92 + 0.08 * k), borderRadius: 28, overflow: "hidden", background: "linear-gradient(180deg, rgba(14,22,40,0.78) 0%, rgba(6,10,20,0.84) 100%)", boxShadow: "0 18px 60px rgba(0,0,0,0.55), inset 0 0 0 1.5px rgba(255,255,255,0.16)" }}>
    {children}
    {sw > -0.6 && sw < 1.6 ? <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sw * 100 - 30}%`, width: "30%", background: "linear-gradient(105deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0) 100%)" }} /> : null}
  </div>
  );
};

/** 도해 안의 작은 글자(축·단위) */
const Tick: React.FC<{ x: number; y: number; opacity: number; align?: "left" | "center" | "right"; size?: number; color?: string; children: React.ReactNode }> = ({ x, y, opacity, align = "left", size = 30, color = "#AEB8C6", children }) => (
  <div style={{ position: "absolute", top: y, left: align === "left" ? x : align === "center" ? x - 200 : undefined, right: align === "right" ? 1080 - x : undefined, width: align === "center" ? 400 : undefined, textAlign: align, opacity, fontFamily: "Pretendard", fontWeight: 600, fontSize: size, color, whiteSpace: "nowrap" }}>
    {children}
  </div>
);

/** 대상에 선으로 붙는 알약 라벨 */
const Pill: React.FC<{ name: string; x: number; y: number; opacity: number; k?: number; color?: string; border?: string; weight?: number; size?: number; children: React.ReactNode }> = ({ name, x, y, opacity, k = 1, color = YELLOW, border, weight = 800, size = 48, children }) => (
  <Interactive.Div name={name} style={{ position: "absolute", left: x, top: y, opacity, scale: String(0.6 + 0.4 * k), transformOrigin: "0% 50%", fontFamily: "Pretendard", fontWeight: weight, fontSize: size, color, background: "rgba(6,10,20,0.78)", border: `2px solid ${border ?? color}`, borderRadius: 999, padding: "8px 26px", whiteSpace: "nowrap", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
    {children}
  </Interactive.Div>
);

const quad = (a: number[], c: number[], b: number[], n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  });
const partial = (pts: number[][], p: number) => pts.slice(0, Math.max(1, Math.round(p * (pts.length - 1))) + 1);
const poly = (pts: number[][]) => pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ");

// ── 비행 방식(0:15~0:30, 실사 없음): 고도-시간 그래프. 모선에 실린 아페론이 15km까지(2D) → 점화 → 3D 로우앵글 상승 → 2D 복귀와 대기층
const GX0 = 190, GX1 = 990, GY0 = 1290; // 시간 0~1, 지상
const KPX = 8.2; // 1km = 8.2px (100km = 820px)
const gx = (t: number) => GX0 + t * (GX1 - GX0);
const gy = (km: number) => GY0 - km * KPX;
const LEG1 = quad([0, 0], [0.32, 7], [0.5, 15], 40); // (시간, km) 모선 상승
const LEG2 = quad([0.5, 15], [0.585, 58], [0.62, 87], 50); // 정점 87km: 아이콘 끝까지 100km 선 아래(「근처」) // 점화 뒤 상승
const LAYERS: { id: string; lo: number; hi: number; fill: string; name: string; ev: string }[] = [
  { id: "tropo", lo: 0, hi: 12, fill: "rgba(120,190,255,0.26)", name: "대류권", ev: "l_tropo_in" },
  { id: "strato", lo: 12, hi: 50, fill: "rgba(80,140,235,0.22)", name: "성층권", ev: "l_strato_in" },
  { id: "meso", lo: 50, hi: 85, fill: "rgba(100,90,215,0.22)", name: "중간권", ev: "l_meso_in" },
  { id: "thermo", lo: 85, hi: 110, fill: "rgba(160,80,200,0.2)", name: "열권", ev: "l_thermo_in" },
];
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 397) % 1080, y: 60 + ((i * 263) % 760), r: 1 + (i % 3) * 0.7 }));

/** 그래프 평면(시간 t, 고도 km)을 화면으로. b=0 평면 그래프, b=1 지면 근처 카메라가 올려다보며 대상(cam)을 따라가는 로우앵글 */
const project = (t: number, km: number, b: number, cam: number[], zx = 1, px = 0) => {
  const flat = { x: GX0 + (gx(t) - GX0) * zx - px, y: gy(km) }; // zx: 가로(시간) 확대, px: 따라가기 이동
  if (b <= 0) return { ...flat, s: 1 };
  // 3D에서는 고도 간격을 3배로 늘려 앞쪽(위쪽) 고도선이 화면 위에서 내려와 지나가게 한다
  const th = (15 * Math.PI) / 180, d = 700, f = 800, S3 = 3;
  const u = gx(t) - 540, v = km * KPX * S3;
  const cu = gx(cam[0]) - 540, cv = cam[1] * KPX * S3 - 450;
  const dy = v - cv, dz = d;
  const yp = dy * Math.cos(th) - dz * Math.sin(th);
  const zp = Math.max(60, dy * Math.sin(th) + dz * Math.cos(th));
  const low = { x: 540 + (f * (u - cu)) / zp, y: 1150 - (f * yp) / zp };
  return { x: flat.x + (low.x - flat.x) * b, y: flat.y + (low.y - flat.y) * b, s: 1 + (f / zp - 1) * b };
};

/** 모선에 실린 아페론(옆모습 아이콘). 오른쪽이 앞 */
const CarrierIcon: React.FC<{ x: number; y: number; rot: number; scale: number; opacity: number; showShip: boolean }> = ({ x, y, rot, scale, opacity, showShip }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity}>
    <ellipse cx={0} cy={-8} rx={118} ry={7} fill="#D9E1EC" stroke="#0B1220" strokeWidth={3} />
    <rect x={-92} y={-26} width={186} height={20} rx={10} fill="#F5F7FB" stroke="#0B1220" strokeWidth={3} />
    <path d="M -88 -24 L -104 -54 L -88 -54 L -72 -24 Z" fill="#F5F7FB" stroke="#0B1220" strokeWidth={3} strokeLinejoin="round" />
    <circle cx={74} cy={-17} r={4} fill="#6FA8FF" />
    <ellipse cx={-52} cy={0} rx={14} ry={6} fill="#C8D1DE" stroke="#0B1220" strokeWidth={2.5} />
    <ellipse cx={52} cy={0} rx={14} ry={6} fill="#C8D1DE" stroke="#0B1220" strokeWidth={2.5} />
    {showShip ? (
      <g>
        <line x1={0} y1={-6} x2={0} y2={8} stroke="#0B1220" strokeWidth={4} />
        <ShipBody />
      </g>
    ) : null}
  </g>
);
/** 아페론 몸체(옆모습). 원점 기준 길이 약 110 */
const ShipBody: React.FC = () => (
  <g>
    <path d="M -48 12 L 40 12 Q 60 18 40 26 L -48 26 Z" fill="#FFFFFF" stroke="#0B1220" strokeWidth={3} strokeLinejoin="round" />
    <rect x={-40} y={17} width={66} height={4} rx={2} fill="#7B5CFF" />
    <path d="M -46 12 L -58 -4 L -46 -4 L -36 12 Z" fill="#7B5CFF" stroke="#0B1220" strokeWidth={2.5} strokeLinejoin="round" />
    <circle cx={22} cy={18} r={3} fill="#6FA8FF" />
  </g>
);
/** 제작 중인 기체: ShipBody와 같은 윤곽의 점선 테두리 */
const ShipOutline: React.FC = () => (
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(235,240,248,0.85)" strokeWidth={2.2} strokeDasharray="5 4" strokeLinejoin="round">
    <path d="M -48 12 L 40 12 Q 60 18 40 26 L -48 26 Z" />
    <path d="M -46 12 L -58 -4 L -46 -4 L -36 12 Z" />
  </g>
);

/** 점화 뒤 아페론 + 불꽃. 오른쪽이 앞(진행 방향으로 회전) */
const RocketIcon: React.FC<{ x: number; y: number; rot: number; scale: number; flame: number; frame: number }> = ({ x, y, rot, scale, flame, frame }) => {
  const flick = 1 + 0.18 * Math.sin(frame * 1.7) + 0.1 * Math.sin(frame * 3.1);
  const L = 70 * flame * flick;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`}>
      <g transform="translate(0 -19)">
        <path d={`M -48 12 L ${-48 - L} 19 L -48 26 Z`} fill="url(#flameOuter)" opacity={flame} />
        <path d={`M -48 15 L ${-48 - L * 0.55} 19 L -48 23 Z`} fill="#FFF6D6" opacity={flame} />
        <ShipBody />
      </g>
    </g>
  );
};

const HowItFlies: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const graph = useEvent(t, "how_it_flies", "graph_in");
  const aAlt = useEvent(t, "how_it_flies", "axis_alt_in");
  const aTime = useEvent(t, "how_it_flies", "axis_time_in");
  const carrier = useEvent(t, "how_it_flies", "carrier_climb");
  const t15 = useEvent(t, "how_it_flies", "tag_15_in");
  const ign = useEvent(t, "how_it_flies", "ignite");
  const rocket = useEvent(t, "how_it_flies", "rocket_climb");
  const view = useEvent(t, "how_it_flies", "view3d");
  const tk = useEvent(t, "how_it_flies", "tag_karman_in");
  const layers = useEvent(t, "how_it_flies", "layers_in");
  const gO = eventOpacity(frame, graph);
  const draw = snap(frame, graph.from, graph.settled);
  // 모선은 점화 직전까지 쉬지 않고 오른다(거의 일정한 속도로, 15km 점화 지점까지 위로 기울어진 채)
  const p1 = interpolate(frame, [carrier.from, carrier.settled], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.15, 0.7, 0.9) });
  // 점화 직후 묵직하게 출발해 점점 빨라진다(가속), 끝에서만 살짝 멎는다
  const climbEase = { ...clamp, easing: Easing.bezier(0.45, 0, 0.32, 1) };
  const p2 = interpolate(frame, [rocket.from, rocket.settled], [0, 1], climbEase);
  const p2Prev = interpolate(frame - 1, [rocket.from, rocket.settled], [0, 1], climbEase);
  const vN = Math.min(1, Math.max(0, (p2 - p2Prev) / 0.0095)); // 현재 속도(0~1)
  const b = Math.min(
    interpolate(frame, [view.from, view.settled], [0, 1], easeInOut),
    1 - interpolate(frame, [view.to, view.end], [0, 1], easeInOut),
  );
  const launched = frame >= rocket.from;
  const leg1 = partial(LEG1, p1);
  const leg2 = launched ? partial(LEG2, p2) : [];
  const head = launched ? leg2[leg2.length - 1] : leg1[leg1.length - 1];
  const cam = head;
  // 모선 구간은 가로축을 3배로 늘려 모선을 따라 화면이 옆으로 흐르고, 2D 복귀 때 전체 폭으로 줄어든다
  const ZX = 3;
  const zx = interpolate(frame, [view.to, view.end], [ZX, 1], easeInOut);
  const headFlat = GX0 + (gx(cam[0]) - GX0) * zx;
  const px = Math.max(0, headFlat - 600) * ((zx - 1) / (ZX - 1));
  const P = (q: number[]) => project(q[0], q[1], b, cam, zx, px);
  const toPoly = (pts: number[][]) => pts.map((q) => { const s = P(q); return `${s.x.toFixed(1)},${s.y.toFixed(1)}`; }).join(" ");
  const hs = P(head);
  // 진행 방향(화면 기준)
  const prev = launched ? leg2[Math.max(0, leg2.length - 3)] : leg1[Math.max(0, leg1.length - 3)];
  const ps = P(prev);
  const rot = (Math.atan2(hs.y - ps.y, hs.x - ps.x) * 180) / Math.PI;
  const flashU = interpolate(frame, [ign.from, ign.from + 14], [0, 1], clamp);
  const flashO = frame >= ign.from ? interpolate(frame, [ign.from, ign.from + 4, ign.from + 18], [0, 1, 0], clamp) : 0;
  const sep = P([0.5, 15]);
  // 점화 뒤 떨어져 나가는 모선
  const drop = interpolate(frame, [carrier.to, carrier.end], [0, 1], clamp);
  const flame = launched ? interpolate(frame, [ign.from, ign.settled], [0.2, 1], clamp) * (1 - 0.6 * interpolate(frame, [rocket.settled, rocket.settled + 20], [0, 1], clamp)) : 0;
  const alt = head[1];
  const space = interpolate(alt, [20, 95], [0, 1], clamp);
  const kO = eventOpacity(frame, tk);
  const iconScale = 1.5 * hs.s * (1 + 0.5 * b);
  const flatO = Math.max(0, 1 - b * 5); // 2D 눈금·축 글자
  const deepO = Math.max(0, (b - 0.7) / 0.3); // 3D 고도선 숫자
  // 3D 상승의 카메라: 추력에 맞춘 미세 진동, 속도가 붙을수록 시야가 넓어진다
  const thrust = b * flame;
  const shakeAmp = thrust * (1.5 + 6 * vN);
  const shakeX = Math.sin(frame * 2.3) * shakeAmp + Math.sin(frame * 5.1) * shakeAmp * 0.4;
  const shakeY = Math.cos(frame * 3.1) * shakeAmp * 0.7;
  const zoom = 1 - 0.08 * vN * b;
  // 꼬리 방향(배기 입자가 흩어지는 쪽)
  const tailX = -Math.cos((rot * Math.PI) / 180), tailY = -Math.sin((rot * Math.PI) / 180);
  return (
    <AbsoluteFill style={{ backgroundColor: "#04070f" }}>
      {/* 하늘: 오를수록 어두워진다 */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #050914 0%, #0B1B3A 38%, #1D4E8C 72%, #4D8BC4 100%)", opacity: 1 - 0.75 * space }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #020309 0%, #060B1A 60%, #0E2042 100%)", opacity: 0.75 * space }} />
      <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`, transformOrigin: "50% 45%" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* 먼 별: 느리게 흐른다(시차) */}
        {STARS.map((st, i) => (
          <circle key={i} cx={st.x} cy={(st.y + b * (frame * (2 + 6 * vN) + i * 40)) % 1920} r={st.r} fill="#FFFFFF" opacity={(0.25 + 0.6 * space) * (0.6 + 0.4 * Math.sin(i + frame * 0.2))} />
        ))}
      </svg>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: gO }}>
        <defs>
          <linearGradient id="flameOuter" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFE08A" />
            <stop offset="45%" stopColor="#FF8A3D" />
            <stop offset="100%" stopColor="rgba(255,80,40,0)" />
          </linearGradient>
          <linearGradient id="trail2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FF7A35" />
            <stop offset="100%" stopColor={YELLOW} />
          </linearGradient>
          <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        {/* 대기층 띠(2D 복귀 뒤) */}
        {LAYERS.map((L) => {
          const ev = t.events.find((e) => e.id === L.ev);
          const le = useEvent(t, "how_it_flies", L.ev);
          const k = ev ? snap(frame, le.from, le.settled) : 0;
          const a = P([0, L.lo]), c = P([1, L.hi]);
          return <rect key={L.id} x={a.x} y={c.y} width={(c.x - a.x) * k} height={a.y - c.y} fill={L.fill} opacity={eventOpacity(frame, layers) * (1 - b)} />;
        })}
        {LAYERS.slice(1).map((L) => {
          const a = P([0, L.lo]), c = P([1, L.lo]);
          return <line key={L.id} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="rgba(255,255,255,0.35)" strokeWidth={2} opacity={eventOpacity(frame, layers) * (1 - b)} />;
        })}
        {/* 고도 격자(10km) — 3D에서는 원근으로 눕는다 */}
        {Array.from({ length: 12 }, (_, i) => i * 10).map((km) => {
          const a = P([0, km]), c = P([draw, km]);
          return <line key={km} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={`rgba(255,255,255,${0.13 + 0.32 * b})`} strokeWidth={(km % 20 === 0 ? 2 : 1) + 1.5 * b} />;
        })}
        {/* 3D: 고도선이 숫자를 달고 카메라 옆을 지나 아래로 빠진다 */}
        {b > 0.01
          ? Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map((km) => {
              const a = P([0, km]);
              if (a.y < 120 || a.y > 1500) return null;
              return (
                <text key={km} x={Math.max(40, a.x + 18)} y={a.y - 12} fill="#FFFFFF" fontFamily="Pretendard" fontWeight={800} fontSize={40 * Math.min(1.6, a.s)} opacity={deepO * 0.9} stroke="rgba(4,7,15,0.85)" strokeWidth={6} paintOrder="stroke">
                  {km}km
                </text>
              );
            })
          : null}
        {b > 0.01 ? (() => { const a = P([0, 100]); return a.y > 120 ? (
          <text x={Math.max(40, a.x + 18)} y={a.y - 14} fill={YELLOW} fontFamily="Pretendard" fontWeight={800} fontSize={44 * Math.min(1.6, a.s)} opacity={deepO} stroke="rgba(4,7,15,0.85)" strokeWidth={6} paintOrder="stroke">
            100km 카르만 라인
          </text>
        ) : null; })() : null}
        {Array.from({ length: 6 }, (_, i) => i / 5).map((tt) => {
          const a = P([tt, 0]), c = P([tt, 110 * draw]);
          return <line key={tt} x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} opacity={1 - b} />;
        })}
        {/* 축 */}
        {(() => { const o = P([0, 0]), top = P([0, 110 * draw]), r = P([draw, 0]); return (
          <g opacity={1 - 0.85 * b}>
            <line x1={o.x} y1={o.y} x2={top.x} y2={top.y} stroke="rgba(255,255,255,0.9)" strokeWidth={4} />
            <line x1={o.x} y1={o.y} x2={r.x} y2={r.y} stroke="rgba(255,255,255,0.9)" strokeWidth={4} />
            <path d={`M ${r.x} ${r.y} l -16 -9 l 0 18 Z`} fill="rgba(255,255,255,0.9)" opacity={draw} />
          </g>
        ); })()}
        {/* 15km·100km 기준선 */}
        {(() => { const a = P([0, 15]), c = P([1, 15]); return <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={YELLOW} strokeWidth={2} strokeDasharray="8 8" opacity={eventOpacity(frame, t15) * 0.8} />; })()}
        {(() => { const a = P([0, 100]), c = P([1, 100]); return <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={YELLOW} strokeWidth={4} strokeDasharray="18 12" opacity={Math.max(kO, 0.35 * b * gO)} />; })()}
        {/* 궤적 */}
        <polyline points={toPoly(leg1)} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="12 10" strokeLinecap="round" opacity={0.9} />
        {leg2.length > 1 ? (
          <g>
            <polyline points={toPoly(leg2)} fill="none" stroke="url(#trail2)" strokeWidth={18} strokeLinecap="round" filter="url(#tglow)" opacity={0.75} />
            <polyline points={toPoly(leg2)} fill="none" stroke="url(#trail2)" strokeWidth={7} strokeLinecap="round" />
          </g>
        ) : null}
        {/* 3D 상승 중 속도선 */}
        {/* 속도선: 가까운 층은 굵고 빠르게, 먼 층은 가늘고 느리게. 속도에 비례해 길어진다 */}
        {b > 0.01
          ? Array.from({ length: 30 }, (_, i) => {
              const near = i % 3 === 0;
              const x = 40 + ((i * 131) % 1000);
              const sp = (near ? 70 : 32) * (0.4 + 1.6 * vN);
              const len = (near ? 220 : 110) * (0.4 + 1.8 * vN);
              const y = ((frame * sp + i * 157) % 2300) - 200;
              return <line key={i} x1={x} y1={y} x2={x} y2={y + len} stroke="#FFFFFF" strokeWidth={near ? 3.5 : 1.5} strokeLinecap="round" opacity={thrust * (near ? 0.5 : 0.28) * (0.35 + 0.65 * vN)} />;
            })
          : null}
        {/* 배기 입자: 꼬리 뒤로 흩어진다 */}
        {launched && flame > 0.05
          ? Array.from({ length: 16 }, (_, i) => {
              const age = ((frame * (1 + vN) + i * 7) % 28) / 28;
              const dist = (60 + age * (220 + 260 * vN)) * iconScale * 0.6;
              const jitter = Math.sin(i * 12.9 + frame * 0.7) * 16 * age;
              return <circle key={i} cx={hs.x + tailX * dist - tailY * jitter} cy={hs.y + tailY * dist + tailX * jitter} r={(4 + 14 * age) * Math.min(1.6, hs.s)} fill="rgba(255,196,130,1)" opacity={(1 - age) * flame * 0.55} />;
            })
          : null}
        {/* 점화 섬광 */}
        {flashO > 0 ? (
          <g opacity={flashO}>
            <circle cx={sep.x} cy={sep.y} r={30 + 140 * flashU} fill="none" stroke="#FFF2C2" strokeWidth={6} />
            <circle cx={sep.x} cy={sep.y} r={60 * (1 - 0.5 * flashU)} fill="#FFE9A8" filter="url(#tglow)" />
            {Array.from({ length: 10 }, (_, i) => {
              const ang = (i / 10) * Math.PI * 2;
              return <line key={i} x1={sep.x + Math.cos(ang) * 40} y1={sep.y + Math.sin(ang) * 40} x2={sep.x + Math.cos(ang) * (60 + 120 * flashU)} y2={sep.y + Math.sin(ang) * (60 + 120 * flashU)} stroke="#FFD16A" strokeWidth={4} strokeLinecap="round" />;
            })}
          </g>
        ) : null}
        {/* 아이콘: 점화 전 모선+아페론, 점화 뒤 모선은 떨어져 나가고 아페론은 불꽃과 함께 */}
        {!launched ? (
          <CarrierIcon x={hs.x} y={hs.y} rot={rot} scale={pop(frame, carrier.from, 12) * 1.55} opacity={1} showShip />
        ) : (
          <CarrierIcon x={sep.x + 160 * drop} y={sep.y + 120 * drop} rot={8 + 10 * drop} scale={1.55 * (1 - 0.25 * drop)} opacity={1 - drop} showShip={false} />
        )}
        {launched ? <RocketIcon x={hs.x} y={hs.y} rot={rot} scale={iconScale} flame={flame * (1 + 0.9 * vN * b)} frame={frame} /> : null}
      </svg>
      </AbsoluteFill>
      {/* 눈금 숫자·축 이름(평면일 때) */}
      {[20, 40, 60, 80, 100].map((km) => (
        <Tick key={km} x={GX0 - 18} y={gy(km) - 18} opacity={gO * draw * flatO} align="right" size={28}>
          {km}
        </Tick>
      ))}
      <Label name="고도 축" x={GX0 - 16} y={gy(110) - 74} opacity={eventOpacity(frame, aAlt) * flatO} k={pop(frame, aAlt.from)} size={44} align="left">
        고도
      </Label>
      <Tick x={GX0 + 74} y={gy(110) - 62} opacity={eventOpacity(frame, aAlt) * flatO} size={30}>
        (km)
      </Tick>
      <Label name="시간 축" x={GX1} y={GY0 + 18} opacity={eventOpacity(frame, aTime) * flatO} k={pop(frame, aTime.from)} size={44} align="right">
        시간
      </Label>
      <Pill name="15km 점화" x={Math.max(40, sep.x - 300)} y={gy(15) - 112} opacity={eventOpacity(frame, t15) * flatO} k={pop(frame, t15.from)} {...(frame >= view.from ? { color: "#FFFFFF", border: "rgba(255,255,255,0.45)", weight: 400 } : {})}>
        15km 점화
      </Pill>
      <Pill name="카르만 라인" x={GX0 + 24} y={gy(100) - 86} opacity={kO * flatO} k={pop(frame, tk.from)}>
        100km 카르만 라인
      </Pill>
      {LAYERS.map((L) => {
        const le = useEvent(t, "how_it_flies", L.ev);
        const mid = (L.lo + Math.min(L.hi, 100)) / 2;
        return (
          <Label key={L.id} name={L.name} x={GX1 - 20} y={gy(mid) - 26} opacity={eventOpacity(frame, le) * flatO} k={pop(frame, le.from)} size={40} color="#E8EEF8" align="right">
            {L.name}
          </Label>
        );
      })}
    </AbsoluteFill>
  );
};

// ── 경험: 유니티 객실 → 창밖 지구, 비행 전체 고도 곡선 속 좁은 무중력 구간(모양은 측정값이 아님)
const P = { x: 60, y: 900, w: 960, h: 440 };
const PX0 = 130, PX1 = 950, PY0 = 1260, PY1 = 1010; // 시간축(이륙→착륙), 고도축(0→최고)
const ZG0 = 0.46, ZG1 = 0.52; // 무중력 구간 위치(비율)
const PROFILE = [
  ...quad([PX0, PY0], [PX0 + 120, PY0 - 10], [PX0 + 0.42 * (PX1 - PX0), PY0 - 0.16 * (PY0 - PY1)], 20),
  ...quad([PX0 + 0.42 * (PX1 - PX0), PY0 - 0.16 * (PY0 - PY1)], [PX0 + 0.44 * (PX1 - PX0), PY1 - 10], [PX0 + ZG0 * (PX1 - PX0), PY1], 14).slice(1),
  ...quad([PX0 + ZG0 * (PX1 - PX0), PY1], [PX0 + 0.49 * (PX1 - PX0), PY1 - 14], [PX0 + ZG1 * (PX1 - PX0), PY1], 8).slice(1),
  ...quad([PX0 + ZG1 * (PX1 - PX0), PY1], [PX0 + 0.6 * (PX1 - PX0), PY0 - 40], [PX1, PY0], 24).slice(1),
];
const WhatYouBuy: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const cabin = useEvent(t, "what_you_buy", "cabin_in");
  const earth = useEvent(t, "what_you_buy", "earth_in");
  const strip = useEvent(t, "what_you_buy", "strip_in");
  const th = useEvent(t, "what_you_buy", "tag_hour_in");
  const tm = useEvent(t, "what_you_buy", "tag_min_in");
  const tu = useEvent(t, "what_you_buy", "tag_unity_cabin_in");
  const grow = eventProgress(frame, strip, "enter");
  const zg = Math.min(1.15, pop(frame, tm.from, 8));
  const sO = eventOpacity(frame, strip);
  const zx0 = PX0 + ZG0 * (PX1 - PX0), zx1 = PX0 + ZG1 * (PX1 - PX0);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <FullVideo pilot={pilot} file="editorial/exp_cabin.mp4" ev={cabin} rate={0.8} position="30% 50%" />
      <FullVideo pilot={pilot} file="editorial/exp_earth.mp4" ev={earth} rate={0.52} position="40% 50%" />
      <LogoShade />
      <Cam from={strip.from} to={strip.end} dir={-1}>
      <Panel x={P.x} y={P.y} w={P.w} h={P.h} opacity={sO} k={pop(frame, strip.from, 12)} sweepAt={strip.settled} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: sO }}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(140,190,255,0.45)" />
            <stop offset="100%" stopColor="rgba(140,190,255,0)" />
          </linearGradient>
        </defs>
        <rect x={zx0} y={PY0 - (PY0 - PY1 + 34) * zg} width={zx1 - zx0} height={(PY0 - PY1 + 34) * zg} fill={YELLOW} opacity={0.32} />
        <line x1={PX0} y1={PY0} x2={PX0 + (PX1 - PX0) * grow} y2={PY0} stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
        {Array.from({ length: 13 }, (_, i) => PX0 + (i * (PX1 - PX0)) / 12).map((x, i) => (
          <line key={i} x1={x} y1={PY0} x2={x} y2={PY0 + (i % 3 === 0 ? 14 : 8)} stroke="rgba(255,255,255,0.45)" strokeWidth={2} opacity={grow} />
        ))}
        <polygon points={`${PX0},${PY0} ${poly(partial(PROFILE, grow))} ${PX0 + (PX1 - PX0) * grow},${PY0}`} fill="url(#area)" />
        <polyline points={poly(partial(PROFILE, grow))} fill="none" stroke="#E8F1FF" strokeWidth={5} strokeLinejoin="round" />
        <line x1={zx0} y1={PY1 - 34} x2={zx0} y2={PY0} stroke={YELLOW} strokeWidth={3} opacity={zg} />
        <line x1={zx1} y1={PY1 - 34} x2={zx1} y2={PY0} stroke={YELLOW} strokeWidth={3} opacity={zg} />
      </svg>
      <Label name="전체 약 1시간" x={PX0} y={P.y + 28} opacity={eventOpacity(frame, th)} k={pop(frame, th.from)} size={48}>
        전체 약 1시간
      </Label>
      <Pill name="무중력 몇 분" x={zx0 - 40} y={PY1 - 120} opacity={eventOpacity(frame, tm)} k={pop(frame, tm.from)} size={44}>
        무중력 몇 분
      </Pill>
      <Tick x={PX0} y={PY0 + 22} opacity={sO * grow}>
        이륙
      </Tick>
      <Tick x={PX1} y={PY0 + 22} opacity={sO * grow} align="right">
        착륙
      </Tick>
      </Cam>
      <UnityTag opacity={eventOpacity(frame, tu)} />
    </AbsoluteFill>
  );
};

// ── 요금: 같은 바닥선에서 위로 솟는 두 막대(20만:85만). 금액 글씨는 그림자 없는 단색
const VB = { base: 1180, top85: 560, w: 210, x14: 290, xNow: 600 };
const vy = (man: number) => VB.base - ((VB.base - VB.top85) * man) / 85;
const Flat: React.FC<{ x: number; y: number; opacity: number; k?: number; size: number; color: string; weight?: number; align?: "left" | "center" | "right"; children: React.ReactNode }> = ({ x, y, opacity, k = 1, size, color, weight = 800, align = "center", children }) => (
  <div style={{ position: "absolute", top: y, left: align === "left" ? x : align === "center" ? x - 300 : undefined, right: align === "right" ? 1080 - x : undefined, width: align === "center" ? 600 : undefined, textAlign: align, opacity, scale: String(0.7 + 0.3 * k), transformOrigin: "50% 100%", fontFamily: "Pretendard", fontWeight: weight, fontSize: size, color, whiteSpace: "nowrap", lineHeight: 1.1 }}>
    {children}
  </div>
);
const PriceClimb: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const bg = useEvent(t, "price_climb", "herotwo_in");
  const b1 = useEvent(t, "price_climb", "bar14_in");
  const l1 = useEvent(t, "price_climb", "tag14_in");
  const b2 = useEvent(t, "price_climb", "barnow_in");
  const l2 = useEvent(t, "price_climb", "tagnow_in");
  const lk = useEvent(t, "price_climb", "tagkrw_in");
  const g1 = snap(frame, b1.from, b1.settled);
  const g2 = snap(frame, b2.from, b2.settled);
  const flash1 = interpolate(frame, [b1.settled, b1.settled + 12], [0.95, 0], clamp);
  const flash2 = interpolate(frame, [b2.settled, b2.settled + 14], [0.95, 0], clamp);
  const bgO = eventOpacity(frame, bg);
  const ratioO = eventOpacity(frame, l2) * interpolate(frame, [l2.settled, l2.settled + 12], [0, 1], clamp);
  const h1 = (VB.base - vy(20)) * g1, h2 = (VB.base - vy(85)) * g2;
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <Drift from={bg.from} to={bg.end} dir={1}>
        <Photo pilot={pilot} file="editorial/data_bg.png" scale={1} opacity={bgO} />
      </Drift>
      <Cam from={bg.from} to={bg.end} dir={1}>
      <Panel x={60} y={400} w={960} h={900} opacity={bgO} k={pop(frame, bg.from, 12)} sweepAt={b2.settled} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: bgO }}>
        <defs>
          <linearGradient id="vb2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFB54A" />
            <stop offset="100%" stopColor={YELLOW} />
          </linearGradient>
          <linearGradient id="vb1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#9FB3CC" />
            <stop offset="100%" stopColor="#EEF3FA" />
          </linearGradient>
        </defs>
        {[20, 40, 60, 80].map((v) => (
          <line key={v} x1={200} y1={vy(v)} x2={960} y2={vy(v)} stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
        ))}
        <line x1={200} y1={VB.base} x2={960} y2={VB.base} stroke="rgba(255,255,255,0.85)" strokeWidth={4} />
        <rect x={VB.x14} y={VB.base - h1} width={VB.w} height={h1} rx={10} fill="url(#vb1)" opacity={eventOpacity(frame, b1)} />
        <rect x={VB.xNow} y={VB.base - h2} width={VB.w} height={h2} rx={10} fill="url(#vb2)" opacity={eventOpacity(frame, b2)} />
        {frame >= b1.settled ? <rect x={VB.x14 - 6} y={vy(20) - 10} width={VB.w + 12} height={20} rx={8} fill="#FFFFFF" opacity={flash1} /> : null}
        {frame >= b2.settled ? <rect x={VB.xNow - 6} y={vy(85) - 10} width={VB.w + 12} height={20} rx={8} fill="#FFFFFF" opacity={flash2} /> : null}
        {/* 2014 막대 높이를 최근 막대 안에 네 번 쌓아 「4배 이상」을 높이로 비교한다 */}
        <g opacity={ratioO}>
          {[20, 40, 60, 80].map((v) => (
            <line key={v} x1={VB.xNow} y1={vy(v)} x2={VB.xNow + VB.w} y2={vy(v)} stroke="rgba(26,18,6,0.55)" strokeWidth={3} strokeDasharray="10 8" />
          ))}
          <line x1={VB.x14 + VB.w} y1={vy(20)} x2={VB.xNow} y2={vy(20)} stroke="rgba(255,255,255,0.6)" strokeWidth={2} strokeDasharray="6 6" />
          <path d={`M ${VB.xNow + VB.w + 20} ${VB.base} L ${VB.xNow + VB.w + 34} ${VB.base} L ${VB.xNow + VB.w + 34} ${vy(85)} L ${VB.xNow + VB.w + 20} ${vy(85)}`} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={3} />
        </g>
      </svg>
      <Tick x={190} y={vy(20) - 18} opacity={bgO} align="right" size={28}>20만</Tick>
      <Tick x={190} y={vy(40) - 18} opacity={bgO} align="right" size={28}>40만</Tick>
      <Tick x={190} y={vy(60) - 18} opacity={bgO} align="right" size={28}>60만</Tick>
      <Tick x={190} y={vy(80) - 18} opacity={bgO} align="right" size={28}>80만</Tick>
      <Tick x={100} y={430} opacity={bgO} size={32} color="#DCE3EC">탑승 요금 (달러)</Tick>
      <Flat x={VB.x14 + VB.w / 2} y={VB.base + 18} opacity={eventOpacity(frame, b1)} size={44} color="#E7ECF3" weight={700}>2014</Flat>
      <Flat x={VB.xNow + VB.w / 2} y={VB.base + 18} opacity={eventOpacity(frame, b2)} size={44} color={YELLOW} weight={700}>최근</Flat>
      <Flat x={VB.x14 + VB.w / 2} y={vy(20) - 76} opacity={eventOpacity(frame, l1)} k={pop(frame, l1.from)} size={50} color="#FFFFFF">20만 달러</Flat>
      <Flat x={VB.xNow + VB.w / 2} y={vy(85) - 150} opacity={eventOpacity(frame, l2)} k={pop(frame, l2.from)} size={62} color={YELLOW}>85만 달러</Flat>
      <Flat x={VB.xNow + VB.w / 2} y={vy(85) - 80} opacity={eventOpacity(frame, lk)} k={pop(frame, lk.from)} size={44} color="#FFFFFF" weight={700}>약 11억 원</Flat>
      <Flat x={VB.xNow + VB.w + 50} y={vy(52)} opacity={ratioO} size={42} color="#FFFFFF" weight={800} align="left">4배 이상</Flat>
      </Cam>
    </AbsoluteFill>
  );
};

// ── 예약: 스페이스포트 앞 기체 → 사람 아이콘 1개 = 5명, 135개가 쌓인다(빈 자리를 미리 그리지 않는다)
const DOT = { cols: 9, rows: 15, x: 168, y: 520, gx: 93, gy: 45 };
/** 사람 한 명 아이콘(머리+어깨). (cx,cy)는 아이콘 중심, s는 크기 배율 */
const Person: React.FC<{ cx: number; cy: number; s: number; fill: string }> = ({ cx, cy, s, fill }) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`} fill={fill}>
    <circle cx={0} cy={-6.5} r={4.6} />
    <path d="M -8.5 10 C -8.5 2.5 -4.8 -0.5 0 -0.5 C 4.8 -0.5 8.5 2.5 8.5 10 Z" />
  </g>
);
const Demand: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const g = useEvent(t, "demand", "ground_in");
  const dots = useEvent(t, "demand", "dots_in");
  const tag = useEvent(t, "demand", "tag675_in");
  const push = interpolate(frame, [g.from, g.end], [1.0, 1.08], clamp);
  const dO = eventOpacity(frame, dots);
  const span = Math.max(1, dots.settled - dots.from);
  const N = 135; // 675명 ÷ 5
  // 다 채워지는 순간 전체가 한 번 밝게 반짝인다
  const done = interpolate(frame, [dots.settled, dots.settled + 5, dots.settled + 16], [0, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <BandVideo pilot={pilot} file="editorial/ch_ground.png" ev={g} rate={1} top={500} width={1300} aspect={720 / 1280} still push={push} />
      <Drift from={dots.from} to={dots.end} dir={-1}>
        <AbsoluteFill style={{ opacity: dO }}>
          <Img src={pilot.file("editorial/data_bg.png")} style={{ width: 1080, height: 1920, objectFit: "cover" }} />
        </AbsoluteFill>
      </Drift>
      <Cam from={dots.from} to={dots.end} dir={-1}>
      <Panel x={80} y={430} w={920} h={780} opacity={dO} k={pop(frame, dots.from, 12)} sweepAt={dots.settled} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: dO }}>
        {Array.from({ length: N }, (_, i) => {
          const r = DOT.rows - 1 - Math.floor(i / DOT.cols), c = i % DOT.cols;
          // 처음엔 하나씩 천천히, 갈수록 빠르게(생성 간격이 점점 짧아진다)
          const at = dots.from + span * Math.pow(i / N, 0.5);
          if (frame < at) return null;
          const k = Math.min(1.2, pop(frame, at, 9));
          return <Person key={i} cx={DOT.x + c * DOT.gx} cy={DOT.y + r * DOT.gy} s={2.0 * k * (1 + 0.12 * done)} fill={done > 0.02 ? `rgb(255,${209 + 46 * done},${106 + 149 * done})` : YELLOW} />;
        })}
        <Person cx={808} cy={474} s={1.5} fill={YELLOW} />
      </svg>
      <Tick x={930} y={456} opacity={dO} align="right" size={32} color="#DCE3EC">
        = 5명
      </Tick>
      <Label name="예약 675명" x={540} y={1226} opacity={eventOpacity(frame, tag)} k={pop(frame, tag.from)} size={92} align="center" weight={800}>
        예약 675명
      </Label>
      </Cam>
    </AbsoluteFill>
  );
};

// ── 일정: 비행 장면 → 분기 칸 달력 위 지금(2026 4분기)과 2027 2분기 초(예상, 비운 표시)
const QB = { x: 90, y: 700, w: 210, gap: 20, h: 300 };
const qx = (i: number) => QB.x + i * (QB.w + QB.gap);
const QN = ["4분기", "1분기", "2분기", "3분기"];
const Plan: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const fly = useEvent(t, "plan", "flyover_in");
  const ferry = useEvent(t, "plan", "ferry_in");
  const axis = useEvent(t, "plan", "axis_in");
  const now = useEvent(t, "plan", "tagnowt_in");
  const q2 = useEvent(t, "plan", "tagq2_in");
  const fleet = useEvent(t, "plan", "fleet_in");
  const sh1 = useEvent(t, "plan", "ship1_in");
  const sh2 = useEvent(t, "plan", "ship2_in");
  const yr = useEvent(t, "plan", "year_in");
  const t125 = useEvent(t, "plan", "tag125_in");
  const fO = eventOpacity(frame, fleet);
  const ySpan = Math.max(1, yr.settled - yr.from);
  const aO = eventOpacity(frame, axis);
  const grow = eventProgress(frame, axis, "enter");
  const reach = eventProgress(frame, q2, "enter");
  const lineY = QB.y + QB.h + 60;
  const nowX = qx(0) + QB.w * 0.45; // 11월 초
  const q2x = qx(2) + 14; // 2분기 초
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <BandVideo pilot={pilot} file="editorial/ch_flyover.mp4" ev={fly} rate={0.42} top={600} />
      <Drift from={ferry.from} to={ferry.end} dir={1}>
        <Photo pilot={pilot} file="editorial/data_bg.png" scale={1} opacity={eventOpacity(frame, ferry)} />
      </Drift>
      {/* 기체 두 대(2호기는 제작 중, 점선) + 1년 띠에 채워지는 속 빈 비행 표시 125개(목표) */}
      {fO > 0 ? (
        <Cam from={fleet.from} to={fleet.end} dir={-1}>
          <Panel x={60} y={430} w={960} h={820} opacity={fO} k={pop(frame, fleet.from, 12)} sweepAt={yr.settled} />
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: fO }}>
            <g transform={`translate(320 640) scale(${3.0 * Math.min(1.1, pop(frame, sh1.from, 11))})`}>
              <g transform="translate(0 -19)"><ShipBody /></g>
            </g>
            <g transform={`translate(760 640) scale(${3.0 * Math.min(1.1, pop(frame, sh2.from, 11))})`} opacity={eventOpacity(frame, sh2)}>
              <g transform="translate(0 -19)"><ShipOutline /></g>
            </g>
            <rect x={110} y={862} width={860} height={262} rx={18} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
            {Array.from({ length: 13 }, (_, m) => (
              <line key={m} x1={110 + (860 * m) / 12} y1={1124} x2={110 + (860 * m) / 12} y2={1138} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
            ))}
            {Array.from({ length: 125 }, (_, i) => {
              const c = Math.floor(i / 5), r = i % 5;
              const at = yr.from + ySpan * Math.pow(i / 125, 0.8);
              if (frame < at) return null;
              const k = Math.min(1.25, pop(frame, at, 9));
              return <circle key={i} cx={134 + c * (812 / 24)} cy={892 + r * 50} r={11 * k} fill="none" stroke={YELLOW} strokeWidth={3} />;
            })}
          </svg>
          <Flat x={320} y={712} opacity={eventOpacity(frame, sh1)} k={pop(frame, sh1.from)} size={48} color="#FFFFFF">아페론</Flat>
          <Flat x={760} y={712} opacity={eventOpacity(frame, sh2)} k={pop(frame, sh2.from)} size={44} color="#C9D2DE" weight={600}>2호기 (제작 중)</Flat>
          <Tick x={112} y={820} opacity={fO} size={32} color="#DCE3EC">1년</Tick>
          {[1, 4, 7, 10].map((mo) => (
            <Tick key={mo} x={110 + (860 * (mo - 0.5)) / 12} y={1144} opacity={fO} align="center" size={26}>{`${mo}월`}</Tick>
          ))}
          <Pill name="연 125회 목표" x={540 - 190} y={1176} opacity={eventOpacity(frame, t125)} k={pop(frame, t125.from)} size={48}>
            연 125회 (목표)
          </Pill>
        </Cam>
      ) : null}
      <Cam from={axis.from} to={axis.end} dir={1}>
      <Panel x={60} y={560} w={960} h={620} opacity={aO} k={pop(frame, axis.from, 12)} sweepAt={q2.settled} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: aO }}>
        {QN.map((_, i) => (
          <rect key={i} x={qx(i)} y={QB.y + 40 * (1 - Math.min(1, pop(frame, axis.from + 4 * i, 11)))} width={QB.w} height={QB.h} opacity={Math.min(1, pop(frame, axis.from + 4 * i, 11))} rx={16} fill={i === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.05)"} stroke="rgba(255,255,255,0.28)" strokeWidth={2} />
        ))}
        <rect x={qx(2)} y={QB.y} width={QB.w} height={QB.h} rx={16} fill="rgba(255,209,106,0.10)" stroke={YELLOW} strokeWidth={4} strokeDasharray="14 10" opacity={eventOpacity(frame, q2)} />
        <line x1={qx(0)} y1={lineY} x2={qx(3) + QB.w} y2={lineY} stroke="rgba(255,255,255,0.5)" strokeWidth={3} opacity={grow} />
        <line x1={nowX} y1={lineY} x2={nowX + (q2x - nowX) * reach} y2={lineY} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" />
        <circle cx={nowX} cy={lineY} r={16} fill={YELLOW} opacity={eventOpacity(frame, now)} />
        <line x1={nowX} y1={QB.y} x2={nowX} y2={lineY} stroke={YELLOW} strokeWidth={2} strokeDasharray="6 6" opacity={eventOpacity(frame, now)} />
        <circle cx={q2x} cy={lineY} r={22} fill="rgba(5,7,11,0.8)" stroke={YELLOW} strokeWidth={5} strokeDasharray="7 6" opacity={eventOpacity(frame, q2)} />
      </svg>
      <Tick x={qx(0) + QB.w / 2} y={QB.y - 60} opacity={aO * grow} align="center" size={34} color="#DCE3EC">
        2026
      </Tick>
      <Tick x={qx(2) + QB.w / 2} y={QB.y - 60} opacity={aO * grow} align="center" size={34} color="#DCE3EC">
        2027
      </Tick>
      {QN.map((q, i) => (
        <Tick key={q} x={qx(i) + QB.w / 2} y={QB.y + 24} opacity={aO * grow} align="center" size={34} color={i === 2 ? YELLOW : "#C4CDD9"}>
          {q}
        </Tick>
      ))}
      <Label name="지금" x={nowX} y={lineY + 36} opacity={eventOpacity(frame, now)} k={pop(frame, now.from)} size={50} align="center">
        지금
      </Label>
      <Pill name="2분기 초 예상" x={qx(1) + 40} y={lineY + 34} opacity={eventOpacity(frame, q2)} k={pop(frame, q2.from)} size={44}>
        2027 2분기 초 (예상)
      </Pill>
      </Cam>
    </AbsoluteFill>
  );
};

// ── 마무리: 우주에서 본 지구(앞선 기체 유니티 영상), 사용자 지정 자막 전용 문구는 기울어진 흰 막대 스티커
const Closing: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const wing = useEvent(t, "closing", "wing_in");
  const tu = useEvent(t, "closing", "tag_unity_close_in");
  const concept = t.concepts.find((c) => c.id === "closing");
  const globalFrame = frame + (concept?.from ?? 0);
  const asideAt = t.events.find((e) => e.id === "aside_in")?.from ?? 0;
  const k = pop(globalFrame, asideAt, 8);
  return (
    <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
      <FullVideo pilot={pilot} file="editorial/hp_earth.mp4" ev={wing} rate={0.6} position="40% 50%" scale={interpolate(frame, [wing.from, wing.end], [1.0, 1.06], clamp)} />
      <LogoShade />
      <EditorialScreenText
        pilot={pilot}
        elementId="aside_text"
        eventId="aside_in"
        globalFrame={globalFrame}
        style={{ left: 540, top: 1296, translate: "-50% 0", rotate: `${-5 + (1 - Math.min(1, k)) * 10}deg`, scale: String(0.4 + 0.6 * k), backgroundColor: "#FFFFFF", padding: "10px 30px", lineHeight: "60px", borderRadius: 16, whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,0.35)" }}
      />
      <UnityTag opacity={eventOpacity(frame, tu)} top={420} />
    </AbsoluteFill>
  );
};

/** 자막 전용 문구: 기본 자막보다 작은 글씨를 흰 막대 안에 얹는다 */
const AsideStyle: React.FC = () => (
  <style>{`[data-screen-text="aside_text"]{font-family:GmarketSans;font-weight:700;font-size:46px;color:#0B1530;}`}</style>
);

const SCENES: Record<string, React.FC<{ pilot: EditorialPilotData }>> = {
  hook_dream: Hook,
  apeiron_reveal: Reveal,
  how_it_flies: HowItFlies,
  what_you_buy: WhatYouBuy,
  price_climb: PriceClimb,
  demand: Demand,
  plan: Plan,
  closing: Closing,
};

export const EditorialEpisode: React.FC<EditorialEpisodeProps> = ({ pilot }) => (
  <AbsoluteFill style={{ backgroundColor: "#05070b" }}>
    <AsideStyle />
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
