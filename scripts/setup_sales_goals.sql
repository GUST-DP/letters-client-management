-- 1. 매출 목표 테이블 생성
CREATE TABLE IF NOT EXISTS public.sales_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_type VARCHAR(10) NOT NULL CHECK (goal_type IN ('monthly', 'yearly')),
    target_date VARCHAR(10) NOT NULL, -- '2026-03' 또는 '2026'
    amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(goal_type, target_date)
);

-- 2. RLS 설정
ALTER TABLE public.sales_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" 
ON public.sales_goals FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 3. 초기 더미 데이터 (옵션)
INSERT INTO public.sales_goals (goal_type, target_date, amount)
VALUES 
('yearly', '2026', 1500000000),
('monthly', '2026-03', 120000000)
ON CONFLICT (goal_type, target_date) DO NOTHING;
