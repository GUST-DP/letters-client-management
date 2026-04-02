-- 계정관리 기능을 위한 profiles 테이블 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- 1. 팀명 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team TEXT;

-- 2. 메뉴 권한 JSON 어레이 컬럼 추가
--    예: '["dashboard","clients","sales","settings","accounts"]'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS menu_permissions JSONB DEFAULT '["dashboard","clients","sales","settings","accounts"]'::jsonb;

-- 3. 기존 데이터 초기화 (전체 권한 부여)
UPDATE profiles 
SET menu_permissions = '["dashboard","clients","sales","settings","accounts"]'::jsonb
WHERE menu_permissions IS NULL;

-- 확인 쿼리
SELECT id, email, full_name, role, team, menu_permissions FROM profiles;
