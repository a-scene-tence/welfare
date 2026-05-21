-- pg_cron 활성·스케줄·실행 이력 확인
-- 실행 위치: Supabase SQL Editor

-- ============================================================================
-- 1. 확장 활성 확인
-- ============================================================================
-- 결과 없음 → Database → Extensions → pg_cron Enable 후 schema.sql 재실행.
select extname, extversion
from pg_extension
where extname = 'pg_cron';

-- ============================================================================
-- 2. 등록된 스케줄 확인
-- ============================================================================
-- 결과 없음 → schema.sql 의 cron.schedule(...) 두 라인 주석 해제 후 재실행.
select jobid, schedule, command, active, jobname
from cron.job
where jobname = 'cleanup_welfare_consent_log';

-- ============================================================================
-- 3. 최근 실행 이력 (최근 10건)
-- ============================================================================
-- 활성 24h 이내 1건 이상 succeeded 가 보이면 정상.
-- 실패 누적 시 권한·테이블 존재 여부 점검.
select runid, jobid, status, start_time, end_time, return_message
from cron.job_run_details
order by start_time desc
limit 10;

-- ============================================================================
-- 4. 즉시 수동 정리 (테스트용)
-- ============================================================================
-- pg_cron 활성 전이라도 만료된 행을 즉시 삭제하려면 다음 실행.
-- delete from public.welfare_consent_log where expires_at < now();

-- ============================================================================
-- 5. 현재 보관 중인 행 통계
-- ============================================================================
select
  count(*)                                            as total,
  count(*) filter (where expires_at < now())          as expired_now,
  count(*) filter (where expires_at < now() + interval '7 days') as expiring_7d,
  min(created_at)                                     as oldest,
  max(created_at)                                     as newest
from public.welfare_consent_log;
