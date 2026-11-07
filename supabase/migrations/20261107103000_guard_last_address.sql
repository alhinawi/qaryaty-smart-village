-- Proposed only. Backup grants/function before applying. Existing after-delete
-- trigger still auto-promotes newest remaining address. No user data deletion.
begin;
create or replace function public.delete_saved_address(p_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'not allowed' using errcode='42501';end if;
 -- Serialize deletes per owner, including requests from separate devices.
 perform 1 from public.profiles where id=auth.uid() and not blocked for update;
 if not found then raise exception 'not allowed' using errcode='42501';end if;
 if not exists(select 1 from public.user_addresses where id=p_id and user_id=auth.uid()) then
 raise exception 'address not found' using errcode='42501';end if;
 if (select count(*) from public.user_addresses where user_id=auth.uid())<=1 then
 raise exception 'add another address first' using errcode='23514';end if;
 delete from public.user_addresses where id=p_id and user_id=auth.uid();
 if not exists(select 1 from public.user_addresses where user_id=auth.uid() and is_default) then
 update public.user_addresses set is_default=true where id=(select id from public.user_addresses where user_id=auth.uid() order by created_at desc,id limit 1);
 end if;
end;
$$;
revoke all on function public.delete_saved_address(uuid) from public;
grant execute on function public.delete_saved_address(uuid) to authenticated;
-- An old client or direct API cannot bypass the last-address check.
revoke delete on public.user_addresses from authenticated;
commit;
