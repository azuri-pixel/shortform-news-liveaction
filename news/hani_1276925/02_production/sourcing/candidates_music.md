# 음악·효과음 후보 (g_music, g_sfx) — hani_1276925

모드 editorial-concept. 원본 보존: `01_input/05_참고자료/music/{bgm,sfx}/` · 미리보기 컷: `02_production/sourcing/music/previews/`
공용 음원 폴더(`npm run music -- list`): **비어 있음 -> 맞는 공용곡 없음**, 외부(incompetech, Freesound via Openverse)로 진행.
**청취 상태: 전 후보 미청취.** 이 환경에는 오디오 재생 수단이 없어 ffprobe/ebur128/대역별 음량·0.5초 RMS 곡선만 측정했다. 분위기는 incompetech 공식 설명·feel 태그에 근거한 것이며 제작자가 직접 들어야 한다.

## A. BGM (incompetech, Kevin MacLeod — CC BY 4.0)
라이선스: 사이트의 "Creative Commons — Free: 무료, 크레딧 필요". 곡별 라이선스 버전 문구는 사이트가 JS 생성이라 확인 못 함(표준 서식은 CC BY 4.0). 크레딧 서식(표준, 사이트 생성 문구 미확인):
`"<곡명>" Kevin MacLeod (incompetech.com) Licensed under Creative Commons: By Attribution 4.0 License http://creativecommons.org/licenses/by/4.0/`
메타 출처: https://incompetech.com/music/royalty-free/pieces.json · 파일: https://incompetech.com/music/royalty-free/mp3-royaltyfree/<곡명>.mp3
측정 음량은 mp3 원본 기준 통합 LUFS, 대역값은 평균 dB(밴드폭이 달라 절대 비교 불가, 저역 대비 중역 비중 참고용).

| 순위 | 곡 / 파일 | 길이 | 악기·태그(공식) | 측정 | 용도·한계 |
|---|---|---|---|---|---|
| 1 | **Teddy Bear Waltz** `bgm/Teddy Bear Waltz.mp3` (ISRC USUAN1700064) | 3:15, 75bpm(6/8) | Flute, Glockenspiel, Clarinet, Cellos, Violas, Basses / Bouncy, Bright, Relaxed | -16.7 LUFS, 10초 RMS -17~-21 dB로 평탄, 저역(-20.8) > 중역(-23.2) -> 내레이션 대역이 상대적으로 비어 있음 | 가볍고 따뜻한 설명 구간 전체 후보. 클라리넷 포함(가점). 평탄해 70초 컷+페이드가 쉬움. 왈츠 리듬이 '중요한 한 가지' 강조 지점에서 변화가 약함. 미청취 |
| 2 | **Enchanted Valley** `bgm/Enchanted Valley.mp3` (USUAN1200093) | 3:10, 117bpm | Celesta, Clarinet, Flute, Alto Flute, Bass Clarinet, Violins, Cellos / Relaxed, Mystical, Humorous; 설명 "Nice light little piece." | -17.6 LUFS, LRA 6.9, 중역(-21.8) 비중 큼, 0~10초 -25 dB로 도입이 작고 이후 -19~-21 | 목관(클라리넷·플루트) 음색이 가장 뚜렷하고 도입이 작아 후킹 직후 진입에 유리. 단 목관 중역이 내레이션과 겹칠 위험 -> 믹스 -18~-22dB 이하 필요. 70초 이후 80s대 -15 dB 부근 큰 구간 있음(쓰지 말 것). 미청취 |
| 3 | **Monkeys Spinning Monkeys** `bgm/Monkeys Spinning Monkeys.mp3` (USUAN1400011) | 2:05, 144bpm | Flutes, Violin, Viola, Cello / Bouncy, Bright, Humorous, Uplifting; "Loopable happy light fluffy piece... pizzicato strings" | -17.3 LUFS, 0~60초 -20~-24 dB로 조용, 70초 이후 -17 dB로 커짐 | 클라리넷 없음. 피치카토 위주라 대사와 충돌이 적고 호기심 톤에 맞음. 내레이션 앞 70초만 쓰면 적합(70초 이후 상승부 배제). 유머가 강해 한계 구간 차분함은 약함. 미청취 |
| 참고 | The Forest and the Trees `bgm/The Forest and the Trees.mp3` (USUAN1100766) | 1:34 | Clarinet, Trombones, Glockenspiel, Flute / Bright, Relaxed; "목관이 엮이며 평온한 탐구" | -17.3 LUFS, LRA 10 | 가장 '클라리넷 위주'지만 94초라 루프 필요, 82초대 -15 dB 상승. 한계~여운 구간용 보조. 미청취 |
| 참고 | Fluffing a Duck `bgm/Fluffing a Duck.mp3` (USUAN1100768) | 1:07 | Tuba, Flute, Trombones, Bass Clarinet, Clarinet / Bouncy, Bright, Humorous | -16.3 LUFS | 코미디 스팅 성격, 내레이션 전 구간 BGM으로는 과함. 후킹 첫 5~10초 유머 포인트로만 가능. 미청취 |
| 기각 | Royal Coupling `bgm/Royal Coupling.mp3` | 2:14 | Flutes, Clarinets, 금관/현 / Bright, Calming | -11.9 LUFS, 10초 RMS가 -25에서 -12 dB까지 크레센도 | 크레센도가 강해 내레이션 아래 깔기 부적합. 보존만 |

Pixabay Music: 공식 API가 없고 웹페이지는 Cloudflare 차단이라 **미조사**. Free Music Archive·ccMixter·Musopen 미조사(위 후보로 충족). Openverse 음악(Jamendo `Purpurea` 등 CC BY 클라리넷 곡)은 곡 단위 확인이 안 돼 제외.

감정 매핑 제안(제작자 선택): 후킹 직후~설명은 1번 또는 2번, '중요한 한 가지!'는 BGM 변화 대신 whoosh/무음 컷으로, 한계~CTA는 같은 곡의 후반 페이드아웃. 내레이션이 쉬지 않으므로 BGM 음량은 내레이션 대비 -20 dB 안팎에서 청취 확인 필요.

## B. 효과음 (Freesound, Openverse API 경유, 전부 CC0 1.0)
라이선스 근거: Openverse 응답의 `license: cc0, 1.0`, license_url https://creativecommons.org/publicdomain/zero/1.0/ (각 자산별로 확인). 크레딧 불요이나 원문 작성자·URL은 아래에 보존. **받은 파일은 Freesound 공개 미리듣기 mp3(hq)이며 원본 WAV가 아니다**(원본은 로그인 필요).

### 코골이 (사람, 1~2초 컷 필요)
| ref | 파일 | 작가·제목·URL | 전체 길이 / 측정 | 컷 제안·미리보기 | 한계 |
|---|---|---|---|---|---|
| snore-A | `sfx/snore/snore_750a3fd8_432997.mp3` | mattyharm "Male Snore 1.wav" https://freesound.org/people/mattyharm/sounds/432997 | 33.7s, -26.1 LUFS, 약 5.5초 주기 | **t=4.9~7.0s**(0.5초 RMS -21~-27 dB로 가장 강한 호기 구간). `music/previews/snore_A_mattyharm_432997_4.9-7.0s.wav` | 미청취. 호기 직전 흡기 구간 무음에 가까움(-74~-90 dB) -> 컷 시작을 4.9s 이후로. |
| snore-B | `sfx/snore/snore_7b499445_432996.mp3` | mattyharm "Male Snore 2.wav" https://freesound.org/people/mattyharm/sounds/432996 | 27.4s, -24.2 LUFS | **t=4.9~6.9s**(-20 dB로 A보다 큼). `previews/snore_B_mattyharm_432996_4.9-6.9s.wav`; 대안 t=10.9~12.4s | 미청취. 같은 작가라 음색이 비슷함. |
| 예비 | `snore_c1d3d4f7_512982.mp3`(Vital_Sounds "snoring 1.wav" 25.9s, -33 LUFS, 조용), `snore_420233fe_500803.mp3`(khenshom "Light snores of a man sleeping" 35s, -38 LUFS, 약함 -> 게인 업 필요) | https://freesound.org/people/Vital_Sounds/sounds/512982 · https://freesound.org/people/khenshom/sounds/500803 | | 미분석(구간 미선정) | 미청취 |

### 클라리넷 단음 (1~2초)
| ref | 파일 | 작가·제목·URL | 길이 / 측정 | 컷·미리보기 | 한계 |
|---|---|---|---|---|---|
| cl-A | `sfx/clarinet/clarinet_0c7d5cee_257481.mp3` | yano1 "overall quality of single note - clarinet - C4" https://freesound.org/people/yano1/sounds/257481 | 4.17s mono, -14.7 LUFS, peak -6.9 dB | t=0~1.8s + 0.4초 페이드아웃. `previews/clarinet_A_yano1_C4_0-1.8s.wav` | 미청취. 실제로 C4 저음역(중저음)이라 코골이 90Hz와 음높이 직접 비교는 아님 -> '소리 비유'용. |
| cl-B | `sfx/clarinet/clarinet_e4038dc2_427501.mp3` | camel7695 "Clarinet Bb (long)" https://freesound.org/people/camel7695/sounds/427501 | 12.2s, -19.2 LUFS | t=0~2.0s + 페이드. `previews/clarinet_B_camel7695_Bb_0-2.0s.wav` | 미청취. 12초 지속음이라 첫 2초만 사용. |
| 예비 | `clarinet_069e0572_373017.mp3` sgossner staccato 0.67s(짧은 스타카토, 단음 느낌은 약함), `clarinet_98df655f_257968.mp3` masaki0515 C4 3.9s(-20.6 LUFS, peak -15.8로 작음) | https://freesound.org/people/sgossner/sounds/373017 · https://freesound.org/people/masaki0515/sounds/257968 | | | 미청취 |

### 부드러운 공기/whoosh
| ref | 파일 | 작가·제목·URL | 길이 / 측정 | 한계 |
|---|---|---|---|---|
| wh-A | `sfx/whoosh/whoosh_7843f159_60002.mp3` | qubodup "Swoosh 15 Windy" https://freesound.org/people/qubodup/sounds/60002 | 0.42s, peak -1.1 dB | 짧음(0.4초). 제목상 바람 계열이나 미청취 |
| wh-B | `sfx/whoosh/whoosh_1fbddd97_60027.mp3` | qubodup "Slow Swosh 40" https://freesound.org/people/qubodup/sounds/60027 | 0.53s | 미청취 |
| wh-C | `sfx/whoosh/whoosh_34ba7605_427823.mp3` | Kinoton "Whoosh #1" https://freesound.org/people/Kinoton/sounds/427823 | 0.8s, -19.4 LUFS | 미청취 |
| wh-D | `sfx/whoosh/whoosh_96814a80_423798.mp3` | ch_ase "Little Whoosh 3" https://freesound.org/people/ch_ase/sounds/423798 | 2.47s, -39.7 LUFS(작음, 약 +15~20 dB 게인 필요) | 길고 부드러운 쪽일 수 있으나 미청취 |

## 한계·미확인
- 모든 후보 미청취. 정서·음색·'드르렁' 질감은 제작자가 들어 최종 확인해야 한다. 믹스는 이후 audio.json에서.
- 효과음은 Pixabay SFX가 아니라 Freesound(CC0)로 충족했다(Pixabay SFX는 웹페이지만 있고 Cloudflare 차단). 요청의 "Pixabay SFX, freesound CC0만" 범위 안.
- Freesound 파일은 미리듣기 mp3라 원본 WAV보다 음질이 낮다. 1~2초 효과음 용도에는 보통 충분하나 필요하면 Freesound 로그인 후 원본이 필요(미수행).
- 연구개 진동 90Hz를 소리로 보여 주는 용도는 별도 합성음/코골이 저역 필터로 만들어야 하며 이번에 소싱하지 않았다.
- incompetech 크레딧 서식은 표준 서식이며 사이트 생성 문구는 확인하지 못했다. 최종 크레딧은 제작 시 incompetech 사이트 생성 문구로 대조 권장.
