import {Interactive, interpolate, useCurrentFrame} from 'remotion';
import type {EditorialTimeline} from './types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 「중요한 한 가지!」 강조(key-callout@1). 공통 레이어 — 장면 코드에 넣지 않는다. 말자막은 그대로 둔다. */
export const KeyCalloutTrack: React.FC<{callouts: EditorialTimeline['key_callouts']}> = ({callouts}) => {
  const frame = useCurrentFrame();
  const c = (callouts ?? []).find((k) => frame >= k.from && frame < k.end);
  if (!c) return null;
  const s = c.style;
  const enter = interpolate(frame, [c.from, c.from + s.enter_frames], [0, 1], clamp);
  const exit = interpolate(frame, [c.end - s.exit_frames, c.end], [1, 0], clamp);
  const line = interpolate(frame, [c.from + s.underline_delay_frames, c.from + s.underline_delay_frames + s.underline_frames], [0, 1], clamp);
  return <Interactive.Div name="key callout" data-key-callout style={{
    position: 'absolute', left: 0, width: 1080, top: s.center_y, translate: `0 calc(-50% + ${(1 - enter) * 18}px)`,
    display: 'flex', justifyContent: 'center', pointerEvents: 'none', opacity: Math.min(enter, exit),
  }}>
    <div style={{position: 'relative', display: 'inline-block', paddingBottom: s.underline_gap + s.underline_px}}>
      <div style={{fontFamily: s.font_family, fontWeight: s.font_weight, fontSize: s.font_size, letterSpacing: s.letter_spacing, color: s.color, textShadow: s.shadow, lineHeight: 1.1, whiteSpace: 'nowrap'}}>{c.text}</div>
      <div style={{position: 'absolute', left: 0, bottom: 0, height: s.underline_px, width: `${line * 100}%`, background: s.underline_color, borderRadius: s.underline_px}} />
    </div>
  </Interactive.Div>;
};
