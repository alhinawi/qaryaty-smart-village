# People category photo update, 2026-11-06

The teacher, nurse, babysitter and cleaner WebP images (360/720 widths) are newly generated generic photoreal scenes, approved by the owner for the people-category cards. They are not photographs of actual providers and not stock photos. No third-party asset was used or purchased. Sources: qaryati-photo-teacher.png, qaryati-photo-nurse.png, qaryati-photo-babysitter.png, qaryati-photo-cleaner.png, generated for this project. They show anonymous adult hands/work objects, no children or recognizable faces. Inspected both sources and rendered mobile cards. WebP quality78.

This release deliberately leaves the hero, services, restaurants, about and donation images unchanged.

## Historical record for original assets (category rows superseded above)

# صور الناس في قريتي

All photos in `public/img/people/` were generated for قريتي with the Sesame Image app on 2026-11-06.
They are not stock photos and do not show real people, so no third-party license or credit applies.

Rules they follow: realistic photo style, Egyptian Delta village setting, Egyptian-looking people,
modest clothes, and every woman wears a hijab that fully covers her hair.

Each image was checked with image analysis (objects, scene, text) for: hijab with hair covered,
no distorted faces or hands, no text or watermarks, fits where it is used. Rejected images were
regenerated or edited (for example, product labels removed from the volunteers photo).

Files are WebP, quality 72, in two widths each (1x and 2x), loaded with `srcset`, lazily except
the first photo on a page.

| File | Where | Shows | Source |
| --- | --- | --- | --- |
| delivery-480/960.webp | Home hero | Delivery rider on a motorbike, village road | Sesame Image, generated |
| teacher-360/720.webp | Home, المدرسين tile | Teacher in hijab with two kids | Sesame Image, generated |
| nurse-360/720.webp | Home, الدكاترة والتمريض tile | Nurse in hijab, elderly man | Sesame Image, generated |
| babysitter-360/720.webp | Home, جليسات الأطفال tile | Babysitter in hijab reading to a girl | Sesame Image, generated |
| cleaner-360/720.webp | Home, عمال وعاملات النظافة tile | Cleaner in hijab wiping a counter | Sesame Image, generated |
| village-market-640/1200.webp | About page header | Woman in hijab buying vegetables | Sesame Image, generated |
| shop-owner-480/960.webp | About page, advertise section | Grocery shop owner | Sesame Image, generated |
| volunteers-480/960.webp | Donate page header | Volunteers packing Ramadan boxes | Sesame Image, generated |

## Donation hero replacement, 2026-11-07

The volunteers hero now uses versioned `volunteers-photo-480.webp` and `volunteers-photo-960.webp`, generated for this project in a photoreal style. Four fictional Egyptian adult volunteers pack unbranded food boxes; both women wear hijabs. This is illustrative imagery, not actual charity personnel. No third-party logos or real people. Source: qaryati-charity-realistic.png. Updated metadata to the real 16:9 ratio. No donation, contact or payment details changed.
