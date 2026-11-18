# hani_954742 — music / bgm 후보 (editorial-concept)

- 요청: asset_gaps.json `bgm` — 가볍고 호기심 있는 과학 해설, 후반 조건·결말에서 차분해짐, 보컬 없음, 내레이션 아래 낮은 믹스, 무료 상업 사용(NC 제외)
- 공용 음원 폴더: 비어 있음(제작자 확인, `npm run music -- list`) → 외부 탐색
- 경로: Incompetech(Kevin MacLeod) 카탈로그 `pieces.json` 필터(feel/instruments/bpm) → 4곡 다운로드 → 계측·스펙트로그램
- 원본: `news/hani_954742/01_input/05_참고자료/music/` (fetch:assets, manifest `02_production/sourcing/music/assets.json`)
- 검색 원자료: `_search/incompetech_pieces.json`, `_search/track_<ISRC>.html`, `_search/incompetech_licenses.html`
- **청취: 미청취.** 에이전트는 오디오를 들을 수 없다. 판정 근거 = 카탈로그 악기·설명 + EBU R128 계측 + 스펙트로그램/파형(`preview/*.png`) + 5초 구간 음량(`preview/*.loudness5s.txt`). 보컬 없음은 카탈로그 악기 목록 기준(Voice/Choir 미기재)이며 청취 확인 아님.

## 라이선스 근거(곡마다)

각 곡 페이지 `https://incompetech.com/music/royalty-free/index.html?isrc=<ISRC>` 가 pieces.json 의 해당 곡으로 Attribution Code 를 렌더한다(템플릿에 곡별 예외 분기 없음, 2026-11-12 확인). 크레딧 원문(곡명만 바뀜):

```
"<Title>" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

끝 크레딧 표기 필수(CC BY 4.0). 상업·수정 허용.

## 후보

| ref | 파일 | 규격 | 크레딧·라이선스 | 실제 내용(계측) | 활용 구간 | 이야기에서 할 일·한계 |
|---|---|---|---|---|---|---|
| 1 `bgm_easy_lemon` | `01_input/05_참고자료/music/incompetech_Easy_Lemon.mp3` sha256 `2486b8ecfe4575f9ab31613a2c03c2ee45e6e5280301d05b4dd7237c9e1c2531` | 126.4s, 320kbps 44.1k stereo, I -15.8 LUFS, LRA 4.3 | "Easy Lemon" Kevin MacLeod (incompetech.com) CC BY 4.0 · ISRC USUAN1200076 | 82 BPM, Guitar·Bass·Drum Kit·Celesta·Marimba. 카탈로그 설명 "Takes voice-over very well". 구조: 0–~48s 성긴 도입(-17~-19), ~48–108s 드럼 들어온 본문(-16~-14), ~108–121s 얇아지는 아웃트로 → 121–126s 잔향 | 0–57s(후킹→AFM→담금→표면 변화) + 크로스페이드 105–126s(입안 조건·결말) ≈ 78s | 밝고 가벼운 호기심 톤, 결말 진정이 곡 구조로 이미 있음. 한계: 본문부 드럼이 핵심 수치 구간과 겹치면 덕킹 필요. 30s·60s 편집본이 카탈로그에 있음(미다운로드) |
| 2 `bgm_brittle_rille` | `01_input/05_참고자료/music/incompetech_Brittle_Rille.mp3` sha256 `f7f3edc48893ea364473410164403cd1350e50164a4d71a1d8fe52c9f498bb50` | 229.1s, 320kbps, I -14.4 LUFS, LRA 2.8 | "Brittle Rille" Kevin MacLeod (incompetech.com) CC BY 4.0 · ISRC USUAN1200047 | 88 BPM, Bass·Music Box·Cello, feel Bright·Calming·Mysterious. 전 구간 밀도 일정(5초 음량 -14~-17), 에너지 대부분 저중역(≈1.5kHz 이하), ~86–90s 짧은 쉼, 215–229s 마무리 화음 | 0–~62s + 크로스페이드 210–229s 종지 ≈ 80s, 또는 0–80s 연속 + 결말 페이드 | "현미경 속을 들여다보는" 호기심·미세함 정서에 가장 가까움(뮤직박스). 한계: 곡 자체에 감정 변화가 거의 없어 후반 진정은 믹스(볼륨·페이드)로 만들어야 함 |
| 3 `bgm_investigations` | `01_input/05_참고자료/music/incompetech_Investigations.mp3` sha256 `699f7a3cd227dfe5c1e88099b45af57202bfe9d56f86b8b43e4252b65dd96768` | 93.5s, 320kbps, I -18.7 LUFS, LRA 5.6 | "Investigations" Kevin MacLeod (incompetech.com) CC BY 4.0 · ISRC USUAN1100646 | 94 BPM, Pizzicato Strings·English Horn·Bassoon·Marimba·Glockenspiel. 0–~43s 성긴 피치카토, ~43–64s 글로켄 추가, ~64–85s 가장 촘촘, ~85–91s 빠짐 → ~92s 마지막 한 음 | 0–80s 연속 후 페이드(마지막 스팅은 쓰지 않거나 결말 컷에 맞춤) | 성기고 여백이 많아 내레이션 자리 가장 넓음(-18.7 LUFS). 한계: 카탈로그 feel "Humorous"·"comedic" — 건강 경고·주의 문장(입안 조건)에 가볍게 들릴 위험. 중반이 오히려 촘촘해져 "후반 진정"과 반대 |

## 기각

| ref | 파일 | 사유 |
|---|---|---|
| `bgm_wallpaper` | `01_input/05_참고자료/music/incompetech_Wallpaper.mp3` (sha256 `9fa810e5193c88f1b360537366f210f16c2588106d5292f0659e9957fa274f96`), 미리보기 `preview/_rejected/incompetech_Wallpaper.png` | 신스+드럼킷 전대역 밀집, I -11.2 LUFS·LRA 1.4로 처음부터 끝까지 평탄, 1–4kHz 음성 대역이 가득 차 내레이션 마스킹 위험, 진정 구간 없음 |

## 미확보·놓칠 수 있는 선택지

- Pixabay Music·YouTube Audio Library: 검색 API·브라우저 없음 → 미탐색. 더 "현대적인" 로파이/플럭 계열이 필요하면 제작자가 별도 경로로.
- Easy Lemon 60 second 편집본(카탈로그 1:02): 미다운로드. 편집 없이 쓰려면 `https://incompetech.com/music/royalty-free/mp3-royaltyfree/Easy%20Lemon%2060%20second.mp3`.
- 청취 기반 판정(보컬 없음·정서·루프 이음매)은 제작자 청취 필요.
