# BGM 후보표 (hani_928073, editorial-concept)

공용 음원 폴더 `npm run music -- list --json` = `[]` (비어 있음) → 외부 탐색. 공용 곡 미사용 사유: 비어 있음.
탐색 경로: Mixkit 무료 음악(Ambient·Piano·Cinematic 장르 목록 108항목 중 제목·길이로 선별 → 11곡 수령 → 구간별 분석으로 9곡 판정). Pixabay 음악은 API·웹 모두 불가(키 API에 음악 없음, 웹 차단)라 건너뜀. Incompetech 등은 이번 회차에서 열어보지 않음(미탐색).

## 확인 범위 (중요)
- **청취하지 않았다.** 제작 환경에서 소리를 들을 수 없어, 실제 파일을 받아 ffmpeg로 구간별 음량(RMS, 5/10초 창)·대역별(<250Hz / 1–4kHz / >4kHz) 에너지·스펙트로그램을 읽은 결과다. 악기 구성·정서 서술은 이 분석에서의 추정이며 **제작자가 미리보기를 듣고 확정**해야 한다.
- 라이선스: Mixkit 트랙 목록 페이지의 구조화 데이터(JSON-LD)에서 항목마다 `copyrightNotice: "Mixkit Stock Music Free License"`, `license: https://mixkit.co/license/#musicFree`를 확인(3개 장르 목록 각 36/36항목 모두 동일). 한 줄 요약은 https://mixkit.co/free-stock-music/ 의 문구: "All audio clips are royalty free and can be used with no attribution or sign up required." / "Attribution is appreciated but not required." / SNS·YouTube 사용 가능 명시 / 금지: "You are not permitted to use Mixkit music in CDs, DVDs, Video Games or TV & Radio broadcasts." **라이선스 전문(/license/ 의 모달)은 가져오지 못했다** → 전문 미열람. 숏폼 SNS 게시는 요약상 허용.
- 작가명은 목록 JSON-LD 원문 그대로.

## 후보

| ref | 파일 | 규격 | 크레딧(원문)·라이선스 근거 | 확인 범위 |
|---|---|---|---|---|
| **A. Echoes** | `01_input/05_참고자료/music/mixkit_188.mp3` | 3:46(226.3s), 44.1kHz 스테레오 320k, 전곡 -17.6 LUFS, TP -1.0 | "Echoes" — Andrew Ev (Mixkit, genre Atmospheres). Mixkit Stock Music Free License · https://mixkit.co/free-stock-music/echoes/ · 파일 https://assets.mixkit.co/music/188/188.mp3 | 분석만, 미청취 |
| **B. Opalescent** | `.../mixkit_593.mp3` | 4:44(284.1s), 44.1k 스테레오 256k, -11.3 LUFS, TP +0.1(클립 위험, 게인 낮추면 무관) | "Opalescent" — Eugenio Mininni (Mixkit, Ambient). 동일 라이선스 · https://mixkit.co/free-stock-music/opalescent/ · https://assets.mixkit.co/music/593/593.mp3 | 분석만, 미청취 |
| **C. Silent Descent** | `.../mixkit_614.mp3` | 2:40(160.4s), 44.1k 스테레오 256k, -13.3 LUFS | "Silent Descent" — Eugenio Mininni (Mixkit, Piano·Cinematic). 동일 라이선스 · https://mixkit.co/free-stock-music/silent-descent/ · https://assets.mixkit.co/music/614/614.mp3 | 분석만, 미청취 |
| 예비 D. Vastness | `.../mixkit_184.mp3` | 3:50(229.8s), 256k, -13.5 LUFS, LRA 2.1 | "Vastness" — Andrew Ev (Mixkit, Ambient·Piano·Cinematic). 동일 라이선스 · https://mixkit.co/free-stock-music/vastness/ | 분석만 |
| 예비 E. Piano Reflections | `.../mixkit_22.mp3` | 3:19(198.9s), 256k, -13.0 LUFS, TP +0.7 | "Piano Reflections" — Ahjay Stelino (Mixkit, Piano). 동일 라이선스 · https://mixkit.co/free-stock-music/piano-reflections/ | 분석만 |

sha256(앞 16자): A 49842074dc06f05a · B 760e23eaaff7bc50 · C 601955cacab6c384 · D 3ffae7ccd5ea6f61 · E 7d58c4255d91f58e. 원본 2차 수령분(571·587·601·606·609·168)도 같은 폴더에 있으나 후보 제외(아래).

미리보기(0~95s, 1s 페이드인·4s 페이드아웃, 파생물): `02_production/sourcing/music/preview/excerpt_0-95s_mixkit_<id>.mp3` (188/593/614/184/22). 스펙트로그램: `preview/spec_lin_<id>.png`(0–3kHz 선형), `preview/spec_<id>.png`(로그).

## 구간별 정서(분석 근거 포함) — 원곡 타임코드

**A. Echoes (226s)** — 저역 드론 위의 지속 패드 음(스펙트로그램에서 긴 블롭 형태, 선율 리드·보컬 형태 아님).
- 0:00–0:20 거의 무음에서 저역 드론이 올라옴(<250Hz -40→-22, 1–4kHz -72~-54) = 우주의 어둠·호기심 도입에 가장 가까움.
- 0:20–0:40 드론 정착, 중음역 여전히 매우 낮음(내레이션 대역 비어 있음).
- 0:40–1:30 패드 화음 음들이 1–3kHz에 등장, 중음 -30~-24 dB(저역 대비 +). 진행감·확장 = 중반~세이건 인용 후보. 약 0:40, 1:05~1:20에 가장 뚜렷.
- 1:30–2:10 음이 듬성해지고 종소리 같은 소음(고역 소량) → 여운. 2:10–3:46 -20 수준 유지 후 3:30 이후 페이드(끝맺음 있음).
- 활용: 0:00→1:35 + 페이드아웃(90초 영상). 인용부를 0:40~1:30에 맞출 것.
- 위험: 저역 비중 큼(내레이션 남성 저음과 겹침 → 150Hz 이하 하이패스 권장). 1:30 전후 중음 상승이 인용에 맞는지 청취 필요. 전체 -17.6으로 이미 낮아 -18~-22 LUFS 목표에 게인 조정 폭 작음(이점).

**B. Opalescent (284s)** — 초반 점음(벨/플럭 계열로 추정), 이후 패드 질감.
- 0:00–0:50 가장 조용한 구간, 음이 띄엄띄엄(스펙트로그램에 개별 점음 패턴), 1–4kHz -39~-35. 도입의 고요·호기심에 맞음.
- 0:50–1:00 전환: 저역 상승(-31→-15 <250Hz), 중음 -25. 한 번에 풍성해지는 분기점(약 1:00 부근).
- 1:00–2:05 풍성한 패드·화음(-24 중음) = 후반 따뜻한 확장 후보. 2:05–3:20 다시 잦아듦·옅은 질감(-35). 3:20–4:35 재상승(-22).
- 활용: 0:00→1:35. **0:50~1:00 상승이 내레이션 인용 진입(약 55~60s 지점)과 맞아야** 한다 — 영상 구성이 다르면 시작 오프셋으로 조정(예: 0:10부터 시작해 상승이 ~50s에 오게). 중반 '약간의 진행감'은 0:15~0:50에서 다소 약함(정적).
- 위험: 상승 폭이 크다(-35→-24, 11dB) → 인용 구간에서 갑자기 커 보일 수 있어 덕킹·게인 곡선 필요. 원본 TP +0.1.

**C. Silent Descent (160s)** — 규칙적 펄스성 점음(플럭/피아노형 추정) → 패드 합류 → 다시 펄스.
- 0:00–0:40 조용(-36), 규칙적 펄스 패턴 = 호기심·미세한 진행감. 펄스가 일정해 내레이션 아래 시계 같은 느낌 위험.
- 0:40–1:10 패드 합류, 중음 -28→-24. 1:10–2:05 가장 큼·풍성(1–4kHz -20~-22, 화음 변화 뚜렷) = 인용·확장 후보. 2:05–2:40 펄스로 돌아가 서서히 사라짐 = 여운·끝맺음 자연스러움.
- 활용: 0:00→1:35(확장이 1:10 이후이므로 90초 영상에선 확장 구간이 짧다). 인용이 ~55s 이후라면 0:30 시작 오프셋 고려. 전체 160s이므로 전곡 사용 시 자연 종결.
- 위험: 중음(1–4k) 에너지가 가장 높아(-20) 내레이션과 가장 많이 겹침. 청취로 선율 리드 여부 확인 필수.

## 예비·기각

- D Vastness(184): 5초 창 RMS -13±1, 곡 전체 거의 변화 없음(LRA 2.1). 저역 드론 위주, 1–4kHz가 -35로 낮아 내레이션 아래에선 가장 안전하나 **정서 변화(확장→따뜻함)가 없다**. 90초 단일 톤 베드·루프용 안전판.
- E Piano Reflections(22): 피아노 곡. 1–4kHz가 저역보다 높고(-26 vs -19) 변화 폭 작음(LRA 2.5) → 피아노 선율이 내레이션 대역을 덮을 가능성이 크고 아크 약함. 도입 고요는 있으나 -17에서 시작해 '어둠' 도입이 약함. 피아노 요청 대응 예비.
- 587 Discover(144s): 0:10·0:30 부근에 음량 불연속(-41→-19→-33→-18)이 있고 길이가 짧아(144s) 제외.
- 606 Drawing the Sky(207s), 609 Moon Walk(205s), 168 Staring at the Night Sky(142s), 601 Skyline, 571 Voxscape: 시작부터 -19~-15 수준으로 일정, 서서히 밝아지는 아크가 약하거나 중음 에너지 높음(1–4kHz -20~-27)이라 기각. 제목이 우주풍(Staring at the Night Sky)인 168은 5초 창 -17~-13에서 중간 이후 -12까지 상승하나 142s에 끝이 급(-21→-37 at 2:05)이고 중음이 -20대 → 대안으로만 기억.
- 이번에 열어보지 못한 곳: Incompetech(CC BY 4.0), FMA, ccMixter, Musopen, Pixabay Music 웹. 위 3곡이 청취에서 탈락하면 다음 탐색 범위. Pixabay 음악은 키 API로 조회 불가.

## 믹스 권고(분석 기반, 청취 확인 전)
- 모두 원본이 -10~-18 LUFS라 내레이션(-16) 아래로 -18~-22 LUFS 가려면 게인 -4~-9dB 필요. 클립(TP +0.1) 방지용으로 낮춘 뒤 사용.
- 내레이션 대역 보호: 곡에 120~150Hz 하이패스와 1–4kHz 약 -3dB 정도 노치를 제작자가 시험.
- 끝맺음: 모두 곡 자체의 자연 종결은 2:40~4:44이라 90초 영상에선 페이드아웃(≥3s)으로 마무리. 루프 불필요(전곡 길이가 충분).
