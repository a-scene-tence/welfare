# 복지매칭 (welfare)

대한민국 거주자 누구나 자신이 받을 수 있는 공공 복지 혜택을 한 번에 확인할 수 있는 웹 에이전트.
거주 지역·나이·소득·결혼/가구 상황을 입력하면 **중앙정부 + 광역시도 + 기초자치단체** 3계층의
혜택을 공식 출처(복지로·정부24·국가법령정보센터·소관 부처·지자체) 기반으로 안내한다.

> 본 서비스는 정부 공식 채널이 아니며, 안내 정보는 참고용입니다. 실제 신청은 복지로
> (bokjiro.go.kr) 또는 거주지 행정복지센터에서 확인하세요. 정확한 안내는 보건복지상담센터
> **129** 로 문의하세요.

---

## 핵심 특징

- 공식 출처 화이트리스트 기반 응답 — 블로그·뉴스·카페 인용 차단
- 3-소스 교차 검증 + 모호 시 129 안내 강제
- 가구원수·합산 소득 → 기준 중위소득 % 자동 계산
- 입력값 비저장(서버 메모리만), 동의 시 비식별 처리 후 30일 보관
- 공급자 비종속(Upstage/Anthropic/OpenAI/Gemini 어댑터, ENV로 스왑)
- 앱인토스(App-in-Toss) 미니앱 호환을 고려한 가벼운 번들과 외부 링크 어댑터

## 기술 스택

- Next.js 15 App Router · TypeScript · Tailwind CSS
- LLM: **Upstage Solar**(기본, 한국어 특화·무료 티어) / Anthropic Claude / OpenAI / Gemini
- 웹 검색: Anthropic은 네이티브 `web_search`, 그 외 공급자는 Tavily(무료 1000회/월) function tool
- Zod · react-hook-form · react-markdown(rehype-sanitize)
- 배포: Vercel(Hobby, 한국 리전 `icn1`)
- (선택) Supabase — opt-in 비식별 대화 이력 저장 (30일 TTL, RLS 활성)

## 디렉터리

```
src/
├─ app/                    # 페이지 + API 라우트
│  ├─ page.tsx             # 입력 폼
│  ├─ chat/page.tsx        # 응답 스트리밍
│  ├─ about / privacy / terms
│  └─ api/chat/route.ts    # SSE
├─ components/             # UI 컴포넌트
├─ lib/
│  ├─ schema.ts            # Zod 입력 검증
│  ├─ pii.ts               # 마스킹/버킷화
│  ├─ regions.ts · income.ts
│  ├─ prompts/             # 시스템 프롬프트
│  ├─ kb/                  # 시드 KB 로더/필터
│  ├─ llm/                 # 공급자 추상화
│  ├─ tools/               # web_search 도메인 화이트리스트
│  ├─ toss/                # 앱인토스 어댑터(Phase 2)
│  ├─ logger.ts · ratelimit.ts
└─ data/
   ├─ programs/central/*.md   # 중앙정부 핵심 사업 큐레이션 KB
   ├─ regions.json
   └─ median-income.json

db/
├─ schema.sql                 # Supabase 테이블·RLS 스키마
└─ README.md                  # Supabase 셋업 절차
```

## 로컬 실행

### 옵션 A: GitHub Codespaces (브라우저, iPad 가능) — 권장

저장소 페이지 → **Code** → **Codespaces** → **Create codespace**.
Node.js·pnpm·git이 미리 설치되어 있고, 시크릿(`UPSTAGE_API_KEY` 등)은
[GitHub Codespaces 시크릿](https://github.com/settings/codespaces)에 등록 시
자동 주입된다. 자세한 절차는 [`.devcontainer/README.md`](.devcontainer/README.md).

### 옵션 B: 로컬 머신

```bash
pnpm install
cp .env.example .env.local
# .env.local 편집 (절대 .env.example에 실제 키 넣지 말 것):
#   LLM_PROVIDER=upstage
#   UPSTAGE_API_KEY=up-...        # https://console.upstage.ai → API Keys
#   TAVILY_API_KEY=tvly-...       # (권장) https://app.tavily.com → API Keys
#   SUPABASE_URL=...              # (선택) Supabase 로깅용
#   SUPABASE_SERVICE_ROLE_KEY=... # (선택) Supabase 로깅용
pnpm dev
# http://localhost:3000
```

타입 검사: `pnpm typecheck` · 빌드: `pnpm build` · 번들 분석: `pnpm analyze`

### LLM 공급자 선택

| 공급자 | 한국어 | 비용 | 웹 검색 | 비고 |
|---|---|---|---|---|
| **Upstage Solar** (기본) | ⭐⭐⭐⭐ | 무료 티어(`solar-pro2`) | Tavily function tool | OpenAI 호환, console.upstage.ai 가입 |
| Anthropic Claude | ⭐⭐⭐⭐⭐ | 유료 | 네이티브 `web_search_20250305` | prompt caching 30~50% 절감 |
| OpenAI / Gemini | — | — | — | 어댑터 stub만 (미구현) |

ENV `LLM_PROVIDER`로 스왑. Upstage 사용 시 `TAVILY_API_KEY`가 없으면 시드 KB만으로 응답하며 응답에 「최신성 확인 필요」가 명시된다.

## Vercel 배포

1. GitHub에 푸시 후 Vercel에서 Import.
2. Framework: Next.js (자동 감지). Region: `icn1 (Seoul)`.
3. Environment Variables(Production+Preview):
   - **Upstage(기본)**: `LLM_PROVIDER=upstage` · `UPSTAGE_API_KEY=up-...` · `UPSTAGE_MODEL=solar-pro2` · `TAVILY_API_KEY=tvly-...`
   - **Anthropic(대안)**: `LLM_PROVIDER=anthropic` · `ANTHROPIC_API_KEY=sk-ant-...` · `ANTHROPIC_MODEL=claude-sonnet-4-5`
   - **(선택) Supabase**: `SUPABASE_URL=...` · `SUPABASE_SERVICE_ROLE_KEY=...` — opt-in 로그 활성화 시. 셋업: `db/README.md` 참고
4. Deploy 클릭. `vercel.json`에서 `/api/chat` 함수 `maxDuration=60`s 가 설정되어 있다.

### Supabase 데이터 저장 (선택)

opt-in 동의자 비식별 대화를 30일 TTL로 보존하려면:

1. https://supabase.com → New Project (Northeast Asia/Seoul 또는 Singapore)
2. Settings → API → `Project URL` + `service_role` 키 복사
3. SQL Editor에서 [`db/schema.sql`](db/schema.sql) 실행 — 테이블 2개 + RLS 활성
4. (선택) `pg_cron` 확장 활성 후 `db/schema.sql` 내 cron 블록 주석 해제로 일일 만료 정리
5. `.env.local`/Vercel ENV에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 입력

미설정 시 `recordMetric`/`recordConsentLog`는 stdout 로그만 남기고 서비스는 정상 동작.

자세한 절차·운영 SQL은 [`db/README.md`](db/README.md) 참고.

## 앱인토스(App-in-Toss) 게시 (Phase 2)

본 코드베이스는 앱인토스 미니앱 게시 가능성을 염두에 두고 설계되었다.

| 정책 | 적용 |
|---|---|
| 초기 번들 ≤ 50MB | 코드 스플릿, lazy import, `pnpm analyze`로 검증 |
| 폰트·CDN 의존 최소화 | Pretendard 시스템 폰트 폴백 |
| WebView 환경 감지 | `src/lib/toss/env.ts` |
| 외부 링크 라우팅 | `src/lib/toss/external.ts` (SDK 미주입 시 `_blank` 폴백) |
| 디자인 토큰 swap | `src/styles/theme.ts` ↔ `theme.tds.ts` |
| 결제·인증·푸시·IAA 어댑터 stub | `src/lib/toss/{auth,push,iaa}.ts` |

게시 단계에서:

1. 앱인토스 콘솔(`https://appsintoss.com`) 가입 → 미니앱 정보 등록
2. (선택) mTLS 키 발급 — 서버 통신 시
3. `pnpm build:appsintoss` 빌드, 번들 50MB 이하 확인
4. TDS 디자인 가이드 점검 — Figma 라이브러리, 앱빌더 활용
5. SDK 연동 결정: 토스 로그인(나이 자동입력) / 푸시 / IAA / 토스 포인트 프로모션
6. 번들 업로드 → 자체 QA → 사업자 정보 등록 → 심사 승인

## 시드 KB 갱신 체크리스트(분기별)

`src/data/programs/central/*.md`의 frontmatter `lastVerified`/`staleAfter`를 점검한다.

- [ ] 매년 1월: 보건복지부 「기준 중위소득」 고시 반영 → `data/median-income.json`
- [ ] 분기별: 각 사업 `officialUrl`/`applyUrl` 상태 점검, 금액 갱신
- [ ] 신규 사업/폐지 사업 추가/삭제
- [ ] `staleAfter` 임박 시 우선 갱신

## 라이선스

MIT
