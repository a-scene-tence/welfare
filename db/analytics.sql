-- 복지매칭 (welfare) — 운영 분석 SQL
-- 실행 위치: Supabase SQL Editor
--
-- 사용법: 각 쿼리를 개별 실행. 결과는 표 형태 또는 Supabase Dashboard 의 차트로 시각화.
-- 보관 정책: welfare_metric 은 별도 TTL 없음(권장 90일 수동 정리), welfare_consent_log 는 30일 TTL.

-- ============================================================================
-- 1. 일별 호출 수 + 평균 latency + 평균 tokens (최근 30일)
-- ============================================================================
select
  date_trunc('day', created_at)::date as day,
  count(*) as calls,
  round(avg(latency_ms))::int as avg_latency_ms,
  round(avg(tokens_in))::int as avg_tokens_in,
  round(avg(tokens_out))::int as avg_tokens_out
from public.welfare_metric
where created_at >= now() - interval '30 days'
group by 1
order by 1 desc;

-- ============================================================================
-- 2. 시·도별 사용량 top 10 (최근 30일)
-- ============================================================================
select
  sido,
  count(*) as calls,
  round(avg(latency_ms))::int as avg_latency_ms,
  count(error_type) as errors
from public.welfare_metric
where created_at >= now() - interval '30 days'
group by sido
order by calls desc
limit 10;

-- ============================================================================
-- 3. 에러율 + 에러 유형 분포 (최근 30일)
-- ============================================================================
select
  coalesce(error_type, 'success') as type,
  count(*) as occurrences,
  round(100.0 * count(*) / sum(count(*)) over (), 2) as pct
from public.welfare_metric
where created_at >= now() - interval '30 days'
group by 1
order by occurrences desc;

-- ============================================================================
-- 4. opt-in 비율 — 동의자 / 전체 비율 (최근 30일)
-- ============================================================================
with metric as (
  select count(*) as n from public.welfare_metric
  where created_at >= now() - interval '30 days'
),
consent as (
  select count(*) as n from public.welfare_consent_log
  where created_at >= now() - interval '30 days'
)
select
  metric.n as total_calls,
  consent.n as consent_calls,
  case when metric.n = 0 then 0
       else round(100.0 * consent.n / metric.n, 2)
  end as consent_pct
from metric, consent;

-- ============================================================================
-- 5. 시·도별 평균 응답 시간 + 95 percentile latency
-- ============================================================================
select
  sido,
  count(*) as calls,
  round(avg(latency_ms))::int as avg_ms,
  percentile_cont(0.5) within group (order by latency_ms)::int as p50_ms,
  percentile_cont(0.95) within group (order by latency_ms)::int as p95_ms,
  max(latency_ms) as max_ms
from public.welfare_metric
where created_at >= now() - interval '30 days'
group by sido
order by calls desc;

-- ============================================================================
-- 6. 주별 트렌드 (지난 12주)
-- ============================================================================
select
  date_trunc('week', created_at)::date as week,
  count(*) as calls,
  round(avg(latency_ms))::int as avg_latency_ms,
  sum(tokens_in) as total_tokens_in,
  sum(tokens_out) as total_tokens_out
from public.welfare_metric
where created_at >= now() - interval '12 weeks'
group by 1
order by 1 desc;

-- ============================================================================
-- 7. 상위 사업 인용 분석 (opt-in 동의자 한정, citations JSONB)
-- ============================================================================
-- citations 필드는 URL 배열. URL 호스트로 그룹핑.
select
  substring(url from 'https?://([^/]+)') as host,
  count(*) as cite_count
from (
  select jsonb_array_elements_text(citations) as url
  from public.welfare_consent_log
  where created_at >= now() - interval '30 days'
) t
group by host
order by cite_count desc
limit 20;

-- ============================================================================
-- 8. 평균 응답 길이 + token cost 추정 (Upstage solar-pro2 기준)
-- ============================================================================
-- 가격 추정: input $0.20/1M, output $0.50/1M (참고: Upstage 공식 페이지에서 확인)
select
  count(*) as calls,
  round(avg(tokens_in))::int as avg_in,
  round(avg(tokens_out))::int as avg_out,
  round(sum(tokens_in)::numeric * 0.0000002, 4) as input_cost_usd,
  round(sum(tokens_out)::numeric * 0.0000005, 4) as output_cost_usd,
  round((sum(tokens_in)::numeric * 0.0000002) + (sum(tokens_out)::numeric * 0.0000005), 4)
    as total_cost_usd
from public.welfare_metric
where created_at >= now() - interval '30 days';

-- ============================================================================
-- 9. 보관 상태 점검 — consent_log 만료 임박 / 만료 행 수
-- ============================================================================
select
  case
    when expires_at < now() then 'expired (cleanup pending)'
    when expires_at < now() + interval '7 days' then 'expiring within 7 days'
    when expires_at < now() + interval '30 days' then 'expiring within 30 days'
    else 'fresh'
  end as bucket,
  count(*) as rows
from public.welfare_consent_log
group by 1
order by 1;

-- ============================================================================
-- 10. 응답 본문 길이 분포 (opt-in)
-- ============================================================================
select
  case
    when char_length(masked_response) < 1500 then '< 1500자 (의심: 빈 응답)'
    when char_length(masked_response) < 3000 then '1500~3000자 (정상)'
    when char_length(masked_response) < 5000 then '3000~5000자 (정상)'
    else '5000자+ (응답 중복 의심)'
  end as bucket,
  count(*) as rows,
  round(avg(char_length(masked_response)))::int as avg_chars
from public.welfare_consent_log
where created_at >= now() - interval '30 days'
group by 1
order by 1;
