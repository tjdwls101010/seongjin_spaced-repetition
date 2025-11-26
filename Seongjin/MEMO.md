# Add Section-Based Flashcard Feature to Obsidian Spaced Repetition Recall

## Objective
Add a NEW flashcard type that creates cards from user-specified markdown sections.

## Feature Description

Users configure in settings:
- **Front heading**: e.g., `# 📋정리`
- **Back heading**: e.g., `# 💭관련`

Plugin creates ONE card per note:
- **Front**: Content from front heading until next level-1 heading
- **Back**: Content from back heading until next level-1 heading or EOF

## Example

### User Settings
- Front heading: `# 📋정리`
- Back heading: `# 💭관련`

### Markdown Note
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

### Result
ONE flashcard:
- Front: Content from `# 📋정리` section (stops at `# ✏️참고`)
- Back: Content from `# 💭관련` section (until end or next `#`)

## Implementation Requirements

### Settings UI
Add new section in plugin settings:
- Toggle: "Enable section-based cards" (default: OFF)
- Text input: "Front heading" (default: `# 📋정리`)
- Text input: "Back heading" (default: `# 💭관련`)

### Parsing Logic
- Find front heading → extract until next `# ` heading
- Find back heading → extract until next `# ` heading or EOF
- Create card ONLY if BOTH sections exist and have content
- If multiple same headings: use FIRST occurrence

### Integration
- This is a SEPARATE card type - don't modify existing types (::, ==, ?)
- Allow notes to have both section-based cards AND inline cards
- Preserve Korean text, Unicode emoji, Obsidian embeds `![[...]]`

## Critical Rules
1. DO NOT modify existing card parsing logic
2. ADD as new, independent feature
3. Default OFF - user must enable
4. User-configurable headings - don't hardcode

## Development
```bash
pnpm install
pnpm dev
```



---


지금 코드베이스는 obsidian의 spaced-repetition 플러그인에서 더 높은 성능을 가지는 알고리즘은 FSRS를 추가하고, 헤딩섹션으로 플래시카드를 추가할 수 있는 기능을 추가한 플러그인이야.
기존 플러그인의 SM-2알고리즘과 이 플러그인의 FSRS알고리즘을 비교하며 자세한 설명과 헤딩별 섹션 기능 등을 `README.md`에 작성해줘.
`Seongjin/docs_spaced-repetition.xml`을 참조해서 해당 플러그인의 기능도 전체적으로 어떤 기능을 가지는지도 `README.md`에 자세히 작성해줘.
한글 인코딩이 깨지지 않도록 유의하고. 
`Seongjin/2025-11-26-add-section-based-flashcard-feature-to-obsidian.txt`은 이전에 Claude Code와 내가 나눈 대화 기록이야. 필요하면 참조해.