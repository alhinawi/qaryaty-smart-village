-- Public reviews. PREPARED, NOT APPLIED. Backup + live-schema review required.
begin;
create table public.reviews (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null unique references public.orders(id),
 author_id uuid not null references public.profiles(id),
 target_kind text not null check (target_kind in ('shop','provider','service')),
 target_id bigint not null,
 author_label text not null default 'عميل قريتي',
 stars integer not null check (stars between 1 and 5),
 body text not null default '' check (char_length(body)<=1000),
 created_at timestamptz not null default now(),
 status text not null default 'pending' check (status in ('pending','published','hidden'))
);
create index reviews_target_idx on public.reviews(target_kind,target_id,status,created_at desc,id desc);
create table public.review_reports (
 id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id),
 reporter_id uuid not null references public.profiles(id),
 reason text not null check (reason in ('abuse','personal','spam','fake')),
 created_at timestamptz not null default now(), resolved_at timestamptz,
 unique(review_id,reporter_id)
);
create table public.review_moderation_log (
 id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id),
 moderator_id uuid not null references public.profiles(id), action text not null,
 reason text not null, created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
alter table public.review_reports enable row level security;
alter table public.review_moderation_log enable row level security;
-- All access through narrow RPCs only. No public/owner direct writes or reads.
revoke all on public.reviews,public.review_reports,public.review_moderation_log from anon,authenticated;

create function public.review_target_visible(k text,t bigint) returns boolean
language sql stable security definer set search_path=public as $$
 select case k
 when 'shop' then exists(select 1 from public.shops where id=t and not is_demo and not hidden)
 when 'provider' then exists(select 1 from public.providers p join public.services s on s.id=p.service_id where p.id=t and p.active and not p.is_demo and not s.is_demo and not s.hidden)
 when 'service' then exists(select 1 from public.services where id=t and not is_demo and not hidden)
 else false end;
$$;

create function public.submit_review(p_order uuid,p_stars integer,p_body text,p_name text default '') returns uuid
language plpgsql security definer set search_path=public as $$
declare o public.orders; k text; t bigint; rid uuid; label text;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and not blocked) then raise exception 'not allowed' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,723));
 select * into o from public.orders where id=p_order and user_id=auth.uid() for update;
 if not found or o.status<>'done' then raise exception 'completed owned order required' using errcode='42501'; end if;
 if exists(select 1 from public.reviews where order_id=p_order) then raise exception 'already reviewed' using errcode='23505'; end if;
 if p_stars is null or p_stars not between 1 and 5 or char_length(coalesce(p_body,''))>1000 then raise exception 'invalid review' using errcode='22023'; end if;
 label:=btrim(coalesce(p_name,''));
 if label='' then label:='عميل قريتي'; elsif label !~ '^[ء-يA-Za-z]{2,20}$' then raise exception 'first name only' using errcode='22023'; end if;
 if o.shop_id is not null then k:='shop'; t:=o.shop_id;
 elsif o.provider_id is not null then k:='provider'; t:=o.provider_id;
 else k:='service'; t:=o.service_id; end if;
 if t is null or not public.review_target_visible(k,t) then raise exception 'target unavailable' using errcode='42501'; end if;
 if (k='shop' and exists(select 1 from public.shops where id=t and owner_profile_id=auth.uid())) or (k='provider' and exists(select 1 from public.providers where id=t and owner_profile_id=auth.uid())) then raise exception 'self review not allowed' using errcode='42501'; end if;
 if (select count(*) from public.reviews where author_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'daily limit reached' using errcode='54000'; end if;
 insert into public.reviews(order_id,author_id,target_kind,target_id,author_label,stars,body) values(p_order,auth.uid(),k,t,label,p_stars,btrim(coalesce(p_body,''))) returning id into rid;
 return rid;
end;
$$;

create function public.list_public_reviews(p_kind text,p_target bigint,p_sort text default 'newest',p_cursor_time timestamptz default null,p_cursor_id uuid default null,p_cursor_stars integer default null) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if p_sort not in ('newest','highest','lowest') then raise exception 'invalid sort'; end if;
 if not public.review_target_visible(p_kind,p_target) then return jsonb_build_object('rows','[]'::jsonb,'count',0,'average',null,'distribution','[0,0,0,0,0]'::jsonb); end if;
 with eligible as (
 select r.* from public.reviews r join public.orders o on o.id=r.order_id
 where r.target_kind=p_kind and r.target_id=p_target and r.status='published' and o.status='done'
 ), page as (
 select * from eligible r where p_cursor_id is null or
 (case when p_sort='newest' then (r.created_at,r.id)<(p_cursor_time,p_cursor_id)
 when p_sort='highest' then r.stars<p_cursor_stars or (r.stars=p_cursor_stars and (r.created_at,r.id)<(p_cursor_time,p_cursor_id))
 else r.stars>p_cursor_stars or (r.stars=p_cursor_stars and (r.created_at,r.id)<(p_cursor_time,p_cursor_id)) end)
 order by case when p_sort='highest' then stars end desc,case when p_sort='lowest' then stars end asc,created_at desc,id desc limit 20
 ) select jsonb_build_object(
 'rows',coalesce((select jsonb_agg(jsonb_build_object('id',id,'authorLabel',author_label,'stars',stars,'text',body,'createdAt',created_at,'completedOrder',true) order by case when p_sort='highest' then stars end desc,case when p_sort='lowest' then stars end asc,created_at desc,id desc) from page),'[]'::jsonb),
 'count',(select count(*) from eligible),'average',(select round(avg(stars),1) from eligible),
 'distribution',(select jsonb_agg((select count(*) from eligible e where e.stars=n) order by n desc) from generate_series(1,5)n)
 ) into result;
 return result;
end;
$$;

create function public.my_order_reviews() returns table(order_id uuid,status text)
language sql stable security definer set search_path=public as $$
 select r.order_id,r.status from public.reviews r where r.author_id=auth.uid();
$$;

create function public.report_review(p_review uuid,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and not blocked) then raise exception 'not allowed' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,724));
 if p_reason not in ('abuse','personal','spam','fake') then raise exception 'invalid reason' using errcode='22023'; end if;
 if not exists(select 1 from public.reviews r join public.orders o on o.id=r.order_id where r.id=p_review and r.status='published' and o.status='done' and public.review_target_visible(r.target_kind,r.target_id)) then raise exception 'review unavailable' using errcode='42501'; end if;
 if (select count(*) from public.review_reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'daily limit reached' using errcode='54000'; end if;
 insert into public.review_reports(review_id,reporter_id,reason) values(p_review,auth.uid(),p_reason) on conflict(review_id,reporter_id) do nothing;
end;
$$;

create function public.review_moderation_queue() returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if not public.can_review_content() then raise exception 'not allowed' using errcode='42501'; end if;
 select coalesce(jsonb_agg(row_to_json(q)),'[]'::jsonb) into result from (
 select r.id,r.target_kind,r.target_id,r.author_label,r.stars,r.body,r.created_at,r.status,
 (select count(*) from public.review_reports x where x.review_id=r.id and x.resolved_at is null) as reports_count,
 coalesce((select jsonb_agg(jsonb_build_object('reason',x.reason,'created_at',x.created_at)) from public.review_reports x where x.review_id=r.id and x.resolved_at is null),'[]'::jsonb) as report_reasons
 from public.reviews r where r.status='pending' or exists(select 1 from public.review_reports x where x.review_id=r.id and x.resolved_at is null)
 order by r.created_at,r.id limit 100
 )q;
 return result;
end;
$$;
create function public.moderate_review(p_review uuid,p_publish boolean,p_reason text) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.can_review_content() then raise exception 'not allowed' using errcode='42501'; end if;
 if p_publish is null or char_length(btrim(coalesce(p_reason,''))) not between 3 and 500 then raise exception 'moderation reason required' using errcode='22023'; end if;
 perform 1 from public.reviews where id=p_review for update;
 if not found then raise exception 'review unavailable'; end if;
 update public.reviews set status=case when p_publish then 'published' else 'hidden' end where id=p_review;
 insert into public.review_moderation_log(review_id,moderator_id,action,reason) values(p_review,auth.uid(),case when p_publish then 'published' else 'hidden' end,btrim(p_reason));
 update public.review_reports set resolved_at=now() where review_id=p_review and resolved_at is null;
end;
$$;
create function public.public_review_aggregates(p_kind text,p_ids bigint[]) returns table(target_id bigint,average numeric,review_count bigint)
language sql stable security definer set search_path=public as $$
 select r.target_id,round(avg(r.stars),1),count(*) from public.reviews r join public.orders o on o.id=r.order_id
 where r.target_kind=p_kind and r.target_id=any(p_ids[1:1000]) and r.status='published' and o.status='done' and public.review_target_visible(r.target_kind,r.target_id)
 group by r.target_id;
$$;
revoke all on function public.public_review_aggregates(text,bigint[]) from public;
grant execute on function public.public_review_aggregates(text,bigint[]) to anon,authenticated;
-- Helpers and RPCs are not callable through PostgreSQL's default PUBLIC grant.
revoke all on function public.review_target_visible(text,bigint) from public;
revoke all on function public.submit_review(uuid,integer,text,text) from public;
revoke all on function public.list_public_reviews(text,bigint,text,timestamptz,uuid,integer) from public;
revoke all on function public.my_order_reviews() from public;
revoke all on function public.report_review(uuid,text) from public;
revoke all on function public.review_moderation_queue() from public;
revoke all on function public.moderate_review(uuid,boolean,text) from public;
grant execute on function public.list_public_reviews(text,bigint,text,timestamptz,uuid,integer) to anon,authenticated;
grant execute on function public.submit_review(uuid,integer,text,text),public.my_order_reviews(),public.report_review(uuid,text),public.review_moderation_queue(),public.moderate_review(uuid,boolean,text) to authenticated;
commit;
