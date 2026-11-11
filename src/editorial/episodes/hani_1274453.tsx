import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { ConceptSequence, eventInConcept, eventOpacity, eventProgress } from "../../lib/editorial";
import type { CompiledEvent, EditorialTimeline } from "../../lib/editorial";
import { EditorialScreenText } from "../ScreenText";
import type { EditorialEpisodeProps, EditorialPilotData } from "../pilot";

/**
 * 100억 년 전 대충돌, 우리 은하가 90도 넘게 누웠다(더럼대 오리가 시뮬레이션, 추정).
 * 실사: ESO/B. Tafreshi 파라날 은하수(4K 원본 세로 크롭). 시뮬레이션: Auriga Project Halo 18(RAS, CC BY 4.0).
 * 기준 은하·기울어짐·GSE 충돌은 Higgsfield 생성 재료(관측 아님). 속도 막대는 220:25 선형, 질량은 5칸:1칸.
 * 기준 은하 이미지(1080×1920 표시)에서 원반 중심은 (540, 888), 원반 끝은 x≈40..1040.
 * 시간은 timeline 사건에서만 받는다.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeInOut = { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) };
const YELLOW = "#FFD16A";
const CORE = { x: 540, y: 888 };

const useEvent = (timeline: EditorialTimeline, conceptId: string, eventId: string): CompiledEvent =>
  eventInConcept(timeline, conceptId, eventId);

/** 개념 지역 프레임 → 전역 프레임(화면 문구용) */
const useGlobal = (pilot: EditorialPilotData, conceptId: string) => {
  const frame = useCurrentFrame();
  const c = pilot.timeline.concepts.find((x) => x.id === conceptId);
  return frame + (c?.from ?? 0);
};

/** 결정적 의사난수(장면마다 같은 별 배치) */
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const labelStyle = (size: number, color = "#FFFFFF", weight = 700): React.CSSProperties => ({
  fontFamily: "Pretendard",
  fontWeight: weight,
  fontSize: size,
  color,
  whiteSpace: "nowrap",
  textShadow: "0 2px 14px rgba(0,0,0,0.9)",
});

const Still: React.FC<{ pilot: EditorialPilotData; file: string; scale?: number; opacity?: number; filter?: string; origin?: string }> = ({ pilot, file, scale = 1, opacity = 1, filter, origin = `${CORE.x}px ${CORE.y}px` }) => (
  <AbsoluteFill style={{ opacity }}>
    <Img src={pilot.file(file)} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(scale), transformOrigin: origin, filter }} />
  </AbsoluteFill>
);

const Video: React.FC<{ pilot: EditorialPilotData; file: string; ev: CompiledEvent; rate?: number; startFrom?: number; scale?: number; origin?: string; opacity?: number }> = ({ pilot, file, ev, rate = 1, startFrom = 0, scale = 1, origin = "50% 50%", opacity }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: opacity ?? eventOpacity(frame, ev) }}>
      <Sequence from={ev.from} durationInFrames={Math.max(1, ev.end - ev.from)} layout="none">
        <OffthreadVideo src={pilot.file(file)} muted playbackRate={rate} startFrom={startFrom} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(scale), transformOrigin: origin }} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ── 후킹: 실제 은하수 하늘 → '대충돌로'에서 우주 공간 은하, 기준선 대비 원반이 기운다
const Hook: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const sky = useEvent(t, "hook", "rewind_hook");
  const tilt = useEvent(t, "hook", "tilt_in");
  const ref = useEvent(t, "hook", "ref_plane_in");
  const hook = useEvent(t, "hook", "hook_text");
  const refO = eventOpacity(frame, ref) * 0.75;
  const refDraw = eventProgress(frame, ref, "enter");
  // 후킹 문구가 떠 있는 동안 중앙부를 살짝 눌러 문구를 받친다
  const shade = eventOpacity(frame, hook);
  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <Video pilot={pilot} file="editorial/disk_tilt.mp4" ev={tilt} />
      {/* 되감기: 시대별 4장(사람 → 공룡·소행성 → 원시 태양 → 100억 년 전 은하)을 같은 방향 줌아웃으로만 움직이고,
          장면 사이는 똑같은 테이프 되감기 전환(가로 줄무늬·흐림)으로 잇는다. 마지막 은하 = 기울어짐 영상 첫 프레임과 같은 그림 */}
      {frame < sky.end ? (() => {
        const eras = ["era1", "era2", "era3", "era4"].map((id) => useEvent(pilot.timeline, "hook", id));
        const cuts = [sky.from, eras[1].from, eras[2].from, eras[3].from, sky.end];
        const vids = ["editorial/rw_v_human.mp4", "editorial/rw_v_dino.mp4", "editorial/rw_v_sun.mp4"];
        const vdur = [0.93, 1.4, 1.6];
        const idx = Math.min(3, Math.max(0, cuts.findIndex((c, i) => frame >= c && frame < cuts[i + 1])));
        const local = interpolate(frame, [cuts[idx], cuts[idx + 1]], [0, 1], clamp);
        const zoom = idx === 3 ? interpolate(local, [0, 1], [1.06, 1.0], clamp) : interpolate(local, [0, 1], [1.06, 1.0], clamp);
        // 전환: 각 경계 앞뒤 4프레임
        const tr = Math.max(...cuts.slice(1, 4).map((c) => interpolate(frame, [c - 4, c, c + 4], [0, 1, 0], clamp)));
        return (
          <AbsoluteFill>
            <AbsoluteFill style={{ filter: tr > 0 ? `blur(${tr * 6}px)` : undefined }}>
              {idx === 0 ? (
                <>
                  <Img src={pilot.file("editorial/rw_human.png")} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(zoom), transformOrigin: "50% 46%" }} />
                  {/* 별 반짝임(하늘 영역) — 회전 없음 */}
                  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
                    {Array.from({ length: 70 }, (_, i) => {
                      const x = rand(i + 7001) * 1080, y = rand(i + 7101) * 1250;
                      const tw = 0.5 + 0.5 * Math.sin(frame * (0.35 + rand(i + 7201) * 0.5) + rand(i + 7301) * 6.28);
                      const r = 1.6 + rand(i + 7401) * 2.4;
                      return <circle key={i} cx={x} cy={y} r={r * (0.7 + 0.6 * tw)} fill="#FFFFFF" opacity={0.25 + 0.75 * tw} />;
                    })}
                  </svg>
                </>
              ) : idx < 3 ? (
                <Sequence from={Math.round(cuts[idx])} durationInFrames={Math.max(1, Math.round(cuts[idx + 1] - cuts[idx]))} layout="none">
                  <OffthreadVideo src={pilot.file(vids[idx])} muted playbackRate={Math.max(0.5, Math.min(2, (vdur[idx] * 30) / Math.max(1, cuts[idx + 1] - cuts[idx])))} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(zoom), transformOrigin: "50% 46%" }} />
                </Sequence>
              ) : (
                <Img src={pilot.file("editorial/galaxy_side.png")} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(zoom), transformOrigin: "50% 46%" }} />
              )}
            </AbsoluteFill>
            <AbsoluteFill style={{ opacity: tr * 0.85, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 14px)" }} />
            <AbsoluteFill style={{ opacity: tr * 0.5, background: `linear-gradient(0deg, rgba(0,0,0,0) ${30 + (frame % 7) * 8}%, rgba(255,255,255,0.35) ${32 + (frame % 7) * 8}%, rgba(0,0,0,0) ${36 + (frame % 7) * 8}%)` }} />
          </AbsoluteFill>
        );
      })() : null}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: refO }}>
        <line x1={540 - 520 * refDraw} y1={CORE.y} x2={540 + 520 * refDraw} y2={CORE.y} stroke="#E9EEF5" strokeWidth={3} strokeDasharray="18 14" />
      </svg>
      <AbsoluteFill style={{ opacity: shade * 0.55, background: "radial-gradient(ellipse 560px 260px at 540px 780px, rgba(2,4,10,0.85) 0%, rgba(2,4,10,0) 100%)" }} />
    </AbsoluteFill>
  );
};

// 헤일로 별: 원반 중심 둘레 타원 안에 성기게
const HALO_STARS = Array.from({ length: 220 }, (_, i) => {
  const a = rand(i + 1) * Math.PI * 2;
  const r = Math.sqrt(rand(i + 101)) * (0.35 + 0.65 * rand(i + 201));
  return { x: CORE.x + Math.cos(a) * r * 500, y: CORE.y + Math.sin(a) * r * 560, s: 1.6 + rand(i + 301) * 2.4, d: r };
});

// ── s03 흡수 장면: 진입(포물선) → 해체(조석 스트림 + 입자 터짐) → 안착(주황 헤일로 + 구상성단), 카메라 미세 회전 + 전경 흐림 입자
// 배경: NASA 옆모습 헤일로 영상(중심 약 540,960). 색: 원반=청백(영상), 헤일로 별=호박·주황, 흡수 잔해=흰 금빛.
const IC = { x: 540, y: 960 };
// 작은 은하 궤적: 오른쪽 위 화면 밖에서 은하 중심으로 휘어 들어오는 곡선
const orbitAt = (u: number) => {
  // u: 0(오른쪽 위 화면 밖) → 1(은하 중심). 되돌아 올라가는 고리 없이 한 번 휘어 들어가는 곡선(2차 베지어)
  const p0 = { x: 1160, y: 250 }, p1 = { x: 980, y: 860 }, p2 = { x: IC.x + 20, y: IC.y - 10 };
  const k = 1 - u;
  return { x: k * k * p0.x + 2 * k * u * p1.x + u * u * p2.x, y: k * k * p0.y + 2 * k * u * p1.y + u * u * p2.y };
};
const HALO_PTS = Array.from({ length: 170 }, (_, i) => {
  const a = rand(i + 1201) * Math.PI * 2;
  const r = Math.sqrt(rand(i + 1301)) * 520;
  return { x: IC.x + Math.cos(a) * r, y: IC.y + Math.sin(a) * r * 1.05, s: 2 + rand(i + 1401) * 2.6, c: rand(i + 1501) < 0.6 ? "#FFB24A" : "#FF8A3D" };
});
const GLOBULARS = [
  { x: IC.x - 300, y: IC.y - 330, r: 26 },
  { x: IC.x + 330, y: IC.y - 210, r: 22 },
  { x: IC.x - 250, y: IC.y + 300, r: 20 },
  { x: IC.x + 270, y: IC.y + 360, r: 24 },
];
const FG = Array.from({ length: 14 }, (_, i) => ({ x: rand(i + 1601) * 1080, y: 300 + rand(i + 1701) * 1300, s: 6 + rand(i + 1801) * 10, v: 0.6 + rand(i + 1901) }));

// ── 구조: 원반 → 둘레 헤일로, 작은 은하가 흘러들어 별이 흩어진다
const Structure: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const g = useGlobal(pilot, "structure");
  const t = pilot.timeline;
  const zoom = useEvent(t, "structure", "zoom_in_ev");
  const halo = useEvent(t, "structure", "halo_vid_ev");
  const close = useEvent(t, "structure", "halo_close_ev");
  const cRate = Math.min(1.6, (5 * 30) / Math.max(1, close.end - close.from));
  const fall = useEvent(t, "structure", "infall_move");
  // NASA 원반 접근 영상(10초 분량)을 '원반과,'까지의 길이에 맞춰 재생
  const zLen = Math.max(1, zoom.end - zoom.from);
  const zRate = Math.min(4, (10 * 30) / zLen);
  // 흡수 3단계: fp 0–0.38 진입(포물선 궤도) · 0.38–0.72 해체(조석 스트림 + 흰 금빛 입자 터짐) · 0.72–1 안착(주황 헤일로 + 구상성단)
  const fp = interpolate(frame, [fall.from, fall.settled], [0, 1], clamp);
  const fO = interpolate(frame, [fall.from, fall.from + 4, fall.to, fall.end], [0, 1, 1, 0], clamp);
  const uDwarf = 0.12 + Easing.in(Easing.quad)(Math.min(1, fp / 0.42)) * 0.88; // 가속하며 중심으로 진입
  const head = orbitAt(uDwarf);
  const burst = Easing.out(Easing.cubic)(interpolate(fp, [0.38, 0.72], [0, 1], clamp));
  const settle = Easing.inOut(Easing.cubic)(interpolate(fp, [0.68, 1], [0, 1], clamp));
  const dwarfO = 1 - interpolate(fp, [0.4, 0.55], [0, 1], clamp);
  // 지나간 궤적(조석 스트림): 머리 뒤로 늘어지는 별의 강
  const TRAIL = 90;
  const trail = Array.from({ length: TRAIL }, (_, i) => {
    const u = Math.max(0, uDwarf - (i / TRAIL) * 0.5);
    return orbitAt(u);
  });
  const streamPath = trail.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
  const streamO = fO * interpolate(fp, [0.05, 0.3, 0.45, 0.7], [0, 0.85, 0.85, 0], clamp); // 흩어지는 순간부터 옅어져 안착 전에 사라짐
  // 카메라: 미세 회전·접근(시차), 전경 흐림 입자는 반대 방향
  const camRot = interpolate(frame, [fall.from, fall.end], [-1.6, 0.6], clamp);
  const camScale = interpolate(frame, [fall.from, fall.end], [1.0, 1.07], clamp);
  const fgShift = interpolate(frame, [fall.from, fall.end], [60, -140], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <Video pilot={pilot} file="editorial/nasa_halo.mp4" ev={halo} rate={1} startFrom={99} />
      <Video pilot={pilot} file="editorial/halo_close.mp4" ev={close} rate={cRate} />
      <Video pilot={pilot} file="editorial/nasa_zoom.mp4" ev={zoom} rate={zRate} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g opacity={fO} style={{ transformOrigin: `${IC.x}px ${IC.y}px`, rotate: `${camRot}deg`, scale: String(camScale) }}>
          <defs>
            <radialGradient id="dwarfGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF6DA" stopOpacity={1} />
              <stop offset="40%" stopColor="#FFE08A" stopOpacity={0.75} />
              <stop offset="100%" stopColor="#FFD27A" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="gcGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE2B0" stopOpacity={0.95} />
              <stop offset="60%" stopColor="#FFB24A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FFB24A" stopOpacity={0} />
            </radialGradient>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          {/* 조석 스트림: 넓은 은은한 띠 + 밝은 심 + 띠를 따라 늘어선 별 입자 */}
          <path d={streamPath} fill="none" stroke="#FFD58A" strokeWidth={34} strokeLinecap="round" opacity={streamO * 0.22} filter="url(#softGlow)" />
          <path d={streamPath} fill="none" stroke="#FFE7B5" strokeWidth={3} strokeLinecap="round" opacity={streamO * 0.7} />
          {trail.map((q, i) => i % 2 === 0 ? (
            <circle key={i} cx={q.x + (rand(i + 2001) - 0.5) * 28} cy={q.y + (rand(i + 2101) - 0.5) * 22} r={1.6 + rand(i + 2201) * 1.8} fill={i < 30 ? "#FFF1C1" : "#FFB24A"} opacity={streamO * (1 - i / TRAIL)} />
          ) : null)}
          {/* 1) 진입하는 작은 은하(흰 금빛) */}
          <ellipse cx={head.x} cy={head.y} rx={70} ry={50} fill="url(#dwarfGlow)" opacity={dwarfO} />
          <circle cx={head.x} cy={head.y} r={9} fill="#FFFFFF" opacity={dwarfO} />
          {/* 2) 해체: 흰 금빛 입자가 터져 나오고 3) 주황 헤일로 자리로 안착 */}
          {HALO_PTS.map((h, i) => {
            const a = rand(i + 2301) * Math.PI * 2;
            const d = burst * (60 + rand(i + 2401) * 260);
            const bx = head.x + Math.cos(a) * d, by = head.y + Math.sin(a) * d * 0.8;
            const x = bx + (h.x - bx) * settle, y = by + (h.y - by) * settle;
            const col = settle > 0.5 ? h.c : "#FFF1C1";
            return <circle key={i} cx={x} cy={y} r={h.s * (1.25 - 0.25 * settle)} fill={col} opacity={fp > 0.38 ? 0.95 : 0} />;
          })}
          {/* 구상성단: 헤일로 안의 빽빽한 별 뭉치 */}
          {GLOBULARS.map((gc, k) => (
            <g key={k} opacity={settle}>
              <circle cx={gc.x} cy={gc.y} r={gc.r * 1.8} fill="url(#gcGlow)" />
              {Array.from({ length: 34 }, (_, i) => {
                const a = rand(k * 100 + i + 2501) * Math.PI * 2, rr = Math.pow(rand(k * 100 + i + 2601), 1.8) * gc.r;
                return <circle key={i} cx={gc.x + Math.cos(a) * rr} cy={gc.y + Math.sin(a) * rr} r={1.3} fill="#FFE9C4" />;
              })}
            </g>
          ))}
        </g>
        {/* 전경 흐림 입자(피사계 심도) */}
        <g opacity={fO * 0.55} filter="url(#fgBlur)">
          <defs><filter id="fgBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter></defs>
          {FG.map((p, i) => <circle key={i} cx={p.x + fgShift * p.v} cy={p.y} r={p.s} fill="#FFE6C2" />)}
        </g>
      </svg>
      <EditorialScreenText pilot={pilot} elementId="lbl_disk" eventId="disk_label" globalFrame={g} style={{ ...labelStyle(60), left: 0, width: 1080, textAlign: "center", top: 1180 }} />
      <EditorialScreenText pilot={pilot} elementId="lbl_halo" eventId="halo_label" globalFrame={g} style={{ ...labelStyle(56, YELLOW), left: 120, top: 600 }} />
    </AbsoluteFill>
  );
};

// ── 수수께끼: 가이아 → 같은 은하에서 원반 별(빠름)·헤일로 별(느림)의 공전을 같은 궤도 크기로 비교
const DISK_STARS = Array.from({ length: 260 }, (_, i) => ({
  r: 70 + Math.pow(rand(i + 3001), 0.8) * 420,
  a0: rand(i + 3101) * Math.PI * 2,
  w: 1.4 + rand(i + 3201) * 1.8,
  o: 0.5 + rand(i + 3301) * 0.5,
}));
const HALO_ORB = Array.from({ length: 13 }, (_, i) => ({
  rx: 300 + rand(i + 3401) * 200,
  ry: 120 + rand(i + 3501) * 220,
  tilt: (rand(i + 3601) - 0.5) * 160,
  dx: (rand(i + 3701) - 0.5) * 80,
  dy: (rand(i + 3801) - 0.5) * 120,
  a0: rand(i + 3901) * Math.PI * 2,
}));
const Puzzle: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const g = useGlobal(pilot, "puzzle");
  const t = pilot.timeline;
  const gal = useEvent(t, "puzzle", "galaxy_hold");
  const gaia = useEvent(t, "puzzle", "gaia_ev");
  const v220 = useEvent(t, "puzzle", "v220_label");
  const v25 = useEvent(t, "puzzle", "v25_label");
  const dim = interpolate(frame, [0, 18], [0.55, 0.32], clamp);
  // 원반: 촘촘한 작은 별(청백)이 거의 원형 궤도로 일사불란하게 돌며 긴 빛꼬리. 헤일로: 굵은 주황 별이 기울어진 타원 궤도를 느긋하게, 짧은 점.
  // 선속도 비 220 : 25 유지(원반 별 선속도 V_D, 헤일로 V_D×25/220). 수치가 나오는 순간 해당 무리 번쩍임, 수치 글자 맥동
  const moveO = interpolate(frame, [gaia.to, gaia.end], [0, 1], clamp) * eventOpacity(frame, gal);
  const flashD = interpolate(frame, [v220.from, v220.from + 4, v220.from + 22], [0, 1, 0], clamp);
  const flashH = interpolate(frame, [v25.from, v25.from + 4, v25.from + 22], [0, 1, 0], clamp);
  const diskHi = interpolate(frame, [v220.from, v220.settled, v25.from, v25.settled], [0.75, 1, 1, 0.5], clamp);
  const haloHi = interpolate(frame, [v220.from, v220.settled, v25.from, v25.settled], [0.75, 0.45, 0.45, 1], clamp);
  const sec = frame / 30;
  const V_D = 1.6 * 470; // px/s
  const V_H = V_D * (25 / 220);
  const diskPt = (r: number, a: number) => ({ x: CORE.x + Math.cos(a) * r, y: CORE.y + Math.sin(a) * r * 0.07 });
  const haloPt = (o: (typeof HALO_ORB)[number], a: number) => {
    const x = Math.cos(a) * o.rx, y = Math.sin(a) * o.ry, r = (o.tilt * Math.PI) / 180;
    return { x: CORE.x + o.dx + x * Math.cos(r) - y * Math.sin(r), y: CORE.y + o.dy + x * Math.sin(r) + y * Math.cos(r) };
  };
  const pulse = (k: number) => 0.5 + 0.5 * Math.sin(frame * 0.35 + k);
  const mist = interpolate(frame, [v25.from - 10, v25.settled + 10], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <Still pilot={pilot} file="editorial/galaxy_side.png" scale={1.06} opacity={eventOpacity(frame, gal) * dim} />
      {/* ESA 가이아 애니메이션(1280×720) 전체를 크게: 차양판을 펼친 위성 전체가 은하수 앞에서 도는 모습. 위아래는 같은 영상의 흐린 확대 */}
      <AbsoluteFill style={{ opacity: eventOpacity(frame, gaia), backgroundColor: "#02040a" }}>
        <Sequence from={gaia.from} durationInFrames={Math.max(1, gaia.end - gaia.from)} layout="none">
          <OffthreadVideo src={pilot.file("editorial/gaia_esa.mp4")} muted playbackRate={Math.min(1.2, (5.6 * 30) / Math.max(1, gaia.end - gaia.from))} style={{ position: "absolute", width: 1080, height: 1920, objectFit: "cover", filter: "blur(32px) brightness(0.5)", scale: "1.15" }} />
          <div style={{ position: "absolute", left: -150, top: 580, width: 1380, height: 776, overflow: "hidden" }}>
            <OffthreadVideo src={pilot.file("editorial/gaia_esa.mp4")} muted playbackRate={Math.min(1.2, (5.6 * 30) / Math.max(1, gaia.end - gaia.from))} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </Sequence>
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: moveO }}>
        <defs>
          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
          <linearGradient id="streakFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#CFE4FF" stopOpacity={0} /><stop offset="100%" stopColor="#F2F8FF" stopOpacity={1} /></linearGradient>
        </defs>
        {/* 원반: 촘촘한 빛줄기 */}
        <g opacity={Math.min(1, diskHi + flashD * 0.6)}>
          {DISK_STARS.map((d, i) => {
            const w = V_D / d.r;
            const a = d.a0 + sec * w;
            const len = Math.min(1.4, (V_D * 0.42) / d.r); // 0.42초 장노출
            const pts = Array.from({ length: 8 }, (_, k) => diskPt(d.r, a - (len * k) / 7));
            const path = pts.map((q, k) => `${k ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");
            const front = Math.sin(a) > 0; // 앞쪽 반원은 더 밝게
            return <path key={i} d={path} fill="none" stroke={front ? "#EAF3FF" : "#9FC6FF"} strokeWidth={d.w * (1 + flashD)} strokeLinecap="round" opacity={(front ? 0.9 : 0.45) * d.o} />;
          })}
        </g>
        {/* 달무리 같은 뿌연 헤일로: '헤일로…25' 구간에 은하 둘레로 퍼진다 */}
        <defs>
          <radialGradient id="haloMist" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD9A8" stopOpacity={0.32} />
            <stop offset="45%" stopColor="#FFB870" stopOpacity={0.16} />
            <stop offset="80%" stopColor="#FF9A50" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#FF9A50" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={CORE.x} cy={CORE.y} rx={480 + 60 * mist} ry={520 + 60 * mist} fill="url(#haloMist)" opacity={0.25 + 0.75 * mist} />
        {/* 헤일로: 굵은 주황 별, 기울어진 타원 궤도, 짧은 점 잔상 */}
        <g opacity={Math.min(1, haloHi + flashH * 0.6)}>
          {HALO_ORB.map((o, i) => {
            const w = V_H / ((o.rx + o.ry) / 2);
            const a = o.a0 + sec * w;
            const q = haloPt(o, a), q2 = haloPt(o, a - w * 0.25);
            return (
              <g key={i}>
                <line x1={q2.x} y1={q2.y} x2={q.x} y2={q.y} stroke="#FFB24A" strokeWidth={7} strokeLinecap="round" opacity={0.5} />
                <circle cx={q.x} cy={q.y} r={18 + flashH * 10} fill="#FF9A3D" opacity={0.45} filter="url(#starGlow)" />
                <circle cx={q.x} cy={q.y} r={8.5} fill="#FFD9A0" />
              </g>
            );
          })}
        </g>
      </svg>
      <EditorialScreenText pilot={pilot} elementId="lbl_disk2" eventId="disk_label_p" globalFrame={g} style={{ ...labelStyle(54), left: 90, top: 790 }} />
      <EditorialScreenText pilot={pilot} elementId="lbl_220" eventId="v220_label" globalFrame={g} style={{ ...labelStyle(60, "#CFE2FF", 800), left: 600, top: 784, textShadow: `0 0 ${8 + 18 * (pulse(0) * 0.5 + flashD)}px rgba(159,198,255,0.95), 0 2px 14px rgba(0,0,0,0.9)` }} />
      <EditorialScreenText pilot={pilot} elementId="lbl_halo2" eventId="halo_label_p" globalFrame={g} style={{ ...labelStyle(54, YELLOW), left: 90, top: 520 }} />
      <EditorialScreenText pilot={pilot} elementId="lbl_25" eventId="v25_label" globalFrame={g} style={{ ...labelStyle(60, YELLOW, 800), left: 600, top: 514, textShadow: `0 0 ${8 + 18 * (pulse(1.5) * 0.5 + flashH)}px rgba(255,178,74,0.95), 0 2px 14px rgba(0,0,0,0.9)` }} />
    </AbsoluteFill>
  );
};

// Halo 18 그림(850×850) 안 3행 패널: z=1.4 옆모습, z=1.2 충돌, z=0.9 정면모습. z 표기(y≈330 이하)는 잘라 낸다
const PANELS = [
  { x: 3, y: 220, w: 134, h: 104 },
  { x: 147, y: 220, w: 134, h: 104 },
  { x: 291, y: 220, w: 128, h: 100 },
];
const AuPanel: React.FC<{ pilot: EditorialPilotData; p: (typeof PANELS)[number]; w: number; cx: number; cy: number; opacity: number }> = ({ pilot, p, w, cx, cy, opacity }) => {
  const k = w / p.w;
  const h = p.h * k;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, overflow: "hidden", opacity, borderRadius: 10, boxShadow: "0 0 0 2px rgba(255,255,255,0.18)" }}>
      <Img src={pilot.file("editorial/auriga_halo18.png")} style={{ position: "absolute", left: -p.x * k, top: -p.y * k, width: 850 * k, height: 850 * k, maxWidth: "none", maxHeight: "none" }} />
    </div>
  );
};

// ── 시뮬레이션: 오리가 실제 그림 → 25개 격자 → 같은 투영의 옆모습→충돌→정면모습
const Simulation: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const g = useGlobal(pilot, "simulation");
  const t = pilot.timeline;
  const au = useEvent(t, "simulation", "auriga_in");
  const grid = useEvent(t, "simulation", "grid_in");
  const pe = useEvent(t, "simulation", "panel_edge");
  const pc = useEvent(t, "simulation", "panel_crash");
  const pf = useEvent(t, "simulation", "panel_face");
  const arc = useEvent(t, "simulation", "flip_arc");
  // 전체 그림: s06 동안만. 격자(개념 도식)가 시작되면 바로 빠진다
  const figO = eventOpacity(frame, au) * interpolate(frame, [grid.from + 6, grid.from + 18], [1, 0], clamp);
  const zoom = interpolate(frame, [au.from, grid.from], [1.0, 1.06], clamp);
  const gO = frame <= pe.from + 2 ? interpolate(frame, [grid.from, grid.from + 8], [0, 1], clamp) : 0;
  const gp = eventProgress(frame, grid, "enter");
  const pick = interpolate(gp, [0.55, 1], [0, 1], clamp);
  const SLOW = new Set([6, 13, 21]);
  const sec = frame / 30;
  // '공통점이' 이후 골라낸 은하들을 가운데로 모음
  const gat = interpolate(frame, [grid.settled + 6, grid.to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const ap = eventProgress(frame, arc, "enter");
  const aO = eventOpacity(frame, arc);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ opacity: figO }}>
        <Img src={pilot.file("editorial/auriga_halo18.png")} style={{ position: "absolute", left: 120, top: 440, width: 840, height: 840, scale: String(zoom) }} />
      </AbsoluteFill>
      {/* 25개 은하: 실제 시뮬레이션 결과가 아닌 개수·기준 도식. 칸마다 작은 나선은하와 그 둘레를 도는 주황 헤일로 별(속도가 제각각).
          '후광이 가장 느린'에서 헤일로가 가장 느린 은하들만 노란 테두리로 남기고, '공통점이'부터 가운데로 모은다 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: gO }}>
        <defs>
          <radialGradient id="miniGal" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF4DC" stopOpacity={1} />
            <stop offset="30%" stopColor="#F2D9B0" stopOpacity={0.9} />
            <stop offset="70%" stopColor="#9FC6FF" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#9FC6FF" stopOpacity={0} />
          </radialGradient>
        </defs>
        {Array.from({ length: 25 }, (_, i) => {
          const col = i % 5, row = Math.floor(i / 5);
          const cx0 = 180 + col * 180, cy0 = 600 + row * 150;
          const slow = SLOW.has(i);
          const gather = slow ? gat : 0;
          const si = [...SLOW].indexOf(i);
          const cx = cx0 + ((360 + si * 180) - cx0) * gather, cy = cy0 + (900 - cy0) * gather;
          const appear = Math.min(1, Math.max(0, gp * 3 - (i / 25) * 1.2 + 0.6));
          const o = (slow ? 1 : (1 - 0.82 * pick) * (1 - gat)) * appear;
          const tilt = (rand(i + 4001) - 0.5) * 40;
          const flat = 0.28 + rand(i + 4101) * 0.3;
          const spin = sec * 0.6;
          const w = slow ? 0.12 : 0.55 + rand(i + 4201) * 0.9; // 헤일로 별 각속도(느린 은하는 확연히 느리게)
          const sc = 1 + 0.25 * gather;
          return (
            <g key={i} opacity={o} transform={`translate(${cx} ${cy}) scale(${sc})`}>
              <g transform={`rotate(${tilt})`}>
                <ellipse cx={0} cy={0} rx={50} ry={50 * flat} fill="url(#miniGal)" />
                {[0, 1].map((k) => (
                  <path key={k} d={`M 0 0 Q ${22} ${-16 * flat} ${44} ${2 * flat}`} fill="none" stroke="#CFE0FF" strokeWidth={2} opacity={0.6}
                    transform={`scale(1 ${1}) rotate(${k * 180 + (spin * 57) % 360} 0 0) scale(1 ${flat})`} />
                ))}
                <circle cx={0} cy={0} r={6} fill="#FFFFFF" />
              </g>
              {Array.from({ length: 4 }, (_, k) => {
                const a = (k / 4) * Math.PI * 2 + sec * w + rand(i * 10 + k) * 2;
                const ht = (rand(i * 10 + k + 4301) - 0.5) * 120 * (Math.PI / 180);
                const x = Math.cos(a) * 64, y = Math.sin(a) * 34;
                return <circle key={k} cx={x * Math.cos(ht) - y * Math.sin(ht)} cy={x * Math.sin(ht) + y * Math.cos(ht)} r={3.6} fill="#FFB24A" />;
              })}
              <rect x={-72} y={-56} width={144} height={112} rx={16} fill="none" stroke={YELLOW} strokeWidth={4} opacity={slow ? pick : 0} />
            </g>
          );
        })}
      </svg>
      {/* 사진 찍는 효과: 패널이 바뀔 때마다 셔터 번쩍임 · 살짝 튀는 스냅 · 흰 사진 테두리 · 뷰파인더 모서리 */}
      {(() => {
        const shots = [pe.from, pc.from, pf.from];
        const pop = 1 + 0.06 * Math.max(...shots.map((t0) => interpolate(frame, [t0, t0 + 7], [1, 0], clamp)));
        const panelO = Math.max(eventOpacity(frame, pe), eventOpacity(frame, pc), eventOpacity(frame, pf));
        return (
          <AbsoluteFill style={{ scale: String(pop), transformOrigin: "540px 860px" }}>
            <div style={{ position: "absolute", left: 540 - 450 - 14, top: 860 - 349 - 14, width: 900 + 28, height: 698 + 28, backgroundColor: "#F4F1EA", borderRadius: 6, opacity: panelO, boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }} />
            <AuPanel pilot={pilot} p={PANELS[0]} w={900} cx={540} cy={860} opacity={eventOpacity(frame, pe)} />
            <AuPanel pilot={pilot} p={PANELS[1]} w={900} cx={540} cy={860} opacity={eventOpacity(frame, pc)} />
            <AuPanel pilot={pilot} p={PANELS[2]} w={900} cx={540} cy={860} opacity={eventOpacity(frame, pf)} />
          </AbsoluteFill>
        );
      })()}
      {(() => {
        const shots = [pe.from, pc.from, pf.from];
        const flash = Math.max(...shots.map((t0) => interpolate(frame, [t0, t0 + 2, t0 + 9], [0, 0.85, 0], clamp)));
        const panelO = Math.max(eventOpacity(frame, pe), eventOpacity(frame, pc), eventOpacity(frame, pf));
        const L = 70, x0 = 540 - 500, x1 = 540 + 500, y0 = 860 - 400, y1 = 860 + 400;
        return (
          <>
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: panelO * 0.9 }}>
              {[[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].map(([x, y, sx, sy], k) => (
                <path key={k} d={`M ${x} ${y + sy * L} L ${x} ${y} L ${x + sx * L} ${y}`} fill="none" stroke="#FFFFFF" strokeWidth={5} />
              ))}
            </svg>
            <AbsoluteFill style={{ backgroundColor: "#FFFFFF", opacity: flash }} />
          </>
        );
      })()}
      {/* 옆에서 본 기울어짐: 가로로 놓인 옆모습 원반이 '원반이 구십 도 넘게'에 맞춰 중심을 축으로 약 102° 돈다.
          원래 가로 자리는 반투명 잔상, 잔상과 기운 원반 사이에 흰 각도 호 */}
      {(() => {
        const ang = -102 * ap;
        const C = { x: 540, y: 900 };
        const Band: React.FC<{ deg: number; o: number; ghost?: boolean }> = ({ deg, o, ghost }) => (
          <div style={{ position: "absolute", left: C.x - 480, top: C.y - 120, width: 960, height: 240, overflow: "hidden", rotate: `${deg}deg`, transformOrigin: "480px 120px", opacity: o, filter: ghost ? "grayscale(1) brightness(1.4)" : undefined,
            WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 70%, transparent 100%)" }}>
            <Img src={pilot.file("editorial/galaxy_side.png")} style={{ position: "absolute", left: -60, top: -(888 - 120), width: 1080, height: 1920, maxWidth: "none", maxHeight: "none" }} />
          </div>
        );
        const R = 300;
        const a0 = 0, a1 = (ang * Math.PI) / 180;
        const arc = Array.from({ length: 30 }, (_, k) => { const a = a0 + ((a1 - a0) * k) / 29; return `${k ? "L" : "M"}${(C.x + Math.cos(a) * R).toFixed(1)} ${(C.y + Math.sin(a) * R).toFixed(1)}`; }).join(" ");
        return (
          <AbsoluteFill style={{ opacity: aO }}>
            <AbsoluteFill style={{ backgroundColor: "#02040a" }} />
            <Band deg={0} o={0.35} ghost />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <line x1={C.x - 470} y1={C.y} x2={C.x + 470} y2={C.y} stroke="#C8D0DA" strokeWidth={3} strokeDasharray="16 12" opacity={0.7} />
            </svg>
            <Band deg={ang} o={1} />
            <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
              <line x1={C.x - Math.cos(a1) * 470} y1={C.y - Math.sin(a1) * 470} x2={C.x + Math.cos(a1) * 470} y2={C.y + Math.sin(a1) * 470} stroke="#FFFFFF" strokeWidth={3} opacity={0.6} />
              <path d={arc} fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" />
              <circle cx={C.x + Math.cos(a1) * R} cy={C.y + Math.sin(a1) * R} r={11} fill="#FFFFFF" />
            </svg>
          </AbsoluteFill>
        );
      })()}
      <EditorialScreenText pilot={pilot} elementId="lbl_25gal" eventId="grid_label" globalFrame={g} style={{ ...labelStyle(60, YELLOW, 800), left: 0, width: 1080, textAlign: "center", top: 450 }} />
      <EditorialScreenText pilot={pilot} elementId="lbl_90" eventId="deg_label" globalFrame={g} style={{ ...labelStyle(68, "#FFFFFF", 800), left: 760, top: 700 }} />
    </AbsoluteFill>
  );
};

// 질량 비교 알갱이: 우리 은하 500개(납작한 원반+팽대부), 작은 은하 100개(공 모양)
const MASS_MW = Array.from({ length: 500 }, (_, i) => {
  const a = rand(i + 5001) * Math.PI * 2, rr = Math.sqrt(rand(i + 5101));
  const bulge = rand(i + 5201) < 0.18;
  return bulge
    ? { x: Math.cos(a) * rr * 50, y: Math.sin(a) * rr * 36, r: 2.4, c: "#FFF1D6" }
    : { x: Math.cos(a) * rr * 210, y: Math.sin(a) * rr * 34, r: 1.8 + rand(i + 5301) * 1.2, c: rand(i + 5401) < 0.7 ? "#BFD8FF" : "#EAF3FF" };
});
const MASS_GSE = Array.from({ length: 100 }, (_, i) => {
  const a = rand(i + 5501) * Math.PI * 2, rr = Math.pow(rand(i + 5601), 0.6) * 62;
  return { x: Math.cos(a) * rr, y: Math.sin(a) * rr * 0.85 };
});
// ── 우리 은하의 과거: 작은 은하의 정면 돌입(생성) → 5칸:1칸
const OurPast: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const g = useGlobal(pilot, "our_past");
  const t = pilot.timeline;
  const gse = useEvent(t, "our_past", "gse_in");
  const mass = useEvent(t, "our_past", "mass_cmp");
  const ratio = useEvent(t, "our_past", "ratio_label");
  // 8초 생성 영상을 개념 길이에 맞춰 늘린다(돌입·흩어짐이 s10에 오도록)
  const len = Math.max(1, gse.end - gse.from);
  const rate = Math.min(1, (8 * 30) / len);
  // 질량 비교: 푸른빛 알갱이 500개(우리 은하) : 금빛 알갱이 100개(작은 은하) = 5 : 1.
  // '5분의 1쯤'에 금빛 덩어리 등장, '왜소은하치곤 큰 덩치였습니다'에 맥동 후 우리 은하 쪽으로 빨려 들어간다
  const mp = eventProgress(frame, mass, "enter");
  const mO = eventOpacity(frame, mass);
  const one = interpolate(frame, [ratio.from, ratio.settled], [0, 1], easeInOut);
  const merge = interpolate(frame, [ratio.to - 34, ratio.to + 6], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const pulseG = 1 + 0.12 * Math.max(0, Math.sin((frame - ratio.settled) * 0.45)) * interpolate(frame, [ratio.settled, ratio.settled + 4, ratio.to - 34], [0, 1, 0], clamp);
  const MW = { x: 330, y: 1100 }, GS = { x: 820, y: 1100 };
  const x0 = MW.x - 200, y0 = MW.y - 70;
  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <Video pilot={pilot} file="editorial/gse_merger.mp4" ev={gse} rate={rate} />

      <AbsoluteFill style={{ opacity: mO * 0.7, background: "linear-gradient(180deg, rgba(2,4,10,0) 40%, rgba(2,4,10,0.9) 52%, rgba(2,4,10,0.9) 68%, rgba(2,4,10,0) 78%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: mO }}>
        <defs><filter id="pGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter></defs>
        {MASS_MW.map((q, i) => {
          const show = Math.min(1, Math.max(0, mp * 1.4 - (i / MASS_MW.length) * 0.4));
          return <circle key={`m${i}`} cx={MW.x + q.x * (0.3 + 0.7 * show)} cy={MW.y + q.y * (0.3 + 0.7 * show)} r={q.r} fill={q.c} opacity={show * 0.95} />;
        })}
        <g filter="url(#pGlow)" opacity={0.6 * one * (1 - merge)}>
          <circle cx={GS.x} cy={GS.y} r={70 * pulseG} fill="#FFD27A" opacity={0.35} />
        </g>
        {MASS_GSE.map((q, i) => {
          const gx = GS.x + q.x * pulseG, gy = GS.y + q.y * pulseG;
          const tx = MW.x + MASS_MW[i * 5].x * 1.15, ty = MW.y + MASS_MW[i * 5].y * 1.6 - 30;
          const x = gx + (tx - gx) * merge, y = gy + (ty - gy) * merge;
          return <circle key={`g${i}`} cx={x} cy={y} r={2.6} fill={merge > 0.6 ? "#FFB24A" : "#FFE6A8"} opacity={one} />;
        })}
      </svg>
      <EditorialScreenText pilot={pilot} elementId="lbl_mw" eventId="mw_label" globalFrame={g} style={{ ...labelStyle(52, "#CFE2FF", 800), left: x0, width: 400, textAlign: "center", top: y0 - 110 }} />
      <EditorialScreenText pilot={pilot} elementId="lbl_ratio" eventId="ratio_label" globalFrame={g} style={{ ...labelStyle(58, YELLOW, 800), left: GS.x - 110, width: 220, textAlign: "center", top: GS.y - 160, opacity: 1 - merge }} />
    </AbsoluteFill>
  );
};

// ── 중요한 한 가지: 배경을 누르고(강조는 공통 레이어), 원반이 기울며 궤도가 갈라진다
const Key: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const g = useGlobal(pilot, "key");
  const t = pilot.timeline;
  const dim = useEvent(t, "key", "dim_in");
  const orb = useEvent(t, "key", "orbit_turn");
  const op = eventProgress(frame, orb, "enter");
  const oO = eventOpacity(frame, orb);
  const ang = -78 * op;
  // s12: 원반 둘레의 노란 헤일로 별(흡수된 작은 은하의 별)이 느리게 도는 모습 — '느린 회전'과 '충돌의 흔적'을 함께 둔다
  const haloO = eventOpacity(frame, dim) * (1 - op);
  const sec = frame / 30;
  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <AbsoluteFill style={{ translate: `0px ${-330 * (1 - op)}px` }}>
      <Still pilot={pilot} file="editorial/galaxy_side.png" scale={1.1} opacity={eventOpacity(frame, dim) * (0.45 - 0.25 * op)} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: haloO }}>
        {HALO_STARS.map((s, i) => {
          const a = Math.atan2(s.y - CORE.y, s.x - CORE.x) + sec * 0.05;
          const r = Math.hypot(s.x - CORE.x, (s.y - CORE.y) * 0.9);
          return <circle key={i} cx={CORE.x + Math.cos(a) * r} cy={CORE.y + Math.sin(a) * r * 1.1} r={s.s} fill={YELLOW} opacity={0.8} />;
        })}
      </svg>
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: oO }}>
        {/* 예전 궤도: 원래 원반면에 남은 점선 */}
        <ellipse cx={CORE.x} cy={CORE.y} rx={400} ry={70} fill="none" stroke="#C8D0DA" strokeWidth={3} strokeDasharray="14 12" opacity={0.85} />
        {/* 지금 원반·궤도: 기울어진다 */}
        <g transform={`rotate(${ang} ${CORE.x} ${CORE.y})`}>
          <ellipse cx={CORE.x} cy={CORE.y} rx={400} ry={70} fill="none" stroke={YELLOW} strokeWidth={5} />
          <ellipse cx={CORE.x} cy={CORE.y} rx={260} ry={16} fill="rgba(255,230,190,0.55)" />
          <circle cx={CORE.x + 400 * Math.cos((frame / 30) * 1.4)} cy={CORE.y + 70 * Math.sin((frame / 30) * 1.4)} r={10} fill={YELLOW} />
        </g>
        <circle cx={CORE.x} cy={CORE.y} r={16} fill="#fff1d6" />
      </svg>
      <EditorialScreenText pilot={pilot} elementId="lbl_orbit" eventId="orbit_label" globalFrame={g} style={{ ...labelStyle(58, "#E3E8EF", 800), left: 110, top: 970 }} />
    </AbsoluteFill>
  );
};

// ── 마무리: 실제 은하수 하늘로 돌아와 천천히 넓게
const Close: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const ev = useEvent(pilot.timeline, "close", "sky_end_in");
  const len = Math.max(1, ev.end - ev.from);
  const rate = Math.min(1, (8 * 25) / len);
  const scale = interpolate(frame, [ev.from, ev.end], [1.14, 1.0], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return (
    <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
      <Video pilot={pilot} file="editorial/paranal.mp4" ev={ev} rate={rate} scale={scale} origin="30% 30%" />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<{ pilot: EditorialPilotData }>> = {
  hook: Hook,
  structure: Structure,
  puzzle: Puzzle,
  simulation: Simulation,
  our_past: OurPast,
  key: Key,
  close: Close,
};

export const EditorialEpisode: React.FC<EditorialEpisodeProps> = ({ pilot }) => (
  <AbsoluteFill style={{ backgroundColor: "#02040a" }}>
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
