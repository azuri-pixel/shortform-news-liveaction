# g_music 후보표 (hani_1284974, editorial-concept)

공용 음원 폴더(`npm run music -- list --json`)는 `[]`. 외부 = Incompetech(Kevin MacLeod), 카탈로그 `sourcing/incompetech_pieces_catalog_2026-11-02.json`(pieces.json 원본 보존).
라이선스(전 후보 공통): Creative Commons: By Attribution 4.0 (CC BY 4.0). 근거 = llms.txt 「Nearly all music … CC BY 4.0 … composer and copyrightHolder are Kevin MacLeod … license https://creativecommons.org/licenses/by/4.0/」,
licenses 페이지 「Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/」, FAQ 「Be sure to credit me」. 곡별 NC/ND/SA 표기는 카탈로그에 없음.
**한계: 페이지의 곡별 크레딧 생성기 출력(곡명 포함 정식 문구)은 못 열었다. 크레딧은 아래 구성 문구로 쓰되 곡별 정식 문구와 대조 필요.**

| ref | 파일 | 길이 | 크레딧(원문 구성)·라이선스 | 측정으로 확인한 구조 | 활용 구간 | 이야기에서 할 일·한계 |
|---|---|---|---|---|---|---|
| M1 (1순위) | `external_assets/audio/bgm/Mary_Celeste.mp3`, 미리보기 `audio/derived/preview_Mary_Celeste_0-85s.mp3` | 162.06s, 44.1k/2ch/320kbps | "Mary Celeste" Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/ · https://incompetech.com/music/royalty-free/ · 카탈로그 설명 「Dark and broody, this one starts thin, gets really muddy, and then releases to a faster clearer section」, 저음 관악·현·튜바, 가사 없음(악기 목록에 보컬 없음) | 5초 RMS(dB): 0~30s -26~-24 (얇고 저역, >2kHz -55~-47), 35~50s -22~-21, 60~70s 최고 -17(>2kHz -33 대역 증가), 75s 이후 -21~-23, 막판 -24. 통합 -19.1 LUFS, LRA 8.9 LU | 0~85s(80~85s 페이드아웃, 미리보기 -20.2 LUFS, peak -4.1 dBFS). 도입 저역 긴장 0~30s → 상승 30~70s(점화·고도) → 70s 이후 밀도 감소(여운) | 가장 구조가 요청과 맞음. 한계: 무중력 구간의 「비어 있음」은 -17→-21dB 정도의 완화일 뿐 완전한 공백이 아니다. 마지막 질문형 여운은 80s 페이드로 만들어야 함. 가장 큰 구간(60~70s)이 내레이션을 덮는지는 믹스 후 확인 |
| M2 | `external_assets/audio/bgm/Ossuary_1_-_A_Beginning.mp3`, 미리보기 `audio/derived/preview_Ossuary1_25-105s.mp3` | 188.06s, 44.1k/2ch/256kbps | "Ossuary 1 - A Beginning" Kevin MacLeod (incompetech.com), 동일 CC BY 4.0 문구 · 설명 「slow-moving edgy drone with an ethereal melody on top」, 신스, 가사 없음 | 0~55s 드론 -24~-21, 55~60s -27(가장 비는 지점), 65~80s 스웰 -19/-20/-16, 90~100s -25. 통합 -19.8 LUFS, LRA 8.7 | 25~105s(1s 페이드인·5s 페이드아웃, 미리보기 -20.5 LUFS, peak -4.4). 구간 안에서는 드론(0~30) → 공백(30~35) → 스웰(40~55) → 감쇠(65~80) | 저밀도로 내레이션 밑에 가장 안전, 단 「상승」이 약하고 공백이 상승 앞에 온다(이야기 순서와 반대). 순서를 맞추려면 편집(공백 구간 컷) 필요. 정서는 공포/불안 쪽이라 우주 경이감보다 위험감 |
| M3 | `external_assets/audio/bgm/Tempting_Secrets.mp3`, 미리보기 `audio/derived/preview_Tempting_Secrets_0-90s.mp3`(0~90s는 평탄, 참고용) | 182.18s, 44.1k/2ch/320kbps | "Tempting Secrets" Kevin MacLeod (incompetech.com), 동일 CC BY 4.0 문구 · 설명 「Starts with a big hit, and then a steady string drone with a beautiful flute line on top. Choirs kick in 2/3 of the way」, 현·플루트·합창 | 0~5s -9dB의 큰 타격(이후 -17~-19 평탄), 100s 이후 115~125s부터 -16~-14로 상승(합창 추정, 말 가사는 없음 추정) , 177s부터 4.9s 무음. 통합 -17.9 LUFS, LRA 12.8 | 도입 0~5s 타격 + 드론, 상승은 ~120s 이후라 60~90s 영상에는 편집(예: 0~45s + 115~160s 크로스페이드) 필요 | 정서 변화(어둠 → 고양)가 「끝이 여운」보다는 「끝이 고양」. 큰 타격은 후킹 소리로는 쓸 수 있으나 내레이션 시작과 겹치면 위험. 합창이 가사 있는 보컬인지 청취로 확인하지 못함 |

## 확인 범위
- 확인함: 파일 3개 실제 다운로드(mp3 유효, ffprobe 길이·채널), 5초 단위 RMS, 대역별(<200Hz, >2kHz) 에너지, EBU R128 통합 음량·peak, 무음 구간.
- 확인 못함(이 환경은 청취 불가): 실제 음색·멜로디의 취향 적합성, M3 합창의 가사 유무, 내레이션 믹스 시 마스킹, 크레딧 곡별 정식 문구.
- 정서·구간 표는 카탈로그 설명 + 측정치 기반 추정이며 「들어서 확인한」 것이 아니다.

## 기각 후보 (`external_assets/audio/bgm/_rejected/`)
- Floating_Cities.mp3 (184s): 전체 -23~-20 dB 평탄, 120bpm 퍼커션, 상승 없음.
- Envision.mp3 (85.4s): 전체 -15~-13 dB 거의 평탄(LRA 1.6), 음량 높고 기타 리듬, 변화 부족.
- Drums_of_the_Deep.mp3 (174s): 110s에서만 약한 증가(-22→-18), 타악 드럼이 내레이션과 충돌 가능.
- 카탈로그에서 제외: Black Vortex·Full On·Rynos Theme 등 액션/에픽 곡은 저밀도 요구와 충돌, Past the Edge는 보컬 포함.

## 놓칠 수 있는 선택지
- Pixabay 음악은 공식 API가 음악을 제공하지 않고 웹페이지는 Cloudflare 차단이라 이번에는 조회하지 못함. Kevin MacLeod 카탈로그만 탐색했고, 「무중력 구간의 완전한 공백」을 가진 곡이 필요하면 음악 편집(구간 컷, 저역 로우패스)이나 다른 소스 탐색이 필요.
- 끝 크레딧에 음악 줄이 필요함(CC BY 4.0): 곡명 + Kevin MacLeod (incompetech.com) + 라이선스 + URL.
