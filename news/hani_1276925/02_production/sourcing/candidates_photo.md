# candidates_photo — hani_1276925 (photo, editorial-concept)

원본 저장: `news/hani_1276925/01_input/05_참고자료/photo/` (MD5SUMS 포함). 이 폴더 매니페스트: `02_production/sourcing/photo/manifest.json`. 공용 정본·RIGHTS.md 미수정.

## 선결 사실
- **img1.webp는 클라리넷 사진이 아니라 침대에서 코 고는 남성과 옆에서 바라보는 여성 사진**(1280x854)이다. 기사 캡션 「Kampus Production/Pexels」가 이 사진에 붙어 있다. 클라리넷 후킹 용도가 아니라 g_snore(실사) 쪽 자료다. Pexels 원본 고해상본은 **미확보**: `.env`의 PEXELS/PIXABAY/UNSPLASH 키 3개가 모두 빈 값(len=0)이고 pexels.com 웹은 403(WebFetch)이다. 사진 ID도 확인 못 했다.
- 스톡 API 키가 없어 g_reed의 Pexels/Pixabay 후보는 검색하지 못했다(Wikimedia Commons만 조회).

## A. 해부도 (g_photo_anatomy) — 형태 기준 + 화면 사용
| ref | 파일 | 규격·세로 크롭 | 라이선스(원문)·URL·크레딧 | 내용·확인 범위 | 용도·한계 |
|---|---|---|---|---|---|
| P1 | wc_Head_lateral_mouth_anatomy.jpg | 1374x1510. 9:16 크롭은 높이 전체 사용 시 폭 약 849px(얼굴·목 쪽 x≈0~850) → 1920 환산 ×1.27, 품질 양호 | **CC BY 2.5** https://creativecommons.org/licenses/by/2.5 · https://commons.wikimedia.org/wiki/File:Head_lateral_mouth_anatomy.jpg · 크레딧 원문 「Patrick J. Lynch, medical illustrator」 | 컬러 시상면 컷어웨이. 눈으로 확인: 비강 아래 경구개, 그 뒤 연구개가 아래로 이어지고 인두·기도 관이 목으로 이어짐. 라벨 없음, 목젖 끝은 뚜렷하지 않음 | **1순위.** 형태 기준이면서 CC BY라 크레딧 표기 시 화면 사용 가능. 일러스트임을 유지(실제 MRI처럼 보이지 않게). 목젖 위치는 별도 보강 필요 |
| P2 | wc_Gray994.png | 600x861 세로형. 9:16 폭 484px → ×2.23(선화라 부드러움) | **Public domain** · https://commons.wikimedia.org/wiki/File:Gray994.png · Henry Vandyke Carter / Henry Gray (1918) Anatomy of the Human Body, Plate 994 「Sagittal section of nose, mouth, pharynx, and larynx.」 | 영어 라벨 직접 확인: Hard palate, Soft palate, Tongue, Nasal part of pharynx, Oral part of pharynx, Epiglottis, Larynx, Trachea. 목젖 라벨 없음 | 위치 참조에 가장 명확. 흑백 선화라 화면에선 옛 해부도 톤. 영어 라벨은 가리거나 한글 재조판 필요 |
| P3 | wc_Pronunciation_organs_diagram.png | 1068x1035 | **CC0** · https://commons.wikimedia.org/wiki/File:Pronunciation_organs_diagram.png · Obsuser (Own work) | 번호 라벨 확인: 5 경구개, 6 연구개, 8 인두, 9 후두 등. 선화 | 번호 라벨이라 한글 재작성이 쉬움. 형태 참조·화면 모두 가능. 세로 크롭은 머리·목 부분 위주 |
| P4 | wc_Illu_pharynx.svg | 1097x722 SVG | **Public domain** · https://commons.wikimedia.org/wiki/File:Illu_pharynx.svg · Original: Arcadian, Vector: Ripounet | **미열람**(SVG 렌더 안 함) | 확인 못 함 |
| P5 | wc_Illu01_head_neck.jpg | 424x430 | **Public domain** · https://commons.wikimedia.org/wiki/File:Illu01_head_neck.jpg · Arcadian (https://training.seer.cancer.gov/head-neck/anatomy/overview.html) | 라벨 Palate만 있고 연구개/경구개 구분 없음 | 해상도·구분 부족 → 형태 참조 이하 |

기각: Mouth Nose Lateral Sagittal.png(CC BY-SA 3.0), Pharynx diagram-fr.svg(CC BY-SA 4.0) — BY-SA 제외(파일 미다운로드).

## B. 논문·보도자료 실제 그림 (g_photo_paper)
| ref | 파일 | 규격 | 라이선스(원문)·URL | 내용 | 용도·한계 |
|---|---|---|---|---|---|
| A0 | (논문 전체) | — | Crossref `license`: https://creativecommons.org/licenses/by/4.0/ (content-version vor, 2026-08-17 시작). OpenAlex `license: cc-by`, Semantic Scholar `openAccessPdf.license: CCBY`. DOI https://doi.org/10.1063/5.0346307 → https://pubs.aip.org/pof/article/38/8/081909/3401306/Computational-analysis-of-palatal-non-apneic | 논문은 **CC BY 4.0**(메타데이터 3곳 일치). 저자 Peng Li, Marco Laudato, Mihai Mihaescu (KTH) | 논문 그림은 크레딧 표기 시 화면에 쓸 수 있다는 것이 메타데이터상 결론. **그러나 pubs.aip.org가 curl 403이라 PDF·그림 원본을 받지 못했고, 개별 그림의 라이선스 문구(제3자 이미지 제외 여부)는 확인하지 못함** |
| A1 | newswise_fig1_full.jpg (hani_published/img2.webp와 같은 710x533 이미지로 보임, MD5는 다름·재인코딩 추정; 400x300 썸네일도 보관) | 710x533 가로. 9:16 크롭은 폭 300px → ×3.6 이상이라 **불가**. 상단 그래프 띠를 가로 풀폭으로 쓰면 ×1.5 | AIP 보도자료 https://publishing.aip.org/?p=13356 (「Making Snoring a Bit More Palatable」, 2026-08-18), Newswise https://www.newswise.com/articles/media-article/852497, 원본 https://publishing.aip.org/wp-content/uploads/2026/08/PR_POF26-AR-08873_fig1.jpg (curl 403, Newswise 복사본으로 확보). 크레딧 원문 「Li et al. (graph), Mussi Katz via flickr, licensed under CC0 (photograph)」 | 눈으로 확인: 곧은 관 안 공기 유선(컬러맵)과 회색 연구개, 녹색 화살표 라벨 "vibrating soft palate". 아래는 입 벌리고 자는 남성 사진을 합성 | 그래프는 F14(곧은 관 단순화 모델)와 일치하는 실제 모델 화면. 그래프 라이선스는 보도자료에 **명시 없음**(CC0는 사진만). 논문 그림과 같다면 A0의 CC BY가 적용될 수 있으나 **미확인** → 사용 전 논문 본문 그림과 대조 필요. 합성 사진 속 남성은 식별 가능한 실제 인물 → 그래프 띠만 크롭 권장 |
| A2 | — | — | — | KTH 보도자료·연구진/캠퍼스 사진, EurekAlert 이미지 | **미확보**: 검색에서 KTH·EurekAlert 페이지를 찾지 못함(결과는 Newswise·News-Medical·기타 2차 기사) |

## C. 클라리넷 리드·마우스피스 (g_reed 사진 대안)
| ref | 파일 | 규격·세로 크롭 | 라이선스·URL·크레딧 | 내용 | 용도·한계 |
|---|---|---|---|---|---|
| R1 | wc_Clar_mouth_reed_lig.jpg | 2800x1911. 9:16 전체 높이 크롭 폭 1075px(우측 x≈1725~2800: 마우스피스 뒷면+리드 포함) → ×1.0. 리드만(우측 x≈2460~2680, y≈140~1320)은 220x1180px 띠라 요소로만 | **CC0** · https://commons.wikimedia.org/wiki/File:Clar_mouth_reed_lig.jpg · User:Gisbert K | 눈으로 확인: 회색 배경에 리가처·마우스피스 윗면/아랫면·리드(「Made in France」 표기)가 따로 놓인 제품 사진 | 리드의 얇은 판 모양을 보여줌. **리드가 마우스피스에 장착된 모습이 아니며** 떨림은 설명 못 함. 리드에 상표 표기 보임 |
| R2 | wc_reed_resin_cc_by.jpg | 932x982 | **CC BY 4.0** · https://commons.wikimedia.org/wiki/File:樹脂製のリードが装着されたクラリネットのマウスピース.jpg · あにやら (Own work) | 설명상 마우스피스에 수지 리드가 리가처로 고정. **미열람** | 장착 모습이 필요할 때 후보. 해상도 낮고 상표 노출 가능, 미확인 |

Pexels/Pixabay 클라리넷 리드·연주 사진: **미검색(API 키 없음)**.

## 못 찾은 것·검색 한계
- 논문 PDF·그림 원본(AIP 403), KTH·EurekAlert 보도자료 이미지, 연구진 사진.
- 컴퓨터 모델 **영상(애니메이션)** 은 발견하지 못함.
- NCI Visuals Online·OpenStax는 직접 조회하지 않음(Commons의 NCI SEER 유래 그림만).
- 목젖이 선명히 표시된 CC0/CC BY 시상면 도해는 미확인.
- 브라우저 UA를 가장한 다운로드는 권한 분류기가 막아 수행하지 않았다.
