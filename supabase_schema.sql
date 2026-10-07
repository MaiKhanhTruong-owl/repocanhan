-- ========================================================
-- PRINTFLOW - SCRIPT KHỞI TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU
-- ========================================================

-- 1. BẢNG TÀI KHOẢN (Đăng nhập trực tiếp, không phụ thuộc gửi email)
create table if not exists public.accounts (
  username text primary key,
  password text not null,
  created_at timestamptz default now()
);
alter table public.accounts disable row level security;

-- Tạo sẵn 1 tài khoản mẫu để bạn có thể test đăng nhập được ngay lập tức:
-- Tên: admin | Mật khẩu: 123456
insert into public.accounts (username, password)
values ('admin', '123456')
on conflict (username) do nothing;

-- 2. BẢNG QUẢN LÝ CUỘN NHỰA IN 3D (filaments)
create table if not exists public.filaments (
  id text primary key,
  user_id text not null default 'admin',
  name text not null,
  brand text default 'Bambu Lab',
  material text default 'PLA',
  color_name text default 'Đen',
  color_hex text default '#18181b',
  initial_weight numeric default 1000,
  remaining_weight numeric default 1000,
  diameter text default '1.75',
  temp_nozzle text default '210-230',
  temp_bed text default '55-65',
  status text default 'loaded',
  slot text default '',
  price numeric default 0,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.filaments disable row level security;

-- 3. BẢNG QUẢN LÝ FILE MÔ HÌNH 3D (print_files)
create table if not exists public.print_files (
  id text primary key,
  user_id text not null default 'admin',
  name text not null,
  original_file_name text,
  file_type text default 'stl',
  size_bytes bigint default 0,
  category text default 'queued',
  assigned_filament_id text,
  estimated_weight numeric default 0,
  estimated_time text default '1h 30m',
  layer_height text default '0.20',
  infill text default '20%',
  target_printer text default '',
  tags text[] default array[]::text[],
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.print_files disable row level security;
