# claude.md — 복지매칭 작업 규칙 & 인수인계 노트

> 본 문서는 Claude(또는 다른 협업 에이전트/사람)가 이 저장소에서 작업할 때 따르는 **운영
> 규칙**과, 지금까지 마주친 **버그·gotcha 로그**입니다. 새 채팅 세션이 시작되면
> **`spec.md` → `claude.md` 순서로 읽고** 작업을 이어 받습니다.
>
> 마지막 업데이트: 2026-05-08 (v8: KB 보강 Phase A — 광역시도 30개 사업 추가)

---

## 0. 새 세션 시작 시 체크리스트

1. `spec.md` 정독 — 현행 사양과 로드맵 파악
2. `claude.md`(이 파일) 의 §11 버그 로그 정독 — 동일 실수 반복 방지
3. `git status` · `git log -5` 로 진행 상황 확인
4. `pnpm install` (lockfile 변경 시) → `pnpm typecheck` → `pnpm build` 가 깨끗한지 확인
5. 작업 시작 전 TodoWrite 로 계획 수립

### 사용자 환경 메모

- 사용자는 **iPad** 사용. 로컬 머신 없음.
- 개발은 **GitHub Codespaces**(`.devcontainer/devcontainer.json`)로 진행.
- 시크릿은 GitHub Codespaces secrets (`https://github.com/settings/codespaces`)에 등록되며
  `remoteEnv` 매핑으로 컨테이너에 자동 주입.
- API 키는 절대 `.env.example` 또는 어떤 커밋 파일에도 작성 금지. **`.env.local`(gitignored)
  또는 Codespaces secrets / Vercel Environment Variables 만 사용.**

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
- `src/lib/llm/` — 공급자 추상화. **새 공급자 추가 시 `LlmProvider` 인터페이스 준수** +
  `name` 유니온 타입에 추가 + `index.ts` factory에 케이스 추가.
- `src/lib/prompts/system.ko.ts` — 단일 출처. 화이트리스트는 `src/lib/tools/webSearch.ts`
  와 동기화.
- `src/lib/tools/externalSearch.ts` — Tavily 어댑터. Anthropic 외 공급자(Upstage 등)가
  function tool 로 호출. 도메인 화이트리스트 후처리 필터 포함.
- `src/lib/supabase.ts` — 서버 전용 Supabase 싱글톤(`service_role` 키). 클라이언트 코드에서
  import 금지(번들 누출 위험). `getSupabase()` 가 ENV 둘 다 설정된 경우에만 클라이언트 반환,
  미설정 시 null → logger 가 stdout 모드로 fallback.
- `src/lib/toss/` — 앱인토스 어댑터. **클라이언트 전용**(`"use client"` 또는 브라우저 전용 함수).
  서버 코드에서 import 금지.
- `src/data/programs/central/*.md` — 시드 KB. frontmatter 필드는 `KbProgram` 타입(`loader.ts`)
  와 정합 유지.
- `db/schema.sql` — Supabase 스키마. 변경 시 `src/lib/logger.ts` 의 insert 컬럼명도 동기화.
- `.devcontainer/devcontainer.json` — Codespaces 환경. **`containerEnv` 에 PATH 등 시스템 변수
  덮어쓰기 금지** (호스트 컨텍스트에서 평가되어 깨짐, §11 버그 로그 참조).
- `.github/workflows/ci.yml` — CI. ENV 키 없이도 빌드가 통과해야 함 (런타임에만 키 필요).

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

- 새 공급자 추가는 `src/lib/llm/<name>.ts` 에 `LlmProvider` 구현 + `provider.ts` 의 `name`
  유니온에 추가 + `index.ts` factory 케이스 등록.
- 모든 공급자 호출 결과는 **공통 `StreamEvent`** 로 정규화: `text_delta` / `tool_use` /
  `citation` / `done` / `error`.
- web_search 도구는 두 가지 패턴 지원:
  - **네이티브 도구 패턴** (Anthropic): `allowed_domains` 를 SDK 도구 정의에 직접 전달.
    SDK가 검색 호출·결과 인용을 모두 처리.
  - **에이전트 루프 패턴** (Upstage·OpenAI·Gemini 예정): function tool 로 `web_search` 정의,
    `finish_reason === "tool_calls"` 감지 시 `externalSearch()` (Tavily) 호출 →
    `tool_result` 메시지를 추가해 다음 턴으로 이어감 (최대 5회).
- 도메인 화이트리스트는 두 패턴 모두 적용:
  - 네이티브: SDK 옵션으로 전달
  - 에이전트 루프: Tavily `include_domains` + `externalSearch` 의 `isAllowed()` 후처리 필터
- prompt caching 은 `SystemBlock.cache: true` 로 표시. Anthropic 은 `cache_control: ephemeral`,
  OpenAI 는 자동 prefix caching, Gemini 는 Implicit caching 매핑. Upstage 는 미지원
  (`SystemBlock.cache` 무시).
- Upstage 는 OpenAI 호환 API (`https://api.upstage.ai/v1`) 를 raw fetch + 자체 SSE 파서로 호출
  (의존성 절약 차원). OpenAI SDK 도입 시 `@anthropic-ai/sdk` 와 일관성 유지를 위해 검토 가능.
- **claude-api 스킬**(이 환경에서 제공)을 Anthropic 코드 수정 시 활용 권장. 트리거 조건:
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
  기록하지 않는다.** Supabase `welfare_metric` 테이블 또는 stdout 운영 메트릭만 허용.
- opt-in 시에도 `maskProfile()` + `maskFreeText()` 통과 후 `welfare_consent_log` 에 저장.
  원본 저장 금지.
- 30일 TTL: `recordConsentLog` 가 `expires_at = now + 30일` 컬럼을 채움.
  자동 정리는 Supabase pg_cron(`db/schema.sql` 주석 해제) 또는 외부 스케줄러로 일일 1회
  `delete from welfare_consent_log where expires_at < now()` 실행.
- Supabase RLS: 두 테이블 모두 `enable row level security` 활성, 정책 미정의 →
  anon/authenticated 키는 모두 차단되며 `service_role` 키만 RLS 우회.
- **API 키 노출 방지** (사용자가 GitHub 웹 UI 로 `.env.example` 편집 시 실수로 실제 키 커밋한
  사례 있음 — §11 버그 로그). 코드/문서/플랜파일에 실제 키를 절대 작성 금지. 모든 키는
  Codespaces secrets / Vercel Environment Variables / 로컬 `.env.local` 에만 입력.

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

### [2026-05-03] 보안 — 사용자가 GitHub 웹 UI 로 실제 API 키를 `.env.example` 에 커밋

- **증상**: 사용자가 iPad 에서 `.env.example` 을 GitHub 웹 에디터로 편집하며 실제
  Upstage·Tavily 키를 입력한 뒤 커밋(afa7435, 32e7e57). git history 에 영구 노출.
  Supabase secret 키도 추가하려다 GitHub Secret Scanning 이 차단해서 다행히 미커밋.
- **원인**: `.env.example` 이 템플릿이라는 점, `.env.local` 이 별도 파일이라는 점이 명확히
  전달되지 않음. iPad 환경에서는 `cp .env.example .env.local` 후 편집이라는 표준 흐름이
  비직관적.
- **해결**: `.env.example` 을 플레이스홀더로 되돌리는 커밋(f9c72b7), 노출된 키 사용자가 회전.
- **재발 방지**:
  - 사용자에게 `.env.example` vs `.env.local` 차이를 명확히 안내. 실제 키는 항상
    Codespaces secrets / Vercel ENV / 로컬 `.env.local` 에만 입력.
  - 코드/문서/플랜파일/커밋에 실 키 작성 절대 금지. 채팅에 키가 노출되면 즉시 회전 권고.
  - GitHub Secret Scanning 이 인식하지 못하는 공급자(Upstage, Tavily 등) 키는 더 주의 필요.

### [2026-05-03] Codespaces — devcontainer.json `containerEnv.PATH` 가 `/bin` 을 가림

- **증상**: 첫 Codespace 생성 시 컨테이너가 시작 직후 종료. 로그에 `-: 5: sleep: not found`,
  `Shell server terminated (code: 1)`. GitHub 가 fallback 으로 alpine recovery 컨테이너 생성,
  이후 rebuild 도 `unable to find user node` 로 실패.
- **원인**: devcontainer.json 의 `containerEnv.PATH = "/home/node/.local/share/pnpm:${PATH}"`
  가 호스트 컨텍스트에서 평가되어 `${PATH}` 가 빈 값으로 치환됨. 컨테이너 안에서 PATH 가
  `/home/node/.local/share/pnpm:` (뒤에 `/usr/bin:/bin` 없음)이 되어 `/bin/sleep` 을 못 찾고
  Codespaces agent 가 컨테이너 유지를 위한 `sleep infinity` 호출에 실패.
- **해결**: `containerEnv` 블록 전체 제거(c6d4f90). corepack 가 pnpm 을 자동으로 PATH 에
  추가하므로 별도 설정 불필요.
- **재발 방지**:
  - **devcontainer.json `containerEnv` 에 PATH 등 시스템 변수 절대 덮어쓰기 금지.**
  - 환경 변수 추가는 `remoteEnv` (런타임 PATH 상속) 또는 `postCreateCommand` 에서 `export`
    사용. `containerEnv` 는 호스트가 변수를 평가하므로 위험.
  - 변경 후 첫 Codespace 생성 로그를 끝까지 확인. "Container started" 직후 종료되면 의심.

### [2026-05-03] Codespaces — `corepack enable` 이 EACCES 로 실패

- **증상**: postCreateCommand 의 `corepack enable` 이
  `EACCES: permission denied, symlink ... -> /usr/local/bin/pnpm` 오류로 실패.
  → `pnpm install` 미실행 → 터미널에서 `pnpm dev` 실행 시 `next: not found`.
- **원인**: postCreateCommand 가 `remoteUser: node` 권한으로 실행되는데 `corepack enable` 은
  `/usr/local/bin/` 에 심볼릭 링크를 생성하려 함 → 권한 부족.
- **해결**: `sudo corepack enable && corepack prepare ... && pnpm install` 로 변경(ca06c21).
  Microsoft typescript-node devcontainer 이미지는 `node` 사용자에게 패스워드 없는 sudo 제공.
- **재발 방지**:
  - postCreateCommand 에서 `/usr/local/` 등 시스템 경로에 쓰는 명령은 `sudo` 사용.
  - Microsoft devcontainer 베이스 이미지의 비-root 기본 사용자 권한 한계 인지.

### [2026-05-04] 폼 — `<input type="number" step={10000}>` 가 원 단위 입력 차단

- **증상**: 사용자가 안동시·가구원 3명·월 6,617,032원 입력 시 "유효한 값을 입력하십시오"
  툴팁이 뜨며 폼 제출 차단.
- **원인**: `IncomeInput.tsx`(48줄)·`MaritalSection.tsx`(59줄)의
  `<input type="number" step={10000}>`. HTML5 number 입력은 step 의 배수만 유효한 값으로
  인식 → 6,617,032 는 10,000 의 배수가 아니라 step mismatch 로 거부.
- **해결**: `step={1}` 로 변경하고 `inputMode="numeric"` 추가 (모바일 숫자 키패드).
- **재발 방지**:
  - `<input type="number">` 에서 `step` 은 *유효 값* 제약이지 단순 가독성 도구가 아님을 인지.
  - 만원 단위 가독성을 원하면 별도 포맷 컴포넌트(천 단위 콤마)나 라벨로 처리.
  - 사용자 자유 입력 항목에는 `step={1}` 또는 `step` 미지정 권장.

### [2026-05-05] React Strict Mode — 첫 SSE fetch 가 무효화되어 응답이 영원히 표시되지 않음 (1차 fix 결함 + 근본 fix)

- **증상**: 페르소나 1(노원구 신혼부부) 입력 후 `/chat` 페이지가 "공식 출처를 검색해 답변을
  준비하고 있습니다. 잠시만 기다려 주세요…" 에서 멈춤. 에러 메시지도 없고 응답 텍스트도
  없음.
- **근본 원인**: `next.config.ts` 의 `reactStrictMode: true` 가 dev 모드에서 effect 를 의도적으로
  두 번 실행. `ChatStream.tsx` useEffect 의 cleanup 이 첫 mount 의 작업을 무효화하고,
  두 번째 mount 는 `startedRef.current=true` 라서 작업을 재개하지 않음.
- **1차 fix (commit `9ca4ac6`) 의 결함** — 동일 결함을 다른 형태로 답습:
  ```ts
  // 1차 fix:
  if (startedRef.current) return;
  startedRef.current = true;
  let stale = false;
  (async () => { ...; if (stale) return; ... })();
  return () => { stale = true; };
  ```
  Strict Mode 에서:
  1. Mount #1: stale_A=false. fetch_A 시작.
  2. Cleanup #1: stale_A=true (closure A 의 변수 mutate).
  3. Mount #2: startedRef true → 조기 return. 새 closure 없음.
  4. Fetch_A 응답 도착하지만 closure A 의 `if (stale) return` 가 모든 setState 차단.
  → UI 영원히 빈 상태. abort() 를 stale 체크로 바꿨을 뿐 같은 결함.
- **근본 fix (commit `<후속>`)** — cleanup 자체 제거:
  ```ts
  if (startedRef.current) return;
  startedRef.current = true;
  (async () => { ... fetch + setState; (stale 가드 없음) ... })();
  // cleanup 없음. startedRef 가 단일 실행 보장.
  ```
  Strict Mode 에서: mount #1 fetch 시작 → cleanup #1 no-op → mount #2 조기 return →
  fetch_A 응답 도착 → setState 가 마운트된 컴포넌트에 정상 반영.
- **부가 개선**: dev 서버에서 stuck 상태 진단을 쉽게 하기 위해 `route.ts` 와 `upstage.ts` 에
  단계별 `console.info` 로그 추가 (`[chat] start`, `[chat] provider begin`,
  `[chat] first text_delta after Xms`, `[upstage] turn N`, `[upstage] http 200` 등).
- **트레이드오프**: 사용자가 mid-stream 페이지 이탈 시 fetch 는 서버에서 끝까지 실행됨
  (Vercel maxDuration 60s 이내). 클라이언트의 setState 는 unmounted 컴포넌트 대상이지만
  React 18+ 가 무해 no-op 으로 처리.
- **재발 방지**:
  - **`AbortController.abort()` 또는 `stale` flag — cleanup 안에서 작업물을 무효화하는 패턴은
    Strict Mode + `startedRef` 단일실행 가드와 결합 시 위험.** 첫 cleanup 이 첫 mount 의
    작업을 죽이는데 두 번째 mount 가 재시작하지 않으면 영원히 빈 결과.
  - 단발성 초기 로딩 fetch 는 cleanup 없이 fire-and-forget 패턴이 가장 단순·안전.
  - Strict Mode 환경에서 streaming hook 작성 시 첫 응답이 UI 에 도달하는지 반드시 수동 검증.
  - 진단 console.info 로그는 Vercel 함수 로그 (production) 와 dev 콘솔 양쪽에서 stuck 원인
    파악에 결정적. 비용·노이즈는 미미하므로 streaming 경로에는 유지 권장.

### [2026-05-04] 정책 정합성 — 소득 입력을 월 세전 → 연 총급여로 전면 변경

- **배경**: 사용자가 "월 세전 vs 연말정산 총급여 기준" 정합성 의문 제기 후, 연 총급여를
  직접 입력하도록 결정.
- **변경 범위**:
  - `src/lib/schema.ts`: `monthlyIncomeKRW` → `annualIncomeKRW` (max 10억),
    `spouseMonthlyIncomeKRW` → `spouseAnnualIncomeKRW`.
  - `src/lib/income.ts`: `annualToMonthly(annualKRW)` 헬퍼 추가 (÷12 반올림).
  - `src/lib/pii.ts`: `bucketAnnualIncome()` (1000만원 단위 버킷) 추가, `maskProfile` 연 기준으로 갱신.
  - `src/components/IncomeInput.tsx`: 레이블·placeholder·헬프 텍스트를 연 총급여 기준으로 변경.
    표시 블록에서 연 총급여 + ÷12 월 환산 + 기준 중위소득 % 모두 노출.
  - `src/components/MaritalSection.tsx`: 배우자 소득도 연 총급여 기준.
  - `src/components/WelfareForm.tsx`: 상태 변수·props 갱신.
  - `src/lib/prompts/buildUserPrompt.ts`: 연 총급여·월 환산·소득 단위 환산 안내 섹션 포함.
  - `src/lib/prompts/system.ko.ts`: §4 자격 판정을 "연 총급여 입력 → ÷12 월 환산 vs 연 직접 비교" 로 갱신.
  - `src/lib/kb/filter.ts`: `annualToMonthly()` 로 변환 후 `medianIncomePercentile` 에 전달.
- **소득 기준 단위별 처리**:
  - 기준 중위소득 % (월 고시): 프로필의 「월 환산 소득(÷12)」 와 비교.
  - 연 총급여 기준 사업(청년도약계좌 등): 「가구합산 연 총급여」 또는 본인 연 총급여를 직접 비교.
  - 종합소득금액 기준: 환산 부정확 → 「홈택스 또는 129 문의 권장」.
- **재발 방지**:
  - 새 KB 사업 추가 시 자격 기준 단위 명시 필수.
  - 페르소나 회귀 시 청년도약계좌(연 총급여 직접 비교)·기초연금(월 환산 비교) 두 경로 확인.

### [2026-05-03] Supabase — Table Editor 가 새로 생성한 테이블을 즉시 표시하지 않음

- **증상**: SQL Editor 에서 `db/schema.sql` 실행 후 Table Editor 사이드바에
  `welfare_metric`, `welfare_consent_log` 가 안 보임. 하지만
  `select tablename from pg_tables where schemaname='public'` 으로 확인하면 존재.
- **원인**: Supabase Table Editor 의 schema cache. 또는 사용자가 SQL 일부만 선택해 실행
  (커서가 주석 영역에 있어 그 부분만 실행됨).
- **재발 방지**:
  - SQL Editor 에서 전체 실행 시 **에디터 빈 공간 클릭 후 Run** (커서 위치 무관).
  - 테이블 안 보이면 먼저 `pg_tables` SELECT 로 존재 여부 확인. 존재하면 페이지 새로고침.
  - 의심 시 API → "Reload schema cache" 트리거.

---

## 12. 결정 로그 (선택지가 있었던 결정)

### LLM 공급자 — Upstage Solar 기본 + Anthropic 대안

- 후보: Anthropic Claude / OpenAI / Gemini / **Upstage Solar**
- 1차 결정 (2026-05-02): Anthropic. 이유: web_search 네이티브 도구·prompt caching·한국어 품질·
  SDK 안정성.
- 재결정 (2026-05-03): **Upstage Solar `solar-pro2`** 가 기본. 이유: 사용자 비용 부담 최소화
  (무료 티어), 한국어 특화, OpenAI 호환 API. Anthropic 은 ENV 스왑 대안으로 유지.
- Upstage 는 네이티브 web_search 가 없어 **Tavily function tool + 에이전트 루프** 로 보완.
- 재평가 트리거: Upstage 무료 티어 한도 초과, 응답 품질 불만족, 또는 Anthropic 가격 인하.

### 외부 웹 검색 — Tavily

- 후보: Tavily (1000회/월 무료, AI agent 특화) / Brave Search (2000회/월 무료) /
  SerpAPI (100회/월) / DuckDuckGo (비공식)
- 결정 (2026-05-03): **Tavily**. 이유: AI agent 용도로 설계되어 결과 형식이 LLM 친화적,
  도메인 필터(`include_domains`) 지원, 무료 티어 충분.
- `TAVILY_API_KEY` 미설정 시 graceful degradation (시드 KB만 사용, 응답에 「최신성 확인 필요」
  명시).

### 데이터 저장소 — Supabase

- 후보: Vercel Postgres / **Supabase** / Neon / 자체 Postgres
- 1차 결정 (2026-05-02): Vercel Postgres (배포 통합 편의).
- 재결정 (2026-05-03): **Supabase**. 이유: 사용자 선택, 무료 티어 관대(500MB DB / 5GB egress /
  50K MAU), pg_cron 으로 TTL 정리 가능, RLS 로 키 분리, Northeast Asia (Seoul/Singapore) 리전.
- 추상화: `src/lib/supabase.ts` 가 클라이언트 싱글톤 제공. Postgres 변경 시 logger.ts 의
  insert 만 교체하면 됨.

### 개발 환경 — GitHub Codespaces (iPad 호환)

- 후보: 로컬 머신 / **GitHub Codespaces** / Gitpod
- 결정 (2026-05-03): **Codespaces**. 이유: 사용자가 iPad 만 보유, 브라우저 1-click 으로
  Node·pnpm·git 환경 확보, 시크릿은 GitHub 가 암호화 보관 후 자동 주입.
- 베이스 이미지: `mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm` (Node 20 +
  passwordless sudo + Debian 안정성).
- `.devcontainer/devcontainer.json` 단순화 (containerEnv 미사용, sudo corepack 사용).

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

### KB 보강 — Phase A (광역시도 6개)

- 페르소나 회귀에서 ② ③ 계층 보류 패턴이 일관되게 관찰됨 (P1 노원·P2 동래·P3 광주
  동구). 원인은 `central/*.md` 26개 중앙 사업만 KB 에 있고 광역·기초 자치단체 KB
  부재 → 100% web_search 의존.
- 사용자 결정: 광역 + 인구 상위 시·군·구 단계적 보강. 진행 방식은 사업 대상
  우선순위 제안→승인 → 작성. Phase A·B·C 분할 (plan §21).
- Phase A 구현 (2026-05-08):
  - `src/lib/kb/loader.ts`: `KbProgram.region` 필드 + `loadRegionalPrograms`/
    `loadLocalPrograms`/`loadAllPrograms` 함수 + `readMarkdownDir(dir, recursive)`
    유틸. central/regional/local 별도 cache.
  - `src/lib/kb/filter.ts`: region 매칭 (sido/sigungu) + 정렬(기초>광역>중앙) +
    limit 25.
  - `src/app/api/chat/route.ts`: `loadCentralPrograms` → `loadAllPrograms` 교체.
  - 광역 6개 × 5 사업 = 30개 markdown 추가:
    - 서울: 청년수당·청년월세·신혼임차이자·안심소득·1인가구
    - 경기: 청년기본소득·면접수당·노동자통장·신혼매입임대·노인일자리(가산)
    - 부산: 청년디딤돌카드+·신혼/청년 임차이자·노인맞춤돌봄(가산)·노인일자리(가산)·1인가구
    - 인천: 청년드림체크카드·신혼주거지원·영플러스일자리·노인안심돌봄(가산)·아이드림 출산지원금
    - 광주: 청년13통장·청년드림수당·신혼임차이자·노인행복일자리(가산)·출산축하금
    - 대구: 청년정주지원·청년행복카드·신혼주거지원·어르신 효도수당·청년 면접지원
- 트레이드오프:
  - 광역 정책은 변경 빈도 높음 → KB 본문에 "운영 여부와 최신 자격은 web_search로
    재확인" 명시. staleAfter: 2026-12-31 강제. LLM 이 KB+web_search 교차검증.
  - frontmatter 큐레이션 시 사업명·자격 부정확 위험 → "사전 후보 메모" 로 LLM 의
    web_search 단서로만 활용 (시스템 프롬프트 §2 "3-소스 교차검증" 으로 보정).
- 다음 단계: 사용자 페르소나 P1·P2·P3 회귀 재실행 → ② 보류율 감소 측정 → 효과 보고
  Phase B (나머지 광역 11개) → Phase C (시·군·구).

### 응답 품질 — 1.8단계 (fixSourceLinks multi-line 패턴 지원)

- 1.7단계 회귀 (P1 노원·P2 동래) 결과:
  - ✅ 시뮬레이션 표 완전 제거 (P1·P2 통과).
  - ✅ ② 광역 계층 중복 검출 (P2 콘솔 `tier2_central_overlap ["노인맞춤돌봄"]`,
    본문 ⚠ 자동 경고 첨부 — 사용자 우선순위 핵심 이슈 해결).
  - ✅ ③ 도메인 매칭 + 자격 매칭 (1.5/1.6단계 효과 유지).
  - ❌ markdown 링크 후처리 — P1·P2 모두 `[chat] sourceLinkFix replaced` 로그 부재.
- 진단: P2 raw 본문이 multi-line 형식 (`출처:\n  보건복지부 · 정책브리핑`).
  `SOURCE_LINE_RE` 가 같은 줄 value `(.+)$` 만 매칭 → multi-line 미처리.
- 변경 (`src/lib/sourceLinkFix.ts`):
  - `SOURCE_LABEL_ONLY_RE` 추가 (라벨만 있는 라인).
  - `SOURCE_VALUE_LINE_RE` 추가 (들여쓰기 또는 sub-list value 라인).
  - 토큰 변환 로직을 `transformTokens()` 함수로 추출 (단일·다중 라인 재사용).
  - 라인 루프에 multi-line 분기 추가: 라벨 라인 발견 → 인접 value 라인(들) 추적
    → 각 value 라인에 transformTokens 적용. 빈 줄·새 라벨·일반 본문 시작 시 종료.
- 트레이드오프: 라인 처리 복잡도 약간 증가. false positive 가능성 — 라벨만 있는 줄
  뒤에 들여쓰기된 본문 텍스트가 오는 경우 오변환 위험 (현실적으로 거의 없음).
- 잔여 위험: 매우 자유로운 출력 형식 (산문 다중 줄)은 여전히 매칭 실패 가능. P3 회귀
  결과 보고 추가 패턴 발견 시 정밀화.

### 응답 품질 — 1.7단계 (시뮬레이션 제거·계층 중복 검출·markdown 링크 본문 후처리)

- 1.6단계 페르소나 회귀 결과 (P1 노원·P2 동래·P3 광주동구):
  - **통과**: 자격-프로필 매칭(P2 청년 사업 차단), ② ③ 도메인 검증 + 자동 ⚠ 경고
    (P2 ⚠ 자동 첨부 ✓), 자체 점검 leak 차단, citation 본문 추출, ③ 정직 보류.
  - **미통과**: (a) 시뮬레이션 표 환각 3/3 위반 — P1 근로장려금 연 600~1,200만원
    (실제 최대 330만원), P2 노인일자리 ₩300,000~₩500,000 (실제 290k/710k),
    P3 청년도약계좌 3년 만기 2,197만원 (실제 5년 만기 5,000만원). (b) 계층 중복
    P2 위반 — ② 부산 노인맞춤돌봄·③ 동래구 노인일자리 (둘 다 ① 사업). (c) markdown
    링크 강제 0/3 — "출처: 도메인" 패턴 무시.
- 사용자 결정 (2026-05-08): (a) 시뮬레이션 섹션 완전 제거 / (b) 서버측 deterministic
  검출 + ⚠ 자동 경고 / (c) 본문 후처리 변환.
- 변경:
  - `system.ko.ts`: 「## 3. 예상 수혜 금액 시뮬레이션」 섹션 삭제, § 번호 재조정.
    「## 2. 추천 복지 혜택」 도입부에 "합산·시뮬레이션 표 작성 절대 금지" 명시.
  - `src/lib/centralPrograms.ts` (신규): 중앙부처 사업명 27개 키워드 화이트리스트
    (기초연금·노인맞춤돌봄·노인장기요양·노인일자리·국민취업지원·청년도약계좌·버팀목·
    디딤돌·아동수당·근로장려금·국민기초생활보장 등) + `findCentralProgramsInBlock`.
  - `src/lib/sourceLinkFix.ts` (신규): 한국어 기관명→도메인 매핑 (45개) + `fixSourceLinks`.
    "출처: 복지로 · 국토교통부" 행에서 본문 URL 과 도메인 매칭해 [복지로](URL) ·
    [국토교통부](URL) 로 자동 재작성. 긴 이름 우선 정렬(예: 광주광역시청 > 광주광역시).
  - `src/app/api/chat/route.ts`: ② ③ 블록 추출 후 `findCentralProgramsInBlock` 호출
    → 키워드 등장 시 「⚠ 자동 검증 경고: ① 중앙정부 사업으로 간주」 자동 첨부.
    `fixSourceLinks` 결과를 SSE done 이벤트의 `finalMarkdown` 필드로 전송.
  - `src/components/ChatStream.tsx`: done 이벤트 `finalMarkdown` 수신 시 누적 텍스트
    교체. 짧은 깜빡임은 수용.
- 트레이드오프:
  - 시뮬레이션 부재로 종합 시각화 약화 → 향후 KB 보강 + deterministic 계산 모듈 검토.
  - 중앙부처 키워드 단순 매칭 → false positive 가능성 (회귀로 정밀화).
  - 매핑 테이블 유지 부담 (신규 사이트 등장 시 수동 추가).
- 잔여 위험: LLM 이 매핑에 없는 기관명 사용 시 변환 실패. 회귀 후 누락 보강.

### 응답 품질 — 1.6단계 (자격 매칭·자체점검 leak·검증 누락·markdown 링크 강제)

- 1.5단계 페르소나 회귀에서 발견된 잔여 4개 이슈를 한꺼번에 수정.
- (1) **자격 매칭 강화**: 페르소나 2 동래구에서 "청년도전지원사업(18-39세)" 이 65세
  사용자에게 안내된 환각 차단. system.ko.ts §4 끝에 "자격-프로필 일치 검증" 섹션 추가
  (나이·가구·소득·특수상황·거주지 5차원 대조). buildUserPrompt.ts 검증 규칙에 inline
  자격 일치 항목 추가.
- (2) **자체 점검 leak 차단**: 페르소나 1 노원에서 LLM 이 "⚠ 자동 검증 경고: ② 광역
  시도 사업..." 같은 자체 점검 결과를 응답 본문에 leak. system.ko.ts 자체 점검 헤더
  를 "내부 검토용 — 응답 본문 출력 절대 금지" 로 변경, 메타 메시지 (⚠ 자동 검증 경고
  등) 는 서버가 자동 첨부 함을 명시.
- (3) **`tierBlockIsEmpty` false positive 수정**: 블록 첫 300자에서만 보류 상태 매치
  → 응답 본문 끝의 leak 된 ⚠ 경고 안의 "확인된 사업 없음" false match 차단.
  `extractTierBlock` 의 tier 3 끝 경계에 ④ 마커도 추가.
- (4) **계층 분류 규칙**: 페르소나 2 의 "동래구 노인맞춤돌봄서비스" 는 보건복지부
  국가사업이라 ① 에만 안내해야 함. system.ko.ts §5 끝에 "중앙부처 사업은 ① 에만
  안내, ③ 중복 분류 금지" 명시 + 실제 ① 사업명 예시 (기초연금·노인맞춤돌봄·노인일
  자리·국민취업지원·청년도약계좌·버팀목·디딤돌·아동수당 등).
- (5) **markdown 링크 강제**: "출처: 정책브리핑 · 복지로" 같은 도메인 이름만 표기 →
  실제 URL 포함된 markdown 링크 형식 (`[복지로](https://www.bokjiro.go.kr/...)`).
  올바른 예시·금지 예시·왜 필요한지 명시.
- 후속 (1.6 회귀 결과 보고 진행): 효과 미흡 시 2단계 (서버 측 URL 진위 검증 — 본문
  URL 을 Tavily SearchHit[] 와 대조) 별도 plan.

### 응답 품질 — 환각 방지 1.5단계 (서버 측 후처리 검증)

- 후보: (A) 시스템 프롬프트만 / (B) 서버 측 후처리 검증 / (C) 둘 다
- 결정 (2026-05-05): **(C) 1단계 + 1.5단계 결합**. 1단계만으로 페르소나 2 동래구 환각이
  자체 점검을 회피한 사례 발견 → deterministic 검증 필요.
- 1.5단계 변경:
  - `src/lib/regionMatch.ts` (신규): 시·군·구 / 광역시도 한글·로마자 매칭 유틸,
    URL 추출, ② ③ 계층 블록 추출, 보류 상태 판별.
  - `src/lib/llm/upstage.ts`: Tavily 가 반환한 모든 hit 을 자동 citation 으로 emit 하던
    로직 제거. 무관 지역 URL (예: 서울 거주자에게 대구 자료) 이 응답 하단에 노출되던 문제 해결.
  - `src/app/api/chat/route.ts`: 응답 스트림 종료 후 (a) 본문 ② ③ 계층 블록의 인용
    URL 이 거주지 도메인을 포함하는지 검증 → 미통과 시 "⚠ 자동 검증 경고" 자동 첨부,
    (b) 응답 본문에서 화이트리스트 도메인 URL 만 추출해 citations 재구성.
  - `system.ko.ts` / `buildUserPrompt.ts`: 「출처」 와 「신청 경로」는 반드시 markdown
    링크 `[제목](URL)` 형식으로 본문에 포함하도록 명시. 도메인 이름만 적는 것 금지.
- 트레이드오프:
  - LLM 이 markdown 링크를 안 쓰면 자동 검증 경고 false positive 가능 → 시스템 프롬프트로
    강제하지만 100% 보장은 아님. 페르소나 회귀로 효과 추적.
  - 시·군·구 한글 stem 매칭이 단순해 일부 자치구(예: 「강서구」 부산·서울 양쪽 존재) 는
    cross-region 거짓 통과 가능. 우선 단순 매칭 후 회귀 결과 보고 정교화.

### 응답 품질 — 환각 방지 1단계 (시스템 프롬프트 강화)

- 후보: (A) 시스템 프롬프트만 강화 / (B) 서버 측 후처리 검증 / (C) 둘 다 동시
- 결정 (2026-05-05): **(A) 1단계만**. 이유: 변경 범위 작고 회귀 위험 낮음, low risk·high impact.
  효과 부족 시 (B) 를 별도 plan 으로 추가.
- 강화 내용:
  - §2 교차검증: 현재/직전 연도 + URL 실존 검증 추가
  - §3 환각 방지: 5개 절대 금지 행위 명시 (URL 합성·일반화·연도 단정 등)
  - §5 3계층: ② 광역시도 사업은 광역 도메인 출처 필수, ③ 시·군·구 사업은 시·군·구 명칭이
    URL 호스트·경로에 포함된 출처 필수. 없으면 「확인된 사업 없음」 명시.
  - §6 최신성: 계층별 검색 쿼리 템플릿 강제 (③ 은 시·군·구 키워드 누락 금지).
  - 도구 규칙: 인용 URL 은 검색 결과에 그대로 존재해야 함 명시.
  - 신규 「응답 작성 직전 자체 점검」 섹션 추가.
- `buildUserPrompt.ts`: 사용자 프로필 끝에 거주지 시·군·구 명시 검증 규칙 inline 삽입.
- 트레이드오프: "확인된 사업 없음" 응답이 더 자주 나올 수 있음. KB 보강으로 보완 검토.

### 소득 입력 기준 — 연 총급여

- 후보: (A) 월 세전 소득 / (B) 연 총급여 (연말정산 총급여액)
- 1차 결정 (2026-05-04): 월 세전 (기준 중위소득이 월 단위 고시이므로).
- 재결정 (2026-05-04): **연 총급여**. 이유: 사용자가 직접 아는 금액이 연말정산 총급여액이고,
  청년도약계좌·근로장려금 등 연 기준 사업에서도 별도 환산 없이 그대로 비교 가능.
  기준 중위소득 비교는 buildUserPrompt 가 ÷12 후 프로필에 포함하므로 LLM 부담 없음.
- 영향 파일: schema.ts, income.ts, pii.ts, IncomeInput.tsx, MaritalSection.tsx, WelfareForm.tsx,
  buildUserPrompt.ts, system.ko.ts, kb/filter.ts, spec.md, claude.md.

### UI 라이브러리 — Tailwind + 자체 컴포넌트

- 후보: shadcn/ui 풀 도입 / Tailwind + 자체 / TDS 직접
- 결정: 현재는 Tailwind + 미니멀 자체 컴포넌트. shadcn/ui 풀 도입 시 번들 부담.
  앱인토스 게시 시 TDS 어댑터(`theme.tds.ts`)로 swap.

---

## 13. 미해결 과제 (TODO)

### 완료
- [x] Supabase 마이그레이션 SQL (`db/schema.sql`) + opt-in 로그 INSERT 실 구현 (2026-05-03)
- [x] Upstage Solar 공급자 + Tavily 외부 검색 (2026-05-03)
- [x] GitHub Codespaces devcontainer (2026-05-03)
- [x] GitHub Actions CI (typecheck + build) (2026-05-03)

### 남은 항목
- [ ] 자동 테스트(Vitest) 작성: `tests/{pii,kb-loader,smoke}.test.ts`
- [ ] `tests/` 디렉터리 vitest 설정(`vitest.config.ts`)
- [ ] 페르소나 3건 실 API 호출 회귀 테스트 (사용자 검증 진행 중)
- [ ] KB `lastVerified` 1차 실제 검증 후 갱신 (자리값 상태)
- [ ] sessionStorage 미가용 폴백 (앱인토스 대비, URL 쿼리 또는 React state lift)
- [ ] Supabase pg_cron 활성으로 30일 TTL 자동 정리 (현재 SQL은 주석 처리)
- [ ] 폰트 self-host 결정 + 번들 영향 측정
- [ ] `pnpm kb:audit` 점검 스크립트 (각 KB 의 `staleAfter` 추적)
- [ ] OpenAI / Gemini 공급자 실 구현 (현재 stub) — 에이전트 루프 패턴은 Upstage 와 동일 적용 가능
- [ ] 사용자 데이터 삭제 API (`db/schema.sql` 의 `delete_my_log` RPC 활성, 응답 페이지에
  session_id 노출 후 「내 데이터 삭제」 버튼)

---
