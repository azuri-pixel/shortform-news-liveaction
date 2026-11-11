# hani_1274453 배경음악 후보 (editorial-concept)

- 공용 음원 폴더: `npm run music -- list --json` → `[]` (비어 있음). 외부(Incompetech)로 진행.
- 확인 방식: **귀로 청취하지 않음.** 파형·로그 스펙트로그램(`previews/`)·10초 단위 레벨/대역비(`_search/band_analysis_10s.txt`, low<300Hz / mid 300–3000Hz / hi>3kHz)로 확인. 최종 채택 전 청취 필수.
- 라이선스: Incompetech 트랙 페이지(index.html?isrc=…)의 Attribution Code 템플릿이 모든 카탈로그 항목에 CC BY 4.0을 표시. 카탈로그(`_search/incompetech_pieces.json`)에는 트랙별 라이선스 필드가 따로 없음.
- 원본: `01_input/05_참고자료/music/` (manifest `assets.json`, fetch:assets 5/5 성공)

| ref | 파일 | 규격 | 크레딧(원문)·라이선스 | 실제 내용(파형·스펙트럼) | 활용 구간 | 이야기에서 할 일·한계 |
|---|---|---|---|---|---|---|
| m01 Impact Lento | 01_input/05_참고자료/music/incompetech_Impact_Lento.mp3 | 210.6s, 44.1kHz stereo 320kbps, ISRC USUAN1100619 | "Impact Lento" Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 License / http://creativecommons.org/licenses/by/4.0/ | 0–115s 저역 드론 + 드문 중역 음(mid 1–15%, 50–60s·90–100s만 mid 78%대), 52–57s 저역이 빠지는 틈. 117–120s부터 4s 주기 저역 펄스 스웰(<150Hz, mid 0%), 195s~ 페이드아웃 | A안 t=70→155s: 영상 0–47s 신비·수수께끼, 영상 ~47–50s 펄스 시작=충돌 비트, 이후 펄스는 끝까지 이어지므로 여운·CTA에서 페이드다운 필요. B안 t=0→85s: 잔잔한 단일 정서, 클라이맥스 없음 | 카탈로그 feel "Epic, Mysterious, Relaxed", 악기 "Synths, Choir"(합창은 패드로 추정, 가사 여부 미청취). 충돌부 웅장함을 저역으로만 내고 중역 비움 → 가장 적합 |
| m03 Echoes of Time v2 | 01_input/05_참고자료/music/incompetech_Echoes_of_Time_v2.mp3 | 285.2s, 44.1kHz stereo 320kbps | "Echoes of Time v2" Kevin MacLeod (incompetech.com) / 동일 CC BY 4.0 문구 | 거의 전 구간 저역 드론(mid 0–3%, 130–140s만 9%). 0–8s 페이드인, 10–65s −18~−20dBFS, 70–135s 상승(−14), 140–160s 딥, 200–255s 최고점(−8.6), 260s~ 페이드 | t=140→225s: 영상 0–20s 딥(도입), 20–80s 상승해 영상 60–80s 정점 → 충돌 위치에 맞게 오프셋 조정 필요. 또는 t=0→85s 평탄 깔개 | 내레이션 간섭 최소. 카탈로그 feel "Dark, Mysterious, Unnerving" — 호기심보다 불안 쪽, 여운·마무리 정서 전환이 약함. v1(벨 선율 있음)은 받지 않음 |
| m05 Earth Prelude | 01_input/05_참고자료/music/incompetech_Earth_Prelude.mp3 | 229.2s, 44.1kHz stereo 160kbps | "Earth Prelude" Kevin MacLeod (incompetech.com) / 동일 CC BY 4.0 문구 | 0–90s 저역 패드 위주(mid 2–22%, −23~−27dBFS), 90–130s 선율 등장(mid ~50%), 130s~ 더 조용(−28~−31) | t=0→85s 통째: 잔잔한 신비 깔개. 마무리용으로 130s~ 구간 | feel "Dark, Mysterious, Calming, Mystical". 웅장한 충돌 고조 없음, 160kbps. 도입·마무리 보조 또는 m01과 이어붙이기용 |

## 기각 (previews/_rejected/)
- m02 Infinite Perspective (345s): 400–1000Hz 아르페지오가 처음부터 끝까지 지속, mid 13–62%, 레벨 평탄 → 내레이션 대역 점유·정서 변화 없음.
- m04 Dreams Become Real (410s): 피아노 주선율, mid 50–99% → 내레이션과 충돌.

## 미확보·한계
- 귀로 청취하지 않음: 합창/보이스 가사 여부, 음색의 실제 정서는 미확인.
- FMA·ccMixter·Musopen 미탐색(Incompetech에서 3곡 확보 후 중단).
