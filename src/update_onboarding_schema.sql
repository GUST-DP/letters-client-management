-- client_onboarding_tasks 테이블에 마스터 항목 정보를 저장할 컬럼 추가
-- 이 컬럼들이 존재하면 마스터 데이터가 변경되어도 기존 고객의 체크리스트는 고정됨

ALTER TABLE client_onboarding_tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE client_onboarding_tasks ADD COLUMN IF NOT EXISTS task_name TEXT;
ALTER TABLE client_onboarding_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE client_onboarding_tasks ADD COLUMN IF NOT EXISTS target TEXT;
ALTER TABLE client_onboarding_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;
ALTER TABLE client_onboarding_tasks ADD COLUMN IF NOT EXISTS is_input BOOLEAN DEFAULT FALSE;

-- 기존 데이터가 있다면 마스터에서 채워넣기 (마이그레이션 용도)
UPDATE client_onboarding_tasks cot
SET 
  category = ot.category,
  task_name = ot.task_name,
  description = ot.description,
  target = ot.target,
  sort_order = ot.sort_order,
  is_input = ot.is_input
FROM onboarding_tasks ot
WHERE cot.task_id = ot.id AND cot.task_name IS NULL;
