-- client_issues 테이블에 'status' 컬럼 추가
ALTER TABLE public.client_issues 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '이슈등록';

-- 기존 데이터(있다면)를 기본값으로 업데이트
UPDATE public.client_issues SET status = '이슈등록' WHERE status IS NULL;
