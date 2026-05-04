# spec.md — 복지매칭 사양서

> 본 문서는 "복지매칭" 프로젝트의 **현행 사양**입니다. 새 채팅 세션이 시작되더라도 이 파일과
> `claude.md`만 읽으면 작업을 이어받을 수 있도록 작성·갱신합니다.
> 마지막 업데이트: 2026-05-04

---

## 1. 프로젝트 개요

- **이름**: 복지매칭 (welfare)
- **저장소**: `a-scene-tence/welfare`
- **브랜치(개발)**: `claude/welfare-benefits-agent-RyIee`
- **목표**: 대한민국 거주자가 거주지·나이·소득·결혼/가구 상황을 입력하면, 받을 수 있는
  공공 복지 혜택을 **중앙정부 + 광역시도 + 기초자치단체** 3계층으로 통합 안내한다.
- **출발점**: 사용자가 노원구 거주자 본인 전용으로 만든 Gemini Gems 프롬프트(`복지상담`)를
  일반 대중용 웹 에이전트로 확장한 것.
- **배포**: Phase 1 — GitHub → Vercel(Hobby, `icn1`). Phase 2 — 앱인토스(App-in-Toss)
  미니앱 게시.

## 2. 대상 사용자

- 본인이나 가족이 받을 수 있는 정부·지자체 복지를 한 번에 확인하고 싶은 일반 대중.
- 디지털 친숙도가 낮은 시니어·다문화 가구·청년·신혼부부·한부모 등 다양한 페르소나 포함.
- 모바일(360px 폭) 우선 사용을 가정.

## 3. 핵심 사용자 흐름

1. `/` 입력 폼: 거주지(시도→시군구) · 나이 · 가구원수 · 본인 월소득 · 결혼/배우자 · 자녀 ·
   해당 상황(복수) · 자유 텍스트(선택)
2. 면책 동의(필수) + 비식별 로깅 동의(선택) 체크
3. (선택) 본인 Anthropic API 키(BYOK) 입력 → rate limit 면제
4. 「받을 수 있는 복지 혜택 찾기」 → `/chat`
5. SSE 스트리밍으로 응답: ① 자격 요약 ② 3계층 사업 목록 ③ 수혜 금액 시뮬레이션 ④ 다음 단계
6. 응답 말미 면책 강제 첨부, 하단 출처(공식 도메인) 목록

## 4. 입력 스키마 (요약)

```ts
{
  region: { sido, sigungu, sidoCode(2자리), sigunguCode(5자리) },
  age: 0~120,
  household: { size: 1~10, monthlyIncomeKRW, assetsKRW? },
  marital: { status: "single" } | { status: "married", spouseAge, spouseMonthlyIncomeKRW },
  children: [{ age }],
  situations: [enum 13종],
  freeText?: string(≤500자),
  consent: { disclaimer: true(필수), storeAnonymizedLog: bool(선택) }
}
```

전체 정의: `src/lib/schema.ts`. 클라/서버 동일 Zod 스키마 사용.

## 5. 출력 형식 (마크다운)

```
## 1. 자격 요약 (가구원수 / 월 합산 소득 / 중위소득 % / 분위 라벨)
## 2. 추천 복지 혜택
   ### ① 중앙정부 사업
   ### ② 광역시도 사업 ({사용자 시·도})
   ### ③ 기초자치단체 사업 ({사용자 시·군·구})
   각 사업: **사업명**(소관 부처) · 자격 · 혜택 · 신청시기 · 구비서류 · 신청경로 · 출처 URL
## 3. 예상 수혜 금액 시뮬레이션
## 4. 다음 단계 (마감 임박 순)
> 면책 (자동 첨부)
```

## 6. 시스템 프롬프트 정책 (`src/lib/prompts/system.ko.ts`)

1. 공식 출처 화이트리스트만 인용 (블로그·뉴스·카페·위키·유튜브 금지)
2. 3-소스 교차검증 (공식 출처 3개 이상 일치) 후 안내
3. 환각 방지: 추측·일반화·과거 정책 인용 금지
4. 자격 판정: 가구 중위소득 % 기준
5. 3계층 강제 (없으면 "해당 계층에서 추가 사업 없음" 명시)
6. 최신성: web_search로 「[지자체명] [사업명] [현재 연도]」 검증
7. 다각도 키워드 검색
8. 의료·법률·금융 단정 금지
9. 응답 말미 면책 자동 첨부

## 7. 데이터 소스

### 7.1 시드 KB (정적, 22개 중앙 사업)

`src/data/programs/central/*.md` — frontmatter + 본문.

| 필드 | 의미 |
|---|---|
| `slug` / `name` / `ministry` / `category` | 식별·분류 |
| `legalBasis` / `legalBasisUrl` / `officialUrl` / `applyUrl` | 근거·공식 링크 |
| `eligibility.{ageMin,ageMax,incomePercentile,situations,households}` | 사전 필터링 키 |
| `amountKRW.{min,max,unit}` | 금액 표시 |
| `year` / `lastVerified` / `staleAfter` | 갱신 추적 |

수록 사업(2026-05 기준 22종): 기초연금·국민기초생활보장·청년월세·버팀목·디딤돌·청년도약계좌·
한부모가족·부모급여/아동수당·실업급여·장애인연금·노인장기요양·노인맞춤돌봄·노인일자리·
국민행복카드·다문화·국민건강보험·근로/자녀장려금·에너지바우처·주거급여·신혼주거·
국민취업제도·보훈·북한이탈주민·농어업·국가장학·아이돌봄.

### 7.2 실시간 검색

공급자별로 다른 메커니즘:

| 공급자 | 검색 도구 | 비고 |
|---|---|---|
| Anthropic | 네이티브 `web_search_20250305` | 도메인 화이트리스트 직접 전달 |
| Upstage Solar (기본) | Tavily function tool + 에이전트 루프 | `src/lib/tools/externalSearch.ts` 가 Tavily API 호출, 도메인 화이트리스트 후처리 필터 |
| OpenAI / Gemini | 미구현 (stub) | Phase 2에서 Responses API web_search_preview / Gemini grounding 매핑 예정 |

도메인 화이트리스트는 `src/lib/prompts/system.ko.ts` 의 `ALLOWED_DOMAINS` 와
`src/lib/tools/webSearch.ts` 의 `WEB_SEARCH_ALLOWED_DOMAINS` 에 동기화.

`TAVILY_API_KEY` 미설정 시 Upstage·OpenAI·Gemini 공급자는 검색 없이 시드 KB만으로
응답하며, `formatSearchResultForLlm` 이 「웹 검색 비활성」 안내를 모델에 전달.

### 7.3 갱신 정책

- 분기 1회: 각 KB 문서 `lastVerified` 점검
- 매년 1월: 보건복지부 「기준 중위소득」 고시 → `src/data/median-income.json` 업데이트
- `staleAfter` 임박 시 응답에 「최신성 확인 필요」 자동 경고

## 8. 개인정보·로깅 정책

| 동의 | 처리 |
|---|---|
| 미동의(기본) | 메모리에서만 처리, 응답 후 폐기. 운영 메트릭(시도·소요시간·토큰)만 `welfare_metric` 또는 stdout |
| 동의(opt-in) | PII 마스킹 → 30일 TTL로 `welfare_consent_log`에 저장 (Supabase) |

마스킹 규칙(`src/lib/pii.ts`):
- 소득: 100만원 단위 버킷 (`230만 → "200만~300만"`)
- 시군구: 시도까지만
- 나이: 5세 단위 버킷
- 자유텍스트: 전화·이메일·주민번호·계좌·카드·이름후보 정규식 제거

세션 식별자: UUID v4 (`session_id`). 사용자 ID 미수집.

저장소: **Supabase** (Postgres + RLS). `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
미설정 시 stdout 로그만 사용. 스키마·셋업 절차는 `db/schema.sql` 및 `db/README.md`.
RLS 활성화로 anon/authenticated 키는 차단되며 service_role(서버 전용)만 쓰기 가능.
30일 TTL 정리는 pg_cron 또는 외부 스케줄러로 일일 1회 실행 권장.

## 9. 아키텍처

### 9.1 스택

- Next.js 15 App Router · TypeScript · Tailwind CSS
- LLM 공급자 (ENV `LLM_PROVIDER` 로 swap):
  - **Upstage Solar** (기본, `solar-pro2` 무료 티어) — 직접 fetch + OpenAI 호환 SSE
  - **Anthropic Claude** (대안) — `@anthropic-ai/sdk`, 네이티브 web_search + prompt caching
  - OpenAI / Gemini (stub)
- 외부 웹 검색: Tavily API (`TAVILY_API_KEY`) — Anthropic 외 공급자가 사용
- Zod · react-hook-form · react-markdown(rehype-sanitize) · gray-matter
- 배포: Vercel(Hobby, `icn1`), 함수 maxDuration 60초
- 데이터 저장: **Supabase** (`@supabase/supabase-js`) — opt-in 로그 (Postgres + RLS, 30일 TTL)
- 개발 환경: GitHub Codespaces (`.devcontainer/`) — 브라우저(iPad 포함) 1-click 셋업
- CI: GitHub Actions (`.github/workflows/ci.yml`) — 매 푸시마다 typecheck + build

### 9.2 디렉터리 (요약)

```
.devcontainer/{devcontainer.json, README.md}   # GitHub Codespaces 환경 정의
.github/workflows/ci.yml                       # typecheck + build 자동 검증
db/{schema.sql, README.md}                     # Supabase 테이블·RLS·셋업 가이드

src/
├─ app/                  # 페이지 + API
│  ├─ page.tsx           # 입력 폼
│  ├─ chat/page.tsx      # 응답 스트리밍
│  ├─ about|privacy|terms
│  └─ api/{chat,health}/route.ts
├─ components/           # UI
├─ lib/
│  ├─ schema.ts · pii.ts · regions.ts · income.ts · ratelimit.ts · logger.ts
│  ├─ supabase.ts                              # 서버 전용 Supabase 싱글톤
│  ├─ prompts/{system.ko,disclaimer,buildUserPrompt}.ts
│  ├─ kb/{loader,filter}.ts
│  ├─ llm/{provider,anthropic,openai,gemini,upstage,index}.ts
│  ├─ tools/{webSearch, externalSearch}.ts     # externalSearch = Tavily 어댑터
│  └─ toss/{env,external,auth,push,iaa}.ts
├─ styles/{theme,theme.tds}.ts
└─ data/{programs/central/*.md, regions.json, median-income.json}
```

### 9.3 공급자 추상화 (`src/lib/llm/provider.ts`)

```ts
interface LlmProvider {
  name: "anthropic" | "openai" | "gemini" | "upstage";
  streamChat(req: StreamRequest): AsyncIterable<StreamEvent>;
}
```

ENV `LLM_PROVIDER` 로 swap. 1차 릴리스는 **Upstage Solar 기본 + Anthropic 대안** 두 공급자
구현. OpenAI/Gemini는 stub.

- **Anthropic** (`src/lib/llm/anthropic.ts`): 네이티브 `web_search_20250305` 도구 + ephemeral
  prompt caching. SDK 의 high-level streaming helper 사용.
- **Upstage** (`src/lib/llm/upstage.ts`): OpenAI 호환 API (`https://api.upstage.ai/v1`) 를
  raw fetch + 자체 SSE 파서로 호출 (의존성 절약). 네이티브 web_search 가 없어
  **에이전트 루프 패턴** 으로 구현 — function tool 호출을 누적·실행한 뒤 tool_result 메시지를
  추가해 다음 턴으로 이어감 (최대 5회). 검색은 `externalSearch()` 가 Tavily API 로 위임.

## 10. 앱인토스(App-in-Toss) 호환 정책

| 제약 | 적용 |
|---|---|
| 초기 번들 ≤ 50MB | 코드 스플릿, lazy import. 현재 First Load JS 102KB 공유 / 132KB 최대 |
| 디자인 가이드(TDS) | `src/styles/theme.ts` ↔ `theme.tds.ts` swap |
| WebView 환경 감지 | `src/lib/toss/env.ts` |
| 외부 링크 | `src/lib/toss/external.ts` (SDK 미주입 시 `_blank` 폴백) |
| 결제·인증·푸시·IAA | `src/lib/toss/{auth,push,iaa}.ts` stub |
| 빌드 타겟 | `pnpm build:appsintoss` (`NEXT_PUBLIC_TARGET=appsintoss`) |

## 11. 성능·번들 예산

| 지표 | 목표 | 현재 |
|---|---|---|
| First Load JS (shared) | ≤ 200KB | 102KB ✓ |
| First Load JS (`/chat`) | ≤ 200KB | 132KB ✓ |
| 정적 자산 합계 | ≤ 50MB | 측정 필요 |
| API 함수 maxDuration | ≤ 60s | 60s |
| 평균 응답 시간 | ≤ 30s (web_search 포함) | 측정 필요 |

## 12. 면책·법적 고지

- 모든 응답 말미: `src/lib/prompts/disclaimer.ts` 의 `DISCLAIMER_TEXT` 강제 첨부
  (포함되지 않은 경우 서버에서 자동 추가 — `src/app/api/chat/route.ts` finally 블록)
- UI 푸터: `<DisclaimerFooter />`
- `/privacy`, `/terms`: 처리방침·이용약관 페이지

## 13. 배포 절차

### 옵션 A — GitHub Codespaces (브라우저, iPad 가능)

1. https://github.com/settings/codespaces → **Codespaces secrets** 에 5개 등록:
   `UPSTAGE_API_KEY`, `UPSTAGE_MODEL`, `TAVILY_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   각 시크릿의 Repository access 에 `a-scene-tence/welfare` 선택.
2. 저장소 → **Code** → **Codespaces** → **Create codespace on `claude/welfare-benefits-agent-RyIee`**.
3. 자동으로 컨테이너 빌드 + `pnpm install` 실행 (1~2분).
4. 터미널에서 `pnpm dev` → 포트 3000 자동 포워딩 → 브라우저 알림 클릭.

### 옵션 B — 로컬 머신

1. `pnpm install` → `cp .env.example .env.local` → 공급자 키 입력 (Upstage 기본:
   `UPSTAGE_API_KEY` + `TAVILY_API_KEY`).
2. `pnpm dev` 로컬 검증.
3. `git push -u origin claude/welfare-benefits-agent-RyIee`.

### 옵션 C — Vercel 직접 배포

1. https://vercel.com → New Project → Import `a-scene-tence/welfare`.
2. Framework: Next.js (자동), Region: `icn1` (Seoul).
3. Environment Variables (Production+Preview) 5개 입력 (위 시크릿과 동일).
4. Deploy.

### Supabase 통합 (모든 옵션 공통, opt-in 로깅용)

`db/schema.sql` 을 Supabase SQL Editor 에서 실행 → 두 테이블(`welfare_metric`,
`welfare_consent_log`) + RLS 활성. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 미설정 시
서비스는 정상 동작하되 stdout 로그만 사용. 절차: `db/README.md`.

### 앱인토스 게시 (Phase 2)

앱인토스 콘솔 → 미니앱 등록 → `pnpm build:appsintoss` → 번들 업로드 → 심사.

## 14. 검증

### 14.1 페르소나 시나리오 (수동)

| # | 페르소나 | 기대 응답 |
|---|---|---|
| 1 | 서울 노원구 신혼부부, 32세, 월 600만원 | 신혼버팀목·디딤돌·신혼희망타운, 서울 임차보증금이자, 노원형 가족돌봄 |
| 2 | 부산 동래구 1인 65세, 월 150만원 | 기초연금·맞춤돌봄·노인일자리, 부산 효도패스, 동래구 경로식당 |
| 3 | 광주 동구 1인 27세 미혼, 월 220만원 | 청년월세·청년도약계좌, 광주 청년 13(일+삶), 동구 청년사업 |

### 14.2 자동 검증 체크

- [x] `pnpm typecheck` 통과
- [x] `pnpm build` 통과
- [ ] Vitest 단위 테스트 (`tests/pii.test.ts`, `tests/kb-loader.test.ts`, `tests/smoke.test.ts`)
  — 미작성, Phase 1.5 추가 예정
- [ ] E2E 페르소나 fixture (Playwright 또는 vitest+MSW)

## 15. 로드맵

### Phase 1 — Web (현재)
- ✓ 스캐폴드 + 22개 시드 KB + 시스템 프롬프트 + SSE 스트리밍
- ✓ Vercel 배포 가능 상태
- ✓ Upstage Solar 공급자 + Tavily 외부 검색 (에이전트 루프)
- ✓ Supabase 마이그레이션 SQL (`db/schema.sql`) + logger 통합 (30일 TTL)
- ✓ GitHub Codespaces devcontainer (iPad 호환)
- ✓ GitHub Actions CI (typecheck + build)
- 다음:
  - [ ] 자동 테스트 작성 (Vitest)
  - [ ] 페르소나 3건 수동 호출 검증 후 KB 보강
  - [ ] (선택) pg_cron 으로 30일 TTL 자동 정리 활성

### Phase 2 — 앱인토스 게시
- [ ] 콘솔 가입·미니앱 등록
- [ ] TDS Figma·앱빌더 적용 → `theme.tds.ts` 토큰 채우기
- [ ] 토스 SDK 어댑터 실 구현 (`auth`/`push`/`iaa`/`external`)
- [ ] 번들 ≤ 50MB 검증
- [ ] 자체 QA + 사업자 정보 등록 + 심사

### Phase 3 — 확장
- [ ] 다국어(영어·중국어·베트남어)
- [ ] Voice 입력(ASR)
- [ ] 사용자 피드백(👍/👎) → 모델 개선
- [ ] 정책 변경 푸시 알림(앱인토스)

## 16. 승인 기준 (Acceptance Criteria, Phase 1)

- [x] 입력 폼이 360px에서 정상 렌더
- [x] 면책 동의 미체크 시 폼 제출 차단
- [x] `/api/chat` 가 SSE로 응답하고 응답 말미에 면책 자동 첨부
- [x] 도메인 화이트리스트가 시스템 프롬프트와 web_search 도구 양쪽에 동기화
- [x] 미동의 시 입력값이 DB·로그에 저장되지 않음(설계상)
- [x] First Load JS ≤ 200KB
- [ ] Anthropic 실 API 키로 3개 페르소나 수동 검증 완료 — 사용자 검증 대기
- [ ] 응답 본문에 화이트리스트 외 URL 인용 없음 — 사용자 검증 대기

## 17. 결정 이력 (사용자 확정)

| 항목 | 결정 | 일자 |
|---|---|---|
| 비용 모델 | 추후 결정 (provider-agnostic 어댑터로 대비) | 2026-05-02 |
| 기본 LLM | **Upstage Solar `solar-pro2`** (무료 티어, 한국어 특화). Anthropic 대안. OpenAI/Gemini stub | 2026-05-03 |
| 외부 웹 검색 | **Tavily API** (무료 1000회/월, AI agent 특화) — Upstage·OpenAI·Gemini 공급자용 | 2026-05-03 |
| 시드 KB 출처 | 공식 출처만(복지로·정부24·법령·부처·지자체). 블로그/뉴스/카페 완전 배제 | 2026-05-02 |
| 개인정보 | 기본 비저장. opt-in 동의자만 비식별 처리 후 30일 보관 | 2026-05-02 |
| 데이터 저장소 | **Supabase** (Postgres + RLS, Northeast Asia/Singapore 리전) | 2026-05-03 |
| 개발 환경 | **GitHub Codespaces** (iPad 호환), 시크릿은 GitHub Codespaces secrets | 2026-05-03 |
| 배포 채널 | Phase 1 Vercel 단독, Phase 2 앱인토스 추가 | 2026-05-02 |

---
