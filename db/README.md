# Supabase 셋업

복지매칭(welfare) 서비스의 opt-in 비식별 로그 저장소를 Supabase로 셋업하는 절차.

> **참고**: Supabase 미설정 시에도 서비스는 정상 동작한다. `recordMetric`은 stdout으로,
> `recordConsentLog`는 stub 로그만 출력한다. opt-in 로그를 실제로 보존하고 싶을 때만 셋업하면 된다.

## 1. 프로젝트 생성

1. https://supabase.com → Sign Up (GitHub 로그인 가능)
2. New Project
   - Name: `welfare` (또는 임의)
   - Database Password: 강력한 패스워드 (기록해 둘 것)
   - Region: **Northeast Asia (Seoul)** 가능, 안 되면 **Singapore**
   - Pricing Plan: Free (500MB DB / 5GB egress / 50K MAU 무료)
3. 약 2~3분 후 프로젝트 활성화

## 2. API 키 확보

Settings → API 메뉴에서:

| 키 | 용도 | 클라이언트 노출 |
|---|---|---|
| `Project URL` | `SUPABASE_URL` | ✅ 가능 |
| `anon` public key | (이 프로젝트에서는 사용 안 함) | ✅ 가능 |
| `service_role` secret key | `SUPABASE_SERVICE_ROLE_KEY` | ❌ **서버 전용** |

> ⚠️ `service_role` 키는 RLS를 우회한다. 절대 클라이언트 코드/공개 저장소에 노출하지 말 것.
> 본 프로젝트에서는 `src/lib/supabase.ts`에서 서버 라우트(`/api/chat`)에서만 import한다.

## 3. 스키마 적용

SQL Editor → New query → `db/schema.sql` 전체 붙여넣기 → Run.

생성되는 객체:

- `public.welfare_metric` — 비동의 사용자 메트릭 (입력값 미저장)
- `public.welfare_consent_log` — opt-in 사용자 마스킹된 대화 (30일 TTL)
- 두 테이블 모두 RLS 활성, 인덱스 포함

## 4. (선택) 30일 자동 정리 — pg_cron

Supabase Free 티어에서 사용 가능.

1. Database → Extensions → 검색 `pg_cron` → Enable
2. SQL Editor에서 `db/schema.sql`의 `cron.schedule(...)` 블록 주석 해제 후 Run
3. 확인: `select * from cron.job;`

미활성 시 대안: Vercel Cron 또는 외부 스케줄러로 주 1회 다음 SQL 실행 (anon으로는 불가, service_role 필요):

```sql
delete from public.welfare_consent_log where expires_at < now();
```

## 5. 환경변수 설정

### 로컬

`.env.local` 파일에 추가:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### Vercel

Project Settings → Environment Variables → Production + Preview에 동일 항목 추가.

## 6. 검증

1. `pnpm dev` 후 http://localhost:3000 폼 제출 (opt-in 미동의)
2. Supabase → Table Editor → `welfare_metric` 에 1행 추가 확인
3. 폼 제출 (opt-in 동의)
4. `welfare_consent_log` 에 1행 추가, `masked_profile`/`masked_response`에 PII 미포함 확인:

```sql
select session_id, sido, masked_profile, masked_response, citations, expires_at
from public.welfare_consent_log
order by created_at desc
limit 5;
```

## 7. 운영 모니터링

자주 쓰는 쿼리:

```sql
-- 일별 요청 수 (지난 7일)
select date_trunc('day', created_at) as day, count(*)
from public.welfare_metric
where created_at > now() - interval '7 days'
group by 1 order by 1 desc;

-- 시도별 분포
select sido, count(*) from public.welfare_metric group by sido order by count desc;

-- 평균 지연시간/토큰
select round(avg(latency_ms)) as avg_latency_ms,
       round(avg(tokens_in)) as avg_in,
       round(avg(tokens_out)) as avg_out
from public.welfare_metric
where created_at > now() - interval '24 hours';

-- 동의 비율
select
  (select count(*) from public.welfare_consent_log) as consenting,
  (select count(*) from public.welfare_metric) as metric_only;
```

## 백업·이관

Supabase Free는 7일 PITR 보존. 무료 티어 한계 도달 시 Pro($25/월)로 업그레이드 또는
`pg_dump`로 export 후 자체 Postgres로 이관 가능 (logger.ts는 Postgres 변경에 무관).
