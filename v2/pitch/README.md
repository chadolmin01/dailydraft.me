# Draft 5분 투자자 발표 자료

이 폴더 안에 발표 한 번에 필요한 모든 자료가 있습니다 — 텍스트, HTML, PDF, PPT.

## 즉시 사용 파일

| 파일 | 용도 |
|------|------|
| **`deck.pdf`** | 발표 직전 공유용 단일 파일. 1280×720 16:9, 10 슬라이드. 누구나 열림. |
| **`deck.pptx`** | Keynote / PowerPoint 에서 편집. 슬라이드별 발표자 노트 자동 포함. |
| `script.md` | 무대 위 대본. 합쇼체, 슬라이드별 시간 안내. |
| `deck.html` | PDF 원본. 직접 브라우저에서 열어 미리보기 가능. |
| `deck.md` | 슬라이드 10장 텍스트 outline. |
| `references.md` | 구성 근거 프레임워크 출처 (Sequoia, YC, Brian Chesky, Guy Kawasaki). |

## 재생성

내용 수정 후 다시 빌드:

```bash
# PDF (Chrome headless 사용, 의존성 0)
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=pitch/deck.pdf --virtual-time-budget=2000 \
  "file:///C:/project/Draft/v2/pitch/deck.html"

# PPT (python-pptx)
python pitch/build-pptx.py
```

세부 컨텐츠는 `deck.html` (PDF 의 단일 진실 소스) 와 `build-pptx.py` 의 NOTES 딕셔너리 각각에서 수정. 두 파일 동시 업데이트 후 빌드.

## 빠른 슬라이드 변환 도구 (대안)

`deck.md` 만 가지고 슬라이드를 새로 만들고 싶을 때:
- [Gamma.app](https://gamma.app) 에 `deck.md` 붙여넣기 → 자동 변환
- [Tome](https://tome.app) 동일

이 경우 디자인 토큰 (배경 cream `#FAF9F5`, 본문 ink `#141413`, 폰트 Pretendard + 함초롬바탕) `v2/design.md` 와 동일하게 맞추어 주십시오.

## 슬라이드로 옮기는 가장 빠른 방법

`deck.md` 의 "화면" 섹션 텍스트를 그대로 Google Slides 나 Keynote 에 옮기면 됩니다.
디자인 토큰 (배경 cream `#FAF9F5`, 본문 ink `#141413`, 폰트 Pretendard Variable)
은 `v2/design.md` 와 동일하게 맞추어 주십시오.

자동 변환을 원하시면 `deck.md` 를 [Gamma.app](https://gamma.app) 이나
[Tome](https://tome.app) 에 그대로 붙여 넣으면 슬라이드 형태로 변환됩니다.
변환 후 시각 일관성 규칙 (deck.md 마지막 섹션) 한 번 더 점검.

## 리허설 가이드

1. **첫 번째 리허설**: `script.md` 그대로 읽으면서 시간 측정. 5분 ±15초 안에 들어와야 함.
2. **두 번째 리허설**: 슬라이드와 함께. 전환 1박자 끊김 연습.
3. **세 번째 리허설**: 청중 1명 앞에서. 끝나고 "기억나는 한 줄" 질문 — 슬라이드 4 의 한 문장이 나와야 성공.

## 데모 영상 (슬라이드 5)

녹화 시나리오:
1. /workspace 진입 — 폴더 카드 보임
2. "FLIP 1기" 폴더 클릭
3. [전체 처리] 버튼 클릭 → 진행률 바
4. [내용 요약] 탭 클릭 → 추출된 항목 카드
5. 좌측 챗에 "다가오는 마감 알려줘" 타이핑 → 답변 받음

총 30초 이내. 빠른 컷, 자막 없이.

## 변경 이력

- 2026-05-22 초안 작성. Sequoia + YC + Chesky 프레임워크 압축.
