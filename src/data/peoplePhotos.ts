// ─── Photos of people used around the site (home hero, people sections, about, donate)
// Files live in /public/img/people as `<id>-<width>.webp`.
//
// Source and license (four category images replaced, see docs/people-photos.md): every photo was made for قريتي with the Sesame Image app on 2026-11-06
// (realistic photo style, Egyptian Delta village setting, every woman in a hijab that covers
// her hair). They are not stock photos and show no real person, so there is no third-party
// license or credit line to keep. Each one was checked with image analysis for the hijab,
// faces and hands, and for text or watermarks. More detail: docs/people-photos.md

export type PeoplePhotoId =
  | 'delivery'
  | 'teacher'
  | 'nurse'
  | 'babysitter'
  | 'cleaner'
  | 'village-market'
  | 'shop-owner'
  | 'volunteers';

export interface PeoplePhotoInfo {
  /** Widths that exist on disk, smallest first. */
  widths: number[];
  /** Width / height. */
  ratio: [number, number];
  /** Arabic alt text. */
  alt: string;
}

export const PEOPLE_PHOTOS: Record<PeoplePhotoId, PeoplePhotoInfo> = {
  delivery: {
    widths: [480, 960],
    ratio: [4, 3],
    alt: 'شاب من القرية على موتوسيكل التوصيل وراه صندوق الطلبات، في شارع ريفي جنبه نخل وغيطان',
  },
  teacher: {
    widths: [360, 720],
    ratio: [4, 3],
    alt: 'إيد مدرس بتشرح في كشكول على مكتب',
  },
  nurse: {
    widths: [360, 720],
    ratio: [4, 3],
    alt: 'قياس ضغط في البيت من غير ظهور الوجوه',
  },
  babysitter: {
    widths: [360, 720],
    ratio: [4, 3],
    alt: 'إيد جليسة بترتب ألعاب آمنة على سجادة',
  },
  cleaner: {
    widths: [360, 720],
    ratio: [4, 3],
    alt: 'تنظيف رخامة مطبخ بالقفازات',
  },
  'village-market': {
    widths: [640, 1200],
    ratio: [16, 9],
    alt: 'ست محجبة بتشتري طماطم من راجل كبير لابس جلابية عند فرشة خضار في شارع القرية',
  },
  'shop-owner': {
    widths: [480, 960],
    ratio: [4, 3],
    alt: 'صاحب بقالة في القرية واقف ورا الكاونتر ووراه الرفوف مليانة بضاعة',
  },
  volunteers: {
    widths: [480, 960],
    ratio: [4, 3],
    alt: 'شباب وبنات محجبات متطوعين بيجهزوا كراتين رمضان فيها رز وزيت وسكر',
  },
};

export function peoplePhotoSrc(id: PeoplePhotoId, width: number): string {
  return `/img/people/${id}-${width}.webp`;
}

export function peoplePhotoSrcSet(id: PeoplePhotoId): string {
  return PEOPLE_PHOTOS[id].widths.map((w) => `${peoplePhotoSrc(id, w)} ${w}w`).join(', ');
}
