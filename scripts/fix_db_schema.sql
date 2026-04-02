-- [긴급] 이슈 관리 시스템 데이터베이스 복구 SQL
-- Supabase Dashboard -> SQL Editor에 붙여넣고 실행해 주세요.

-- 1. 필수 컬럼(status, responder_name) 추가
ALTER TABLE public.client_issues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '이슈등록';
ALTER TABLE public.client_issues ADD COLUMN IF NOT EXISTS responder_name TEXT;

-- 2. 기존 데이터에 기본값 적용 (필요시)
UPDATE public.client_issues SET status = '이슈등록' WHERE status IS NULL;

-- 3. 스키마 캐시 갱신 유도 (권한 설정 재확인)
ALTER TABLE public.client_issues ENABLE ROW LEVEL SECURITY;

-- [주의] 위 쿼리 실행 후에도 오류가 지속되면 
-- Supabase Dashboard에서 'Reload Schema' 버튼을 클릭해 주시기 바랍니다.
