-- 성능 최적화를 위한 인덱스 추가 스크립트
-- Supabase SQL Editor에서 실행해 주세요.

-- 1. 고객사 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients (company_name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at DESC);

-- 2. 매출 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_month ON sales (sales_month DESC);

-- 3. 서비스 이슈 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_client_issues_client_id ON client_issues (client_id);
CREATE INDEX IF NOT EXISTS idx_client_issues_occurrence_date ON client_issues (occurrence_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_issues_created_at ON client_issues (created_at DESC);

-- 4. 고객사 운영 이슈 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_client_operation_issues_client_id ON client_operation_issues (client_id);
CREATE INDEX IF NOT EXISTS idx_client_operation_issues_occurrence_date ON client_operation_issues (occurrence_date DESC);
CREATE INDEX IF NOT EXISTS idx_client_operation_issues_created_at ON client_operation_issues (created_at DESC);
