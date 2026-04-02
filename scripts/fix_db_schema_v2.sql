-- 1. 필수 컬럼 확인 및 추가 (status, responder_name)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_issues' AND column_name = 'status') THEN
        ALTER TABLE public.client_issues ADD COLUMN status TEXT DEFAULT '이슈등록';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_issues' AND column_name = 'responder_name') THEN
        ALTER TABLE public.client_issues ADD COLUMN responder_name TEXT;
    END IF;
END $$;

-- 2. 강제로 스키마 캐시 갱신을 유도하기 위한 구문들
-- 테이블에 주석을 달면 스키마 캐시가 새로고침되는 경우가 많습니다.
COMMENT ON TABLE public.client_issues IS 'Client Issues Table (Updated at ' || now() || ')';

-- 3. PostgREST 캐시 초기화 시도 (Supabase 내부 엔진에 시그널 전달)
NOTIFY pgrst, 'reload schema';

-- 4. 확인 쿼리 (실행 후 Result 탭에서 확인하세요)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_issues' 
AND column_name IN ('status', 'responder_name');
