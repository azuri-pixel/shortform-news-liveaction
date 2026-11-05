# g_music 후보 (hani_1246017, editorial-concept)

범위: 공용 음원 폴더 `npm run music -- list --json` = `[]` (비어 있음) → 공용 곡 없음. 외부는 Incompetech(CC BY 4.0)만 실제 확보.
접근 한계: Pixabay Music 웹 403(API 없음), ccMixter 접속 실패(000), FMA는 페이지 파싱 미시도 → 이 세 곳은 미확인. Musopen 미탐색.
**청취 한계: 소싱 담당은 소리를 듣지 못한다. 아래 구성·정서는 Incompetech 카탈로그 기재(feel·악기·bpm)와 ffmpeg RMS 5초 구간 측정으로만 판단한 것이다. 제작자가 반드시 청취·믹스 검수할 것.**
**구조 한계: Incompetech 곡은 대부분 처음부터 끝까지 에너지가 일정한 루프형이다. "웅장 도입 → 추진 → 후반 1/4 차분한 여운" 호가 곡 안에 통째로 있는 곡은 찾지 못했다. 그래서 같은 곡 안의 구간 2개를 이어 붙이고(2초 크로스페이드) 뒷부분에 로우패스·감쇄·페이드를 건 70~80초 편집 미리보기(A·B·C)를 만들었다. 편집·가공본이므로 크레딧에 "편집됨"을 밝혀야 한다(Incompetech FAQ: 편집 시 어디가 본인 작업인지 크레딧에 명시).**

## 후보표

| ref | 파일(원본) | 곡·규격 | 크레딧(원문)·라이선스 근거 | 실제 구성(측정)·확인 범위 | 활용 구간(타임코드) | 이야기에서 할 일·한계 |
|---|---|---|---|---|---|---|
| M1 (추천 1순위) | `external_assets/audio/bgm_candidates/Hiding Your Reality.mp3` / 미리보기 `sourcing/preview_music/B_HidingYourReality_80s.mp3` (+`.png` 파형) | Kevin MacLeod, 3:13, 107bpm, Soundtrack, 금관(트럼펫·트롬본·튜바)+신스+타악 / feel: Action, Driving, Epic | `Hiding Your Reality Kevin MacLeod (incompetech.com)` / `Licensed under Creative Commons: By Attribution 4.0` / `https://creativecommons.org/licenses/by/4.0/` (카탈로그 pieces.json: 모든 곡 CC BY 4.0, FAQ 크레딧 서식) | RMS: 0~20s 약 -26→-21dB로 쌓이며 시작, 20~90s -18~-15dB 추진, 95~110s 약 -23dB로 자연스럽게 성기게 내려앉는 구간 있음, 마지막 10s 페이드. 고음역(>3kHz) 에너지가 낮아 밝게 튀지 않음 | 미리보기 B(80s): 원곡 0:00~1:02 → 2s 크로스페이드 → 원곡 1:36~1:56(로우패스 2.5kHz, -2dB) → 72s부터 8s 페이드. 「중요한 한 가지」는 미리보기 약 60s 부근(전환점)에 맞음 | 도입 상승·추진은 곡 자체 구조에 가장 가깝다. 한계: 금관 중음역이 내레이션과 겹칠 수 있음 → 덕킹 필요, 청취 미확인. 후반 여운은 곡 자체의 약화 구간+가공이며 "질문을 남기는" 느낌은 청취 확인 필요 |
| M2 | `.../bgm_candidates/Undaunted.mp3` / 미리보기 `sourcing/preview_music/C_Undaunted_74s.mp3` (+`.png`) | Kevin MacLeod, 3:33, 95bpm, Soundtrack, 타악+피아노+신스 / feel: Driving, Epic, Action, Intense. 설명 "Big big drums pushing a big cinematic feel." | `Undaunted Kevin MacLeod (incompetech.com)` / 위와 같은 CC BY 4.0 문구 | RMS 0~10s -24dB로 시작, 이후 -20dB 전후로 큰 변동 없이 지속, 마지막 15s 감쇠. 저음역(<200Hz) 비중 큼 | 미리보기 C(74s): 원곡 0:00~0:50 → 2s 크로스페이드 → 1:40~2:06(로우패스 1.8kHz, -6dB) → 68s부터 6s 페이드 | 웅장·시네마틱은 M1보다 강함. 한계: 큰 드럼이 계속 밀어 저밀도 요건에 약함, 도입 상승감은 약함(처음부터 일정). 청취 미확인 |
| M3 (안전 대체) | `.../bgm_candidates/Inspired.mp3` / 미리보기 `sourcing/preview_music/A_Inspired_75s.mp3` (+`.png`) | Kevin MacLeod, 4:46, 120bpm, Electronica, 기타+신스+타악 / feel: Bright, Relaxed, Calming, Uplifting. 설명상 corporate·industrial process 용도 | `Inspired Kevin MacLeod (incompetech.com)` / 위와 같은 CC BY 4.0 문구 | RMS -14dB 전 구간 거의 평탄(5초 구간 변동 ±1dB), 고음역 낮음 → 내레이션 아래 안정적. 도입 상승·웅장함은 없음 | 미리보기 A(76s): 원곡 0:00~0:52 → 2s 크로스페이드 → 2:30~2:56(로우패스 1.8kHz, -5dB) → 68s부터 6s 페이드 | 현대적 비트·저밀도는 가장 안전. 한계: 「웅장」 요구 미충족(밝고 편안한 정서), 후반 변화는 전적으로 가공에 의존 |

## 기각 (원본 `external_assets/audio/bgm_candidates/_rejected/`)
Americana(오케스트라, 전반 조용·후반 고조로 구조 반대), At Launch(금관 행진 중심, 현대적 비트 아님), Newer Wave(80년대 신스팝, 톤 불일치), Rising Game(1:52, 마지막까지 고조·dark·choir라 여운 없음), Rising Tide(4:37 평탄 일렉트로니카, 미스터리 정서), Super Power Cool Dude(3:56 평탄 액션 신스), Urban Gauntlet(타악 펄스 강해 내레이션과 겹침). 모두 카탈로그 기재+RMS 측정 기준이며 청취 기각 아님.

## 추천과 이유
1순위 M1: 시작이 작게 쌓여 올라가는 형태(0~20s), 중간 추진, 95~110s에 곡 자체에 성긴 구간이 있어 편집이 덜 인위적이다. 요청의 「웅장·상승 → 추진 → 가라앉음」과 구조가 가장 가깝다. 단 금관 음역이 목소리와 겹칠 위험이 있어 덕킹(내레이션 구간 -10dB 이상)을 권한다. 내레이션 최우선이면 M3, 웅장함 최우선이면 M2.
미리보기 길이 74~80s는 예상 분량 65~80s에 맞춘 것이며 실제 길이가 다르면 첫 구간 길이만 조정하면 된다(전환점은 원곡 1:02 / 0:50 / 0:52).

## 요청 범위가 놓칠 수 있는 선택지
- 곡 안에 호가 있는 곡을 찾으려면 Pixabay Music·FMA·Musopen을 브라우저로 직접 청취해야 하나 소싱 담당은 접근 불가(Pixabay 403). 필요하면 제작자가 후보 URL을 주면 내려받아 분석한다.
- 정서 변화를 곡 하나로 찾기보다, 도입용 곡 1 + 여운용 잔잔한 곡 1(예: Incompetech Heartbreaking 1:36, Reaching Out 1:01, Atlantean Twilight 2:51 - 모두 미다운로드·미청취)을 이어 붙이는 방식도 있다.

## 크레딧(제작자가 게시 설명란·RIGHTS.md에 사용)
- Hiding Your Reality Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/ (편집됨)
- 같은 형식으로 Undaunted, Inspired.
`attribution@3·4` 편은 끝 크레딧에 음악을 넣지 않고 RIGHTS.md·게시 설명란에만 남긴다.
