// 「여기서 중요한 한 가지!」 강조 공통 계약 (key-callout@1, 2026-11-03 사용자 지시).
// 나레이션 문장이 「여기서 중요한 한 가지」로 시작하면 그 문장 구간에 「중요한 한 가지!」를 흰색 굵은 중앙 문구 + 노란 밑줄로 띄운다.
// request.json key_callout(새 편) 또는 visual-system.json key_callout_policy(진행 중인 편의 명시적 선택)가 있을 때만 켠다. 옛 편에는 소급하지 않는다.
export const KEY_CALLOUT_POLICY = "key-callout@1";
const POLICIES = [KEY_CALLOUT_POLICY];
export const KEY_CALLOUT_TRIGGER = "여기서 중요한 한 가지";
export const KEY_CALLOUT_TEXT = "중요한 한 가지!";
export const KEY_CALLOUT_STYLE = {
  center_x: 540, center_y: 860, font_family: "Pretendard", font_size: 128, font_weight: 800, letter_spacing: -3,
  color: "#FFFFFF", shadow: "0 4px 24px rgba(0,0,0,0.65), 0 1px 3px rgba(0,0,0,0.8)",
  underline_color: "#FFD16A", underline_px: 9, underline_gap: 14,
  lead_frames: 3, enter_frames: 7, underline_delay_frames: 4, underline_frames: 10, hold_after_frames: 10, exit_frames: 6,
};

// 공백·문장부호를 무시하고 비교한다(「여기서 중요한 한 가지!」「여기서, 중요한 한가지」 모두 해당).
const bare = (text) => String(text ?? "").replace(/[\s.,!?'"‘’“”·…~-]/g, "");

// lines: normalizeNarration 결과. 반환 key_callouts 는 timeline.key_callouts 로 그대로 싣는다.
export const compileKeyCallouts = ({ policy = null, lines, fps, contentFrames }) => {
  const errors = [];
  if (policy == null) return { errors, key_callouts: [] };
  if (!POLICIES.includes(policy)) { errors.push({ code: "key-callout-policy", where: "key_callout", message: `알 수 없는 강조 계약: ${policy}` }); return { errors, key_callouts: [] }; }
  const s = KEY_CALLOUT_STYLE;
  const key_callouts = [];
  for (const line of lines ?? []) {
    if (!bare(line.text).startsWith(bare(KEY_CALLOUT_TRIGGER))) continue;
    if (!Number.isFinite(line.start) || !Number.isFinite(line.end)) continue;
    const from = Math.max(0, Math.round(line.start * fps) - s.lead_frames);
    const end = Math.min(contentFrames ?? Infinity, Math.round(line.end * fps) + s.hold_after_frames);
    if (from < end) key_callouts.push({ policy, line: line.id, text: KEY_CALLOUT_TEXT, from, end, style: structuredClone(s) });
  }
  return { errors, key_callouts };
};
