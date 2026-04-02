-- onboarding_tasks 및 client_onboarding_tasks 테이블 RLS 설정
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자는 모든 작업 가능하도록 정책 추가
CREATE POLICY "인증된 사용자 onboarding_tasks CRUD" ON onboarding_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "인증된 사용자 client_onboarding_tasks CRUD" ON client_onboarding_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 만약 이미 정책이 있다면 중복 에러가 날 수 있으므로 do 블록 사용 권장 (또는 그냥 실행)
-- 여기서는 단순화하여 직접 실행
