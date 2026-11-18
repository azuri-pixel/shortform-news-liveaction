# 영상 후보 — hani_954742 (editorial-concept, P3 video)

작성 2026-11-12, 소싱 담당. 원본: `01_input/05_참고자료/video/` · manifest·SHA-256: `assets.json`, `_search/originals_sha256.txt` · 검색 원자료: `_search/`
미리보기: `preview/mk_<id>_sheet.jpg`(클립당 5장, 5·27·50·73·95% 지점, 장마다 타임코드 표기). 타임코드는 원본 기준(720p 미리보기와 같은 길이).

**라이선스 근거(자산별)**: Mixkit 개별 페이지마다 `Mixkit Stock Video Free License` / `Restricted License` 문자열 수를 셌다(`grep -c`). 아래 채택 후보는 전부 Free 1회·Restricted 0회. Free License: 상업 사용 가능, 표기 불필요(https://mixkit.co/license/#videoFree). 같은 페이지 목록에서도 Restricted 항목이 섞여 있어(OJ 9건, 치아 3건 등) 그 항목은 제외했다.

**Pexels/Pixabay/Unsplash API**: `.env`와 사용자·시스템 환경변수 모두 키 값이 비어 있다(길이 0). API 호출이 401/400. 이번 판은 Mixkit + Wikimedia Commons로 대체했다.

세로 크롭 확대율: 1920x1080 → 608x1080 세로 크롭 → 1080x1920 = ×1.78. 1080x1920 세로 원본 = ×1.0. 2160x3840 세로 원본 = ×0.5(축소, 도구가 1080 무음 정규화본도 만듦: `02_production/external_assets/_normalized/`).

| ref | 파일(원본) | 규격·크롭 | 크레딧·라이선스 근거 | 실제 내용(미리보기 확인) | 활용 구간 | 이야기에서 할 일·오인 한계 |
|---|---|---|---|---|---|---|
| mixkit_5080 | `01_input/05_참고자료/video/mixkit_5080_1080.mp4` | 1920x1080, 20s, 24fps · 세로 크롭 ×1.78(중앙) | Mixkit, Free License 1/Restricted 0 · https://mixkit.co/free-stock-video/texture-of-bubbles-from-a-soda-5080/ | t=1.0 흰 배경에 갈색 음료 줄기가 표면으로 떨어짐 → t=5.4~19.0 잔 안쪽 거품·기포 매크로, 큰 기포가 천천히 움직임 | 0.5~3s 붓기, 5~19s 기포 텍스처 | **soda_pour 1순위 후킹**. 상표·사람 없음. 콜라 종류를 특정하지 못함(갈색 탄산음료 일반) |
| mixkit_5081 | `.../mixkit_5081_1080.mp4` | 1920x1080, 15s · ×1.78(잔 가장자리가 오른쪽, 중앙-좌 크롭) | Mixkit, Free 1/0 · .../top-of-a-glass-with-cola-in-detail-5081/ | 빨간 배경, 얼음 든 잔 위로 갈색 음료를 붓고(t=0.8~7.5) 거품이 잔 가득 솟음(t=10.9~14.2) | 2~12s | soda_pour 2순위. 빨간 배경이 특정 브랜드 색을 연상시킬 수 있음(로고·글자는 없음) |
| mixkit_5098 | `.../mixkit_5098_1080.mp4` | 1920x1080, 15s · ×1.78 | Mixkit, Free 1/0 · .../filling-a-glass-full-of-ice-with-soda-5098/ | 얼음 잔에 붓는 측면 클로즈업 → t=7.5~14.2 거품층이 잔 벽 가득, 아래 짙은 음료층 | 6~15s | soda_pour 대체/연속컷. 상표 없음 |
| mixkit_50522 | `.../mixkit_50522_1080.mp4` | 1920x1080, 19s · ×1.78(원형 잔 일부만 남음) | Mixkit, Free 1/0 · .../pouring-coke-on-a-glass-with-ice-generates-soda-bubbles-50522/ | 위에서 내려다본 원형 잔, 연갈색 거품(t=0.9~5.1) → 거품이 꺼지며 짙은 콜라·얼음(t=9.5~18) | 0~12s | 거품이 "꺼지는" 변화 — 시간 경과 전환 컷 후보. 파일명에 'coke'가 있으나 화면에 상표 없음 |
| mixkit_5096 | `.../mixkit_5096_2160.mp4` | 2160x3840 세로, 15s · ×0.5 | Mixkit, Free 1/0 · .../filling-a-glass-with-soda-from-a-bottle-5096/ | 빨간 배경, 손이 짙은 유리병으로 얼음 잔에 콜라를 부음, 잔이 차오름(t=0.8~14.2). 병에 라벨·글자 안 보임(5장 모두) | 0~15s | soda_pour 세로 원본 / three_drinks의 "콜라" 컷. 손만 나옴 |
| mixkit_5136 | `.../mixkit_5136_1080.mp4` | 1080x1920 세로, 11s · ×1.0 | Mixkit, Free 1/0 · .../serving-tonic-in-a-glass-5136/ | 남색 배경, 투명 탄산(토닉)을 와인잔에 붓는 줄기·기포(t=0.6~5.5). **t≈8.0부터 노란 뚜껑 병 노출** | **0~6.5s만** | three_drinks의 "사이다(투명 탄산)" 대역. 실제는 토닉워터 — 사이다로 지칭하지 말고 "투명 탄산음료" 그림으로만. 8s 이후 병(라벨 확인 불가) 제외 |
| mixkit_3710 | `.../mixkit_3710_1080.mp4` | 1080x1920 세로, 10s · ×1.0 | Mixkit, Free 1/0 · .../lemon-cut-in-half-dipped-in-soda-3710/ | 연두빛 탄산 속 라임(레몬) 단면, 기포가 끊임없이 올라옴(0.5~9.8 거의 고정 구도) | 0~10s | 레몬·라임 탄산 = 사이다 분위기 컷. 음료 종류 증거 아님(분위기) |
| mixkit_10428 | `.../mixkit_10428_2160.mp4` | 2160x3840 세로, 15s · ×0.5 | Mixkit, Free 1/0 · .../serving-juice-in-a-glass-with-some-oranges-on-a-10428/ | 흰 배경, 오렌지 단면 옆 잔에 오렌지주스를 부어 가득 참(t=0.8~14.2). 포장·글자 없음 | 0~12s | three_drinks의 "오렌지주스" 컷. 시판 브랜드 주스와 구분 불가(일반 오렌지주스) |
| mixkit_10373 | `.../mixkit_10373_1080.mp4` | 1920x1080, 11s · ×1.78(입·턱 중심) | Mixkit, Free 1/0 · .../woman-biting-a-chocolate-on-a-yellow-background-10373/ | 노란 배경, 빨간 립스틱 여성 하관(눈 위 화면 밖), 초콜릿 바를 깨물어 치아가 보임(t=0.5~7.9) | 0.3~6s | teeth_mouth **약한 대역**. 앞니 노출은 있으나 음료가 아니라 간식. "입안 조건" 구간에서 오인 위험 — 쓸 경우 짧게, 탄산음료와 연결하지 말 것. 초콜릿 바 포장 글자 없음 |

## 예비(미다운로드, 미리보기만)

| ref | 미리보기 | 내용 | 비고 |
|---|---|---|---|
| mixkit_5083 | `preview/mk_5083_sheet.jpg` | 세로, 빨간 배경 콜라 잔에 얼음이 떨어져 튀김 | Free 1/0. 튀김 동작이 강해 후킹 대체 가능 |
| mixkit_5095 | `preview/mk_5095_sheet.jpg` | 가로, 빨간 배경 얼음 잔에 붓기·거품 | Free 1/0 |
| mixkit_5100 | `preview/mk_5100_sheet.jpg` | 가로, 흰 배경 손이 유리병으로 콜라 붓기 | Free 1/0. 병 모양 확인 필요(라벨은 안 보임) |
| mixkit_5082 | `preview/mk_5082_sheet.jpg` | 가로, 얼음이 콜라 잔으로 떨어짐 | Free 1/0 |

## 기각 (`_rejected/`)

| ref | 사유 |
|---|---|
| Commons `Atomic-Force-Microscopy-Protocol-...-Video1.ogv` (CC BY 4.0, Wu X, Muthuchamy M, Reddy D) | 실물 장비가 아니라 세포막 수용체 힘-거리 곡선 애니메이션. 치아·표면 거칠기와 무관하고 장비 실사도 아님 |
| Commons `Fast-multi-frequency-...-srep11692-s2.ogv` (CC BY 4.0, Cartagena-Rivera A, Wang W, Geahlen R, Raman A) | 살아있는 세포의 AFM 나노역학 지도. **AFM 측정 이미지라 법랑질 결과로 오인될 위험** — facts.md "AFM 측정 이미지 흉내 금지" 취지와 충돌 |
| mixkit_5088 | 여성이 빨간 라벨 병으로 마심 — 병 라벨이 특정 브랜드 연상, 얼굴 노출 |
| mixkit_10372 | 풍선껌 — 치아 보이지 않음, 주제 무관 |
| mixkit_5097 | 병 속 시점 추상 영상 — 무엇인지 읽히지 않음 |
| Commons `Atomic Force Microscope.ogv` (Jubobroff) | CC BY-SA 4.0 — 기본 제외(미다운로드) |
| Mixkit Restricted 항목(OJ 15954·17733·48092·14671·20036·20037·17889·16595·27611·28828·17721·11763, 탄산 30758·14608·20035·24480·14023·47222·16006, 치아 48173·17555·36105) | 개별 페이지가 Restricted License — 무료 다운로드·조건 미확보로 제외 |

## 미확보

- **afm_or_microscope**: 사용 가능한 라이선스의 AFM 장비 실사·캔틸레버 작동 실사 0건. KAIST 공식 영상 미확인(KAIST 유튜브·뉴스룸은 이번 판에서 미조회). Mixkit 현미경 영상은 전부 광학현미경 — AFM 오인 위험으로 미채택.
- **teeth_mouth**: 웃는 치아 클로즈업·치아 모형 Free 항목 없음(해당 항목 48173·17555는 Restricted). 음료 마시는 입(얼굴 비식별) Free 항목 없음.
- **three_drinks 나란히 한 컷**: 세 음료가 함께 있는 영상 없음 → 개별 3컷(5096·5136 or 3710·10428)으로 구성.
