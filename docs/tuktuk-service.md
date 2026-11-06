# خدمة اطلب التوكتوك، 2026-11-06

Adds service 43 "اطلب التوكتوك" (delivery category) and 14 demo tuk-tuk drivers (provider ids 148-161, kind `worker`, role "سواق توك توك").

- All drivers are fictional demo people, registered in `src/config/providerImages.ts` like every other sample person. They are not real drivers and no real person's name or photo was used.
- Driver portraits (`public/img/providers/provider-148..161.webp`, 256x256 WebP) are generated photoreal portraits of invented men, in the app's green uniform colors where a uniform shows. Men only, so no hijab question arises; no children, no real likenesses.
- The service image (`public/img/services/service-43.webp`, 480x540 WebP) is a generated photoreal green-and-white tuk-tuk on a village street, in the app colors, with no people and no readable text.
- Pricing is "السعر بالاتفاق" (quote) everywhere: no fares, commission or payment rules were set, pending the owner's decision.
- Database: `supabase/tuktuk-service.sql` inserts only the new ids (idempotent upsert). Backup of the live `services`/`providers` tables before applying it: `supabase/backups/2026-11-06-pre-tuktuk/`.
