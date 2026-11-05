# candidates_video.md — hani_1246017 (editorial-concept, kind=video)

원본: `01_input/05_참고자료/video/` (SHA256 전체: `02_production/sourcing/video/sha256.txt`, manifest: `02_production/sourcing/video/manifest.json`)
컨택트시트(클립당 6장 균등 추출, 6x1 또는 3x2 행 우선): `02_production/sourcing/video/sheets/<원본 파일명>.jpg`, 장면 시각은 `sheets/index.txt`의 frames_at
크롭 미리보기: `02_production/sourcing/video/preview/`

## 수집 경로와 한계
- Pexels·Pixabay 웹페이지·다운로드 페이지 403, API 키 없음(.env 값 비어 있음). 웹 검색(Pexels 도메인 한정)으로 ID를 찾고, **Pexels ID가 약 2천만대 이하인 것만 CDN 직링크(`videos.pexels.com/video-files/<id>/<id>-<품질>_<w>_<h>_<fps>fps.mp4`)가 열려 실제 다운로드**했다. 2900만대 이후 신규 ID는 CDN 파일명을 알 수 없어 다운로드 불가. Pixabay는 다운로드 0건.
- Wikimedia Commons는 API가 열려 있어 CC0/CC BY만 선별.
- **Pexels 페이지가 403이라 자산별 라이선스 문구·작가명 원문을 직접 확인하지 못했다.** 'Free to use'와 작가명은 검색 스니펫 기준이며 원문 확정은 페이지 확인 필요(미확인).

## g_hook_towers (evidence)

| 건물 | ref | 파일 | 규격·크롭 | 크레딧·라이선스 근거 | 실제 내용(눈으로 확인) | 활용 구간 | 할 일·오인 한계 |
|---|---|---|---|---|---|---|---|
| 부르즈칼리파 | V-BK1 (1순위) | `video/pexels_18647269-hd_1080_1920_25fps.mp4` (https://videos.pexels.com/video-files/18647269/18647269-hd_1080_1920_25fps.mp4 / 페이지 https://www.pexels.com/video/burj-khalifa-evening-view-18647269/) | 1080x1920 세로 원본, 13.5s, 25fps, 크롭 불필요 x1.0 | Pexels License(스니펫상 Free). 작가명 미확인 | 해질녘 두바이몰 앞 도로에서 야자수 사이로 올려다본 부르즈칼리파 하단~중단. Dubai Mall 간판·차량 보임. 6장 모두 같은 탑(3단 셋백) | t=0~10s | 저각이라 높이감 전달. 탑 상단은 프레임 위에서 잘려 스파이어는 안 보임 |
| 부르즈칼리파 | V-BK2 | `video/pexels_5058333-uhd_2160_3840_25fps.mp4` (https://videos.pexels.com/video-files/5058333/5058333-uhd_2160_3840_25fps.mp4 / https://www.pexels.com/video/beautiful-light-show-of-burj-khalifa-5058333/) | 2160x3840 세로, 22.4s, 25fps, 크롭 불필요, 1080x1920 환산 x0.5 | Pexels License(스니펫상 Free), 작가 스니펫 'Max Avans'(원문 미확인) | 야간 LED 라이트쇼가 투사된 부르즈칼리파 상부 60%, 스파이어 끝까지 프레임 안 | t=3.7~11s 형태가 가장 선명(7.5s 가장 밝음), 11s 이후는 선 패턴이 형태를 덮음 | 가장 극적인 후킹 컷. 라이트쇼 연출이라 평소 모습으로 오인될 수 있음(연출·분위기 컷) |
| 부르즈칼리파 | V-BK3 (보조) | `video/pexels_20242130-hd_1080_1920_25fps.mp4` | 1080x1920 세로, 7.9s | Pexels License(스니펫상 Free), 작가 미확인 | 석양 시가지 멀리 스카이라인 가운데 부르즈칼리파 스파이어만 솟음 | t=0~7.9s | 주변 대비 압도적 높이를 보여주는 맥락 컷. 건물 디테일은 약함 |
| 메르데카118 | — | **미확보** | — | — | 받은 KL 영상 3건(`pexels_18293320`, `pexels_15186706`, `pexels_12704618`)은 KL타워·페트로나스·익스체인지106 위주로 메르데카118이 프레임에서 식별되지 않아 기각(태그에만 Merdeka 118) | — | 다운로드 불가 후보: Pexels 29682647(Hāyca, 1080x1920 42s 세로, 태그 Merdeka 118) https://www.pexels.com/video/skyscraper-towering-over-city-skyline-29682647/ 제작자가 페이지를 열 수 있으면 식별 후 1순위. 사진은 photo 담당 범위(https://www.pexels.com/photo/close-up-of-the-merdeka-118-14361318/ , https://www.pexels.com/photo/megatall-skyscraper-warisan-merdeka-tower-27118631/) |
| 상하이타워 | V-SH1 (1순위) | `video/commons_Shanghai_Bund,_Lujiazui_Skyline_Timelapse.webm` (https://upload.wikimedia.org/wikipedia/commons/9/91/Shanghai_Bund%2C_Lujiazui_Skyline_Timelapse.webm / https://commons.wikimedia.org/wiki/File:Shanghai_Bund,_Lujiazui_Skyline_Timelapse.webm) | 1920x1080 가로, 36.7s, ~30fps. 세로 크롭 `crop=607:1080:963:0` → 1080x1920 **x1.78**(소프트하나 2.5 이내). 미리보기 `preview/shanghai_bund_t30_crop.jpg`, `preview/shanghai_bund_t30_full.jpg` | **CC0**, 작가 Yigang Yu, 출처 https://www.flickr.com/photos/133693764@N05/19938038713/ (Commons 메타데이터에서 CC0 확인) | 번드에서 본 푸둥 타임랩스(흐림→황혼→야경). 오리엔탈펄·진마오·SWFC와 함께 **구름 속으로 솟는 상하이타워**(중앙의 어두운 비틀린 타워) 식별 확인(t=30s 크롭 미리보기) | t=18~36s(야경, 타워가 또렷) | 상하이타워 식별 가능. 야간이라 타워는 어둡고 상부는 구름에 가림 |
| 상하이타워 | V-SH2 | `video/commons_Timelapse_de_nuit_de_la_vue_du_quartier_de_Lujiazui.webm` | 1920x1080, 8.1s, 30fps, 크롭 x1.78 | **CC0**, 작가 Tomtoom03 | 루지아주이 레이저쇼 야경 타임랩스, 오른쪽 가장 높은 타워가 상하이타워로 보임(시트 기준, 확대 확인 안 함) | 전체 8s | 식별이 약해 2순위 |
| 상하이(보조) | V-SH3 | `video/commons_Shanghai_night_-_July_2019.ogv` | 1920x1080, 31s | **CC BY 4.0**, 작가 Nesnad(Own work) → 크레딧 'Nesnad, CC BY 4.0' | 번드에서 본 푸둥 야경, 안개로 상층부가 가림 | — | 상하이타워 식별이 약해 비추천 |

## g_city (evidence)

| 대상 | ref | 파일 | 규격·크롭 | 크레딧·라이선스 근거 | 실제 내용 | 활용 구간 | 할 일·오인 한계 |
|---|---|---|---|---|---|---|---|
| 선전 스카이라인 | — | **미확보** | — | — | Pexels 영상 검색 페이지 403, 웹 검색은 선전 사진만 노출(photo 담당 참고: https://www.pexels.com/photo/drone-shot-of-shenzhen-city-in-china-20828139/ ). Pixabay Shenzhen 영상은 3건뿐이고 내용 미확인(https://pixabay.com/videos/search/shenzhen/). Commons 선전 영상은 폭우 길거리뿐 | — | **기각**: Pexels 3121138(선전처럼 보이나 인천 송도 센트럴파크·동북아무역타워로 보임), Commons Heavy rain in Shenzhen 2건(길거리, 스카이라인 없음). 대체 금지 조건 준수 → 선전 영상은 미확보로 반환. 사진(photo 담당)·도해 병행 필요 |
| 뉴욕 미드타운 | V-NY1 (1순위) | `video/pexels_5828437-uhd_2160_3840_24fps.mp4` (https://videos.pexels.com/video-files/5828437/5828437-uhd_2160_3840_24fps.mp4 / https://www.pexels.com/video/city-skyscrapers-5828437/) | 2160x3840 세로, 10.0s, 24fps, x0.5. 미리보기 `preview/nyc_empire_t5.jpg` | Pexels License(스니펫상 Free), 작가 'Charles Parker'(스니펫, 원문 미확인) | 황혼 미드타운 고층 숲, 엠파이어스테이트 빌딩 중심, 원월드트레이드가 먼 배경 | t=0~10s(거의 정지) | 미드타운 규모감. 270 Park Ave가 아님, 뉴욕 맥락용 |
| 뉴욕 미드타운 | V-NY2 | `video/pexels_5827634-uhd_2160_3840_24fps.mp4` (https://www.pexels.com/video/high-view-of-manhattan-5827634/) | 2160x3840 세로, 11.0s | Pexels License(스니펫상 Free), 작가 미확인 | 원 밴더빌트(스텝형 상층+첨탑, 그랜드센트럴 옆 이스트 미드타운)와 평탄한 맨해튼 | t=0~11s | 270 Park Ave와 같은 이스트 미드타운 권역(약 5블록 북)이나 270 Park는 아님. 다른 건물로 명명 금지 |
| 270 Park 부근 | V-NY3 | **미다운로드(용량)** Commons "Aerial views of Midtown Manhattan, New York City, USA.webm" https://commons.wikimedia.org/wiki/File:Aerial_views_of_Midtown_Manhattan,_New_York_City,_USA.webm (703MB, 3840x2160, 396s), "…Chrysler Building, 42nd Street, One Vanderbilt, … Grand Central Station … skyline.webm"(499s), "…Park Avenue, Union Square, Downtown … Manhattan….webm"(1.7GB, 820s) | 4K 가로 → 세로 크롭 1215x2160(x0.89, 업스케일 없음) | **CC BY 3.0**, 작가 'the Dronalist'(원 출처 YouTube, Commons 메타) → 사용 시 크레딧 필요 | 미드타운 드론 4K. 원격 샘플 8프레임(t=20~300s)은 타임스스퀘어·6번가 협곡·락펠러 인근·옥상 수직샷이고 **270 Park는 확인 못함**. Chrysler/Grand Central 파일이 가능성 가장 높음(미스캔) | 미확정 | 270 Park 식별에는 전체 스캔이 필요. 필요하면 후속 요청 |
| 뉴욕(보조) | — | `video/pexels_12122308-uhd_3840_2160_24fps.mp4` | 3840x2160 24fps 6.5s | Pexels(스니펫상 Free) | 허드슨야드·웨스트사이드 석양 항공 | — | 서쪽 미드타운, 270 Park와 무관 |

## g_construction (tone)

| ref | 파일 | 규격·크롭 | 크레딧·라이선스 근거 | 실제 내용 | 활용 구간 | 할 일·한계 |
|---|---|---|---|---|---|---|
| V-CN1 | `video/pexels_7168640-uhd_3840_2160_25fps.mp4` (https://videos.pexels.com/video-files/7168640/7168640-uhd_3840_2160_25fps.mp4 / https://www.pexels.com/video/cranes-on-top-of-a-skyscraper-7168640/) | 3840x2160 25fps 19.2s, 세로 크롭 1215x2160(x0.89), 건물이 프레임 우측이라 오른쪽으로 크롭 이동 필요 | Pexels(스니펫상 Free), 작가 'Tima Miroshnichenko'(스니펫, 원문 미확인) | 두바이 고층 건설 중, 상단에 크레인 | t=0~19s(거의 정지) | '계속 올라가는 중' 진행감 1순위. 특정 건물로 소개 금지 |
| V-CN2 | `video/pexels_14054979-uhd_3840_2160_25fps.mp4` (https://www.pexels.com/video/tower-cranes-next-to-a-high-rise-building-14054979/) | 3840x2160 25fps 25.4s | Pexels(스니펫상 Free), 작가 'utopia 36' | 크레인 옆 고층 아파트 골조(20층 내외, 초고층 아님), 드론 선회 | t=0~25s | 일반 맥락용. 높이감 약함 |
| V-CN3 | `video/pexels_14054964-uhd_3840_2160_25fps.mp4` | 3840x2160 15.2s | Pexels(스니펫상 Free) | 건설 중 아파트와 붉은 타워크레인 | t=0~15s | 초고층 아님 |

기각/미사용: `pexels_14134289`(아파트 건설 드론, 중복), `pexels_19479036`(65s, 저층 건설 타임랩스·역광), `pexels_3689303`(시트만 생성, 미판독). 신규 ID 후보(다운로드 불가): https://www.pexels.com/video/urban-highrise-construction-with-crane-timelapse-32020153/ (세로 4K 16s 타임랩스, 제작자가 페이지를 열 수 있으면 우선 검토).

## g_energy (tone)

| ref | 파일 | 규격·크롭 | 크레딧·라이선스 근거 | 실제 내용 | 활용 구간 | 할 일·한계 |
|---|---|---|---|---|---|---|
| V-EN1 | `video/pexels_3051316-hd_1920_1080_24fps.mp4` (https://www.pexels.com/video/view-of-buildings-in-the-city-at-night-3051316/) | 1920x1080 24fps 8.0s, 세로 크롭 x1.78 | Pexels(스니펫상 Free), 작가 미확인 | 야간 고층 오피스(꼭대기 LED, 켜진 사무실 층) | t=0~8s(거의 정지) | '밤에도 켜진 초고층' 에너지 정서. LA로 보이나(스니펫 태그) 도시 단정 금지 |
| V-EN2 (분위기만) | `video/pexels_9441990-uhd_2160_3840_24fps.mp4` | 2160x3840 24fps 15s | Pexels(스니펫상 Free) | 도쿄 스카이트리(전파탑, 건물 아님) 야경 색 변화 | 전체 | 빌딩 에너지 소비의 증거로는 부적합 |

기각: `pexels_11335925`(어두운 해안 야경, 건물이 거의 안 보임), `pexels_12719795`(애틀랜타 시가지로 보임, 용도 없음).
엘리베이터·공조·유리 외벽 클로즈업은 **미확보**(Pexels 신규 ID·Pixabay 접근 불가). 다운로드 못한 후보: Pexels 857254(저각 유리 고층, 스니펫상 CC0·작가 Kelly Lacy, CDN 파일명이 달라 직링크 실패, https://www.pexels.com/video/low-angle-shot-of-a-skyscraper-857254/), 8268976, 3038486.

## 반환 사항
1. 메르데카118·선전 영상은 미확보(식별 불가·접근 불가). 구체 ID를 위에 남겼다. 대안은 사진(photo 담당)+도해, 또는 제작자가 직접 받은 파일 지정.
2. Pexels 자산별 라이선스·작가명 원문은 미확인. 크레딧 표기 전에 페이지에서 한 번 확인이 필요하다.
3. 270 Park Ave 실물 영상은 미확보. Dronalist CC BY 3.0 4K 드론 영상이 가장 유력하나 스캔·다운로드 전이다.
4. 영상 판독은 클립당 6장 시트 기준(3689303 제외). 모바일 실재생은 미검수.
