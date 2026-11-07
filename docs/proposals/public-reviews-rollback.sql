-- Rollback by disabling access, retaining all reviews/report/audit data.
-- Revert the feature code separately; do not drop customer records.
begin;
revoke all on function public.submit_review(uuid,integer,text,text) from authenticated;
revoke all on function public.list_public_reviews(text,bigint,text,timestamptz,uuid,integer) from anon,authenticated;
revoke all on function public.my_order_reviews() from authenticated;
revoke all on function public.report_review(uuid,text) from authenticated;
revoke all on function public.review_moderation_queue() from authenticated;
revoke all on function public.moderate_review(uuid,boolean,text) from authenticated;
revoke all on function public.public_review_aggregates(text,bigint[]) from anon,authenticated;
commit;
