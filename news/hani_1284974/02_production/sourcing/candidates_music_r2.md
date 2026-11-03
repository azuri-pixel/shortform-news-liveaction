# g_music 재탐색 후보표 r2 (hani_1284974, editorial-concept)

요청: 「내용에 방해하지 않고, 리드미컬한」. 기존 6곡(Mary Celeste, Ossuary 1, Tempting Secrets, Floating Cities, Envision, Drums of the Deep) 제외.
출처: Incompetech(Kevin MacLeod) 카탈로그 `sourcing/incompetech_pieces_catalog_2026-11-02.json`(1443곡)에서 BPM·길이·악기(보컬 없음)로 거른 뒤 7곡 다운로드·측정, 3곡 채택.
공용 음원 폴더(`npm run music -- list --json`)는 `[]`.
라이선스(공통): Creative Commons: By Attribution 4.0 (CC BY 4.0). 근거는 r1 후보표와 동일 — llms.txt「Nearly all music … CC BY 4.0 … composer and copyrightHolder are Kevin MacLeod」, licenses 페이지「Licensed under Creative Commons: By Attribution 4.0」, FAQ「Be sure to credit me」. 곡별 NC/ND/SA 표기는 카탈로그에 없음. 한계: 곡별 크레딧 생성기 정식 문구는 못 열었다(r1과 동일), 제작자가 대조 필요.
크레딧 형식(구성 문구): "<곡명>" Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/

## 후보 (추천 순)

| ref | 파일 / 미리보기 | 곡·URL·길이·BPM | 측정값 | 활용 구간 | 이야기에서 할 일·한계 |
|---|---|---|---|---|---|
| R2-1 (1순위) | `external_assets/audio/bgm/Galactic_Rap.mp3` · `external_assets/audio/derived/preview_Galactic_Rap_0-80s.mp3` (0~80s, 1s 페이드인·4s 페이드아웃) | "Galactic Rap" Kevin MacLeod, https://incompetech.com/music/royalty-free/mp3-royaltyfree/Galactic%20Rap.mp3 · 142.05s, 44.1k/2ch/256k · BPM 120(카탈로그 120, 우리 측정 자기상관 120/60 확인) · 신스+퍼커션, 보컬 없음 · 카탈로그 설명「98% voice-over friendly! … watch out for the key change at 1:34」 | 통합 -17.9 LUFS, LRA 2.2 LU, peak -2.5 dBFS(미리보기 -18.4 LUFS, LRA 2.0). 대역 RMS: 저역(<300Hz) -20.4 dB / 중음역(300~3k) -25.4 dB / 고역(>3k) -35.6 dB → 중음역이 저역보다 5.0 dB 낮고 고역보다 10.2 dB 높음. 5초 단위 전체 RMS -18.3~-20.1(진폭 ±1 dB), 중음역 -24.3~-28.3 | 0~85s 전체(키 체인지 1:34 이전). 영상 72s 전체에 그대로 깔 수 있음 | 이 영상에서 가장 안전하고 일정한 펄스. 15~30s 고도 구간에서 「더 역동적」인 상승은 없다(곡 전체가 평탄) — 역동성은 영상 컷·그래프가 맡고 음악은 박만 유지. 끝 질문 구간은 80s 페이드아웃으로 마무리. 94s(1:34) 이후는 쓰지 말 것. 장르가 「랩 비트」 계열 신스라 약간 도시적/쿨한 톤 — 우주 경이감은 약함 |
| R2-2 | `external_assets/audio/bgm/Impact_Moderato.mp3` · `external_assets/audio/derived/preview_Impact_Moderato_0-75s.mp3` (1s 페이드인) | "Impact Moderato" Kevin MacLeod, https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impact%20Moderato.mp3 · 75.68s, 44.1k/2ch/320k · BPM 100(카탈로그 100, 측정 100 확인) · 드럼킷+퍼커션+기타+신스, 보컬 없음 · 설명「3 of 6. Laid back drum kit with a lot of extra percussion under a simple guitar」 | 통합 -16.0 LUFS, LRA 3.2 LU, peak -0.1 dBFS(여유 없음, 믹스에서 -3 dB 이상 내릴 것). 대역 RMS: 저역 -17.3 / 중음역 -29.4 / 고역 -33.5 → 중음역이 저역보다 12.1 dB 낮음(후보 중 가장 비어 있음). 5초 전체 RMS -16.6~-18.5, 중음역 -28~-31, 마지막 15초 감쇠 | 0~72s 전체. 영상 길이(72s)보다 3.7s만 길어 루프·편집 없이 맞음 | 가장 많이 비어 있는 중음역 + 일정한 드럼 그루브라 40~60s 요금 도해(빠른 정보)에 특히 맞음. 한계: 길이가 영상과 거의 같아 길이 연장 불가(루프 지점 미확인), 곡 끝에서 자연 감쇠(65s 이후 -19→-25 dB), 기타 한 대가 중음역 일부를 차지하므로 내레이션 밑에서 -1~2 dB 더 내리는 편이 안전. 저역 비중이 커 소형 스피커에서는 드럼 울림이 크게 들릴 수 있음. 「편안한 웬만한 BGM」 톤이라 15~30s 클라이맥스 느낌은 약함 |
| R2-3 | `external_assets/audio/bgm/Jerry_Five.mp3` · `external_assets/audio/derived/preview_Jerry_Five_0-80s.mp3` (0~80s, 페이드인·아웃) | "Jerry Five" Kevin MacLeod, https://incompetech.com/music/royalty-free/mp3-royaltyfree/Jerry%20Five.mp3 · 160.05s, 44.1k/2ch/256k · BPM 90(카탈로그 90, 측정 90 확인) · 신스+퍼커션, 보컬 없음 · 설명「cooler, driving piece. Lots of space in this piece」 | 통합 -18.8 LUFS, LRA 8.0 LU(미리보기 -19.9 LUFS, LRA 5.8), peak -3.4. 대역 RMS: 저역 -22.1 / 중음역 -26.3 / 고역 -34.0 → 중음역이 저역보다 4.2 dB 낮음. 구조(5초 RMS 전체 / 중음역): 0~20s -18~-19 / -24.5, 20~65s -21~-25 / -28~-30(얇아짐), 65~85s -18 / -24.5, 85~105s -28 / -30(가장 얇음), 105~150s -18~-19 | 영상 0~72s에 0~72s를 그대로 대응: 0~20s 소개~점화 시작(찬 밀도), 20~65s 상승·체험·요금(얇은 구간, 내레이션이 가장 많은 구간에 가장 비어 있음), 65~72s 밀도 복귀(마무리). 또는 20s 뒤에서 시작해 고도 구간에 밀도를 맞출 수 있음(이 경우 편집 필요) | 마디 단위로 밀도가 오르내려 「쉬지 않는 내레이션」 밑에서 구간별 여백이 생기는 장점이 있으나, LRA 8.0이 요청의 「음량 기복 작음」과 충돌 — 20s·65s·85s 전환에서 5~6 dB 변화. 미리보기 구간에서 기복 5.8 LU. 믹스 시 전환 부분이 내레이션 문장 중간에 걸리지 않도록 컷 위치 확인 필요. 요청 조건 충족도는 R2-1·R2-2보다 낮아 대안 |

## 확인 범위
- 확인함: 3곡 실제 다운로드(mp3 유효, ffprobe 길이·채널), EBU R128 통합 LUFS·LRA·peak, 대역별(<300Hz, 300~3kHz, >3kHz) 평균 RMS, 5초 단위 전체/중음역 RMS 시계열, 모노 포락선 자기상관으로 BPM 확인(카탈로그와 일치), 미리보기 3개 생성.
- 확인 못함(이 환경은 청취 불가): 실제 음색·취향 적합성, 보컬/보컬 샘플 유무(카탈로그 악기 목록에 보컬 없음만 근거), 내레이션 믹스 시 마스킹, 크레딧 곡별 정식 문구, 곡 끝 루프 이음새.
- 대역 RMS는 ffmpeg 고역/저역 필터(완전한 벽 아님)에서 읽은 평균값이라 상대 비교용이다.

## 기각 후보 (`external_assets/audio/bgm/_rejected/`, 모두 Incompetech CC BY 4.0, 다운로드 후 측정)
- Journey_To_Ascend.mp3 (219.4s, 116bpm 탐 드럼): LRA 1.8로 평탄하나 중음역 -16.1 dB가 저역 -17.6보다 큼 — 탐 드럼이 내레이션 음역을 차지, peak +1.9 dBFS(클리핑 가능).
- Voxel_Revolution.mp3 (129.9s, 122bpm 신스): 중음역 -19.9 dB로 비교적 높고 5초 RMS 기복 -13~-17.5로 큼, peak +1.5 dBFS.
- Deep_Haze.mp3 (122.1s, 120bpm): LRA 7.8, 후반으로 계속 커지는 구조(-22→-16 dB)라 내레이션 밑에서 오르는 음량이 방해. 「Action, Driving」 분류.
- Mesmerizing_Galaxy_Loop.mp3 (93.0s, 124bpm, 루프 제작 곡): LRA 0.8로 매우 평탄하고 길이/루프는 이상적이나 퍼커션이 없어(설명「There is no percussion」) 박이 없는 패드/아르페지오이고, 중음역 -16.8 dB가 저역 -16.5와 같은 수준으로 꽉 차 내레이션과 겹침. 「리드미컬」 조건과 「중음역 비움」 모두 미충족.

## 놓칠 수 있는 선택지
- Incompetech 외 Free Music Archive·ccMixter·Musopen·Pixabay Music은 이번에 탐색하지 않았다(웹페이지 Cloudflare 차단, API 없음). 더 얇은 중음역·유사 비트가 필요하면 그쪽 또는 R2-1을 로우패스/미드 EQ(-3 dB @ 1kHz)로 정리하는 방법이 있다.
- 카탈로그 BPM 없음(None)인 곡(Static Motion, Clean Soul 등)은 BPM 필터에서 빠졌다.
- 모든 후보에서 15~30s 「가장 역동적」 구간에 음악 자체의 상승은 만들기 어렵다. 요청의 「방해하지 않는」 조건과 상충하는 부분이라, 상승이 필요하면 음악보다 점화 효과음(sfx)·컷 리듬으로 처리하는 편이 낫다.
- 끝 크레딧에 음악 줄이 필요함(CC BY 4.0): 곡명 + Kevin MacLeod (incompetech.com) + 라이선스 + URL.
