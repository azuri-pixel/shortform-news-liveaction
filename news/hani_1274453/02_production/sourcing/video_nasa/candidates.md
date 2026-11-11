# hani_1274453 NASA 우리 은하 영상 후보 (editorial-concept)

파일: `_raw/<id>.*` · 시트(노란 틀 = 9:16 중앙 크롭, 각 장에 타임코드): `sheets/<id>.jpg` · 페이지 원문: `_raw/pages/svs_<id>.json|html` · manifest: `assets.json`
라이선스 근거: svs.gsfc.nasa.gov/help "All of our content is in the public domain (unless otherwise noted)". 페이지별 제3자 크레딧 확인 결과를 각 줄에 적었다.

| ref | 역할 | 규격 / 9:16 크롭 | 크레딧(원문) / 라이선스 | 확인 | 쓸 구간 | 할 일·오인 한계 |
|---|---|---|---|---|---|---|
| vn_svs14935_mw_tilt | 1 원반(정면→옆모습), 2 재사용 | 4000x4000 30fps 3.33s(100프레임) 무음 / 9:16 중앙 크롭 2250x4000 → 1080x1920 = x0.48(축소). 옆모습 원반은 크롭 폭보다 넓어 양끝이 잘림 | NASA's Goddard Space Flight Center (Producer/Graphic designer Scott Wiessinger (eMITS), Animator Adriana Manrique Gutierrez (eMITS), Science writer Ashley Balzer (eMITS)) / SVS "public domain (unless otherwise noted)", 페이지에 ESA·스톡·제3자 표기 없음 | 9장 확인 | 0-1.3s 정면 정지(회전 없음), 1.3-3.33s 기울기, 3.15-3.33s 완전 옆모습. 24초를 채우려면 0.15~0.25배 감속 또는 정면 구간 정지 유지 필요 | 상상도(artist's concept). 원반·막대·나선팔만 있고 헤일로는 이 판에 없음(별도 판 참고). 글자·로고 없음 |
| vn_svs14935_stellar_halo | 1 원반+별 헤일로(1순위), 2 재사용 | 2160x2160 29.97fps 8.48s 무음 / 9:16 중앙 크롭 1215x2160 → x0.89(축소). 은하+헤일로 세로 전체가 크롭 안. 옆모습 원반을 크게 보려면 608x1080 크롭 = x1.78 | NASA's Goddard Space Flight Center (Scott Wiessinger (eMITS) Producer/Graphic designer, Adriana Manrique Gutierrez (eMITS) Animator, Ashley Balzer (eMITS) Science writer) / SVS public domain, 페이지 제3자 표기 없음. 같은 페이지 "Labeled" 판은 글자 있음 → Unlabeled 판만 받음 | 9장 확인 | 0-3.3s 정면 원반+둥근 헤일로, 3.3-6.1s 기울기, 6.1-8.48s 옆모습 원반+타원 헤일로(정지에 가까움) | 상상도. 페이지 설명 "stellar halo ... roughly 300,000 light-years across". 헤일로는 개별 별이 아니라 뿌연 갈색 빛무리로 표현. 은하가 화면에서 작음(원반 폭 약 1/4). 글자·로고 없음 |
| vn_svs14935_dm_halo | 보조(헤일로 대비) | 2160x2160 29.97fps 9.01s / x0.89 | 위와 같음 / SVS public domain | 9장 확인 | 0-3.5s 정면, 3.5-5.5s 기울기, 5.5-9s 옆모습 | 보라색 = 암흑물질 헤일로(약 100만 광년). 별 헤일로로 쓰면 오인. 이번 이야기에는 불필요할 가능성 높음 |
| vn_svs20406_mw_zoom | 2 회전(정면), 1 보조 | 3840x2160 30fps 20.0s 무음(페이지 표기 1080 파일명이지만 실제 4K) / 9:16 중앙 크롭 1215x2160 → x0.89 | NASA's Goddard Space Flight Center Conceptual Image Lab (Animators Adriana Manrique Gutierrez (eMITS), Jonathan North (eMITS); Producer Joy Ng (eMITS)) / SVS public domain, 페이지 제3자 표기 없음 | 9장 확인 | 0-8s 정면 은하 천천히 회전+접근(크롭 안에 원반 전체), 8-14s 확대, 14-20s 원반 내부로 진입(별밭) | 상상도. 옆모습 없음. 우리 은하 회전·"안으로 들어간다" 연출용. 글자·로고 없음 |

크롭 미리보기(왼쪽부터): 별 헤일로 t=7.5s 중앙 1215x2160(x0.89) · 같은 장면 810x1440 확대(x1.33) · 기울기 t=3.3s 2250x4000(x0.48) · 줌 t=4s 1215x2160 → `sheets/crop_preview_9x16.jpg`

## 기각·제외
- svs 10687 JWST Science Simulation: Galaxy Collision(1080p/720p, 대등 병합→타원은하): 페이지 "Please give credit for this item to: NASA/Goddard Space Flight Center and the Advanced Visualization Laboratory at the National Center for Supercomputing Applications, B. Robertson, L. Hernquist For usage permission, please contact the Ad[vanced Visualization Laboratory]" → 퍼블릭 도메인 아님(허가 필요). 다운로드 중단·manifest에서 제거. 내용도 작은 은하 흡수가 아님.
- svs 14847 100,000 Computer Simulations Reveal Milky Way's Fate(세로판 1080x1920 있음): 페이지 Video Credits에 "Stock Footage Provided By Pond5/lovemushroom", "ESA" 등 제3자 혼재, 내레이션·음악 포함 완성 영상, 주제가 안드로메다 충돌. 받지 않음.
- svs 14656 Galaxy Collision Simulation (Dome Version): 돔(어안) 형식 1280x720, 설명 없음. 받지 않음.
- svs 11534 Galaxy Formation: 960x540 저해상도. 받지 않음.
- svs 14935 Milky_Way_Pause_Labeled / Stellar_Halo_Pause_Labeled: 화면 글자 있음 → Unlabeled 판만 받음.
- images.nasa.gov video 검색("milky way", "galaxy collision", "andromeda", "stellar stream", "milky way halo"): 은하 외부 애니메이션 없음(목록 `_raw/pages/` 아님 — 검색 결과 0~3건, 관련 없음).

## 미확보
- 역할 3(우리 은하가 작은 은하를 흡수 / 원반 기울어짐 시뮬레이션): NASA 공식(SVS·images.nasa.gov)에서 권리 깨끗한 후보 없음. 기존 video/ 후보표의 v_esa_merger2018(ESA Standard Licence)이 유일한 내용 일치.
