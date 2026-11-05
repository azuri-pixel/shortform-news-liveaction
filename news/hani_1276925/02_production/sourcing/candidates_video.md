# candidates_video — hani_1276925 (editorial-concept, 담당: video)

원본 폴더: `news/hani_1276925/01_input/05_참고자료/video/` (원본 그대로, 파생 사본 없음)
미리보기(컨택트시트, 장마다 t= 타임코드 표기): `news/hani_1276925/02_production/sourcing/video/_preview/`
검색 원자료: `news/hani_1276925/02_production/sourcing/video/_raw/` (Mixkit 카테고리 HTML·항목 HTML; Pexels/Pixabay 응답은 키 없음 오류만 담김)

## 먼저 알릴 것 (접근 한계)
- **PEXELS_API_KEY / PIXABAY_API_KEY / UNSPLASH_ACCESS_KEY 가 `.env` 에 빈 값**이고 환경변수도 비어 있다. 같은 이유로 Pexels/Pixabay API 조회는 401/400 이었다. 웹페이지는 403(Cloudflare). 우회하지 않았다. **Pexels·Pixabay 후보는 0건 = 미탐색**이다(없다는 뜻이 아님). 키를 채우면 같은 gap으로 재요청 가능.
- 대신 접근 가능했던 **Mixkit(Mixkit Free License: 상업 사용 가능, 크레딧 불요, 단독 재배포 금지)**, **Wikimedia Commons(항목별 라이선스)**, Coverr(목록만, 미다운로드)를 썼다. 사용자 조건의 "사용 근거가 명확한 자료"는 충족하지만 Pexels/Pixabay 한정은 아니다.
- Mixkit 1080 파일은 상세 페이지가 노출하는 720 URL과 같은 규칙의 `assets.mixkit.co/videos/<id>/<id>-1080.mp4` (HTTP 200, 실제 1920x1080 확인). 18023·24862·13129 는 1080 없음(403)이라 720 사용.
- 라이선스 문구는 Mixkit 항목 페이지의 "Free License" 표기로 항목마다 확인(5개 항목 페이지 확인: 43741, 42972, 42974, 42981; 18023·24862·13129 는 항목 페이지 라이선스 문구 grep 0건 → 라이선스 미확인으로 간주). 40226·3207·42976 은 항목 페이지 라이선스 문구를 직접 확인하지 않았다(카테고리 목록 출처만) → 사용 전 확인 필요.

## 후보표

| ref | 파일 | 규격·크롭 | 크레딧(원문)·라이선스 근거 | 실제 내용·확인 범위 | 활용 구간 | 이야기에서 할 일·오인 한계 |
|---|---|---|---|---|---|---|
| **g_snore-1** | `01_input/05_참고자료/video/mixkit_42974-1080.mp4` | 1920x1080, 23.976fps, 19.4s. 세로 1080x1920 크롭 = 높이 기준 ×1.78 (≤2.5). 인물 좌우 이동이 커 크롭 중심 이동 필요 | 제목 "Couple sleeping together angry at each other" — Mixkit (https://mixkit.co/free-stock-video/couple-sleeping-together-angry-at-each-other-42974/). Mixkit Free License(항목 페이지 확인). 작가명 페이지에 별도 표기 없음 | 어두운 침실, 여성이 깨어 눈을 감은 채 이마를 짚고(t≈4.9s) 베개/손으로 귀를 덮는다(t≈8~18s). 남성은 뒤쪽에 누워 있음. **코 고는 소리·남성 입 벌림은 화면에서 확인 불가**. 소리 미청취(무음 가정). 시트: `_preview/mixkit_42974-1080_sheet.jpg` | t≈8~18s | "배우자가 귀를 막는" 장면. 코골이임을 자막/효과음이 보강해야 함. 화면 단독으로는 불면·소음 불만으로도 읽힘 |
| g_snore-2 | `mixkit_42972-1080.mp4` | 1920x1080, 7.5s, ×1.78 | Mixkit "Man and woman sleeping together on their backs" Free License(항목 페이지 확인) https://mixkit.co/free-stock-video/man-and-woman-sleeping-together-on-their-backs-42972/ | 파란 야간조명, 부부가 위에서 보이는 구도로 자는 중. 입 벌림·코골이 동작 없음(t=0.6~6.9s 전 구간 정지에 가까움) | t=0~7s | 코골이의 증거가 아니라 "자는 부부" 맥락 컷. g_sleep_wide 와 겸용 |
| **g_clarinet-1** | `01_input/05_참고자료/video/commons_navyband_clarinet_solo.webm` | **1080x1920 세로 원본**, 23.976fps, 27.0s → 크롭 ×1 | "United States Navy Band", 파일 "8 Days of Day- Clarinet solo featuring Musician 1st Class Arianna Hammond.webm" (Wikimedia Commons, 라이선스 표시 "Public domain" = 미 해군 밴드 제작 연방정부 저작물). 원 출처 YouTube 보관 링크. 원문 확인: Commons imageinfo `LicenseShortName=Public domain` | 군악대 합주 장면. **클라리넷은 t≈18.5~20s(측면, 마우스피스를 입에 문 상태)와 t≈22.5~27s(정면 사선, 입에 문 마우스피스·악기 상단 키 접근)**. 그 앞(0~18s)은 드럼·트럼펫·트롬본·소프라노 색소폰이라 사용 불가. 제복 명찰·소속 휘장이 작게 보임, 자막 글자 없음. 시트: `_preview/commons_navyband_clarinet_solo_sheet.jpg`, `_18-27s_sheet.jpg`. 소리 미청취 | **t≈23~27s 우선**, 18.5~20s 보조 | "클라리넷이 입 안의 마우스피스에서 소리를 시작"이라는 설명에 가장 근접. 리드 자체는 입에 가려 안 보인다 → g_reed 대체 불가. 군악대 제복이라 국가·군 홍보 인상 가능, 크레딧 표기 권장 |
| g_clarinet-2 (주의) | `mixkit_43741-1080.mp4` | 1920x1080, 19.1s, ×1.78 | "Face of a musician playing the flute" — Mixkit https://mixkit.co/free-stock-video/face-of-a-musician-playing-the-flute-43741/ Free License(항목 페이지 확인) | 모자 쓴 재즈 연주자 클로즈업, 입에 문 마우스피스. **프레임(t=8s)상 클라리넷이 아니라 색소폰 넥+마우스피스로 보인다.** 제목은 flute, 본문 설명은 clarinet이라 자체 표기도 불일치 | t=1.6~17.5s | **클라리넷으로 쓰면 오인.** "단일 리드 마우스피스를 입에 문 얼굴"이라는 일반 비유용으로만, 악기 이름 자막 금지 |
| **g_reed** | **없음(미확보)** | — | — | 리드/마우스피스 매크로 영상·고해상 사진 후보 없음. Commons 검색 "clarinet reed"에서는 영상이 Octocontralto clarinet(미확인 라이선스)·chalumeau(CC BY-SA 4.0, 제외)뿐. Pexels/Pixabay 미탐색 | — | g_clarinet-1 t≈24~26s 가 마우스피스 접촉부까지는 보여주나 리드가 보이지는 않음. 사진은 photo 담당 확인 필요 |
| **g_flag-1** | `mixkit_40226-1080.mp4` | **1080x1920 세로 원본**, 24fps, 20.5s → ×1 | "Bright dark orange fabric waving" — Mixkit https://mixkit.co/free-stock-video/bright-dark-orange-fabric-waving-40226/ (카테고리 Fabric/Texture/Background). 라이선스 문구는 상세 페이지 grep 미실시 → **사용 전 Free License 표기 확인 필요** | 갈색~주황 새틴 천이 전 구간 연속으로 물결치는 클로즈업(전체 20s 6장 확인, 대각선 주름이 계속 이동). 깃발이 아니고 3D/촬영 구분 불명, 로고·글자 없음 | 전 구간 어디든(t=1.7~18.8s) | "깃발처럼 계속 떨림"의 연속 파동을 가장 길게 제공. 연구개 단면도와 매치컷하기 좋은 연속 움직임이지만 깃발 형태(깃대·가장자리)는 없음 → "천이 물결치는" 은유로만 |
| g_flag-2 | `mixkit_18023-720.mp4` | 1280x720, 29.97fps, 10.0s. 세로 1080x1920 크롭 ×2.67 (**>2.5, 품질 위험**) | "Racing flag waving" Mixkit https://mixkit.co/free-stock-video/racing-flag-waving-18023/ (태그에 Ferrari 포함). 라이선스 문구 미확인 | 흑백 체커 레이싱 플래그가 전 프레임 가득 펄럭임. 로고 확인 못함(6장 모두 체커만) | t=0.8~9.2s | 깃발 실물이나 레이싱·승리 연상, 해상도 부족. 가로 영상을 세로에 채우면 블러/소프트 위험 → 박스형 배치 사용 시 가능 |
| **g_sleep_wide-1** | `mixkit_42981-1080.mp4` | 1920x1080, 9.6s, ×1.78 (부부가 화면 중앙~상단이라 중앙 크롭 무난) | "Loving couple sleeping together at night" Mixkit https://mixkit.co/free-stock-video/loving-couple-sleeping-together-at-night-42981/ Free License(항목 페이지 확인) | 어두운 침실에서 남성 어깨에 기대 자는 여성, 거의 정지, 숨쉬는 미세 움직임. 6장 전부 동일 구도 | t=0.8~8.8s | 결말 여운. 매우 어두워 밝기 보정 필요, 자막 가독성 유리 |
| g_sleep_wide-2 | `mixkit_42972-1080.mp4` | 위 g_snore-2 | 위 | 위 | t=0~7s | 푸른 야간 톤 대안 |

## 기각·비채택 (파일은 원본 폴더에 보존, 삭제하지 않음)
- `mixkit_24862-720.mp4` (Man sleeping through the day): 낮 시간대 옅은 보라색 침구의 청소년 느낌 남성, 720p ×2.67, 야간·결말 톤 아님.
- `mixkit_3207-1080.mp4` (Couple sleeping): 밝은 베이지 톤 아침 분위기, 어두운 침실 요구와 불일치.
- `mixkit_42976-1080.mp4`, `mixkit_13129-720.mp4` (international flags): 시트 미확인(다운로드만 함). 국기라 기각 예정.
- Commons "Playing a chalumeau demo.webm": CC BY-SA 4.0 → 제외. "Video of NightLase Snore Procedure.ogv": 치료 시술 장면 → 제외. "A domestic dog snoring.ogv", "Pig snoring.ogv": 성인 코골이 아님, 미다운로드.

## 못 찾은 것·한계
1. **g_snore: 코를 고는 성인(입 벌림) 실사는 없음.** 후보는 "귀를 막는 배우자"(42974) 정도. 화면만으로 코골이를 단정할 수 없으니 효과음/자막과 함께 써야 함.
2. **g_reed 미확보.** 리드·마우스피스 매크로 영상은 못 찾았고, 마우스피스가 보이는 가장 가까운 컷이 g_clarinet-1.
3. **Pexels/Pixabay/Unsplash 키 빈 값으로 미탐색.** 예: 검색 엔진이 알려준 Pexels 클립(Antoni Shkraba, "Person Playing Flute" 7580136, 클라리넷 클로즈업 설명)과 Pixabay "Clarinet, Music, Connection"(35940, 1920x1080)은 존재가 확인될 뿐 다운로드·시청하지 않았다 — 후보 아님.
4. 모든 클립 **소리 미청취**, 시트 6장 샘플(영상당 6프레임, 클라리넷은 9프레임)로 판단.
5. g_clarinet-1 은 해군 군악대 영상이라 제복·명찰이 보임. 휘장 로고는 작지만 글자/로고 완전 부재는 아님.
6. 파생 사본 없음(1080p/30fps 초과 원본 없음).
