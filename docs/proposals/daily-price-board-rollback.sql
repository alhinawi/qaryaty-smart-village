-- Stop feature access without deleting merchant data. Revert UI bundle separately.
begin;
revoke execute on function public.list_daily_prices(bigint) from anon,authenticated;
revoke execute on function public.publish_daily_price(bigint,text,text,numeric) from authenticated;
revoke execute on function public.withdraw_daily_price(uuid) from authenticated;
commit;
