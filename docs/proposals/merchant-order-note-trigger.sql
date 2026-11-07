-- PROPOSAL ONLY. Not applied. Review, backup and approval required.
-- Replaces only the existing opt-in WhatsApp queue formatter; no sending or destination changes.
begin;
create or replace function public.enqueue_order_whatsapp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_shop public.shops;
  v_body text;
begin
  -- Master switch first: OFF means nothing is queued, whatever the shop chose.
  if coalesce((select value from public.app_settings where key = 'whatsapp_notifications'), 0) <> 1 then
    return new;
  end if;
  if new.shop_id is null then return new; end if;
  select * into v_shop from public.shops where id = new.shop_id;
  if v_shop.whatsapp_opt_in is not true or v_shop.whatsapp_phone is null then return new; end if;
  v_body := '🛒 طلب جديد من قريتي!' || E'\n\n'
    || 'الطلب: ' || left(new.service_name, 120) || E'\n'
    || case when length(btrim(coalesce(new.notes,'')))>0 then 'ملاحظات العميل: ' || left(btrim(new.notes),1000) || case when length(btrim(new.notes))>1000 then E'\nباقي الملاحظات في تفاصيل الطلب.' else '' end || E'\n' else '' end
    || 'العنوان: ' || left(new.address, 160) || E'\n'
    || 'الموبايل: ' || new.phone || E'\n'
    || 'الإجمالي: ' || coalesce(new.total_amount::text, 'هيتحدد بعد التأكيد') || ' جنيه' || E'\n\n'
    || 'دوس «قبول الطلب» عشان تبدأ تجهزه: https://qaryaty.vercel.app/orders/' || new.id || '/accept?t=' || new.accept_token;
  insert into public.order_whatsapp_queue (order_id, shop_id, phone, body) values (new.id, new.shop_id, v_shop.whatsapp_phone, v_body);
  return new;
end;
$$;

commit;
