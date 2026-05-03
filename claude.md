# claude.md — 복지매칭 작업 규칙 & 인수인계 노트

> 본 문서는 Claude(또는 다른 협업 에이전트/사람)가 이 저장소에서 작업할 때 따르는 **운영
> 규칙**과, 지금까지 마주친 **버그·gotcha 로그**입니다. 새 채팅 세션이 시작되면
> **`spec.md` → `claude.md` 순서로 읽고** 작업을 이어 받습니다.
>
> 마지막 업데이트: 2026-05-02

---

## 0. 새 세션 시작 시 체크리스트

1. `spec.md` 정독 — 현행 사양과 로드맵 파악
2. `claude.md`(이 파일) 의 §11 버그 로그 정독 — 동일 실수 반복 방지
3. `git status` · `git log -5` 로 진행 상황 확인
4. `pnpm install` (lockfile 변경 시) → `pnpm typecheck` → `pnpm build` 가 깨끗한지 확인
5. 작업 시작 전 TodoWrite 로 계획 수립

## 1. 브랜치·커밋·푸시 규칙

- **개발 브랜치**: `claude/welfare-benefits-agent-RyIee` 고정. 다른 브랜치로 푸시 금지.
- 모든 변경은 **NEW 커밋**. amend·force-push·`reset --hard` 금지(사용자 명시 요청 시 제외).
- 커밋 메시지: 한국어/영어 혼용 가능, **WHY 중심 1~2문장 + 필요시 본문**. 공식 형식:
  ```
  <type>: <짧은 요약>

  <본문 — 변경 이유와 핵심 결정 사항>

  https://claude.ai/code/session_<id>
  ```
- 푸시: `git push -u origin claude/welfare-benefits-agent-RyIee`. 네트워크 오류 시 2/4/8/16초
  지수 백오프로 4회까지 재시도.
- **PR 자동 생성 금지**. 사용자가 명시적으로 요청할 때만 `mcp__github__create_pull_request` 사용.

## 2. 파일 구조 불변성 (변경 시 spec.md §9.2 동기화)

- `src/app/` — 페이지·API. 라우트 추가는 신중히(앱인토스 번들 영향).
- `src/lib/llm/` — 공급자 추상화. **새 공급자 추가 시 `LlmProvider` 인터페이스 준수**.
- `src/lib/prompts/system.ko.ts` — 단일 출처. 화이트리스트는 `src/lib/tools/webSearch.ts`
  와 동기화.
- `src/lib/toss/` — 앱인토스 어댑터. **클라이언트 전용**(`"use client"` 또는 브라우저 전용 함수).
  서버 코드에서 import 금지.
- `src/data/programs/central/*.md` — 시드 KB. frontmatter 필드는 `KbProgram` 타입(`loader.ts`)
  와 정합 유지.

## 3. 코드 스타일

- 주석은 **WHY** 만. 코드가 자명한 경우 작성하지 않는다(불필요한 docstring 금지).
- 이모지 사용 금지(사용자가 명시 요청 시만).
- 한국어 사용자 메시지·UI 문구는 **존댓말** 통일.
- 기능 플래그·하위 호환 shim 금지(미사용 코드는 삭제).
- TypeScript `strict: true`. `any` 회피. 외부 SDK 타입이 빈약하면 `as unknown as <T>` 로
  좁히되 §11 에 기록.
- Tailwind 클래스 정렬 자유, CSS-in-JS 미사용. 커스텀 토큰은 `var(--brand)` 등 CSS variable.

## 4. KB 큐레이션 규칙

각 `.md` 파일 작성 시:

1. frontmatter 필수: `slug`, `name`, `ministry`, `category`, `officialUrl`, `year`, `lastVerified`.
2. 출처는 **공식 도메인만** (`spec.md` §7.1 참조). 블로그·뉴스 인용 금지.
3. 금액·자격·신청기간은 **연도 명시** + 「연도별 상이」 안내. 단정 금지.
4. `staleAfter` 는 보통 `lastVerified + 6개월`. 분기 점검 시 갱신.
5. 본문은 1~2문단. 자세한 절차는 `officialUrl` 로 위임.

## 5. LLM 공급자 어댑터 규칙

- 새 공급자 추가는 `src/lib/llm/<name>.ts` 에 `LlmProvider` 구현 + `index.ts` factory 등록.
- 모든 공급자 호출 결과는 **공통 `StreamEvent`** 로 정규화: `text_delta` / `tool_use` /
  `citation` / `done` / `error`.
- web_search 도구 도메인 화이트리스트는 **공급자별 네이티브 옵션**으로 전달(Anthropic
  `allowed_domains`, OpenAI Responses `web_search_preview` filter 등).
- prompt caching 은 `SystemBlock.cache: true` 로 표시. Anthropic 은 `cache_control: ephemeral`,
  OpenAI 는 자동 prefix caching, Gemini 는 Implicit caching 매핑.
- **claude-api 스킬**(이 환경에서 제공)을 LLM 코드 수정 시 활용 권장. 트리거 조건:
  `@anthropic-ai/sdk` import, prompt caching/tool use/streaming 변경, 모델 ID 교체 등.

## 6. 시스템 프롬프트 변경 시 점검 사항

`src/lib/prompts/system.ko.ts` 수정 시 반드시:

1. 화이트리스트 변경 → `ALLOWED_DOMAINS` 동기화 → `WEB_SEARCH_ALLOWED_DOMAINS` 동일성 확인
2. 면책 문구 변경 → `disclaimer.ts` 의 `DISCLAIMER_TEXT` 와 일치 확인
3. 출력 형식 변경 → `spec.md` §5 갱신
4. 페르소나 시나리오 (spec §14.1) 로 회귀 점검

## 7. PII / 동의 규칙

- `consent.disclaimer = true` 가 false/missing 이면 API 가 400 으로 거부해야 한다.
  (현재 Zod 스키마가 `z.literal(true)` 로 강제)
- `consent.storeAnonymizedLog === false` 이면 **응답 본문·프로필을 DB·외부 로그에 절대
  기록하지 않는다.** stdout 운영 메트릭만 허용.
- opt-in 시에도 `maskProfile()` + `maskFreeText()` 통과 후 저장. 원본 저장 금지.
- 30일 TTL 폐기 작업은 Phase 2 에 별도 cron/SQL 로 구현.

## 8. 앱인토스 호환 체크리스트 (커밋 전)

- [ ] 새 의존성 추가 시 번들 영향 확인 (`pnpm analyze`)
- [ ] `src/lib/toss/*` 외 코드에서 토스 SDK 직접 호출 금지
- [ ] 외부 링크는 `openExternal()` 경유 (또는 `<a target="_blank">` 만 사용)
- [ ] 디자인 토큰은 CSS variable 기반. 하드코딩 색상 지양
- [ ] localStorage 사용 금지(앱인토스 일부 환경 비활성). sessionStorage + try/catch 사용

## 9. 커밋 전 검증 명령

```bash
pnpm typecheck   # tsc --noEmit
pnpm build       # 라우트 사이즈 확인 (≤ 200KB First Load JS)
# 선택
pnpm analyze     # ANALYZE=true next build
```

타입체크 실패·빌드 실패 시 **커밋 금지**. 원인 수정 후 재시도.

## 10. 사용 가능한 스킬·도구 메모

| 스킬·도구 | 용도 | 트리거 |
|---|---|---|
| `claude-api` | Anthropic SDK·prompt caching·tool use 변경 | LLM 코드 수정 시 |
| `simplify` | 변경된 코드 품질·중복 검토 | 큰 변경 후 |
| `review` | PR 리뷰 (사용자 요청 시) | PR 생성 후 |
| `security-review` | 변경분 보안 검토 | 입력 검증·인증·DB 코드 변경 후 |
| `mcp__github__*` | PR/이슈/CI (기본 disabled, 명시 요청 시만 활성) | 사용자 명시 요청 |

---

## 11. 버그 & gotcha 로그

> 형식: `[YYYY-MM-DD] 카테고리 — 증상 → 원인 → 해결/방지`

### [2026-05-02] 환경 — PDF 텍스트 추출 실패

- **증상**: `Read` 툴이 PDF 를 읽으려 하면 `pdftoppm is not installed` 오류.
  `pip install pypdf` / `pdfminer.six` 도 cryptography 모듈 충돌로 실패.
- **원인**: 컨테이너 기본 이미지에 poppler-utils 미설치, Python `cryptography` 가
  깨진 상태로 설치됨(`_cffi_backend` import 실패).
- **해결**: `apt-get install -y poppler-utils` 로 `pdftotext` 확보 후 `pdftotext -layout`
  로 직접 추출. Python PDF 라이브러리는 사용하지 않음.
- **재발 방지**: PDF 분석이 필요하면 즉시 `pdftotext` 경로로 진행. Python 우회 시도 금지.

### [2026-05-02] git — 빈 저장소에서 `git branch` 출력 없음

- **증상**: 첫 커밋 전 `git -C welfare branch` 결과가 비어 있어 현재 브랜치 확인 불가.
- **원인**: 커밋이 0개일 때 git 은 브랜치 목록을 표시하지 않음(HEAD 가 미실현된 ref).
- **해결**: `git symbolic-ref HEAD` 로 현재 가리키는 ref 확인 (`refs/heads/<branch>`).
- **재발 방지**: 빈 저장소에서 브랜치 확인은 `git symbolic-ref HEAD` 사용.

### [2026-05-02] LLM SDK — Anthropic 스트림 이벤트 형식 약형 타입

- **증상**: `@anthropic-ai/sdk` 의 `messages.stream()` 이벤트 타입을 정확히 좁히기 어려움.
- **원인**: SDK 의 이벤트 union 이 도구 호출·인용·다양한 delta 형식을 포함해 복잡.
- **현재 처리**: `as unknown as <대략적 shape>` 로 좁히고 필요한 필드만 추출
  (`src/lib/llm/anthropic.ts`).
- **잠재 위험**: SDK 버전 업 시 `delta.type === "citations_delta"` 등 식별자 변경 가능.
- **재발 방지**:
  - 버전 업 후 첫 호출 시 콘솔에 raw 이벤트 로깅하여 형식 검증.
  - claude-api 스킬을 호출해 최신 SDK 패턴 확인 후 패치.
  - 가능하면 SDK 가 노출하는 high-level helper(`stream.on("text", ...)` 등)로 마이그레이션.

### [2026-05-02] LLM 도구 — `web_search_20250305` 식별자 미검증

- **증상**: web_search 도구의 `type: "web_search_20250305"` 식별자는 시스템 프롬프트
  분석만으로 작성. 실제 SDK·API 호환은 미검증.
- **원인**: 1차 스캐폴드 단계에서 실 API 호출 없이 작성.
- **재발 방지**:
  - 첫 실 API 호출 시 도구 형식 오류가 나면 Anthropic 공식 문서·SDK 의 도구 정의로 교체.
  - 호출 직전 claude-api 스킬을 invoke 하여 현재 권장 도구 식별자 확인.

### [2026-05-02] Next.js — `next-env.d.ts` 자동 갱신

- **증상**: `pnpm build` 시 `next-env.d.ts` 가 자동 수정됨(`reference path` 추가).
- **원인**: Next.js 15 의 typed routes 가 빌드 중 참조 경로 삽입.
- **재발 방지**: 변경분 그대로 커밋. **수동 편집 금지** (파일 상단에 명시된 NOTE 준수).

### [2026-05-02] App-in-Toss — sessionStorage 가용성 가정

- **증상**: 앱인토스 일부 WebView 환경에서 sessionStorage 가 비활성/제한될 가능성.
- **현재 처리**: `WelfareForm` 의 `sessionStorage.setItem` 호출을 `try/catch` 로 감쌈.
- **잠재 위험**: 폼 제출 후 `/chat` 에서 `welfare:profile` 키를 못 읽으면 즉시 `/` 로 redirect
  되어 무한 루프 위험.
- **재발 방지**:
  - Phase 2 게시 전, sessionStorage 미가용 시 폼 → 결과 페이지 직접 전환(URL 쿼리 또는
    React state lift)으로 폴백 추가.
  - 실제 토스 앱 WebView 에서 동작 검증 필수.

### [2026-05-02] 시드 KB — `lastVerified` 자리값

- **증상**: 22개 시드 KB 모두 `lastVerified: 2025-12-15` / `staleAfter: 2026-06-30` 자리값.
  실제 검증 일자가 아님.
- **원인**: 1차 스캐폴드에서 메타데이터 형태만 채움.
- **재발 방지**:
  - 첫 운영 전 각 사업의 공식 사이트를 1회씩 점검하고 `lastVerified` 를 실제 점검 일자로
    갱신.
  - 매 분기마다 `pnpm kb:audit` 같은 점검 스크립트(미작성, 추후 추가) 또는 수동 점검.

### [2026-05-02] 디자인 — Pretendard 폰트 self-host 미적용

- **증상**: `globals.css` 에서 Pretendard 를 시스템 폰트 폴백으로만 사용. 실제 self-host
  파일은 번들에 없음.
- **원인**: 1차 스캐폴드에서 외부 CDN 의존을 피하기 위해 폰트 파일을 추가하지 않음.
- **재발 방지**:
  - 폰트 적용이 시각적 차이를 만든다고 판단되면 `next/font/local` 로 woff2 self-host.
    번들 사이즈 영향 측정 필요(앱인토스 50MB 제약).
  - 또는 토스 디자인 시스템 폰트(Toss Product Sans)로 전환(Phase 2).

---

## 12. 결정 로그 (선택지가 있었던 결정)

### LLM 공급자 — Anthropic 1차

- 후보: Anthropic Claude / OpenAI / Gemini
- 결정: 1차 Anthropic. 이유: web_search 네이티브 도구·prompt caching·한국어 품질·SDK 안정성.
- 재평가 트리거: 비용 데이터 수집 후, 또는 Gemini 의 grounding 품질이 한국 정부 사이트에서
  유의미하게 향상된 경우.

### 데이터 소싱 — 하이브리드 (시드 KB + 실시간 검색)

- 후보: (A) 100% 정적 KB / (B) 100% 실시간 검색 / (C) 하이브리드
- 결정: (C). 이유: 중앙 핵심 사업은 변동 적어 KB 효율적, 광역/기초는 종류 많고 갱신 잦아
  실시간 검색이 정확.

### 개인정보 — opt-in 비식별 로깅만

- 후보: (A) 비저장 / (B) 항상 저장 / (C) opt-in
- 결정: (C). 이유: 사용자 신뢰·개선 데이터 둘 다 필요. 동의 없는 저장 절대 금지.

### 배포 채널 — Phase 1 Vercel 단독

- 후보: (A) 처음부터 앱인토스 / (B) Vercel 먼저 / (C) 동시 출시
- 결정: (B). 이유: 앱인토스 심사 4~6주 + 디자인 가이드 적용 부담. 웹에서 검증 후 Phase 2.
- Phase 2 트리거: 사용자 만족도 검증 + 트래픽 확보 시도.

### UI 라이브러리 — Tailwind + 자체 컴포넌트

- 후보: shadcn/ui 풀 도입 / Tailwind + 자체 / TDS 직접
- 결정: 현재는 Tailwind + 미니멀 자체 컴포넌트. shadcn/ui 풀 도입 시 번들 부담.
  앱인토스 게시 시 TDS 어댑터(`theme.tds.ts`)로 swap.

---

## 13. 미해결 과제 (TODO)

- [ ] 자동 테스트(Vitest) 작성: `tests/{pii,kb-loader,smoke}.test.ts`
- [ ] 페르소나 3건 실 API 호출 회귀 테스트
- [ ] KB `lastVerified` 1차 실제 검증 후 갱신
- [ ] sessionStorage 미가용 폴백 (앱인토스 대비)
- [ ] Vercel Postgres 마이그레이션 SQL + opt-in 로그 INSERT 실 구현
- [ ] 30일 TTL 폐기 cron (Phase 2)
- [ ] 폰트 self-host 결정 + 번들 영향 측정
- [ ] `tests/` 디렉터리 vitest 설정(`vitest.config.ts`)
- [ ] `pnpm kb:audit` 점검 스크립트 (각 KB 의 `staleAfter` 추적)

---
