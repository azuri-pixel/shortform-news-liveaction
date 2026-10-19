# 제작 파일 형식 예시

아래는 `02_production/` 파일의 **구조 예시**다. `<…>`는 실제 값으로 바꿀 자리이며 완성 데이터나 문구가 아니다. 숫자도 구조를 보여주는 자리값이다. 필수 계약과 값 범위는 [editorial 스키마](../../../../docs/specs/editorial-concept.schema.md), [후킹 계약](hook-overlay.md), [음향 스키마](../../../../docs/specs/audio.schema.md)를 따른다. 후킹·현재 제작 프로필·실제 발화 시간 등 편별 계약은 별도로 채운다.

## story.json

```json
{
  "schema_version": "1.0",
  "pilot": "<id>",
  "mode": "editorial-concept",
  "script_policy": "editorial-owned",
  "creative_scope": {"script": "delegated", "assets": "delegated", "diagrams": "delegated", "audio": "delegated"},
  "question": "<질문>",
  "takeaway": "<결론>",
  "concept_order": ["concept_a"],
  "credits": ["<크레딧>"]
}
```

## concepts.json — 개념 한 개와 라벨 한 개

```json
{
  "schema_version": "1.0",
  "pilot": "<id>",
  "concepts": [{
    "id": "concept_a",
    "question": "<질문>",
    "takeaway": "<결론>",
    "narration_lines": ["s01"],
    "prerequisites": [],
    "representation": {"kind": "image", "role": "evidence", "why": "<선택 이유>", "full_bleed": true},
    "state": {"keep": [], "add": ["label_a"], "remove": []},
    "elements": [{"id": "label_a", "kind": "text", "role": "necessary-label", "text": "<라벨>"}],
    "mobile": {"max_simultaneous_labels": 1, "focal_priority": ["label_a"]},
    "visual": {
      "purpose": "observe", "focus": "<관찰 대상>", "moments": [],
      "realization": {"method": "source", "asset_ids": ["source_a"], "job_ids": []}
    }
  }]
}
```

## motion.json — 라벨 사건과 SFX

`token_index`는 0부터 시작한다. 각 word는 같은 줄의 실제 토큰과 일치해야 한다. 해시는 `npm run motion:anchor -- <id> --fix`로 갱신할 수 있다. 이 명령은 같은 줄의 정확히 일치하는 단어 중 기존 인덱스와 가장 가까운 것을 선택하며 동률이면 앞 인덱스를 선택한다. 찾지 못한 단어는 보고하고 그대로 둔다.

```json
{
  "schema_version": "1.0", "pilot": "<id>", "fps": 30, "total_frames": 90,
  "narration_word_sha256": "<단어 시각 SHA-256>",
  "events": [{
    "id": "label_show", "kind": "label", "concept_id": "concept_a", "element_id": "label_a",
    "timing": {
      "from": {"anchor": {"line": "s01", "token_index": 0, "word": "<토큰>", "edge": "start", "offset_frames": 0}},
      "settled": {"anchor": {"line": "s01", "token_index": 0, "word": "<토큰>", "edge": "start", "offset_frames": 3}},
      "to": {"anchor": {"line": "s01", "token_index": 0, "word": "<토큰>", "edge": "end", "offset_frames": 0}},
      "end": {"anchor": {"line": "s01", "token_index": 0, "word": "<토큰>", "edge": "end", "offset_frames": 3}}
    },
    "easing": {"enter": "ease-out", "move": "linear", "exit": "ease-in"},
    "depends_on": [], "coexist_with": []
  }],
  "audio_cues": [{"id": "cue_a", "kind": "sfx", "asset": "audio/<효과음>.wav", "gain_db": 0, "bind": {"event_id": "label_show", "point": "settled", "offset_frames": 0}}]
}
```

## visual-system.json — media·generation_jobs·attribution 부분

아래는 해당 블록만 발췌한 구조다. `generation_job`은 accepted 작업 id에 연결한다. 컷 출처의 start/end는 초이며, 프레임이 아니다. 기관 자료에는 실제 공식 자료 URL인 `attribution_evidence`를 기록한다. 생성 자산에 기관 자료 크레딧을 붙이지 않는다.

```json
{
  "media": {
    "full_bleed_default": true,
    "assets": [
      {"id": "source_a", "source": "01_input/<원본>.mp4", "file": "editorial/<클립>.mp4", "trim": {"from_sec": 0, "duration_sec": 1}, "crop": {"x": 0, "y": 0, "width": 1080, "height": 1920}, "attribution_kind": "institution", "attribution_evidence": "https://example.invalid/<공식자료>", "credit": "<기관 크레딧>"},
      {"id": "still_a", "source": "01_input/<원본>.mp4", "file": "editorial/<정지화면>.png", "frame_at_sec": 0},
      {"id": "generated_a", "source": "02_production/external_assets/<생성물>.png", "file": "editorial/<생성물>.png", "generation_job": "job_a"}
    ]
  },
  "generation_jobs": [{"id": "job_a", "kind": "image", "purpose": "<생성 목적>", "status": "accepted", "provider": "<제공자>", "model": "<모델>", "prompt_path": "02_production/<프롬프트>.txt", "output": "02_production/external_assets/<생성물>.png", "observation": "<관찰>"}],
  "attribution": {
    "sources": [{"asset_id": "source_a", "text": "<기관 크레딧>", "start": 0, "end": 1}],
    "pages": [{"categories": [{"title": "참조 기사", "lines": ["<기사 크레딧>"]}]}]
  }
}
```

## audio.json — BGM 블록

음량은 예시 숫자를 그대로 쓰지 않고 실제 음원·계약에 맞춘다. editorial SFX 음량은 motion.audio_cues에 기록한다.

```json
{
  "schema_version": "1.0", "pilot": "<id>", "loudness_contract": "audio-loudness@1",
  "narration": {"file": "audio/narration.wav", "gain_db": 0},
  "bgm": {
    "asset": "<음원 id>", "file": "audio/<배경음>.mp3", "gain_db": 0, "duck_db": -12,
    "duck_attack_sec": 0.25, "duck_release_sec": 0.6,
    "fade_in_sec": 1, "fade_out_sec": 2, "start_offset_sec": 0,
    "loop": true, "credit": "<음원 크레딧>"
  },
  "sfx": []
}
```

## voice.json

키 근거: `scripts/lib/production/global-defaults.mjs`의 `VOICE_KEYS`. 실제 선택한 제공자와 보이스 값을 보존한다.

```json
{
  "provider": "<제공자>", "voice_id": "<보이스 id>", "voice_name": "<보이스 이름>",
  "model": "<모델>", "language": "<언어>", "audio_tempo": 1, "audio_pitch": 0,
  "emotion_preset": "<감정 프리셋>"
}
```
