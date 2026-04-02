-- client_issues 테이블에 'responder_name' 컬럼 추가
ALTER TABLE public.client_issues 
ADD COLUMN IF NOT EXISTS responder_name TEXT;

-- 기존 데이터 마이그레이션 (필요시)
-- UPDATE public.client_issues SET responder_name = '시스템' WHERE status = '조치완료' AND responder_name IS NULL;
