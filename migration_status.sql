-- 1. 새로운 상태 컬럼 추가
ALTER TABLE clients 
ADD COLUMN progress_status text DEFAULT '협의중',
ADD COLUMN contract_status text DEFAULT '계약진행중';

-- 2. 기존 status 데이터를 기반으로 새로운 컬럼 업데이트 (기존 데이터 보존용 마이그레이션)
UPDATE clients SET
  progress_status = CASE 
    WHEN status IN ('계약중', '계약완료') THEN '운영중'
    WHEN status = '운영중' THEN '운영중'
    WHEN status = '입고대기' THEN '입고대기'
    WHEN status IN ('계약종료', '해지') THEN '운영종료'
    ELSE '협의중'
  END,
  contract_status = CASE 
    WHEN status IN ('계약완료', '운영중', '입고대기', '계약중') THEN '계약완료'
    WHEN status IN ('계약종료', '해지') THEN '계약해지'
    ELSE '계약진행중'
  END;

-- 3. 기존의 구형 status 컬럼 삭제
ALTER TABLE clients DROP COLUMN status;

-- 4. client_onboarding 테이블에 계약 해지일 추가
ALTER TABLE client_onboarding
ADD COLUMN contract_end_date date;
