-- 복지매칭 (welfare) — Supabase 스키마
-- 실행 위치: Supabase SQL Editor (https://supabase.com → 프로젝트 → SQL Editor)
--
-- 두 테이블 모두 RLS를 활성화하여 anon/authenticated 키로는 접근 불가.
-- service_role 키만 RLS를 우회하므로 서버(`src/lib/supabase.ts`)에서만 쓰기 가능.

-- ============================================================================
-- 1. welfare_metric — 비동의 사용자 운영 메트릭 (입력값 일체 미저장)
-- ============================================================================
create table if not exists public.welfare_metric (
  session_id  uuid        primary key,
  created_at  timestamptz not null default now(),
  sido        text        not null,
  latency_ms  int         not null,
  tokens_in   int         not null,
  tokens_out  int         not null,
  error_type  text
);

create index if not exists welfare_metric_created_idx
  on public.welfare_metric (created_at desc);

alter table public.welfare_metric enable row level security;
-- 정책 미정의 → 모든 anon/authenticated 권한 차단(서비스 role은 RLS 우회).

-- ============================================================================
-- 2. welfare_consent_log — opt-in 사용자 마스킹된 대화 (30일 TTL)
-- ============================================================================
create table if not exists public.welfare_consent_log (
  session_id      uuid        primary key,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  sido            text        not null,
  latency_ms      int         not null,
  tokens_in       int         not null,
  tokens_out      int         not null,
  error_type      text,
  masked_profile  jsonb       not null,
  masked_response text        not null,
  citations       jsonb       not null default '[]'::jsonb
);

create index if not exists welfare_consent_log_expires_idx
  on public.welfare_consent_log (expires_at);

create index if not exists welfare_consent_log_created_idx
  on public.welfare_consent_log (created_at desc);

alter table public.welfare_consent_log enable row level security;

-- ============================================================================
-- 3. (선택) 30일 만료 자동 정리 — pg_cron 활성 시 주석 해제 후 실행
-- ============================================================================
-- Supabase 무료 티어에서도 pg_cron 사용 가능 (Database → Extensions → pg_cron).
-- 매일 새벽 3시(UTC) 만료된 행 삭제. 시간대는 UTC 기준이므로 한국시 12시(정오)에 실행됨.
--
-- create extension if not exists pg_cron;
-- select cron.schedule(
--   'cleanup_welfare_consent_log',
--   '0 3 * * *',
--   $$delete from public.welfare_consent_log where expires_at < now()$$
-- );
--
-- 활성 cron 확인: select * from cron.job;
-- 실행 이력:     select * from cron.job_run_details order by start_time desc limit 20;

-- ============================================================================
-- 4. 동의 철회용 삭제 함수 (선택) — 사용자 본인이 session_id 알 때 호출
-- ============================================================================
-- 사용자에게 응답 페이지에서 session_id를 보여주고, 「내 데이터 삭제」 버튼을 통해
-- 다음 RPC를 호출하면 서비스 role 없이도 삭제 가능. (Phase 2)
--
-- create or replace function public.delete_my_log(p_session_id uuid)
-- returns void
-- language sql
-- security definer
-- as $$
--   delete from public.welfare_consent_log where session_id = p_session_id;
-- $$;
-- grant execute on function public.delete_my_log(uuid) to anon;
