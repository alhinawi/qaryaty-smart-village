-- Customers change their own phone from the profile form (حسابي).
-- The phone column stays out of the update grant on profiles; this function is
-- the only way the app changes it, and it checks the Egyptian mobile format.
-- The phone is a contact field, not a login: it stays non-unique (two family
-- members may share one number), and nothing is limited per phone. QARYA1 is
-- once per account (orders_one_promo_per_user on user_id, discount_code), so a
-- new phone number doesn't give a second first order.
create or replace function public.update_my_phone(p_phone text)
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare
  v_phone text := btrim(coalesce(p_phone, ''));
  result  public.profiles;
begin
  if auth.uid() is null then
    raise exception 'profile:not_signed_in' using errcode = '42501';
  end if;
  if public.is_blocked() then
    raise exception 'profile:blocked' using errcode = '42501';
  end if;
  if v_phone !~ '^01[0125][0-9]{8}$' then
    raise exception 'profile:bad_phone' using errcode = '22023';
  end if;
  update public.profiles set phone = v_phone where id = auth.uid() returning * into result;
  if result.id is null then
    raise exception 'profile:not_found' using errcode = 'P0002';
  end if;
  return result;
end $$;

revoke all on function public.update_my_phone(text) from public, anon;
grant execute on function public.update_my_phone(text) to authenticated;
