create or replace function public.current_app_user()
returns public.users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.users
  where clerk_user_id = coalesce(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claim.sub', true)
  )
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.current_app_user() u where u.role = 'admin'
  )
$$;
