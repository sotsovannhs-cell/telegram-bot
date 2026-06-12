-- Supabase Schema for SecureAttend

-- 1. extensions
create extension if not exists "uuid-ossp";

-- 2. tables

-- institutions (Multi-tenancy)
create table public.institutions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  contact_email text,
  address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- users (Employees, HR Admins)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  institution_id uuid references public.institutions(id) on delete cascade not null,
  full_name text not null,
  email text,
  role text check (role in ('employee', 'hr_admin', 'super_admin')) default 'employee',
  telegram_chat_id text,
  face_encoding text, -- representation of face vector for matching
  nfc_tag_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- attendance_logs
create table public.attendance_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  check_type text check (check_type in ('check_in', 'check_out')) not null,
  method text check (method in ('gps', 'face', 'qr', 'nfc')) not null,
  location_lat double precision,
  location_lng double precision,
  photo_url text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- payroll_records
create table public.payroll_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  month date not null, -- usually the first day of the month
  base_salary numeric not null default 0,
  deductions numeric not null default 0,
  bonuses numeric not null default 0,
  net_pay numeric not null default 0,
  status text check (status in ('draft', 'processing', 'paid')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security (RLS)

alter table public.institutions enable row level security;
alter table public.users enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.payroll_records enable row level security;

-- (Policies would be here but typically managed via Supabase UI or more complex JWT claims)
-- Example simple policy for users:
create policy "Users can view their own data" on public.users for select using (auth.uid() = id);

-- 4. Realtime
alter publication supabase_realtime add table attendance_logs;
