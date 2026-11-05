import React from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, Img, Interactive, interpolate, OffthreadVideo, Sequence, spring, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { ConceptSequence, eventInConcept, eventOpacity, eventProgress } from "../../lib/editorial";
import type { CompiledEvent, EditorialTimeline } from "../../lib/editorial";
import type { EditorialEpisodeProps, EditorialPilotData } from "../pilot";

/**
 * 꺾이지 않는 초고층 건축 바람 — 사용자 제공 원고 그대로.
 * 141칸 격자는 실제 141개(2025년 완공 200m 이상), 그중 91칸이 중국. 400점 중 88점이 300m 초과.
 * 두 배 막대는 1:2 비율만 정확하다(2017년 값 자체는 표기하지 않는다). 높이 비교는 0~1km 선형, 부르즈칼리파 828m.
 * 에너지 단면은 Higgsfield 생성 가상 건물이고 층별 띠는 '위로 갈수록 커진다'는 경향만 나타낸다(측정값 아님).
 * 시간은 timeline 사건에서만 받는다.
 */

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YELLOW = "#FFD16A";
const NAVY = "#060a14";

const pop = (frame: number, at: number, damping = 11) => spring({ frame: frame - at, fps: 30, config: { damping, stiffness: 170, mass: 0.6 } });
const ease = (frame: number, a: number, b: number) => interpolate(frame, [a, Math.max(a + 1, b)], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 1, 0.68, 1) });

/** 배경 실사는 들어올 때 페이드하지 않는다(개념 경계에서 검은 프레임이 생기지 않게). 나갈 때만 사라진다 */
const inOpacity = (frame: number, ev: CompiledEvent) => (frame < ev.from ? 0 : frame < ev.to ? 1 : eventOpacity(frame, ev));
const useEvent = (timeline: EditorialTimeline, conceptId: string, eventId: string): CompiledEvent => eventInConcept(timeline, conceptId, eventId);

/** 화면 키워드 — 대상 곁에 붙는 짧은 문구 */
const Label: React.FC<{ name: string; x: number; y: number; opacity: number; k?: number; size?: number; color?: string; align?: "left" | "center"; weight?: number; pill?: boolean; shadow?: string; children: React.ReactNode }> = ({ name, x, y, opacity, k = 1, size = 56, color = "#fff", align = "center", weight = 800, pill = false, shadow, children }) => (
  <Interactive.Div
    name={name}
    style={{
      position: "absolute",
      left: align === "center" ? x - 540 : x,
      top: y,
      width: align === "center" ? 1080 : undefined,
      textAlign: align,
      opacity,
      scale: String(0.75 + 0.25 * Math.min(1.08, k)),
      transformOrigin: align === "center" ? "50% 50%" : "0% 50%",
      fontFamily: "Pretendard",
      fontWeight: weight,
      fontSize: size,
      letterSpacing: -1,
      color,
      whiteSpace: "nowrap",
      textShadow: pill ? undefined : shadow ?? "0 2px 16px rgba(0,0,0,0.85)",
    }}
  >
    {pill ? (
      <span style={{ display: "inline-block", backgroundColor: "rgba(6,10,20,0.72)", border: `2px solid ${color === "#fff" ? "rgba(255,255,255,0.35)" : color}`, borderRadius: 14, padding: "10px 26px" }}>{children}</span>
    ) : (
      children
    )}
  </Interactive.Div>
);

const Photo: React.FC<{ pilot: EditorialPilotData; file: string; ev: CompiledEvent; from?: number; to?: number; origin?: string; filter?: string }> = ({ pilot, file, ev, from = 1.0, to = 1.08, origin = "50% 50%", filter }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: inOpacity(frame, ev) }}>
      <Img src={pilot.file(file)} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(interpolate(frame, [ev.from, ev.end], [from, to], clamp)), transformOrigin: origin, filter }} />
    </AbsoluteFill>
  );
};

const FullVideo: React.FC<{ pilot: EditorialPilotData; file: string; ev: CompiledEvent; rate?: number; push?: [number, number]; filter?: string }> = ({ pilot, file, ev, rate = 1, push = [1, 1.05], filter }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: inOpacity(frame, ev) }}>
      <Sequence from={ev.from} durationInFrames={Math.max(1, ev.end - ev.from)} layout="none">
        <OffthreadVideo src={pilot.file(file)} muted playbackRate={rate} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(interpolate(frame, [ev.from, ev.end], push, clamp)), filter }} />
      </Sequence>
    </AbsoluteFill>
  );
};

/** 로고(오른쪽 위) 주변만 살짝 눌러 밝은 화면에서도 로고가 읽히게 */
const LogoShade: React.FC<{ light?: boolean }> = ({ light }) => <AbsoluteFill style={{ background: light ? "radial-gradient(circle 150px at 930px 320px, rgba(30,42,58,0.14) 0%, rgba(30,42,58,0) 100%)" : "radial-gradient(circle 170px at 930px 320px, rgba(3,6,12,0.55) 0%, rgba(3,6,12,0) 100%)" }} />;

// ── 141칸 격자: 12열, 건물 기호 높이는 고정 의사난수(같은 편 안에서 두 번 쓰므로 같은 모양)
// 중국 91칸 — 격자 안에 고르게 퍼지게 고른다(실제 위치 의미 없음, 개수만 정확)
const CHINA = new Set(Array.from({ length: 141 }, (_, i) => i).filter((i) => (i * 91) % 141 < 91));


// ── 도입: 부르즈칼리파 → 메르데카118 → 상하이타워(후킹 문구는 공통 트랙)
const Hook: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const burj = useEvent(t, "hook_towers", "burj_in");
  const mer = useEvent(t, "hook_towers", "merdeka_in");
  const sh = useEvent(t, "hook_towers", "shanghai_in");
  const rise = useEvent(t, "hook_towers", "sh_rise_in");
  const hook = useEvent(t, "hook_towers", "hook_text");
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <FullVideo pilot={pilot} file="editorial/burj.mp4" ev={burj} push={[1.0, 1.08]} />
      <FullVideo pilot={pilot} file="editorial/merdeka.mp4" ev={mer} push={[1.06, 1.0]} />
      <FullVideo pilot={pilot} file="editorial/shanghai.mp4" ev={sh} push={[1.0, 1.08]} />
      <FullVideo pilot={pilot} file="editorial/sh_rise.mp4" ev={rise} push={[1.0, 1.05]} />
      <AbsoluteFill style={{ opacity: eventOpacity(frame, hook), background: "linear-gradient(180deg, rgba(4,6,12,0) 26%, rgba(4,6,12,0.38) 36%, rgba(4,6,12,0.38) 50%, rgba(4,6,12,0) 60%)" }} />
      <LogoShade />
    </AbsoluteFill>
  );
};

// ── 지난해 141개: 4컷 3D 시퀀스(2026-11-05 사용자 구성안)
// Cut1 전체 뷰: 141동이 바닥 격자에서 솟으며 슬레이트 블루-그레이로 정렬 / Cut2 사선 Z축 플라이스루 + 141 카운팅
// Cut3 한 동(JP모건 본사 자리)만 앰버 골드·네온 시안으로 발광, 전면으로 타이트 줌인 / Cut4 그 창문 면에서 실사 사진으로 전환
// 12열×12행, 마지막 행 9동 = 정확히 141. 높이는 고정 의사난수(모양용, 측정값 아님). 위치 의미 없음.
const G3 = { cols: 12, sp: 74, w: 36 };
const PICK3 = 43; // 4번째 줄 7열 — 군집 안쪽. 앞줄 지붕(최고 약 240) 위 높이(262)에서 상단 전면으로 줌인한다
const pos3 = (i: number) => {
  const c = i % G3.cols, r = Math.floor(i / G3.cols);
  return [(c - 5.5) * G3.sp, -(r - 5.5) * G3.sp] as const; // [x, z] — 0행이 앞
};
const h3 = (i: number) => (i === PICK3 ? 300 : 70 + ((i * 37) % 23) * 7);
const lerp3 = (a: number[], b: number[], k: number) => a.map((v, n) => v + (b[n] - v) * k);
const bez3 = (a: number[], m: number[], b: number[], k: number) => lerp3(lerp3(a, m, k), lerp3(m, b, k), k);
const SLATE = [127, 147, 174];
// 141개 장면 톤 후보 — 141_TONE 하나만 바꿔 비교한다
type Tone3 = { sky: string; fog: string; ground: string; grid: [string, string]; bldg: string; amb: number; hemi: [string, string, number]; sun: number; text: string; sub: string; shadow: string; shade: string };
const TONES: Record<string, Tone3> = {
  navy: { sky: "#0a1324", fog: "#0a1324", ground: "#0d1830", grid: ["#2a4166", "#1a2a46"], bldg: `rgb(${SLATE.join(",")})`, amb: 0.3, hemi: ["#bcd2ff", "#0a1324", 0.25], sun: 1.35, text: "#fff", sub: "#DCE3EC", shadow: "0 2px 16px rgba(0,0,0,0.85)", shade: "linear-gradient(180deg, rgba(6,10,20,0.9) 0%, rgba(6,10,20,0.75) 30%, rgba(6,10,20,0) 42%, rgba(6,10,20,0) 80%, rgba(6,10,20,0.5) 100%)" },
  clay: { sky: "#E9ECEF", fog: "#E9ECEF", ground: "#DCDDDA", grid: ["#C3C6C9", "#D0D2D3"], bldg: "#F4F2EC", amb: 0.55, hemi: ["#ffffff", "#c9c6bd", 0.5], sun: 1.6, text: "#1E2A3A", sub: "#4A5666", shadow: "0 2px 14px rgba(255,255,255,0.9)", shade: "linear-gradient(180deg, rgba(233,236,239,0.95) 0%, rgba(233,236,239,0.8) 30%, rgba(233,236,239,0) 42%)" },
  dawn: { sky: "#DCE5EE", fog: "#DCE5EE", ground: "#C5D0DB", grid: ["#A9B7C6", "#B8C4D0"], bldg: "#AEBDCE", amb: 0.5, hemi: ["#f4ece4", "#9fb0c3", 0.45], sun: 1.5, text: "#1E2A3A", sub: "#46546A", shadow: "0 2px 14px rgba(255,255,255,0.85)", shade: "linear-gradient(180deg, rgba(220,229,238,0.95) 0%, rgba(220,229,238,0.8) 30%, rgba(220,229,238,0) 42%)" },
  sand: { sky: "#ECE6DA", fog: "#ECE6DA", ground: "#D8D0C1", grid: ["#BFB6A6", "#CCC4B5"], bldg: "#CFC6B6", amb: 0.5, hemi: ["#fff6e8", "#b8ad99", 0.45], sun: 1.5, text: "#2A2620", sub: "#5A5246", shadow: "0 2px 14px rgba(255,255,255,0.85)", shade: "linear-gradient(180deg, rgba(236,230,218,0.95) 0%, rgba(236,230,218,0.8) 30%, rgba(236,230,218,0) 42%)" },
};
const TONE141 = TONES.dawn; // 2026-11-05 사용자 선택: 새벽 블루그레이

const Rig: React.FC<{ pos: number[]; look: number[] }> = ({ pos, look }) => {
  const { camera } = useThree();
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  camera.updateProjectionMatrix();
  return null;
};

// 생성 외벽(창 안 사무실) 텍스처 — 이미지 로드가 끝날 때까지 렌더를 붙잡는다
const useFacadeTexture = (src: string) => {
  const [handle] = React.useState(() => delayRender("facade texture"));
  const tex = React.useMemo(() => {
    const t = new THREE.TextureLoader().load(src, () => continueRender(handle), undefined, () => continueRender(handle));
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  }, [src, handle]);
  return tex;
};
const FACADE_TILE_H = 41.4 / (752 / 1344); // 2열×6층 한 장이 정면 폭(41.4)에 맞을 때의 높이

const City141: React.FC<{ frame: number; appearFrom: number; appearTo: number; gold: number; shell: number; facadeSrc: string; cam: { pos: number[]; look: number[] }; paint?: (i: number) => { c: string; lift: number } | null }> = ({ frame, appearFrom, appearTo, gold, shell, facadeSrc, cam, paint }) => {
  const facade = useFacadeTexture(facadeSrc);
  return (
    <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 38, near: 5, far: 8000, position: [0, 1250, 2300] }} style={{ position: "absolute", inset: 0 }}>
      <Rig pos={cam.pos} look={cam.look} />
      <color attach="background" args={[TONE141.sky]} />
      <fog attach="fog" args={[TONE141.fog, 2200, 5200]} />
      <ambientLight intensity={TONE141.amb} color="#c9d6ea" />
      <hemisphereLight args={TONE141.hemi} />
      <directionalLight position={[-900, 1400, 700]} intensity={TONE141.sun} color="#fff2dc" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-900} shadow-camera-right={900} shadow-camera-top={900} shadow-camera-bottom={-900} shadow-camera-near={100} shadow-camera-far={4000} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color={TONE141.ground} roughness={0.95} />
      </mesh>
      <gridHelper args={[1200, 16, TONE141.grid[0], TONE141.grid[1]]} position={[0, 0.5, 0]} />
      {Array.from({ length: 141 }, (_, i) => {
        const at = appearFrom + (appearTo - appearFrom) * Math.pow(i / 141, 1.7); // 처음 몇 동이 바로 솟아 빈 화면을 없앤다(r5 shot-judge F3)
        const k = Math.min(1, ease(frame, at, at + 10));
        if (k <= 0) return null;
        const [x, z] = pos3(i);
        const pt = paint ? paint(i) : null;
        const h = Math.max(0.1, h3(i) * k * (pt ? pt.lift : 1));
        const isPick = i === PICK3;
        const g = isPick ? gold : 0;
        const w = isPick ? G3.w * 1.15 : G3.w;
        const col = pt ? pt.c : TONE141.bldg;
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[w, h, w]} />
              {g > 0.01 ? (
                <meshStandardMaterial color="#2a4266" roughness={0.3} metalness={0.4} emissive="#ffb43a" emissiveIntensity={0.35 * g} />
              ) : (
                <meshStandardMaterial color={col} roughness={0.6} metalness={0.15} />
              )}
            </mesh>
            <mesh position={[0, h + 7 * k, 0]} castShadow>
              <boxGeometry args={[w * 0.45, Math.max(0.1, 14 * k), w * 0.45]} />
              <meshStandardMaterial color={g > 0.01 ? "#ffc85a" : col} roughness={0.5} emissive={g > 0.01 ? "#ffb43a" : "#000000"} emissiveIntensity={0.8 * g} />
            </mesh>
            {g > 0.01 ? (
              <>
                <mesh position={[0, h / 2, w / 2 + 0.35]}>
                  <planeGeometry args={[w, h]} />
                  <meshBasicMaterial map={facade} transparent opacity={g} toneMapped={false} map-repeat={[1, h / FACADE_TILE_H]} />
                </mesh>
                <mesh position={[0, h / 2, 0]}>
                  <boxGeometry args={[w + 16, h + 14, w + 16]} />
                  <meshBasicMaterial color="#ffb43a" transparent opacity={0.22 * g * shell} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
                <mesh position={[0, h / 2, 0]}>
                  <boxGeometry args={[w + 40, h + 34, w + 40]} />
                  <meshBasicMaterial color="#5ff3ff" transparent opacity={0.08 * g * shell} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
                <Segs pts={boxEdges(0, 0, 0, w + 3, h + 2, w + 3)} color="#5ff3ff" opacity={g * shell} />
              </>
            ) : null}
          </group>
        );
      })}
    </ThreeCanvas>
  );
};

const Count2025: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const grid = useEvent(t, "count_2025", "grid_in");
  const done = useEvent(t, "count_2025", "tag_done_in");
  const fly = useEvent(t, "count_2025", "fly_in");
  const t141 = useEvent(t, "count_2025", "tag_141_in");
  const c200 = useEvent(t, "count_2025", "cond_200m_in");
  const pick = useEvent(t, "count_2025", "pick_in");
  const jpm = useEvent(t, "count_2025", "jpm_in");
  const rise = useEvent(t, "count_2025", "rise_in");
  const tj = useEvent(t, "count_2025", "tag_jpm_in");
  const [pxw, pzw] = pos3(PICK3);
  // Cut1 고공 전체 뷰(느린 드리프트) → Cut2 왼쪽 저공으로 사선 하강하며 군집을 스침 → Cut3 선택 동 전면으로 타이트 줌인
  // Cut1 고공 전체 뷰 → Cut2 사선 하강하며 군집을 스침 → Cut3 선택 동 앞 골목(3·4번째 줄 사이)으로 낮게 들어가 정면으로 돌아선다
  const street = pzw + G3.sp / 2; // 선택 동 앞 골목 한가운데 z
  const P0 = [0, 3300, 2400], P0b = [40, 3050, 2250], L0 = [0, 0, -60];
  const Pm = [-560, 330, 860], P1 = [pxw + 460, 320, pzw + 520], L1 = [pxw + 80, 120, street];
  const E = [pxw + 520, 120, street], Pt = [pxw + 20, 26, street + 10], Lup = [pxw, 240, pzw];
  // 마지막 무빙: 올려다본 채 위로·왼쪽으로 등속 이동(실사 사진 무빙과 같은 방향·속도로 이어진다)
  const Pr = [pxw - 16, 110, street + 6], Lr = [pxw - 6, 330, pzw];
  const r = interpolate(frame, [rise.from, jpm.settled + 4], [0, 1], clamp);
  const a = ease(frame, grid.from, fly.from);
  const b = ease(frame, fly.from, fly.settled);
  const c = interpolate(frame, [pick.from, pick.settled], [0, 1], { ...clamp, easing: Easing.bezier(0.4, 0, 0.25, 1) });
  const pos = r > 0 ? lerp3(Pt, Pr, r) : c > 0 ? bez3(P1, E, Pt, c) : b > 0 ? bez3(P0b, Pm, P1, b) : lerp3(P0, P0b, a);
  // 골목을 따라가며 앞(-x)을 보다가 마지막에 선택 동 전면(-z)으로 고개를 돌린다
  const turn = ease(frame, pick.from + (pick.settled - pick.from) * 0.55, pick.settled);
  const lookRun = [pos[0] - 300, 150, street];
  const look = r > 0 ? lerp3(Lup, Lr, r) : c > 0 ? lerp3(lerp3(L1, lookRun, Math.min(1, c * 2)), Lup, turn) : b > 0 ? lerp3(L0, L1, b) : L0;
  const gold = ease(frame, pick.from, pick.from + 14);
  // Cut4: 창문 면이 화면을 채운 뒤 실사로 겹쳐 바뀐다
  const photoK = eventProgress(frame, jpm, "enter");
  const count = Math.round(141 * ease(frame, t141.from, t141.settled));
  return (
    <AbsoluteFill style={{ backgroundColor: TONE141.sky }}>
      {frame < jpm.settled ? (
        <AbsoluteFill style={{ opacity: eventOpacity(frame, grid) }}>
          <City141 frame={frame} appearFrom={grid.from} appearTo={grid.settled} gold={gold} shell={1 - turn} facadeSrc={pilot.file("editorial/facade_tile.png")} cam={{ pos, look }} />
          <AbsoluteFill style={{ opacity: 1 - c, background: TONE141.shade }} />
        </AbsoluteFill>
      ) : null}
      <Label name="2025년 완공" x={540} y={420} opacity={eventOpacity(frame, done)} k={pop(frame, done.from)} size={96} color={TONE141.text} shadow={TONE141.shadow}>2025년 완공</Label>
      <Label name="141개" x={540} y={410} opacity={eventOpacity(frame, t141)} k={pop(frame, t141.from)} size={124} color={TONE141.text} shadow={TONE141.shadow}>{`${count}개`}</Label>
      <Label name="(높이 200m 이상)" x={540} y={556} opacity={eventOpacity(frame, c200)} size={46} weight={700} color={TONE141.sub} shadow={TONE141.shadow}>(높이 200m 이상)</Label>
      {frame >= jpm.from ? (
        <>
          {/* 금색 빛 띠가 아래→위로 훑은 자리부터 실사. 사진도 위로·왼쪽 카메라 무빙(내용은 아래·오른쪽으로 흐름)을 이어받는다 */}
          <AbsoluteFill style={{ opacity: eventOpacity(frame, jpm), maskImage: `linear-gradient(to top, #000 ${-12 + 124 * photoK - 9}%, transparent ${-12 + 124 * photoK + 9}%)`, WebkitMaskImage: `linear-gradient(to top, #000 ${-12 + 124 * photoK - 9}%, transparent ${-12 + 124 * photoK + 9}%)` }}>
            <Img src={pilot.file("editorial/jpm.jpg")} style={{ width: 1080, height: 1920, objectFit: "cover", scale: String(interpolate(frame, [jpm.from, jpm.end], [1.16, 1.03], clamp)), translate: `${interpolate(frame, [jpm.from, jpm.end], [-26, 26], clamp)}px ${interpolate(frame, [jpm.from, jpm.end], [-70, 50], clamp)}px` }} />
            <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,6,12,0) 50%, rgba(4,6,12,0.6) 72%)" }} />
          </AbsoluteFill>
          {photoK > 0 && photoK < 1 ? (
            <div style={{ position: "absolute", left: 0, width: 1080, top: 1920 * (1 - (-12 + 124 * photoK) / 100) - 90, height: 180, background: "linear-gradient(180deg, rgba(255,196,90,0) 0%, rgba(255,214,130,0.85) 50%, rgba(255,196,90,0) 100%)", mixBlendMode: "screen", opacity: Math.sin(Math.PI * photoK) }} />
          ) : null}
        </>
      ) : null}
      <Label name="JP모건 본사" x={540} y={1180} opacity={eventOpacity(frame, tj)} k={pop(frame, tj.from)} size={68} pill>JP모건 본사</Label>
      <LogoShade light={photoK < 0.5} />
    </AbsoluteFill>
  );
};

// ── 2017년 대비 두 배: 141개 장면과 같은 톤의 3D 도시 2583동(정확한 개수).
// 「2583개」까지 가운데 블록에서 바깥으로 솟으며 카메라가 고공으로 빠져 전체 규모를 보이고,
// 「2017년 이후 두 배」에 왼쪽 절반(1292동)은 2017년 회색으로 가라앉고 오른쪽 절반(1291동)이 금색으로 바뀐다 — 면적 1:2로 두 배를 읽는다.
// 높이는 고정 의사난수(모양용). 위치·좌우 배치에는 실제 의미가 없다.
const C2 = { cols: 51, n: 2583, sp: 40, w: 22 };
const c2pos = (i: number) => {
  const c = i % C2.cols, r = Math.floor(i / C2.cols);
  return [(c - (C2.cols - 1) / 2) * C2.sp, -(r - 25) * C2.sp] as const;
};
const c2h = (i: number) => 26 + ((i * 53) % 37) * 3.2 + (((i * 7) % 11) === 0 ? 70 : 0);
const C2ORDER = (() => {
  const d = Array.from({ length: C2.n }, (_, i) => {
    const [x, z] = c2pos(i);
    return [i, Math.hypot(x, z) + ((i * 97) % 13) * 9] as const;
  });
  const rank = new Array<number>(C2.n);
  [...d].sort((a, b) => a[1] - b[1]).forEach(([i], k) => (rank[i] = k));
  return rank;
})();
const City2583: React.FC<{ frame: number; rise: CompiledEvent; split: number; cam: { pos: number[]; look: number[] } }> = ({ frame, rise, split, cam }) => {
  // 인스턴스 메시를 직접 만들어 색 버퍼를 처음부터 붙이고, 컬링을 끈다(경계 구가 원점 한 점으로 굳어 통째로 잘리는 문제)
  const mesh = React.useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(C2.w, 1, C2.w), new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15 }), C2.n);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(C2.n * 3), 3);
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, []);
  const base = new THREE.Color(TONE141.bldg), old = new THREE.Color("#8F99A8"), gold = new THREE.Color("#F2C14E");
  const o = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < C2.n; i++) {
    const at = rise.from + (rise.settled - rise.from) * (C2ORDER[i] / C2.n);
    const k = Math.min(1, ease(frame, at, at + 9));
    const [x, z] = c2pos(i);
    const h = Math.max(0.1, c2h(i) * k);
    o.position.set(x, h / 2, z);
    o.scale.set(1, h, 1);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    const right = x > 0 || (x === 0 && i % 2 === 0);
    col.copy(base).lerp(right ? gold : old, split);
    mesh.setColorAt(i, col);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return (
    <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 38, near: 10, far: 16000, position: [0, 900, 1200] }} style={{ position: "absolute", inset: 0 }}>
      <Rig pos={cam.pos} look={cam.look} />
      <color attach="background" args={[TONE141.sky]} />
      <fog attach="fog" args={[TONE141.fog, 3500, 12000]} />
      <ambientLight intensity={TONE141.amb} color="#c9d6ea" />
      <hemisphereLight args={TONE141.hemi} />
      <directionalLight position={[-1600, 2600, 1300]} intensity={TONE141.sun} color="#fff2dc" castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096} shadow-camera-left={-1400} shadow-camera-right={1400} shadow-camera-top={1400} shadow-camera-bottom={-1400} shadow-camera-near={100} shadow-camera-far={7000} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9000, 9000]} />
        <meshStandardMaterial color={TONE141.ground} roughness={0.95} />
      </mesh>
      <gridHelper args={[2200, 22, TONE141.grid[0], TONE141.grid[1]]} position={[0, 0.5, 0]} />
      <primitive object={mesh} />
    </ThreeCanvas>
  );
};

const Doubling: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const bars = useEvent(t, "doubling", "bars_in");
  const grow = useEvent(t, "doubling", "grow_in");
  const t17 = useEvent(t, "doubling", "tag_2017_in");
  const tn = useEvent(t, "doubling", "tag_now_in");
  const tx = useEvent(t, "doubling", "tag_x2_in");
  const cf = useEvent(t, "doubling", "cond_feb_in");
  // 가운데 블록 가까이에서 시작해 고공으로 빠지며 도시 전체가 화면에 들어온다
  const pull = interpolate(frame, [bars.from, bars.settled + 20], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.2, 1) });
  const drift = interpolate(frame, [bars.settled + 20, grow.end], [0, 1], clamp);
  const pos = lerp3(lerp3([140, 520, 760], [0, 4300, 3500], pull), [0, 4500, 3300], drift * 0.6);
  const look = lerp3([0, 30, 0], [0, 0, -260], pull);
  const split = ease(frame, grow.from, grow.settled);
  const count = Math.round(2583 * ease(frame, tn.from, bars.settled));
  return (
    <AbsoluteFill style={{ backgroundColor: TONE141.sky }}>
      <AbsoluteFill style={{ opacity: eventOpacity(frame, bars) }}>
        <City2583 frame={frame} rise={bars} split={split} cam={{ pos, look }} />
        <AbsoluteFill style={{ background: TONE141.shade }} />
      </AbsoluteFill>
      <Label name="2583개" x={540} y={392} opacity={eventOpacity(frame, tn)} k={pop(frame, tn.from)} size={124} color={TONE141.text} shadow={TONE141.shadow}>{`${count}개`}</Label>
      <Label name="2026년 2월 발표" x={540} y={540} opacity={eventOpacity(frame, cf)} size={44} weight={700} color={TONE141.sub} shadow={TONE141.shadow}>2026년 2월 발표</Label>
      <Label name="2017년" x={290} y={1170} opacity={eventOpacity(frame, t17)} k={pop(frame, t17.from)} size={60} weight={800} color="#5E6977" pill>2017년</Label>
      <Label name="×2" x={540} y={604} opacity={eventOpacity(frame, tx)} k={pop(frame, tx.from)} size={76} color="#F2C14E" pill>×2</Label>
      <LogoShade light />
    </AbsoluteFill>
  );
};

// ── 보류에도 계속: 크레인 실사
const Pipeline: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const c1 = useEvent(t, "pipeline", "con1_in");
  const c2 = useEvent(t, "pipeline", "con2_in");
  const tg = useEvent(t, "pipeline", "tag_140_in");
  const cf = useEvent(t, "pipeline", "cond_feb3_in");
  const pace = useEvent(t, "pipeline", "pace_in");
  const t141 = useEvent(t, "pipeline", "tag_141b_in");
  // 같은 바닥선, 높이는 개수에 비례(141 → 300px). 2026년은 전망이라 점선 윤곽
  const base = 1180, PX = 300 / 141;
  const pO = eventOpacity(frame, pace);
  const h1 = 141 * PX * ease(frame, pace.from, pace.from + 14);
  const h2 = 140 * PX * ease(frame, tg.from, tg.settled + 10);
  const bx1 = 340, bx2 = 740, bw = 150;
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <FullVideo pilot={pilot} file="editorial/con1.mp4" ev={c1} push={[1.0, 1.05]} />
      <FullVideo pilot={pilot} file="editorial/con2.mp4" ev={c2} push={[1.0, 1.06]} />
      <AbsoluteFill style={{ opacity: pO, background: "linear-gradient(180deg, rgba(4,6,12,0) 30%, rgba(4,6,12,0.72) 45%, rgba(4,6,12,0.72) 70%, rgba(4,6,12,0.2) 78%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: pO }}>
        <line x1={200} x2={880} y1={base} y2={base} stroke="rgba(255,255,255,0.6)" strokeWidth={3} />
        <rect x={bx1 - bw / 2} y={base - h1} width={bw} height={h1} rx={6} fill="#E6EBF2" />
        <rect x={bx2 - bw / 2} y={base - h2} width={bw} height={h2} rx={6} fill="rgba(255,209,106,0.16)" stroke={YELLOW} strokeWidth={5} strokeDasharray="14 9" />
      </svg>
      <Label name="2025년 141개" x={bx1} y={base + 16} opacity={eventOpacity(frame, t141)} size={48} weight={800}>2025년 141개</Label>
      <Label name="2026년 → 약 140개" x={bx2} y={base + 16} opacity={eventOpacity(frame, tg)} k={pop(frame, tg.from)} size={48} color={YELLOW}>2026년 → 약 140개</Label>
      <Label name="지난 2월 전망" x={bx2} y={base + 140} opacity={eventOpacity(frame, cf)} size={44} weight={700} color="#DCE3EC">지난 2월 전망</Label>
      <LogoShade />
    </AbsoluteFill>
  );
};

// ── 중국: 도시 실사 → 같은 141칸에서 91칸이 노랗게
// ── 중국: 푸둥 실사 위 「중국」 → 0:10에서 본 같은 3D 141동 군집이 돌아와 91동이 중국 빨강으로 물들며 솟는다(나머지 50동은 회색으로 가라앉음)
// 빨강은 이 장면에서만 쓰는 「중국」 색. 91동의 위치는 의미 없음(개수만 정확), 왼쪽 앞에서 오른쪽 뒤로 물결처럼 칠한다.
const CN_RED = "#D9483B";
const CHINA_WAVE = (() => {
  const ids = Array.from({ length: 141 }, (_, i) => i).filter((i) => CHINA.has(i));
  const key = (i: number) => { const [x, z] = pos3(i); return x - z * 0.6; };
  const rank = new Map<number, number>();
  [...ids].sort((a, b) => key(a) - key(b)).forEach((i, k) => rank.set(i, k));
  return rank;
})();
const China: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const ns = useEvent(t, "china", "pudong_in");
  const gb = useEvent(t, "china", "grid_b_in");
  const fillE = useEvent(t, "china", "china_fill");
  const tc = useEvent(t, "china", "tag_china91_in");
  const t65 = useEvent(t, "china", "tag_65_in");
  const tcn = useEvent(t, "china", "tag_cn_in");
  const go = eventOpacity(frame, gb);
  const fillK = (i: number) => {
    const r = CHINA_WAVE.get(i);
    if (r === undefined) return -1;
    const at = fillE.from + (fillE.settled - fillE.from) * (r / 91);
    return ease(frame, at, at + 8);
  };
  const dim = ease(frame, fillE.from, fillE.settled);
  const grey = new THREE.Color(TONE141.bldg).lerp(new THREE.Color("#9AA3AE"), 0.6 * dim);
  const red = new THREE.Color(CN_RED);
  const paint = (i: number) => {
    const k = fillK(i);
    if (k < 0) return { c: `#${grey.getHexString()}`, lift: 1 };
    const c = new THREE.Color(TONE141.bldg).lerp(red, k);
    return { c: `#${c.getHexString()}`, lift: 1 + 0.18 * k };
  };
  const orbit = interpolate(frame, [gb.from, gb.end], [-14, 10], clamp) * (Math.PI / 180);
  const R = 2350;
  const pos = [R * Math.sin(orbit), 1900, R * Math.cos(orbit)];
  const look = [0, 40, -30];
  const count = Math.round(91 * ease(frame, fillE.from, fillE.settled));
  const ring = ease(frame, t65.from, fillE.settled) * 0.65;
  const RR = 74, C = 2 * Math.PI * RR;
  return (
    <AbsoluteFill style={{ backgroundColor: TONE141.sky }}>
      <FullVideo pilot={pilot} file="editorial/pudong.mp4" ev={ns} push={[1.0, 1.06]} />
      <AbsoluteFill style={{ opacity: 0.45 * eventOpacity(frame, tcn) * (1 - go), background: "radial-gradient(ellipse at 50% 46%, rgba(120,10,10,0.55) 0%, rgba(0,0,0,0) 60%)" }} />
      <Label name="중국" x={540} y={760} opacity={eventOpacity(frame, tcn) * (1 - go)} k={pop(frame, tcn.from)} size={150} color={CN_RED} weight={900} pill>중국</Label>
      {go > 0 ? (
        <AbsoluteFill style={{ opacity: go }}>
          <City141 frame={frame} appearFrom={gb.from - 20} appearTo={gb.from - 19} gold={0} shell={0} facadeSrc={pilot.file("editorial/facade_tile.png")} cam={{ pos, look }} paint={paint} />
          <AbsoluteFill style={{ background: TONE141.shade }} />
        </AbsoluteFill>
      ) : null}
      <Label name="중국 91개" x={540} y={392} opacity={eventOpacity(frame, tc)} k={pop(frame, tc.from)} size={112} color={CN_RED} shadow={TONE141.shadow}>{`중국 ${Math.max(count, 0)}개`}</Label>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: eventOpacity(frame, t65) }}>
        <circle cx={540} cy={640} r={RR} fill="rgba(255,255,255,0.75)" stroke="#C6D0DB" strokeWidth={16} />
        <circle cx={540} cy={640} r={RR} fill="none" stroke={CN_RED} strokeWidth={16} strokeLinecap="round" strokeDasharray={`${C * ring} ${C}`} transform="rotate(-90 540 640)" />
      </svg>
      <Label name="65%" x={540} y={612} opacity={eventOpacity(frame, t65)} k={pop(frame, t65.from)} size={50} weight={900} color={TONE141.text} shadow={TONE141.shadow}>65%</Label>
      <LogoShade light={go > 0.5} />
    </AbsoluteFill>
  );
};

// ── 선전: 푸톈(핑안금융센터) → 선전만
const Shenzhen: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const f = useEvent(t, "shenzhen", "futian_in");
  const ts = useEvent(t, "shenzhen", "tag_sz_in");
  const t200 = useEvent(t, "shenzhen", "tag_sz200_in");
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <FullVideo pilot={pilot} file="editorial/futian.mp4" ev={f} push={[1.12, 1.0]} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,6,12,0.65) 18%, rgba(4,6,12,0) 40%)" }} />
      <Label name="중국 선전" x={540} y={430} opacity={eventOpacity(frame, ts)} k={pop(frame, ts.from)} size={60}>중국 선전</Label>
      <Label name="200m 이상 200개" x={540} y={530} opacity={eventOpacity(frame, t200)} k={pop(frame, t200.from)} size={68} color={YELLOW} pill>200m 이상 200개</Label>
      <LogoShade />
    </AbsoluteFill>
  );
};

// ── 공사 중 400개 → 3D 「공사 중인 도시」: 위쪽이 골조로 끊긴 건물 400동 + 꼭대기 타워크레인. 「300m가 넘는」에 300m 면이 깔리고
// 88동만 면을 뚫고 솟아 금색이 된다(나머지는 면 아래). 높이는 기준면 위·아래만 맞춘 정성적 표현, 위치 의미 없음, 개수만 정확.
const U3 = { cols: 20, n: 400, sp: 64, w: 26 };
const SUPER = new Set(Array.from({ length: 400 }, (_, i) => i).filter((i) => (i * 88) % 400 < 88));
const u3pos = (i: number) => [(i % U3.cols - (U3.cols - 1) / 2) * U3.sp, -(Math.floor(i / U3.cols) - (U3.cols - 1) / 2) * U3.sp] as const;
const u3h0 = (i: number) => 110 + ((i * 37) % 29) * 5.5; // 110~264: 모두 300m 면 아래
const u3h1 = (i: number) => 330 + ((i * 53) % 17) * 9; // 슈퍼초고층 최종 330~474
const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, n: number) => {
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  m.frustumCulled = false;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};
const Site400: React.FC<{ frame: number; appear: CompiledEvent; rise: CompiledEvent; cam: { pos: number[]; look: number[] } }> = ({ frame, appear, rise, cam }) => {
  const parts = React.useMemo(() => ({
    body: instanced(new THREE.BoxGeometry(U3.w, 1, U3.w), new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15 }), U3.n),
    col: instanced(new THREE.BoxGeometry(2.6, 1, 2.6), new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.4 }), U3.n * 4),
    slab: instanced(new THREE.BoxGeometry(U3.w, 1.6, U3.w), new THREE.MeshStandardMaterial({ roughness: 0.6 }), U3.n * 3),
    mast: instanced(new THREE.BoxGeometry(2.4, 1, 2.4), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 }), U3.n),
    jib: instanced(new THREE.BoxGeometry(52, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 }), U3.n),
  }), []);
  const o = new THREE.Object3D();
  const slate = new THREE.Color(TONE141.bldg), gold = new THREE.Color("#F2C14E"), steel = new THREE.Color("#6E7C8E"), crane = new THREE.Color("#F1F2EE");
  const c = new THREE.Color();
  const set = (m: THREE.InstancedMesh, id: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, col: THREE.Color, ry = 0) => {
    o.position.set(x, y, z);
    o.rotation.set(0, ry, 0);
    o.scale.set(sx, sy, sz);
    o.updateMatrix();
    m.setMatrixAt(id, o.matrix);
    m.setColorAt(id, col);
  };
  for (let i = 0; i < U3.n; i++) {
    const at = appear.from + (appear.settled - appear.from) * (((i * 131) % 400) / 400);
    const k = Math.min(1, ease(frame, at, at + 10));
    const sup = SUPER.has(i);
    const rk = sup ? ease(frame, rise.from + ((i * 7) % 18), rise.settled) : 0;
    const H = Math.max(0.2, (u3h0(i) + (sup ? (u3h1(i) - u3h0(i)) * rk : 0)) * k);
    const [x, z] = u3pos(i);
    const fin = H * 0.62, top = H;
    const tone = c.copy(slate).lerp(gold, rk);
    set(parts.body, i, x, fin / 2, z, 1, Math.max(0.1, fin), 1, tone);
    const st = c.clone().copy(steel).lerp(gold, rk);
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], q) => set(parts.col, i * 4 + q, x + (a * (U3.w - 3)) / 2, fin + (top - fin) / 2, z + (b * (U3.w - 3)) / 2, 1, Math.max(0.1, top - fin), 1, st));
    [0, 0.5, 1].forEach((f, q) => set(parts.slab, i * 3 + q, x, fin + (top - fin) * f, z, 1, 1, 1, st));
    const mh = 46 * k;
    set(parts.mast, i, x + U3.w / 2 - 2, top + mh / 2, z - U3.w / 2 + 2, 1, Math.max(0.1, mh), 1, crane);
    set(parts.jib, i, x + U3.w / 2 - 2, top + mh, z - U3.w / 2 + 2, k, 1, 1, crane, ((i * 47) % 360) * (Math.PI / 180));
  }
  Object.values(parts).forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const planeO = ease(frame, rise.from - 6, rise.from + 8);
  return (
    <ThreeCanvas width={1080} height={1920} shadows camera={{ fov: 38, near: 10, far: 16000, position: [0, 900, 1500] }} style={{ position: "absolute", inset: 0 }}>
      <Rig pos={cam.pos} look={cam.look} />
      <color attach="background" args={[TONE141.sky]} />
      <fog attach="fog" args={[TONE141.fog, 2600, 9000]} />
      <ambientLight intensity={TONE141.amb} color="#c9d6ea" />
      <hemisphereLight args={TONE141.hemi} />
      <directionalLight position={[-1400, 2400, 1100]} intensity={TONE141.sun} color="#fff2dc" castShadow shadow-mapSize-width={4096} shadow-mapSize-height={4096} shadow-camera-left={-900} shadow-camera-right={900} shadow-camera-top={900} shadow-camera-bottom={-900} shadow-camera-near={100} shadow-camera-far={6000} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9000, 9000]} />
        <meshStandardMaterial color={TONE141.ground} roughness={0.95} />
      </mesh>
      <gridHelper args={[1400, 20, TONE141.grid[0], TONE141.grid[1]]} position={[0, 0.5, 0]} />
      {Object.entries(parts).map(([k2, m]) => <primitive key={k2} object={m} />)}
      {planeO > 0 ? (
        <group position={[0, 300, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1500, 1500]} />
            <meshBasicMaterial color="#E0A030" transparent opacity={0.12 * planeO} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <Segs pts={rect4(0, 0.5, 0, 1500, 1500)} color="#C98A14" opacity={0.9 * planeO} />
        </group>
      ) : null}
    </ThreeCanvas>
  );
};
const Underway: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const c3 = useEvent(t, "underway", "con5_in");
  const dots = useEvent(t, "underway", "dots_in");
  const rise = useEvent(t, "underway", "rise88");
  const t400 = useEvent(t, "underway", "tag_400_in");
  const t88 = useEvent(t, "underway", "tag_88_in");
  const t300 = useEvent(t, "underway", "tag_300p_in");
  const cf = useEvent(t, "underway", "cond_feb2_in");
  const dO = eventOpacity(frame, dots);
  // 낮은 사선에서 공사 현장 위를 미끄러지다가, 「300m가 넘는」부터 올라가며 기준면과 솟는 88동을 함께 잡는다
  const g = interpolate(frame, [dots.from, rise.from], [0, 1], clamp);
  const r = interpolate(frame, [rise.from, rise.end], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.3, 1) });
  const pos = lerp3(lerp3([-900, 560, 1500], [-380, 640, 2050], g), [240, 1500, 2600], r);
  const look = lerp3(lerp3([-120, 120, 0], [0, 150, -60], g), [0, 200, -60], r);
  const count = Math.round(400 * ease(frame, dots.from, t400.settled));
  return (
    <AbsoluteFill style={{ backgroundColor: TONE141.sky }}>
      <FullVideo pilot={pilot} file="editorial/con5.mp4" ev={c3} push={[1.0, 1.05]} />
      {dO > 0 ? (
        <AbsoluteFill style={{ opacity: dO }}>
          <Site400 frame={frame} appear={dots} rise={rise} cam={{ pos, look }} />
          <AbsoluteFill style={{ background: TONE141.shade }} />
        </AbsoluteFill>
      ) : null}
      <Label name="공사 중 400개" x={540} y={392} opacity={eventOpacity(frame, t400)} k={pop(frame, t400.from)} size={104} color={TONE141.text} shadow={TONE141.shadow}>{`공사 중 ${count}개`}</Label>
      <Label name="2026년 2월 발표" x={540} y={520} opacity={eventOpacity(frame, cf)} size={44} weight={700} color={TONE141.sub} shadow={TONE141.shadow}>2026년 2월 발표</Label>
      <Label name="300m" x={70} y={700} opacity={eventOpacity(frame, t300)} size={56} weight={800} color="#B86A00" shadow={TONE141.shadow} align="left">300m</Label>
      <Label name="300m 초과 88개" x={540} y={1180} opacity={eventOpacity(frame, t88)} k={pop(frame, t88.from)} size={68} color="#F2C14E" pill>300m 초과 88개</Label>
      <LogoShade light={dO > 0.5} />
    </AbsoluteFill>
  );
};

// ── JEC타워: 공사 현장(2026년 5월, CC0) → 조감도 → 높이 계보(같은 바닥선, 0~1km 선형)
// 높이는 2차 출처 값(JP모건 본사 423m, 상하이타워 632m, 메르데카118 679m, 부르즈칼리파 828m, JEC 1000m 계획)의 비율만 쓰고 숫자는 표기하지 않는다.
// 기준선 200m(초고층)·300m(슈퍼초고층)은 앞 장면에서 말한 기준이다. 실재=채움, 계획=점선 윤곽
// ── 높이 계보 3D: 다섯 건물의 특징을 살린 단순화 모형(정밀 복제 아님)을 실제 높이 비율(1 단위 = 1m)로 한 바닥에 세운다
// JP모건 본사 423, 상하이타워 632(비틀림), 메르데카118 679(다이아몬드 면+첨탑), 부르즈칼리파 828(Y자 계단식+첨탑), JEC타워 1000(계획, 반투명 와이어)
type Lv = { y: number; s: number; r?: number };
const loft = (profile: [number, number][], levels: Lv[]) => {
  const pos: number[] = [];
  const ring = (L: Lv) => profile.map(([x, z]) => {
    const c = Math.cos(L.r ?? 0), sn = Math.sin(L.r ?? 0);
    return [(x * c - z * sn) * L.s, L.y, (x * sn + z * c) * L.s] as const;
  });
  for (let l = 0; l < levels.length - 1; l++) {
    const A = ring(levels[l]), B = ring(levels[l + 1]);
    for (let i = 0; i < profile.length; i++) {
      const j = (i + 1) % profile.length;
      pos.push(...A[i], ...B[i], ...B[j], ...A[i], ...B[j], ...A[j]);
    }
  }
  const T = ring(levels[levels.length - 1]);
  const cy = levels[levels.length - 1].y;
  for (let i = 0; i < profile.length; i++) {
    const j = (i + 1) % profile.length;
    pos.push(0, cy, 0, ...T[j], ...T[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
};
const poly = (n: number, rf: (t: number) => number): [number, number][] => Array.from({ length: n }, (_, i) => {
  const t = (i / n) * Math.PI * 2;
  return [Math.cos(t) * rf(t), Math.sin(t) * rf(t)];
});
const MODELS = (() => {
  const sq: [number, number][] = [[-34, -34], [34, -34], [34, 34], [-34, 34]];
  const jpm = loft(sq, [{ y: 0, s: 1.05 }, { y: 40, s: 0.96 }, { y: 300, s: 0.9 }, { y: 360, s: 0.8 }, { y: 400, s: 0.66 }, { y: 423, s: 0.5 }]);
  const tri = poly(36, (t) => 40 * (1 + 0.13 * Math.cos(3 * t)));
  const sh = loft(tri, Array.from({ length: 13 }, (_, i) => ({ y: (632 * i) / 12, s: 1 - 0.45 * (i / 12) ** 1.2, r: ((120 * Math.PI) / 180) * (i / 12) })));
  const dia = poly(16, (t) => 36 * (i16(t) ? 1 : 0.82));
  const merBody = loft(dia, [{ y: 0, s: 1 }, { y: 120, s: 0.98 }, { y: 300, s: 0.86 }, { y: 440, s: 0.62 }, { y: 520, s: 0.34 }, { y: 545, s: 0.12 }, { y: 679, s: 0.012 }]);
  const Y = poly(48, (t) => 46 * (0.42 + 0.58 * Math.abs(Math.cos(1.5 * t)) ** 2.2));
  const fr = [0, 0.2, 0.34, 0.47, 0.58, 0.67, 0.74, 0.8];
  const sc = [1, 0.86, 0.72, 0.58, 0.45, 0.33, 0.23, 0.15];
  const burjLv: Lv[] = [];
  fr.forEach((f, i) => {
    burjLv.push({ y: 828 * f, s: sc[i] });
    if (i < fr.length - 1) burjLv.push({ y: 828 * fr[i + 1] - 0.1, s: sc[i] });
  });
  burjLv.push({ y: 828, s: 0.02 });
  const burj = loft(Y, burjLv);
  const jecP = poly(48, (t) => 60 * (0.5 + 0.5 * Math.abs(Math.cos(1.5 * t)) ** 1.6));
  const jec = loft(jecP, Array.from({ length: 11 }, (_, i) => ({ y: (1000 * i) / 10, s: Math.max(0.015, (1 - i / 10) ** 1.25) })));
  return { jpm, sh, mer: merBody, burj, jec, jecEdges: new THREE.EdgesGeometry(jec, 20) };
})();
function i16(t: number) {
  return Math.round((t / (Math.PI * 2)) * 16) % 2 === 0;
}
const L3 = [
  { key: "jpm", x: -380, m: 423 },
  { key: "sh", x: -190, m: 632 },
  { key: "mer", x: 0, m: 679 },
  { key: "burj", x: 200, m: 828 },
  { key: "jec", x: 410, m: 1000 },
] as const;
const camAt = (pos: number[], look: number[], fov: number) => {
  const c = new THREE.PerspectiveCamera(fov, 1080 / 1920, 10, 20000);
  c.position.set(pos[0], pos[1], pos[2]);
  c.lookAt(look[0], look[1], look[2]);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
};
const Lineup3D: React.FC<{ frame: number; cmp: CompiledEvent; names: Record<string, CompiledEvent>; t200: CompiledEvent; t300: CompiledEvent; t1: CompiledEvent }> = ({ frame, cmp, names, t200, t300, t1 }) => {
  // 낮은 곳에서 JP모건을 올려다보며 시작 → 오른쪽 위로 크레인하며 빠져 다섯 건물과 1km 면이 한 화면에
  const k = interpolate(frame, [cmp.from, cmp.settled + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.35, 0, 0.25, 1) });
  const drift = interpolate(frame, [cmp.settled + 10, cmp.end], [0, 1], clamp);
  const pos = lerp3(bez3([-560, 40, 520], [-300, 320, 1700], [15, 600, 3350], k), [45, 620, 3300], drift * 0.5);
  const look = lerp3(lerp3([-380, 260, 0], [15, 335, 0], k), [30, 340, 0], drift * 0.5);
  const fov = 38;
  const cam = camAt(pos, look, fov);
  const grow = (n: number) => ease(frame, cmp.from + 4 + n * 7, cmp.from + 22 + n * 7);
  const jecK = ease(frame, cmp.from + 30, cmp.settled);
  const plane = (m: number, ev: CompiledEvent, color: string, a: number) => {
    const o = eventOpacity(frame, ev);
    return o > 0 ? (
      <group position={[20, m, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1300, 420]} />
          <meshBasicMaterial color={color} transparent opacity={a * o} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <Segs pts={rect4(0, 0.5, 0, 1300, 420)} color={color} opacity={0.9 * o} />
      </group>
    ) : null;
  };
  const tagAt = (x: number, y: number, z: number) => proj(cam, x, y, z);
  const nameRow: Record<string, number> = { jpm: 0, sh: 1, mer: 0, burj: 1, jec: 0 };
  const label: Record<string, string> = { jpm: "JP모건 본사", sh: "상하이타워", mer: "메르데카118", burj: "부르즈칼리파", jec: "JEC타워(계획)" };
  return (
    <>
      <ThreeCanvas width={1080} height={1920} shadows camera={{ fov, near: 10, far: 20000, position: [pos[0], pos[1], pos[2]] }} style={{ position: "absolute", inset: 0 }}>
        <Rig pos={pos} look={look} />
        <fog attach="fog" args={[TONE141.fog, 4000, 14000]} />
        <ambientLight intensity={TONE141.amb} color="#c9d6ea" />
        <hemisphereLight args={TONE141.hemi} />
        <directionalLight position={[-1500, 2400, 1600]} intensity={TONE141.sun} color="#fff2dc" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-left={-900} shadow-camera-right={900} shadow-camera-top={1300} shadow-camera-bottom={-300} shadow-camera-near={100} shadow-camera-far={6000} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12000, 12000]} />
          <meshStandardMaterial color={TONE141.ground} roughness={0.95} />
        </mesh>
        <gridHelper args={[1800, 18, TONE141.grid[0], TONE141.grid[1]]} position={[20, 0.5, 0]} />
        {L3.slice(0, 4).map((b, n) => {
          const g = grow(n);
          return g > 0 ? (
            <mesh key={b.key} geometry={MODELS[b.key]} position={[b.x, 0, 0]} scale={[1, g, 1]} castShadow receiveShadow>
              <meshStandardMaterial color={b.key === "burj" ? "#C9D3DF" : "#AEBCCD"} roughness={0.38} metalness={0.25} flatShading />
            </mesh>
          ) : null;
        })}
        {jecK > 0 ? (
          <group position={[L3[4].x, 0, 0]} scale={[1, jecK, 1]}>
            <mesh geometry={MODELS.jec}>
              <meshBasicMaterial color="#F2B33D" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments geometry={MODELS.jecEdges}>
              <lineBasicMaterial color="#C98A14" />
            </lineSegments>
          </group>
        ) : null}
        {plane(200, t200, "#7C8EA3", 0.1)}
        {plane(300, t300, "#7C8EA3", 0.1)}
        {plane(1000, t1, "#E0A030", 0.16)}
      </ThreeCanvas>
      {L3.map((b) => {
        const [x, y] = tagAt(b.x, 0, 150);
        return (
          <Label key={b.key} name={label[b.key]} x={x} y={y + 10 + nameRow[b.key] * 52} opacity={eventOpacity(frame, names[b.key]) * ease(frame, cmp.from + (cmp.settled - cmp.from) * 0.55, cmp.from + (cmp.settled - cmp.from) * 0.8)} size={44} weight={700} color={b.key === "jec" ? "#B86A00" : TONE141.text} shadow={TONE141.shadow}>
            {label[b.key]}
          </Label>
        );
      })}
      {([[200, t200, "200m", 44], [300, t300, "300m", 44], [1000, t1, "1km", 64]] as const).map(([m, ev, txt, size]) => {
        const [x, y] = tagAt(-620, m, 210);
        return (
          <Label key={txt} name={txt} x={Math.max(40, x)} y={y - size - 10} opacity={eventOpacity(frame, ev)} k={m === 1000 ? pop(frame, ev.from) : 1} size={size} weight={m === 1000 ? 800 : 700} color={m === 1000 ? "#B86A00" : TONE141.sub} shadow={TONE141.shadow} align="left">
            {txt}
          </Label>
        );
      })}
    </>
  );
};

const JEC: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const site = useEvent(t, "jec", "site_in");
  const rend = useEvent(t, "jec", "render_in");
  const tr = useEvent(t, "jec", "tag_render_in");
  const cmp = useEvent(t, "jec", "cmp_in");
  const tb = useEvent(t, "jec", "tag_burj_in");
  const tjc = useEvent(t, "jec", "tag_jec_in");
  const t1 = useEvent(t, "jec", "tag_1km_in");
  const t200 = useEvent(t, "jec", "tag_200_in");
  const t300 = useEvent(t, "jec", "tag_300_in");
  const names = {
    jpm: useEvent(t, "jec", "tag_jpm_h_in"),
    sh: useEvent(t, "jec", "tag_sh_h_in"),
    mer: useEvent(t, "jec", "tag_mer_h_in"),
    burj: tb,
  };
  const cO = eventOpacity(frame, cmp);
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <Photo pilot={pilot} file="editorial/jec_site.jpg" ev={site} from={1.0} to={1.06} origin="50% 35%" />
      <Photo pilot={pilot} file="editorial/jec_render.jpg" ev={rend} from={1.08} to={1.0} origin="50% 40%" />
      <Label name="조감도" x={80} y={430} opacity={eventOpacity(frame, tr)} size={46} weight={700} align="left" pill>조감도</Label>
      <AbsoluteFill style={{ opacity: cO, backgroundColor: TONE141.sky }}>
        <Lineup3D frame={frame} cmp={cmp} names={{ ...names, jec: tjc }} t200={t200} t300={t300} t1={t1} />
        <AbsoluteFill style={{ background: TONE141.shade, opacity: 0.6 }} />
      </AbsoluteFill>
      <LogoShade light={cO > 0.5} />
    </AbsoluteFill>
  );
};

// ── 대가: 공통 「중요한 한 가지!」 동안 가상 초고층(생성 이미지, 실존 아님)을 엑스레이 스캔 → 같은 바닥선 위 세 건물의 와이어프레임 단면
// 골조(코어·아웃트리거·벨트 트러스)는 이름표 없는 형태 맥락이고, 도면 UI(축 A·B·C, 레벨, 치수 H, 직각, 절단선)는 수치 없는 도면 문법이다.
// 주장은 두 가지뿐: 층수가 많은 건물일수록 ㎡당 에너지(번개 1·2·3, 층 색)와 건축·유지비(동전 더미)가 크다는 정성적 경향.
const TOWERS = [
  { x: 210, w: 150, floors: 10, bolts: 1, coins: 2, heat: 0.15, tag: "tag_low", name: "저층", grid: "A", out: [] as number[] },
  { x: 490, w: 150, floors: 24, bolts: 2, coins: 4, heat: 0.55, tag: "tag_mid", name: "고층", grid: "B", out: [0.5] },
  { x: 770, w: 190, floors: 44, bolts: 3, coins: 7, heat: 1, tag: "tag_high", name: "초고층", grid: "C", out: [0.36, 0.7] },
] as const;
const CYAN = "#7FE3F0";
const RED = "#FF5A4E";
const heatColor = (h: number, a = 1) => `rgba(${Math.round(90 + 165 * h)},${Math.round(170 + 30 * h - 110 * h * h)},${Math.round(235 - 200 * h)},${a})`;
const BK = 1.7;
const bolt = (cx: number, top: number) => `M ${cx + 4 * BK} ${top} L ${cx - 16 * BK} ${top + 34 * BK} L ${cx - 2 * BK} ${top + 34 * BK} L ${cx - 8 * BK} ${top + 62 * BK} L ${cx + 16 * BK} ${top + 24 * BK} L ${cx + 2 * BK} ${top + 24 * BK} L ${cx + 10 * BK} ${top} Z`;

type WireState = { frame: number; grow: (n: number) => number; heat: number; bolt: (n: number, b: number) => number; coin: (n: number, c: number) => number; ui: number; exceed?: number; heatOf?: (n: number) => number };
// 3D 와이어프레임 공간: 세 건물이 같은 바닥판 위, 카메라가 천천히 궤도를 돈다. 라벨·번개는 같은 카메라로 투영한 화면 좌표에 2D로 붙인다.
// 뒤쪽 3D 구간도 141개 장면과 같은 새벽 블루그레이(2026-11-05 사용자 「뒤쪽도 같은 톤으로 맞춰줘」)
// 2026-11-05 사용자 「1:09 에너지 효율 인포그래픽 장면은 흰색 바탕 말고, 어두운 색으로」 — 밝은 장면이 이어져 반복감이 들어 이 구간만 어두운 톤
const WSKY = "#0A1222", WGRAD = "linear-gradient(180deg, #0F1B30 0%, #060A14 85%)", WLINE = "#7FE3F0", WTEXT = "#FFFFFF", WSUB = "#DCE3EC", WTITLE = "#FFD16A", WSH = "0 2px 16px rgba(0,0,0,0.85)";
const WDARK = true;
const W3 = { fov: 34, R: 3500, camY: 700, lookY: 250, fh: 13 };
const TX = [-300, 0, 300];
const wCam = (theta: number) => {
  const c = new THREE.PerspectiveCamera(W3.fov, 1080 / 1920, 10, 9000);
  const th = (theta * Math.PI) / 180;
  c.position.set(W3.R * Math.sin(th), W3.camY, W3.R * Math.cos(th));
  c.lookAt(0, W3.lookY, 0);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
};
const proj = (c: THREE.PerspectiveCamera, x: number, y: number, z: number) => {
  const v = new THREE.Vector3(x, y, z).project(c);
  return [((v.x + 1) / 2) * 1080, ((1 - v.y) / 2) * 1920] as const;
};
const Segs: React.FC<{ pts: number[]; color: string; opacity?: number }> = ({ pts, color, opacity = 1 }) => {
  const geo = React.useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [pts]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
};
// 상자 모서리 12개
const boxEdges = (x: number, y0: number, z: number, w: number, h: number, d: number) => {
  const a = x - w / 2, b = x + w / 2, f = z + d / 2, k = z - d / 2, y1 = y0 + h;
  const P = [[a, y0, f], [b, y0, f], [b, y0, k], [a, y0, k], [a, y1, f], [b, y1, f], [b, y1, k], [a, y1, k]];
  const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  return E.flatMap(([m, n]) => [...P[m], ...P[n]]);
};
const rect4 = (x: number, y: number, z: number, w: number, d: number) => {
  const a = x - w / 2, b = x + w / 2, f = z + d / 2, k = z - d / 2;
  return [a, y, f, b, y, f, b, y, f, b, y, k, b, y, k, a, y, k, a, y, k, a, y, f];
};
const Wire3D: React.FC<{ s: WireState; theta: number; names: Record<string, number>; axis: number }> = ({ s, theta, names, axis }) => {
  const cam = wCam(theta);
  const towers = TOWERS.map((tw, n) => {
    const H = tw.floors * W3.fh, g = s.grow(n), h = Math.max(0.1, H * g), x = TX[n], w = tw.w, shown = Math.floor(tw.floors * g);
    return { tw, n, H, g, h, x, w, shown };
  });
  return (
    <>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: W3.fov, near: 10, far: 9000, position: [0, W3.camY, W3.R] }} style={{ position: "absolute", inset: 0 }}>
        <Rig pos={[cam.position.x, cam.position.y, cam.position.z]} look={[0, W3.lookY, 0]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[-800, 1400, 900]} intensity={1.6} />
        {/* 도면 바닥: 격자 + 축선 */}
        <group visible={s.ui > 0.02}>
          <gridHelper args={[1400, 14, WDARK ? "#2b5d6e" : "#9DB0C2", WDARK ? "#173344" : "#B7C5D3"]} position={[0, 0, 0]} />
        </group>
        <Segs pts={[-560, 0.5, 260, 560, 0.5, 260]} color={WTEXT} opacity={0.6} />
        <Segs pts={[540, 0.5, 260, 520, 0.5, 248, 540, 0.5, 260, 520, 0.5, 272]} color={WTEXT} opacity={0.75 * axis} />
        {towers.map(({ tw, n, H, g, h, x, w, shown }) => {
          if (g <= 0) return null;
          const core = w * 0.28;
          const out = tw.out.filter((o) => o * H + 2 * W3.fh <= h);
          const outPts = out.flatMap((o) => {
            const y = o * H, d = 2 * W3.fh, L = x - w / 2, R = x + w / 2, cl = x - core / 2, cr = x + core / 2;
            return [-1, 1].flatMap((side) => {
              const z = (side * w) / 2;
              return [L, y, z, cl, y + d, z, L, y + d, z, cl, y, z, R, y, z, cr, y + d, z, R, y + d, z, cr, y, z, L, y, z, R, y, z, L, y + d, z, R, y + d, z];
            });
          });
          const red = n === 2 && s.exceed ? s.exceed * (0.65 + 0.35 * Math.sin(s.frame / 4)) : 0;
          return (
            <group key={n}>
              {Array.from({ length: shown }, (_, f) => (
                <mesh key={f} position={[x, f * W3.fh + (W3.fh - 2) / 2, 0]}>
                  <boxGeometry args={[w, W3.fh - 2, w]} />
                  <meshBasicMaterial color={heatColor(s.heatOf ? s.heatOf(n) : tw.heat)} transparent opacity={0.03 + 0.2 * s.heat} depthWrite={false} />
                </mesh>
              ))}
              <Segs pts={Array.from({ length: shown }, (_, f) => rect4(x, (f + 1) * W3.fh, 0, w, w)).flat()} color={WLINE} opacity={0.35} />
              <mesh position={[x, h / 2, 0]}>
                <boxGeometry args={[core, h, core]} />
                <meshBasicMaterial color={WLINE} transparent opacity={0.1} depthWrite={false} />
              </mesh>
              <Segs pts={boxEdges(x, 0, 0, core, h, core)} color={WLINE} opacity={0.9} />
              <Segs pts={[0.25, 0.75].flatMap((c) => [-1, 1].flatMap((side) => [x - w / 2 + w * c, 0, (side * w) / 2, x - w / 2 + w * c, h, (side * w) / 2]))} color={WLINE} opacity={0.4} />
              {outPts.length ? <Segs pts={outPts} color={WLINE} opacity={0.95} /> : null}
              <Segs pts={boxEdges(x, 0, 0, w, h, w)} color={red > 0 ? RED : CYAN} opacity={red > 0 ? 0.5 + 0.5 * red : 1} />
              {red > 0 ? <Segs pts={boxEdges(x, 0, 0, w + 14, h + 8, w + 14)} color={RED} opacity={red} /> : null}
              {/* 동전 더미(건물 앞 왼쪽) */}
              {Array.from({ length: tw.coins }, (_, c) => {
                const k = s.coin(n, c);
                if (k <= 0) return null;
                return (
                  <mesh key={`c${c}`} position={[x - w / 2 - 58, 8 + c * 17 + (1 - k) * 30, w / 2 + 30]} scale={[k, k, k]}>
                    <cylinderGeometry args={[36, 36, 14, 32]} />
                    <meshStandardMaterial color="#F2C14E" metalness={0.6} roughness={0.35} emissive="#5a3f08" emissiveIntensity={0.4} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
        {/* 도면 UI: 치수선 H, 레벨 ▽ 눈금, 단면(절단면) — 초고층 C에만 */}
        {(() => {
          const T = towers[2];
          if (T.g <= 0 || s.ui <= 0.02) return null;
          const xr = T.x + T.w / 2 + 70, zf = T.w / 2;
          const lv = [0.25, 0.5, 0.75, 1].filter((q) => q * T.H <= T.h).flatMap((q) => [xr - 24, q * T.H, zf, xr + 34, q * T.H, zf]);
          const cut = 0.82 * T.H;
          return (
            <group>
              <Segs pts={[xr, 0, zf, xr, T.h, zf, xr - 14, 0, zf, xr + 14, 0, zf, xr - 14, T.h, zf, xr + 14, T.h, zf, T.x + T.w / 2, T.h, zf, xr + 14, T.h, zf]} color={WLINE} opacity={s.ui} />
              {lv.length ? <Segs pts={lv} color={WLINE} opacity={s.ui} /> : null}
              {T.h >= cut ? (
                <>
                  <mesh position={[T.x, cut, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[T.w + 90, T.w + 90]} />
                    <meshBasicMaterial color={WLINE} transparent opacity={0.16 * s.ui} side={THREE.DoubleSide} depthWrite={false} />
                  </mesh>
                  <Segs pts={rect4(T.x, cut, 0, T.w + 90, T.w + 90)} color={WLINE} opacity={0.8 * s.ui} />
                </>
              ) : null}
            </group>
          );
        })()}
      </ThreeCanvas>
      {/* 투영 좌표에 붙는 2D: 번개, 축 원·문자, H, 건물 이름, 층수 축 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {towers.map(({ tw, n, H, x }) => {
          const [bx, by] = proj(cam, x, H + 30, 0);
          return Array.from({ length: tw.bolts }, (_, b) => {
            const k = s.bolt(n, b);
            if (k <= 0) return null;
            const cx = bx + (b - (tw.bolts - 1) / 2) * 62;
            return <path key={`${n}-${b}`} d={bolt(cx, by - 108)} fill={heatColor(s.heatOf ? s.heatOf(n) : tw.heat)} stroke="#fff" strokeWidth={2} strokeLinejoin="round" opacity={Math.min(1, k)} style={{ transformOrigin: `${cx}px ${by - 55}px`, scale: String(0.6 + 0.4 * Math.min(1, k)) }} />;
          });
        })}
        {towers.map(({ tw, x }) => {
          const [ax, ay] = proj(cam, x, 0, 600);
          return (
            <g key={tw.grid} opacity={s.ui} stroke={WLINE} strokeWidth={2} fill={WSKY}>
              <circle cx={ax} cy={ay + 36} r={32} />
            </g>
          );
        })}
      </svg>
      {towers.map(({ tw, x }) => {
        const [lx, ly] = proj(cam, x, 0, 300);
        const [ax, ay] = proj(cam, x, 0, 600);
        return (
          <React.Fragment key={tw.tag}>
            <Label name={tw.name} x={lx} y={ly - 6} opacity={names[tw.tag]} size={44} weight={700} color={WSUB} shadow={WSH}>{tw.name}</Label>
            <Label name={`축 ${tw.grid}`} x={ax} y={ay + 8} opacity={s.ui} size={44} weight={700} color={WLINE} shadow={WSH}>{tw.grid}</Label>
          </React.Fragment>
        );
      })}
      {(() => {
        const T = towers[2];
        const [hx, hy] = proj(cam, T.x + T.w / 2 + 70, T.H * 0.5, T.w / 2);
        const [ex, ey] = proj(cam, 540, 0, 260);
        return (
          <>
            <Label name="치수 H" x={hx + 34} y={hy - 28} opacity={s.ui * (T.g >= 1 ? 1 : 0)} size={44} weight={700} color={WLINE} shadow={WSH}>H</Label>
            <Label name="층수 →" x={Math.min(990, ex)} y={ey + 132} opacity={axis} size={44} weight={700} color={WSUB} shadow={WSH}>층수 →</Label>
          </>
        );
      })()}
    </>
  );
};

// 설계 단면도 시안: 세 건물을 세로로 자른 정면 단면(층판·외벽·빗금 코어·아웃트리거·지반 해칭), 수치 없는 도면 문법(레벨 ▽, 치수선, 축선)
const DIAGRAM_MODE = "3d" as "3d" | "section";
const SEC = { base: 1230, fh: 12, xs: [230, 540, 850] };
const Section2D: React.FC<{ s: WireState; names: Record<string, number>; axis: number }> = ({ s, names, axis }) => {
  const INK = "#1F3A5A";
  const towers = TOWERS.map((tw, n) => {
    const H = tw.floors * SEC.fh, g = s.grow(n), h = H * g, x = SEC.xs[n], w = tw.w;
    return { tw, n, H, g, h, x, w, L: x - w / 2, R: x + w / 2, shown: Math.floor(tw.floors * g) };
  });
  const B = SEC.base;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="secHatch" width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={10} stroke={INK} strokeWidth={2} />
          </pattern>
          <pattern id="secEarth" width={18} height={18} patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1={0} y1={0} x2={0} y2={18} stroke={INK} strokeWidth={1.4} strokeOpacity={0.55} />
          </pattern>
        </defs>
        {/* 도면 종이 격자 */}
        <g opacity={0.6 * s.ui}>
          {Array.from({ length: 23 }, (_, k) => <line key={`v${k}`} x1={30 + k * 46} x2={30 + k * 46} y1={600} y2={B + 60} stroke={INK} strokeOpacity={0.07} strokeWidth={1} />)}
          {Array.from({ length: 15 }, (_, k) => <line key={`h${k}`} x1={30} x2={1050} y1={B - k * 46} y2={B - k * 46} stroke={INK} strokeOpacity={0.07} strokeWidth={1} />)}
        </g>
        {/* 지반 */}
        <rect x={60} y={B} width={960} height={44} fill="url(#secEarth)" />
        <line x1={60} x2={1020} y1={B} y2={B} stroke={INK} strokeWidth={5} />
        {towers.map(({ tw, n, H, g, h, x, w, L, R, shown }) => {
          if (g <= 0) return null;
          const core = w * 0.28, cl = x - core / 2, cr = x + core / 2, top = B - h;
          const red = n === 2 && s.exceed ? s.exceed * (0.65 + 0.35 * Math.sin(s.frame / 4)) : 0;
          return (
            <g key={n}>
              {/* 기초 */}
              <rect x={L - 14} y={B} width={w + 28} height={26} fill="url(#secHatch)" stroke={INK} strokeWidth={2.5} />
              {/* 층별 에너지 색(코어 밖 실) */}
              {Array.from({ length: shown }, (_, f) => (
                <g key={`h${f}`} fill={heatColor(tw.heat, 0.05 + 0.45 * s.heat)}>
                  <rect x={L} y={B - (f + 1) * SEC.fh} width={cl - L} height={SEC.fh} />
                  <rect x={cr} y={B - (f + 1) * SEC.fh} width={R - cr} height={SEC.fh} />
                </g>
              ))}
              {/* 코어(잘린 벽 = 빗금) */}
              <rect x={cl} y={top} width={core} height={h} fill="url(#secHatch)" fillOpacity={0.55} />
              <line x1={cl} x2={cl} y1={top} y2={B} stroke={INK} strokeWidth={4} />
              <line x1={cr} x2={cr} y1={top} y2={B} stroke={INK} strokeWidth={4} />
              {/* 층판 */}
              {Array.from({ length: shown }, (_, f) => <line key={`f${f}`} x1={L} x2={R} y1={B - (f + 1) * SEC.fh} y2={B - (f + 1) * SEC.fh} stroke={INK} strokeWidth={2.2} />)}
              {/* 아웃트리거·벨트 트러스 */}
              {tw.out.filter((o) => o * H + 2 * SEC.fh <= h).map((o) => {
                const y = B - o * H, d = 2 * SEC.fh;
                return (
                  <g key={o} stroke={INK} strokeWidth={3} fill="none">
                    <path d={`M ${L} ${y} L ${cl} ${y - d} M ${L} ${y - d} L ${cl} ${y} M ${R} ${y} L ${cr} ${y - d} M ${R} ${y - d} L ${cr} ${y}`} />
                    <line x1={L} x2={R} y1={y} y2={y} strokeWidth={5} />
                    <line x1={L} x2={R} y1={y - d} y2={y - d} strokeWidth={5} />
                  </g>
                );
              })}
              {/* 외벽·지붕 파라펫 */}
              <path d={`M ${L} ${B} L ${L} ${top} L ${R} ${top} L ${R} ${B}`} fill="none" stroke={red > 0 ? RED : INK} strokeWidth={red > 0 ? 6 : 5} />
              {red > 0 ? <rect x={L - 8} y={top - 8} width={w + 16} height={h + 8} fill="none" stroke={RED} strokeWidth={4} opacity={red} /> : null}
              <line x1={L - 6} x2={R + 6} y1={top} y2={top} stroke={INK} strokeWidth={5} />
              {/* 축선(일점쇄선) */}
              <line x1={x} x2={x} y1={top - 30} y2={B + 70} stroke={WLINE} strokeWidth={1.6} strokeDasharray="22 6 4 6" opacity={s.ui} />
              {/* 번개 */}
              {Array.from({ length: tw.bolts }, (_, b) => {
                const k = s.bolt(n, b);
                if (k <= 0) return null;
                const cx = x + (b - (tw.bolts - 1) / 2) * 62;
                return <path key={`b${b}`} d={bolt(cx, B - H - 120)} fill={heatColor(s.heatOf ? s.heatOf(n) : tw.heat)} stroke="#fff" strokeWidth={2} strokeLinejoin="round" opacity={Math.min(1, k)} style={{ transformOrigin: `${cx}px ${B - H - 67}px`, scale: String(0.6 + 0.4 * Math.min(1, k)) }} />;
              })}
              {/* 동전 더미 */}
              {Array.from({ length: tw.coins }, (_, c) => {
                const k = s.coin(n, c);
                if (k <= 0) return null;
                const cx = L - 46, cy = B - 14 - c * 18 - (1 - k) * 30;
                return (
                  <g key={`c${c}`} opacity={k}>
                    <ellipse cx={cx} cy={cy + 5} rx={34} ry={11} fill="#B8892E" />
                    <ellipse cx={cx} cy={cy} rx={34} ry={11} fill="#F2C14E" stroke="#8A6420" strokeWidth={2} />
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* 도면 UI: 초고층 C의 레벨 ▽·치수선, 층수 축 화살표 */}
        {(() => {
          const T = towers[2];
          if (T.g <= 0) return null;
          const xr = 990;
          return (
            <g opacity={s.ui} stroke={INK} fill="none" strokeWidth={2}>
              <line x1={xr} x2={xr} y1={B - T.h} y2={B} />
              <line x1={T.R + 10} x2={xr + 14} y1={B - T.h} y2={B - T.h} strokeDasharray="5 5" />
              {[B - T.h, B].map((y) => <line key={y} x1={xr - 10} x2={xr + 10} y1={y + 10} y2={y - 10} strokeWidth={3} />)}
              {[0.25, 0.5, 0.75, 1].filter((q) => q * T.H <= T.h).map((q) => {
                const y = B - T.H * q;
                return <path key={q} d={`M ${T.R + 14} ${y} L ${T.R + 70} ${y} M ${T.R + 40} ${y - 16} L ${T.R + 56} ${y - 16} L ${T.R + 48} ${y} Z`} />;
              })}
            </g>
          );
        })()}
        <path d={`M 60 ${B + 92} L 1000 ${B + 92} M 984 ${B + 82} L 1004 ${B + 92} L 984 ${B + 102}`} fill="none" stroke={INK} strokeWidth={2.5} opacity={axis} />
      </svg>
      {towers.map(({ tw, x }) => (
        <Label key={tw.tag} name={tw.name} x={x} y={B + 104} opacity={names[tw.tag]} size={44} weight={700} color={WTEXT} shadow={WSH}>{tw.name}</Label>
      ))}
      <Label name="치수 H" x={1010} y={B - towers[2].H * 0.5 - 28} opacity={s.ui * (towers[2].g >= 1 ? 1 : 0)} size={44} weight={700} color={WLINE} shadow={WSH} align="left">H</Label>
    </>
  );
};

const XRAY = "grayscale(1) invert(1) sepia(1) hue-rotate(150deg) saturate(2.6) brightness(0.85) contrast(1.2)";
const Energy: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const bg = useEvent(t, "energy", "energy_bg_in");
  const xr = useEvent(t, "energy", "xray_in");
  const cm = useEvent(t, "energy", "energy_cmp_in");
  const ui = useEvent(t, "energy", "ui_in");
  const te = useEvent(t, "energy", "tag_energy_in");
  const tc = useEvent(t, "energy", "tag_cost_in");
  const bo = useEvent(t, "energy", "bolts_in");
  const co = useEvent(t, "energy", "coins_in");
  const ta = useEvent(t, "energy", "tag_axis_in");
  const stdG = useEvent(t, "standard", "std_gauge_in");
  const names = { tag_low: useEvent(t, "energy", "tag_low_in"), tag_mid: useEvent(t, "energy", "tag_mid_in"), tag_high: useEvent(t, "energy", "tag_high_in") };
  const p = eventProgress(frame, xr, "enter");
  const scanY = 1920 * (1 - p);
  const xO = eventOpacity(frame, xr);
  const cO = eventOpacity(frame, cm);
  const uiK = ease(frame, ui.from, ui.settled) * eventOpacity(frame, ui);
  const s: WireState = {
    frame,
    grow: (n) => ease(frame, cm.from + n * 10, cm.from + n * 10 + 26),
    heat: ease(frame, te.from, te.settled + 24),
    bolt: (n, b) => (frame >= bo.from + n * 8 + b * 5 ? pop(frame, bo.from + n * 8 + b * 5) * eventOpacity(frame, bo) : 0),
    coin: (n, c) => (frame >= co.from + n * 8 + c * 3 ? ease(frame, co.from + n * 8 + c * 3, co.from + n * 8 + c * 3 + 5) * eventOpacity(frame, co) : 0),
    ui: uiK,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <Photo pilot={pilot} file="editorial/energy_tower.png" ev={bg} from={1.0} to={1.05} origin="50% 60%" filter="brightness(0.6)" />
      <AbsoluteFill style={{ opacity: xO, clipPath: `inset(${scanY}px 0 0 0)` }}>
        <Photo pilot={pilot} file="editorial/energy_tower.png" ev={bg} from={1.0} to={1.05} origin="50% 60%" filter={XRAY} />
      </AbsoluteFill>
      {/* 스캔선·십자선·진행 눈금 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: xO * (p < 1 ? 1 : 0.0) }}>
        <rect x={0} y={scanY - 3} width={1080} height={6} fill={CYAN} opacity={0.95} />
        <rect x={0} y={scanY} width={1080} height={70} fill="url(#scanGlow)" />
        <defs>
          <linearGradient id="scanGlow" x1="0" x2="0" y1="0" y2="1">
            <stop offset={0} stopColor={CYAN} stopOpacity={0.35} />
            <stop offset={1} stopColor={CYAN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g stroke={CYAN} strokeWidth={2.5} fill="none">
          <circle cx={540} cy={scanY} r={34} />
          <line x1={490} x2={590} y1={scanY} y2={scanY} />
          <line x1={540} x2={540} y1={scanY - 50} y2={scanY + 50} />
        </g>
        {Array.from({ length: 22 }, (_, k) => <line key={k} x1={24} x2={k % 4 === 0 ? 64 : 44} y1={140 + k * 80} y2={140 + k * 80} stroke={CYAN} strokeWidth={2} opacity={140 + k * 80 >= scanY ? 0.9 : 0.3} />)}
      </svg>
      <AbsoluteFill style={{ opacity: cO, background: WGRAD }}>
        {DIAGRAM_MODE === "section" ? (
          <Section2D s={s} names={{ tag_low: eventOpacity(frame, names.tag_low), tag_mid: eventOpacity(frame, names.tag_mid), tag_high: eventOpacity(frame, names.tag_high) }} axis={eventOpacity(frame, ta)} />
        ) : (
          <Wire3D s={s} theta={interpolate(frame, [cm.from, stdG.end], [-16, 2], clamp)} names={{ tag_low: eventOpacity(frame, names.tag_low), tag_mid: eventOpacity(frame, names.tag_mid), tag_high: eventOpacity(frame, names.tag_high) }} axis={eventOpacity(frame, ta)} />
        )}
      </AbsoluteFill>
      <Label name="㎡당 에너지" x={540} y={380} opacity={eventOpacity(frame, te)} k={pop(frame, te.from)} size={84} color={WTITLE} shadow={WSH}>㎡당 에너지</Label>
      <Label name="건축비·유지비 ↑" x={470} y={496} opacity={eventOpacity(frame, tc)} k={pop(frame, tc.from)} size={60} color="#F2C14E" pill>건축비·유지비 ↑</Label>
      <LogoShade light={!WDARK && cO > 0.5} />
    </AbsoluteFill>
  );
};

// ── 그래서: 같은 와이어프레임 위 에너지 눈금. 「엄격한 기준」에 허용선이 많음 쪽에서 적음 쪽으로 내려와 초고층(C)이 선을 넘는다(정성적, 수치 없음)
const GX0 = 200, GX1 = 880, GY = 540;
const Standard: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const frame = useCurrentFrame();
  const t = pilot.timeline;
  const gin = useEvent(t, "standard", "std_gauge_in");
  const cmE = useEvent(t, "energy", "energy_cmp_in");
  const mk = useEvent(t, "standard", "std_marker_in");
  const ts = useEvent(t, "standard", "tag_std_in");
  const tf = useEvent(t, "standard", "tag_few_in");
  const tm = useEvent(t, "standard", "tag_many_in");
  const gO = eventOpacity(frame, gin);
  const slide = eventProgress(frame, mk, "enter");
  const mx = interpolate(slide, [0, 1], [GX1 + 40, GX0 + (GX1 - GX0) * 0.78]);
  // r5 검수: 「초고층이 이미 기준을 넘는다」로 읽히지 않게 — 기준선이 내려오면 초고층(C)의 에너지 색이 그 선까지 식고 자물쇠(기준 적용)가 붙는다
  const capH = (mx - GX0) / (GX1 - GX0);
  const cool = ease(frame, mk.from + 6, mk.settled + 10);
  const cHeat = 1 + (Math.min(1, capH) - 1) * cool;
  const s: WireState = { frame, grow: () => 1, heat: 1, bolt: () => 0, coin: () => 0.45, ui: 0.6, heatOf: (n) => (n === 2 ? cHeat : TOWERS[n].heat) };
  const lockK = ease(frame, mk.settled, mk.settled + 10);
  return (
    <AbsoluteFill style={{ backgroundColor: WSKY }}>
      <AbsoluteFill style={{ background: WGRAD }}>
        {DIAGRAM_MODE === "section" ? (
          <Section2D s={s} names={{ tag_low: 1, tag_mid: 1, tag_high: 1 }} axis={1} />
        ) : (
          <Wire3D s={s} theta={interpolate(frame, [cmE.from, gin.end], [-16, 2], clamp)} names={{ tag_low: 1, tag_mid: 1, tag_high: 1 }} axis={1} />
        )}
      </AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: gO }}>
        <defs>
          <linearGradient id="stdHeat" x1="0" x2="1" y1="0" y2="0">
            {[0, 0.25, 0.5, 0.75, 1].map((h) => <stop key={h} offset={h} stopColor={heatColor(h)} />)}
          </linearGradient>
        </defs>
        <rect x={GX0} y={GY} width={GX1 - GX0} height={26} rx={13} fill="url(#stdHeat)" />
        <rect x={mx} y={GY - 4} width={Math.max(0, GX1 + 4 - mx)} height={34} fill="rgba(6,10,20,0.55)" />
        {TOWERS.map((tw, n) => {
          const h = n === 2 ? cHeat : tw.heat;
          const x = GX0 + (GX1 - GX0) * h;
          return <path key={tw.grid} d={`M ${x - 16} ${GY - 34} L ${x + 16} ${GY - 34} L ${x} ${GY - 6} Z`} fill={heatColor(h)} stroke="#fff" strokeWidth={2} />;
        })}
        <line x1={mx} x2={mx} y1={GY - 50} y2={GY + 60} stroke={WTITLE} strokeWidth={5} strokeDasharray="12 8" />
        <path d={`M ${mx - 14} ${GY + 76} L ${mx + 14} ${GY + 76} L ${mx} ${GY + 58} Z`} fill={WTITLE} />
      </svg>
      {lockK > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: lockK }}>
          {(() => {
            const cam = wCam(interpolate(frame, [cmE.from, gin.end], [-16, 2], clamp));
            const T = TOWERS[2];
            const [lx, ly] = proj(cam, TX[2], T.floors * W3.fh + 40, 0);
            return (
              <g transform={`translate(${lx} ${ly - 70}) scale(${0.8 + 0.2 * lockK})`}>
                <path d="M -20 -6 L -20 -22 A 20 20 0 0 1 20 -22 L 20 -6" fill="none" stroke={WTITLE} strokeWidth={7} />
                <rect x={-30} y={-8} width={60} height={46} rx={8} fill={WTITLE} />
                <circle cx={0} cy={12} r={6} fill="#0A1222" />
              </g>
            );
          })()}
        </svg>
      ) : null}
      <Label name="에너지 기준" x={540} y={380} opacity={eventOpacity(frame, ts)} k={pop(frame, ts.from)} size={84} color={WTITLE} shadow={WSH}>에너지 기준</Label>
      <Label name="적음" x={GX0} y={GY + 34} opacity={eventOpacity(frame, tf)} size={44} weight={700} color={WSUB} shadow={WSH}>적음</Label>
      <Label name="많음" x={GX1} y={GY + 34} opacity={eventOpacity(frame, tm)} size={44} weight={700} color={WSUB} shadow={WSH}>많음</Label>
      <LogoShade light={!WDARK} />
    </AbsoluteFill>
  );
};

const Closing: React.FC<{ pilot: EditorialPilotData }> = ({ pilot }) => {
  const t = pilot.timeline;
  const n = useEvent(t, "closing", "kl_tl_in");
  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      <FullVideo pilot={pilot} file="editorial/kl_tl.mp4" ev={n} push={[1.0, 1.04]} filter="brightness(0.8)" />
      <LogoShade />
    </AbsoluteFill>
  );
};

const SCENES: Record<string, React.FC<{ pilot: EditorialPilotData }>> = {
  hook_towers: Hook,
  count_2025: Count2025,
  doubling: Doubling,
  pipeline: Pipeline,
  china: China,
  shenzhen: Shenzhen,
  underway: Underway,
  jec: JEC,
  energy: Energy,
  standard: Standard,
  closing: Closing,
};

export const EditorialEpisode: React.FC<EditorialEpisodeProps> = ({ pilot }) => (
  <AbsoluteFill style={{ backgroundColor: NAVY }}>
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
