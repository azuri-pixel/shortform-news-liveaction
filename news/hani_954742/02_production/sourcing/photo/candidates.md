# P3 사진 소싱 후보 — hani_954742 (editorial-concept)

작성: 2026-11-12, sourcing(photo). 원본: `01_input/05_참고자료/kaist_press/`, `01_input/05_참고자료/commons/` (SHA-256 → `SHA256SUMS`, manifest → `assets.json`). 미리보기·크롭: `previews/`, 기각: `_rejected/`. 검색 원자료: 스크래치(회신 미첨부).
수치 대조는 source-verify 담당이라 여기서 하지 않았다.

## kaist_figures (evidence)

| ref | 파일 | 규격·크롭 | 크레딧(원문)·라이선스 근거 | 실제 내용(눈으로 확인) | 이야기에서 할 일·한계 |
|---|---|---|---|---|---|
| K2 | kaist_press/kaist_en_9131_Figure_2.jpg | 1600x1103 (한겨레 img2 563px의 약 1.6배 이상, 거칠기+탄성 합본) | 출처 페이지 https://news.kaist.ac.kr/newsen/html/news/?mode=V&mng_no=9131 (KAIST 영문 뉴스, "Figure 2. Changes in surface roughness (top) and modulus of elasticity (bottom)...") · 크레딧 "Professor Seungbum Hong, KAIST" (EurekAlert 620971) · 이용조건: EurekAlert "News organizations may use or redistribute these figures and images, with proper attribution, as part of news coverage of this paper only." / KAIST 사이트 "Copyright (C) 2020, KAIST, All Rights Reserved" — CC 아님 | AFM 높이 이미지 3음료×(As-polished,1,3,5,10분), Rq 그래프(0~10분), 탄성계수 맵(0~5분)·그래프 | 핵심 증거. 크롭: previews/crops/fig2_afm_roughness_grid_915x440.png(폭 맞춤 ×1.18), fig2_afm_row_cocacola_915x150.png, fig2_graph_roughness_630x500.png(폭 맞춤 ×1.71), fig2_graph_modulus_630x460.png, fig2_modulus_maps_915x520.png. AFM 단일 패널은 약 120px → 전폭이면 ×9, 2장 비교(540px씩)도 ×4.5로 흐려짐 → 격자·한 줄 단위 사용이나 그래프 재작도를 권함. 패널 위 음료 상표명(Coca-Cola® 등) 텍스트가 있음 |
| K1 | kaist_press/kaist_en_9131_Figure_1.jpg | 1600x472 | 위와 동일 페이지·조건 (EurekAlert 620972 "Tooth sample preparation process for atomic force microscopy (a, b, c), and an atomic force microscopy probe image (right)." 크레딧 "Professor Seungbum Hong, KAIST") | (a) 어금니 2mm 절단선 (b) 절편 enamel/dentin 화살표 (c) 시료 홀더 / 우측 SEM 탐침 끝, 10µm 눈금, "KAIST 10.0kV ... SE(M)" | 크롭: crops/fig1_sem_probe_622x472.png(폭 맞춤 ×1.74, cover로 1920 높이 채우면 ×4.07 → 위험), crops/fig1_sample_prep_abc_985x472.png. 탐침 SEM은 AFM 장비 영상 대신 쓰기 좋다(SEM으로 찍은 AFM 탐침이라고 써야 함). (b)는 실제 시료의 법랑질·상아질 표시라 tooth_structure 보조로도 쓸 수 있다 |
| K2-ko / K1-ko | kaist_press/kaist_ko_9110_image2.jpg (900x619), image1.jpg (800x236) | EN판보다 저해상 | 국문 보도자료 https://news.kaist.ac.kr/news/html/news/?mode=V&mng_no=9110 , 같은 조건 | EN판과 같은 그림, 국문 캡션 "그림 1/2" | 캡션 근거로만 보존. 사용은 EN판 |
| EA | kaist_press/eurekalert_620971_lowres.jpg (1440x992), eurekalert_620972_lowres.jpg (1440x424) | 공개 최대 렌디션(original/high-res는 API 400 "not supported") | 위 Usage Restrictions 원문 그대로 | K2·K1과 같은 그림 | 이용조건 문구의 증빙. 사용은 KAIST EN판 |

논문 원문: DOI 10.1016/j.jmbbm.2020.103930, JMBBM vol.110 (2020-10호), Crossref 라이선스는 Elsevier TDM뿐 → 오픈 액세스 아님, 그림 재사용 권리 없음. arXiv 1909.02419(v1, 2019-09-02 제출)는 arXiv non-exclusive distribution license → CC 아님(재사용 근거 아님). 프리프린트 제목은 "Nanoscale characterization of the impact of beverages on the enamel surface of human teeth"로 출판본과 다름. 고해상 그림 PDF는 받지 않음.

## tooth_structure (explain)

| ref | 파일 | 규격·크롭 | 크레딧(원문)·라이선스 | 실제 내용 | 할 일·한계 |
|---|---|---|---|---|---|
| T1 | commons/Blausen_0863_ToothAnatomy_02.png | 1500x1500 · 1080x1920 cover ×1.28(좌우 잘림), 폭 맞춤 ×0.72 | CC BY 3.0 https://commons.wikimedia.org/wiki/File:Blausen_0863_ToothAnatomy_02.png · Artist 원문: "BruceBlaus. When using this image in external sources it can be cited as: Blausen.com staff (2014). "Medical gallery of Blausen Medical 2014". WikiJournal of Medicine 1 (2). DOI:10.15347/wjm/2014.010. ISSN 2002-4436." | 어금니 단면 일러스트: 법랑질(흰 바깥층)·상아질·치수·잇몸·뼈, 영문 라벨 | 1순위. "법랑질 = 가장 바깥층"이 한눈에 보인다. 영문 라벨은 가리거나 한글 라벨을 덧씌워야 하며, 이때 CC BY 변경 표시가 필요하다. 개념도이고 연구 시료는 아니다 |
| T2 | commons/Tooth_Section_numbered.svg (미리보기 previews/tooth_section_numbered_1280.png) | 벡터라 확대 무손실 | Public domain · Artist: Jak · Credit 원문: "Made language-neutral by Jak from Image:Tooth Section.svg by User:Asbestos." | 번호식 단면(1 Enamel, 2 Dentine, 3 Pulp, 4 Gum, 5 Cementum, 6 Bone, 7 Blood vessel, 8 Nerve, 9 Crown, 10 Root), 글자 없음 | 2순위·코드 도해 바탕. 단순한 평면 그림체에 테두리가 있어 색·크롭 손질을 전제로 쓴다 |
| T3 | commons/What_is_Inside_Human_Tooth_Macro-Anatomy.jpg (미리보기 previews/inside_tooth_ahmed_1000.jpg) | 1608x1259 · cover ×1.53 | CC BY 4.0 https://commons.wikimedia.org/wiki/File:What_is_Inside_Human_Tooth_(Macro-Anatomy).jpg · Artist: Mohamed A.M. Ahmed · Credit: Own work | 실제 사람 어금니 종단면 두 쪽(검은 배경). 바깥 반투명 법랑질 캡과 상아질이 보인다 | 실사 대안. 단, 교합면에 충치(갈색·검은 병소)가 있어 avoid 목록의 "충치 혐오"에 걸릴 수 있고, 하단 워터마크 "DR.MAXSTEIN / MOHAMED A.M. AHMED"는 크롭해야 한다. 정상 치아 증거로 쓰면 안 된다 |

## 기각 (_rejected/)

- nmhm_cp2335_900.jpg — Section of tooth (CP 2335), NMHM, CC BY 2.0: 괴혈병 잇몸 염증 현미경 사진이다. 법랑질이 표시돼 있지 않고 질환 이미지다.
- aletaibi_molar_sections_1280.png — Khalid Aletaibi, CC BY 4.0: 치과 시술용 치수 도해로 영문 텍스트가 많고 이야기 목적에 맞지 않는다.
- fig1_sample_prep_abc_1050x472_bad_edge.png — 크롭 오른쪽에 SEM 가장자리가 섞여서 985px로 다시 잘랐다.
- 제외(받지 않음): Commons "Cross sections of teeth labels.png", "Basic anatomy tooth.jpg", "Crosssectiontooth11-24-05.jpg", "EnamelLayer04-11-07.jpg" — 모두 CC BY-SA 3.0. 한겨레 img4 — 네이버 지식백과(권리 불명).
