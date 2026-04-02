-- 1. UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- 2. profiles (사용자/운영팀) 테이블
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'manager',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. cost_centers (코스트센터 기준정보) 테이블
create table cost_centers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. service_types (서비스형태 기준정보) 테이블
create table service_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. clients (전체 고객사 기본 정보) 테이블
create table clients (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  brand_name text,
  business_number text,
  cost_center_id uuid references cost_centers(id) on delete set null,
  status text not null default '협의중',
  contract_type text,
  service_type_id uuid references service_types(id) on delete set null,
  product_category text,
  approval_link text,
  operation_manager_id uuid references profiles(id) on delete set null,
  sales_manager_id uuid references profiles(id) on delete set null,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. client_onboarding (운영 준비 및 리드타임 관리) 테이블
create table client_onboarding (
  client_id uuid primary key references clients(id) on delete cascade,
  sales_start_date date,
  contract_date date,
  service_start_date date,
  service_end_date date,
  operation_readiness numeric default 0,
  operation_difficulty integer,
  initial_sku_count integer,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. sales (매출/미수금) 테이블
create table sales (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade not null,
  sales_month varchar not null,
  total_amount numeric not null default 0,
  deposited_amount numeric default 0, -- 누락된 컬럼 추가
  deposit_status text not null default '대기중',
  payment_lead_time integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- RLS (Row Level Security) 활성화
-- ==========================================
alter table profiles enable row level security;
alter table cost_centers enable row level security;
alter table service_types enable row level security;
alter table clients enable row level security;
alter table client_onboarding enable row level security;
alter table sales enable row level security;

-- 우선 인트라넷 내부망이므로 인증된(로그인한) 가입자는 조회 및 생성, 수정, 삭제 가능하도록 허용
-- (추후 관리자 전용 권한 등 고도화 시 정책 분리)
create policy "인증된 사용자 profiles CRUD" on profiles for all to authenticated using (true) with check (true);
create policy "인증된 사용자 cost_centers CRUD" on cost_centers for all to authenticated using (true) with check (true);
create policy "인증된 사용자 service_types CRUD" on service_types for all to authenticated using (true) with check (true);
create policy "인증된 사용자 clients CRUD" on clients for all to authenticated using (true) with check (true);
create policy "인증된 사용자 client_onboarding CRUD" on client_onboarding for all to authenticated using (true) with check (true);
create policy "인증된 사용자 sales CRUD" on sales for all to authenticated using (true) with check (true);

-- Auth 회원가입 시 public.profiles 테이블 자동 연동 트리거 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 초기 코스트센터/서비스 타입 더미 데이터 (옵션)
-- ==========================================
insert into cost_centers (name) values ('이케아'), ('듀오백'), ('네오스코리아'), ('인노바드'), ('신세계까사'), ('가구 기타고객사'), ('레브릭스'), ('지누스'), ('바이더하임'), ('보니애가구'), ('동서가구'), ('에몬스'), ('오늘의집'), ('가구 외(이종)고객사');
insert into service_types (name) values ('풀필먼트'), ('현장설치(B2B)'), ('배송/설치대행'), ('기타');

-- 8. clients 테이블에 영업 인입 경로 필드 추가 (2026-03-16 반영)
ALTER TABLE clients ADD COLUMN lead_source TEXT;
