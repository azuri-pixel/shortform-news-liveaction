# fact-check 원문 회신 — hani_1246017 r3 (P5 재검수, 좁은 델타)

대상: out/pilots/hani_1246017/qa/production-54570e70-091f-4954-84eb-2aac83ae28cd.mp4 (sha256 ed2add570f75017a96ec9200899bb9df184b30547badebec7356735f318a6d0c 직접 계산·일치, receipt 6bb8913d)
packet: out/pilots/hani_1246017/review/r3/packet (claims_changed=false, changed_media=[std_v], 변경 [2321,2479])
근거: reviews/r2/fact-check-raw.md, decisions.md 「P5 r2 검수 응답」(44~50행), RIGHTS.md, primary-sources.md, CREDITS.md(편·packet), visual-system.json(media.assets[11] std_v, generation_jobs g_std_facade), prompts/std_facade.txt, facts.md s13. attribution@4.
판정: N1 해결(적합). N3·N4 해결. 새 기록 결함 1건(N5, 비차단). 좁은 범위라 전체 사실 대조는 r2 승계, 미확인 범위 아래.

## 확인 방식
- sheets 18·19 시청(2231~2600 정지 표본).
- orig/ 원본 f02336(std 정착)·f02472(std 끝, 틸트 최상단) 확대.
- 기록: visual-system std_v·g_std_facade 연결, 프롬프트 파일, 생성 원본 존재, RIGHTS·primary-sources·CREDITS 해당 행.
- MP4 sha256 직접 계산.

## rechecks (r2 이슈)
| r2 | 판정 | 근거 |
|---|---|---|
| N1 | 해결(규칙 5·1 적합) | 2326~2473 컷이 메르데카118(다각형 크라운·첨탑·곤돌라)이 아니라 이름 없는 유리 커튼월 근접 틸트로 바뀜. 화면에 크라운·첨탑·스카이라인·로고·지명이 없음(f02336·f02472). 원고·자막 어디서도 이 건물을 부르지 않으므로 s13 「지적」이 특정 실존 건물을 향하지 않음. facts s13 「지적(의견)이지 시행된 규제 아님」과 화면 사이 충돌 없음(수치·규제 표기 없음). 관측 증거 오인: 측정값·기관 표기·자료 형식이 없는 분위기 컷이라 관측 결과로 제시되지 않음 |
| N1 생성물 기록 | 연결 확인 | std_v.generation_job=g_std_facade, attribution_kind=generated → job(seedance_2_5, job_id 68098e60…, status accepted), prompt_path·output 파일 실재. 프롬프트 「generic, fictional … No recognizable real building」. CREDITS.md에 「seedance_2_5 가상 초고층 외벽 영상(실존 건물 아님)」 |
| N2 | 해결(r2 응답 수용) | RIGHTS Envato 추가 행에 sh_rise(E5LQTW8GC7). 화면 영향 없음 |
| N3 | 해결 | RIGHTS 「Envato 추가」 행: sh_rise·con5(인증서 미첨부, 사용자 원문 근거로 사용). 「Envato 미사용」 행: modern-glass-skyscraper(JM9DREQ78U) 결론 컷 제외로 이동, con5 파일이 미사용 행에서 빠짐 |
| N4 | 해결 | primary-sources.md 16행 처리 칸 「화면은 「JP모건 본사」만(원고 밖 수치 423m 미표기)」 = 렌더(r2 f00545) |

## fact_ranges (이번에 실제 확인)
| 구간(프레임) | 줄 | 결과 |
|---|---|---|
| 2231–2331 | s12 | 「m²당 에너지」「건축비·유지비 ↑」「1m²」×3 유지, r2와 같음 |
| 2326–2473 | s13 | 생성 유리 외벽 틸트 + 자막 「그래서 훨씬 엄격한」. 이름·수치·규제 표기 없음 |
| 2472–2600 | s14·끝 | 페트로나스 CTA(「여러분은 어떻게」「댓글로 의견 남겨주세요.」) → 끝 크레딧: 참조 기사·CVU·Commons CC0(Tomtoom03, Omarnizar05)·Envato Elements. @4이므로 Higgsfield 미표기는 맞음 |

## 결함·관찰
- N5 (기록, 비차단): RIGHTS.md에 생성 영상 std_v(Higgsfield seedance_2_5) 행이 없음. 생성 행은 「생성 이미지 energy_tower」 하나뿐. CREDITS·visual-system에는 있으므로 화면 영향 없음. RIGHTS에 energy_tower와 같은 형식으로 한 행 추가.
- 관찰(비차단, 규칙 5 경계): 가운데 면이 위로 좁아지고 양옆 면이 비스듬히 넓어지는 삼각 분할 외벽 형태가 원월드트레이드센터의 외벽 기하와 닮음(f02472에서 가장 뚜렷). decisions 45행이 크라운 닮음을 인지하고 0~4초로 자른 것은 확인. 남은 근접 외벽만으로는 이름 붙은 건물로 읽힐 근거가 약하고 영상 안에서 뉴욕·그 건물을 가리키는 요소가 없어 사실 결함으로 보지 않음. shot-judge 식별성 판단과 함께 볼 것.
- 관찰(기록): packet snapshot std_v 해시 2c6332…, public/pilots/hani_1246017/editorial/std.mp4 c678dc…, 생성 원본 98a8d7…가 서로 다름. 해시 계산 기준(트림·정규화 등)을 확인하지 못함. 화면 프레임은 새 생성 컷이 맞음.
- F4 잔여(기록, r2부터): 편 CREDITS.md 「JPMorganChase — Photo: Nigel Young, …」가 지정 표기 원문 「Photo credit: Nigel Young, courtesy of Foster + Partners」와 다름. 화면 컷 출처는 r2에서 원문 일치 확인. 설명란용 문구 정정 권고.

## 미확인
- 음성 내용(transcript not-provided). s13 내레이션·자막 일치 청취 안 함.
- sheets 01~17(변경 구간 밖). claims_changed=false·length_changed=false라 r2 fact_ranges 승계 여부는 review-loop 계약 판단. r2 미확인 범위(sheets 04·07·16·17 r2 미시청, mobile/, 연속 재생, 개수 픽셀 계수)는 그대로 남음.
- 2326~2473 사이 표본 외 프레임(2337~2471)과 연속 재생. 생성 클립 4초 안에서 크라운이 보이는지 프레임 사이 확인 안 함(f02472 최상단에 크라운 없음).
- std_v 해시 연결(위 관찰).

r3: 변경 구간의 사실 대조 적합. N1·N3·N4 해결. 남은 것은 비차단 기록(N5·F4 잔여)과 미확인 범위. 전체 종결은 위 미확인 범위의 승계 판정에 달려 있으므로 이 회신만으로 종결을 선언하지 않음(incomplete).
