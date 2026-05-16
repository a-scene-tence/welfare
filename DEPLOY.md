# 배포 가이드 (Vercel)

이 문서는 **welfare** 저장소를 Vercel 에 배포하는 단계 + 운영 가이드입니다.

## 1. Vercel 프로젝트 생성

1. https://vercel.com → 로그인.
2. **Add New → Project** → `Import Git Repository` → `a-scene-tence/welfare` 선택.
3. **Framework Preset**: Next.js (자동 감지).
4. **Build & Output Settings**: 기본값 유지 (Next.js 가 자동 설정).
5. **Root Directory**: `./` (기본).
6. **Environment Variables**: 아래 §2 참고.
7. **Deploy** 클릭 → 첫 production 배포 시작 (약 3분).

## 2. 환경 변수

Vercel Dashboard → Project → **Settings → Environment Variables** 에서 등록.

각 변수는 **Production / Preview / Development** 환경별 분리 가능 (권장: 동일 키 또는 production-only).

### 2.1 필수 (서비스 기본 동작)

| 키 | 예시 값 | 비고 |
|---|---|---|
| `LLM_PROVIDER` | `upstage` | `anthropic` / `openai` / `gemini` / `upstage` 중 택일. `upstage` 권장 (한국어 특화, solar-pro2 무료 티어). |
| `UPSTAGE_API_KEY` | `up-...` | https://console.upstage.ai → API Keys. `LLM_PROVIDER=upstage` 시 필수. |
| `TAVILY_API_KEY` | `tvly-...` | https://app.tavily.com (무료 1000회/월). Upstage·OpenAI·Gemini provider 의 외부 검색용. |

### 2.2 선택 (확장 기능)

| 키 | 기본값 | 용도 |
|---|---|---|
| `UPSTAGE_MODEL` | `solar-pro2` | Upstage 모델 변경 시. |
| `SUPABASE_URL` | (미설정) | Opt-in 비식별 로깅. 미설정 시 stdout 로그만 사용 (서비스는 정상 동작). |
| `SUPABASE_SERVICE_ROLE_KEY` | (미설정) | 위와 함께 둘 다 설정해야 활성. |
| `UPSTASH_REDIS_REST_URL` | (미설정) | IP rate limit 활성. |
| `UPSTASH_REDIS_REST_TOKEN` | (미설정) | 위와 쌍. |
| `RATELIMIT_PER_HOUR` | `10` | 시간당 요청 한도 (Upstash 활성 시). |
| `ANTHROPIC_API_KEY` | (미설정) | `LLM_PROVIDER=anthropic` 사용 시. |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | Anthropic 모델. |

### 2.3 Public (클라이언트 노출)

| 키 | 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_TARGET` | `web` | 빌드 타겟 — `web` (Vercel) 또는 `appsintoss` (앱인토스 미니앱). |

## 3. 리전 / 함수 (이미 설정됨)

`vercel.json` 에 다음 설정 완료:

```json
{
  "regions": ["icn1"],
  "framework": "nextjs",
  "functions": {
    "src/app/api/chat/route.ts": {
      "maxDuration": 60
    }
  }
}
```

- **regions: icn1** — 서울 (한국 사용자 latency 최소).
- **/api/chat maxDuration 60s** — LLM 응답 + 외부 검색 처리 시간 확보.

## 4. Preview vs Production

- **main 브랜치 push** → production 자동 배포 (https://welfare.vercel.app 등 프로젝트 URL).
- **PR push (다른 브랜치)** → preview 자동 배포 → PR 코멘트에 preview URL.

각 PR 마다 격리된 preview 환경 + 별도 환경 변수 (Preview-only 로 설정 가능).

## 5. Rollback

- Vercel Dashboard → **Deployments** 탭 → 안정적이었던 이전 deployment 선택 → **Promote to Production**.
- Git revert + push 보다 빠름.

## 6. Domain / SSL

1. Vercel Dashboard → **Settings → Domains** → **Add Domain**.
2. 도메인 입력 (예: `welfare.example.com`).
3. DNS 설정:
   - `A` 레코드 → `76.76.21.21` (Vercel)
   - 또는 `CNAME` → `cname.vercel-dns.com`
4. SSL 자동 발급 (Let's Encrypt) — 수 분 ~ 수 시간.

## 7. 자동 배포 hook

기본 트리거:
- main push → production
- PR push → preview

추가 트리거 (선택, Vercel Dashboard → Settings → Git → Deploy Hooks):
- KB 데이터 수동 업데이트 후 강제 재배포 URL
- 외부 시스템 (예: cron) 에서 호출 가능

## 8. 모니터링

- Vercel Dashboard → **Analytics** (free tier 가능) — 페이지뷰, latency, top routes
- **Logs** 탭 — `/api/chat` 등 서버 함수 stdout 실시간
- **Speed Insights** — Core Web Vitals

## 9. 비용 (Hobby tier 기준)

| 항목 | 한도 | 비고 |
|---|---|---|
| Serverless 호출 | 100GB-hour/월 | /api/chat 1회 ~10MB-sec → 약 36M 호출/월 가능 |
| Bandwidth | 100GB/월 | 일반 한국 트래픽 충분 |
| Build minutes | 6000분/월 | PR push 빈도 영향 |
| Deployment | 무제한 | preview 포함 |

초기 트래픽 0 → Hobby 충분. 트래픽 늘면 Pro ($20/월) 검토.

## 10. 트러블슈팅

### 10.1 첫 배포 build 실패
- **타입 에러**: 로컬 `pnpm typecheck` 통과 확인.
- **환경 변수 누락**: `LLM_PROVIDER` 가 anthropic 이면 `ANTHROPIC_API_KEY` 필요. upstage 면 `UPSTAGE_API_KEY` 필수.
- **빌드 자체는 키 없이도 통과** — runtime 에만 사용.

### 10.2 /api/chat 타임아웃
- `vercel.json` 의 `maxDuration: 60` 확인.
- Upstage 응답이 60초 이상 걸리면 발생 — `maxSearches` 5 유지 권장 (§31).

### 10.3 Preview URL 에서 LLM 호출 실패
- Vercel Settings → Environment Variables → "Preview" 체크박스로 키가 활성됐는지 확인.
- 새 환경 변수 추가 후 재배포 필요.

## 11. 회귀 테스트 연계

- `ci.yml` (PR check): typecheck + unit test + build — Vercel 배포 전 자동 검증.
- `e2e.yml` (nightly): production / preview URL 에서 P1·P2·P3 E2E. 현재는 `localhost:3000` 으로 실행 — 추후 Vercel preview URL 로 옮길 수 있음 (별도 sprint).

## 12. Supabase 로깅 (선택)

opt-in 동의자 대화 이력 + 운영 메트릭을 Supabase 에 저장. **미설정 시에도 서비스는 정상 작동** (stdout 로그만).

### 12.1 셋업 단계

1. https://supabase.com → New Project (자세한 절차: [`db/README.md`](db/README.md)).
   - Region: **Northeast Asia (Seoul)** 권장.
2. SQL Editor → New query → [`db/schema.sql`](db/schema.sql) 전체 붙여넣기 → Run.
3. Settings → API → `Project URL` + `service_role` 키 복사.
4. Vercel Dashboard → Settings → Environment Variables:
   - `SUPABASE_URL` = `Project URL`
   - `SUPABASE_SERVICE_ROLE_KEY` = `service_role` secret (Production + Preview 모두 등록)
5. Vercel 자동 재배포 → 로깅 활성.

### 12.2 분석 SQL

[`db/analytics.sql`](db/analytics.sql) 에 10개 대시보드 쿼리:
- 일별 호출 수 / 평균 latency / 평균 tokens
- 시·도별 사용량 top 10
- 에러율 + 에러 유형 분포
- opt-in 비율 (동의자 / 전체)
- 시·도별 p50 / p95 latency
- 주별 트렌드 (12주)
- citations URL 호스트별 빈도
- token cost 추정 (Upstage solar-pro2 기준)
- consent_log 만료 상태 (만료 임박 / 만료 행)
- 응답 길이 분포 (회귀 의심 감지)

Supabase Dashboard → SQL Editor → 각 쿼리 복사·실행.

### 12.3 pg_cron 자동 정리 (선택)

`welfare_consent_log` 의 30일 TTL 자동 정리. Database → Extensions → pg_cron 활성 후 [`db/schema.sql`](db/schema.sql) §3 주석 해제:

```sql
create extension if not exists pg_cron;
select cron.schedule(
  'cleanup_welfare_consent_log',
  '0 3 * * *',  -- 매일 03:00 UTC (한국 정오)
  $$delete from public.welfare_consent_log where expires_at < now()$$
);
```

### 12.4 동의 철회

사용자가 응답 페이지에서 session_id 를 확인하고 GitHub 이슈로 삭제 요청. Phase 2 의 `delete_my_log` RPC 함수 배포 시 직접 호출 가능.

### 12.5 트러블슈팅

- **`recordMetric` 호출됐는데 행 없음**: `SUPABASE_URL` 또는 `SUPABASE_SERVICE_ROLE_KEY` 오타 / Preview 환경 미적용. Logs 탭에서 `[metric insert] error: ...` 확인.
- **RLS 차단**: schema 의 `enable row level security` 만 있고 정책 없음 → `service_role` 만 RLS 우회. anon/authenticated 키로는 절대 접근 불가 (의도).
- **citations 빈 배열**: 응답 본문에 markdown 링크가 없거나 화이트리스트 도메인 외 → `extractUrls + isWhitelistedDomain` 필터링 결과.
