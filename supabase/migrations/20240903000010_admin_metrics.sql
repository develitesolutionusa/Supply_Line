create or replace function public.admin_dashboard_metrics(p_since timestamptz)
returns json
language sql
stable
as $$
  select json_build_object(
    'sales_cents', coalesce((
      select sum(total_cents) from public.orders
      where status in ('paid', 'fulfilled') and created_at >= p_since
    ), 0),
    'paid_orders', (
      select count(*) from public.orders
      where status in ('paid', 'fulfilled') and created_at >= p_since
    ),
    'pending_orders', (
      select count(*) from public.orders where status = 'pending'
    ),
    'new_accounts', (
      select count(*) from public.business_accounts where created_at >= p_since
    )
  );
$$;

grant execute on function public.admin_dashboard_metrics(timestamptz) to service_role;
