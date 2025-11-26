# Obsidian Spaced Repetition (개선 버전)

Obsidian에서 간격 반복 학습(Spaced Repetition)을 통해 플래시카드와 노트를 복습하여 망각 곡선에 대항하는 플러그인입니다.

이 버전은 원본 [obsidian-spaced-repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition) 플러그인을 기반으로 하며, **FSRS 알고리즘 지원**과 **섹션 기반 플래시카드 기능**을 추가했습니다.

## 주요 개선 사항

### 🎯 FSRS 알고리즘 지원

**FSRS(Free Spaced Repetition Scheduler)**는 최신 간격 반복 알고리즘으로, 기존 SM-2 알고리즘보다 더 정확한 복습 스케줄링을 제공합니다.

- **ts-fsrs 라이브러리 기반**: 검증된 FSRS 구현 사용
- **유연한 파라미터 조정**: Request Retention, Maximum Interval, w 파라미터 등 세부 조정 가능
- **학습 로그 기록**: 복습 데이터를 CSV 파일로 저장하여 학습 패턴 분석 가능
- **알고리즘 간 전환 가능**: Anki(SM-2), FSRS, SM-2, Default 알고리즘 간 자유로운 전환

### 📑 섹션 기반 플래시카드

사용자가 지정한 헤딩을 기준으로 노트의 특정 섹션을 플래시카드로 자동 생성합니다.

**사용 예시:**

```markdown
# 📋정리

갈등은 둘 이상의 주체 간 힘의 차이가 비등할 때 발생한다.
세대 간 갈등은 저성장과 인구소멸 현상으로 인해 심화되고 있다.

# ✏️참고

- ![[some link]]

# 💭관련

1. ![[link 1]]
   - 설명 1
2. ![[link 2]]
   - 설명 2
```

위 노트에서 **`# 📋정리`** 섹션을 카드의 앞면으로, **`# 💭관련`** 섹션을 카드의 뒷면으로 자동 생성합니다.

**특징:**
- 헤딩을 포함한 전체 섹션 내용 추출
- Level-1 헤딩(#)까지 자동 감지
- 서브 헤딩(##, ### 등)은 섹션에 포함
- 한글, 이모지, Obsidian 링크 완벽 지원
- 기존 인라인 카드와 공존 가능

## 알고리즘 비교

### SM-2 (Anki 기반)

**개요:**
- SuperMemo SM-2 알고리즘의 Anki 변형
- 가장 널리 사용되는 간격 반복 알고리즘

**작동 방식:**
- **Ease Factor**: 각 카드의 난이도 계수 (기본값 2.5)
- **Interval 계산**: 이전 간격 × Ease Factor
- **평가 옵션**: Again, Hard, Good, Easy
- **Ease 조정**:
  - Again: Ease -0.2, 간격 × 0.5
  - Hard: Ease -0.15, 간격 × 1.2
  - Good: Ease 유지, 간격 × Ease
  - Easy: Ease +0.15, 간격 × Ease × 1.3

**장점:**
- 단순하고 직관적
- 오랜 검증 기간
- 적은 초기 복습 횟수

**단점:**
- 개인별 학습 패턴 미반영
- 고정된 난이도 조정 로직
- Ease Hell 문제 (반복 실패 시 Ease가 지나치게 낮아짐)

### FSRS (Free Spaced Repetition Scheduler)

**개요:**
- 최신 머신러닝 기반 간격 반복 알고리즘
- 대규모 학습 데이터를 기반으로 최적화

**작동 방식:**
- **Stability & Difficulty**: 두 가지 핵심 파라미터로 카드 상태 관리
- **17개 w 파라미터**: 학습 데이터에 따라 조정 가능한 가중치
- **Request Retention**: 목표 기억 유지율 설정 (기본값 0.9 = 90%)
- **Fuzzing**: 같은 날 복습되는 카드를 분산
- **Short-term Scheduler**: 단기 학습 최적화

**장점:**
- 더 정확한 예측: 개인 학습 패턴 반영
- 최적화된 복습 간격: 불필요한 복습 감소
- 유연한 파라미터: 학습 목표에 맞게 조정
- 지속적인 개선: 활발한 연구 및 업데이트

**단점:**
- 초기 설정 복잡도 (기본값 사용 가능)
- SM-2 대비 이해 난이도

### 알고리즘 선택 가이드

| 상황 | 추천 알고리즘 |
|------|--------------|
| 간단하게 시작하고 싶은 경우 | SM-2 (Anki) |
| 최적의 학습 효율을 원하는 경우 | **FSRS** |
| 기존 Anki 데이터를 가져오는 경우 | SM-2 (Anki) → 나중에 FSRS로 전환 가능 |
| 장기 학습 프로젝트 | **FSRS** |

> 💡 **추천**: FSRS는 기본 설정만으로도 SM-2보다 우수한 성능을 제공합니다. 특별한 이유가 없다면 FSRS 사용을 권장합니다.

## 주요 기능

### 📇 플래시카드 종류

1. **Single-line Basic**
   ```markdown
   질문::답변
   ```

2. **Single-line Bidirectional**
   ```markdown
   앞면:::뒷면
   ```
   (양방향 카드 2개 생성)

3. **Multi-line Basic**
   ```markdown
   여러 줄로 된
   질문
   ?
   여러 줄로 된
   답변
   ```

4. **Multi-line Bidirectional**
   ```markdown
   여러 줄 앞면
   ??
   여러 줄 뒷면
   ```

5. **Cloze Cards (빈칸 채우기)**
   ```markdown
   대한민국의 수도는 ==서울==이다.
   ```

6. **섹션 기반 카드** (신규 기능!)
   - 설정에서 Front/Back 헤딩 지정
   - 노트 전체를 하나의 플래시카드로 활용

### 📚 덱(Deck) 구성

**태그 기반:**
```markdown
#flashcards/역사/한국사
질문1::답변1
질문2::답변2
```

**폴더 기반:**
- 폴더 구조가 자동으로 덱 계층 구조로 변환
- 예: `과목/세부주제/세부세부주제` → `Deck/sub-deck/sub-sub-deck`

### 📊 통계 및 시각화

- **Forecast**: 향후 복습 카드 수 예측
- **Intervals**: 복습 간격 분포
- **Eases**: 카드 난이도 분포
- **Card Types**: New, Young, Mature 카드 분포

### 📝 노트 복습

플래시카드뿐만 아니라 **전체 노트**도 간격 반복 학습에 포함할 수 있습니다.

```markdown
---
tags: [#review]
---

# 노트 제목

노트 내용...
```

- Easy, Good, Hard 평가로 다음 복습 일정 자동 조정
- 노트 리뷰 큐에서 복습 일정 확인
- 증분 쓰기(Incremental Writing)에 유용

### 🎨 UI 커스터마이징

- **모달/탭 모드**: 복습 화면을 모달 또는 새 탭으로 표시
- **카드 크기 조절**: 높이/너비 비율 설정
- **컨텍스트 표시**: 카드가 속한 헤딩 계층 표시/숨김
- **키보드 단축키**:
  - Space/Enter: 답변 보기
  - 0: 카드 초기화
  - 1: Hard
  - 2: Good
  - 3: Easy

## 설치 방법

### Obsidian 커뮤니티 플러그인 (원본)

1. Obsidian 설정 → 커뮤니티 플러그인 → 탐색
2. "Spaced Repetition" 검색
3. 설치 및 활성화

### 수동 설치 (이 개선 버전)

1. 이 저장소를 클론하거나 다운로드
2. `pnpm install && pnpm build` 실행
3. `build/main.js`, `manifest.json`, `styles.css`를 Obsidian vault의 `.obsidian/plugins/obsidian-spaced-repetition/` 폴더에 복사
4. Obsidian 재시작 및 플러그인 활성화

## 사용 방법

### 1. 기본 플래시카드 생성

```markdown
#flashcards

서울의 인구는?::약 1000만 명
부산의 인구는?::약 350만 명

대한민국의 수도는 ==서울==이다.
```

### 2. 섹션 기반 플래시카드 설정

1. **설정 → Spaced Repetition → Flashcards → Section-Based Cards**
2. "Enable section-based cards" 활성화
3. Front heading 설정 (예: `# 📋정리`)
4. Back heading 설정 (예: `# 💭관련`)

### 3. 노트 작성

```markdown
#flashcards

# 📋정리

핵심 개념 정리 내용...

## 세부 사항 1
내용...

## 세부 사항 2
내용...

# 💭관련

- ![[관련 노트 1]]
- ![[관련 노트 2]]
```

### 4. 복습 시작

- 왼쪽 리본의 플래시카드 아이콘 클릭
- 또는 명령어 팔레트에서 "Spaced Repetition: Review flashcards" 실행
- 덱 선택 후 복습 시작

### 5. FSRS 알고리즘 활성화

1. **설정 → Spaced Repetition → Algorithm**
2. 드롭다운에서 **"Fsrs"** 선택
3. 확인 다이얼로그에서 승인 (데이터 자동 변환)
4. 플러그인 재시작

**FSRS 파라미터 조정 (선택):**
- **Request Retention**: 목표 기억 유지율 (50-100%, 기본값 90%)
- **Maximum Interval**: 최대 복습 간격 (기본값 36500일)
- **w 파라미터**: 고급 사용자용 (기본값 사용 권장)
- **Fuzzing**: 복습 날짜 분산 활성화
- **Short-term Scheduler**: 단기 학습 최적화

## 고급 기능

### Cloze 패턴 커스터마이징

Anki 스타일 빈칸 만들기:

**설정에 추가:**
```
{{[123::]answer[::hint]}}
```

**사용:**
```markdown
브라질 사람들은 {{1::포르투갈어::언어}}를 사용한다.
```

### 빈 줄 포함하기

기본적으로 빈 줄은 카드 종료를 의미하지만, 설정 변경으로 포함 가능:

**설정:**
- "Characters denoting the end of clozes and multiline flashcards"를 `+++`로 변경

**사용:**
```markdown
질문
?

| 항목 | 설명 |
|------|------|
| A    | B    |

+++
```

### 학습 로그 활용 (FSRS)

FSRS 사용 시 복습 데이터가 `ob_revlog.csv`에 자동 저장됩니다.

**로그 필터링:**
- 설정에서 특정 덱만 로그에 포함하도록 설정 가능
- 예: `#flashcards/중요한과목` 만 로깅

**데이터 활용:**
- FSRS Optimizer로 개인 맞춤 w 파라미터 계산 가능
- 학습 패턴 분석 및 시각화

## 참고 자료

### Spaced Repetition 학습법

- [How to Remember Anything Forever-Ish by Nicky Case](https://ncase.me/remember/)
- [20 rules of knowledge formulation](https://supermemo.guru/wiki/20_rules_of_knowledge_formulation)
- [Spaced Repetition for Efficient Learning](https://www.gwern.net/Spaced-repetition/)

### 관련 프로젝트

- [원본 플러그인](https://github.com/st3v3nmw/obsidian-spaced-repetition)
- [FSRS 알고리즘](https://github.com/open-spaced-repetition/fsrs4anki)
- [ts-fsrs 라이브러리](https://github.com/open-spaced-repetition/fsrs.js)

## 지원 언어

플러그인 UI는 다음 언어로 번역되어 있습니다:

- 한국어 (Korean)
- English
- 简体中文 (Chinese Simplified)
- 繁體中文 (Chinese Traditional)
- 日本語 (Japanese)
- Español (Spanish)
- Français (French)
- Deutsch (German)
- Русский (Russian)
- Português do Brasil (Portuguese Brazil)
- 그 외 다수

## 기여

버그 리포트, 기능 제안, 번역 기여를 환영합니다!

원본 플러그인 기여 가이드: [Contributing](https://github.com/st3v3nmw/obsidian-spaced-repetition/blob/master/docs/docs/en/contributing.md)

## 라이선스

MIT License

---

**즐거운 학습 되세요! 📚✨**
