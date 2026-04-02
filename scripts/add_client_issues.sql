-- 1. client_issues 테이블 생성
CREATE TABLE IF NOT EXISTS public.client_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  issue_content TEXT NOT NULL,
  occurrence_subject TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  title TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  construction_team TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  action_taken TEXT,
  fu_required_team TEXT,
  preventive_measure TEXT,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS 활성화 및 권한 설정
ALTER TABLE public.client_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users" ON public.client_issues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for all authenticated users" ON public.client_issues
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for all authenticated users" ON public.client_issues
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for all authenticated users" ON public.client_issues
  FOR DELETE TO authenticated USING (true);

-- 3. Storage Bucket 생성 (issue_attachments)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue_attachments', 'issue_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Security Policies
CREATE POLICY "Authenticated users can select issue_attachments" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'issue_attachments');

CREATE POLICY "Authenticated users can insert issue_attachments" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'issue_attachments');

CREATE POLICY "Authenticated users can update issue_attachments" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'issue_attachments');

CREATE POLICY "Authenticated users can delete issue_attachments" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'issue_attachments');
