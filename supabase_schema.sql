create table if not exists public.filaments (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
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

alter table public.filaments enable row level security;
drop policy if exists "User select filaments" on public.filaments;
create policy "User select filaments" on public.filaments for select using (auth.uid() = user_id);
drop policy if exists "User insert filaments" on public.filaments;
create policy "User insert filaments" on public.filaments for insert with check (auth.uid() = user_id);
drop policy if exists "User update filaments" on public.filaments;
create policy "User update filaments" on public.filaments for update using (auth.uid() = user_id);
drop policy if exists "User delete filaments" on public.filaments;
create policy "User delete filaments" on public.filaments for delete using (auth.uid() = user_id);

create table if not exists public.print_files (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
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

alter table public.print_files enable row level security;
drop policy if exists "User select files" on public.print_files;
create policy "User select files" on public.print_files for select using (auth.uid() = user_id);
drop policy if exists "User insert files" on public.print_files;
create policy "User insert files" on public.print_files for insert with check (auth.uid() = user_id);
drop policy if exists "User update files" on public.print_files;
create policy "User update files" on public.print_files for update using (auth.uid() = user_id);
drop policy if exists "User delete files" on public.print_files;
create policy "User delete files" on public.print_files for delete using (auth.uid() = user_id);
