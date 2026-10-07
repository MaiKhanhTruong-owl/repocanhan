-- CHỈ DUY NHẤT BẢNG TÀI KHOẢN ĐỂ TEST ĐĂNG KÝ & ĐĂNG NHẬP
create table if not exists public.accounts (
  username text primary key,
  password text not null,
  created_at timestamptz default now()
);

-- Mở quyền truy cập đọc/ghi trực tiếp
alter table public.accounts disable row level security;

-- Tạo sẵn 1 tài khoản mẫu để test đăng nhập ngay lập tức:
-- Tài khoản: admin | Mật khẩu: 123456
insert into public.accounts (username, password)
values ('admin', '123456')
on conflict (username) do nothing;
