-- ============================================================
-- 煙道 — SNS 機能拡張: comments / bookmarks / follows / view_count
-- ============================================================

-- ---------- view_count（閲覧数） ----------
alter table public.mixes add column if not exists view_count integer not null default 0;

-- ---------- comments（コメント） ----------
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  mix_id     uuid not null references public.mixes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_mix_id_idx on public.comments (mix_id, created_at desc);

-- ---------- bookmarks（保存） ----------
create table if not exists public.bookmarks (
  mix_id     uuid not null references public.mixes(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (mix_id, user_id)
);

-- ---------- follows（フォロー） ----------
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

-- ============================================================ RLS
alter table public.comments  enable row level security;
alter table public.bookmarks enable row level security;
alter table public.follows   enable row level security;

-- comments: 全員閲覧可、本人のみ投稿・削除
create policy "comments_select_all"  on public.comments for select using (true);
create policy "comments_insert_self" on public.comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_self" on public.comments for delete using (auth.uid() = user_id);

-- bookmarks: 本人のみ閲覧・追加・削除（プライベート）
create policy "bookmarks_select_self" on public.bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_self" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_self" on public.bookmarks for delete using (auth.uid() = user_id);

-- follows: 全員閲覧可、本人のみ追加・解除
create policy "follows_select_all"  on public.follows for select using (true);
create policy "follows_insert_self" on public.follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_self" on public.follows for delete using (auth.uid() = follower_id);

-- ---------- 閲覧数インクリメント（RLS を跨いで安全に +1） ----------
create or replace function public.increment_view(p_mix_id uuid)
returns void
language sql
security definer set search_path = public
as $$
  update public.mixes set view_count = view_count + 1 where id = p_mix_id;
$$;
revoke execute on function public.increment_view(uuid) from public;
grant execute on function public.increment_view(uuid) to anon, authenticated;
