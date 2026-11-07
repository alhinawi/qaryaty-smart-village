import { useEffect, useState } from 'react';
import { FamilyOrderPreview } from './FamilyOrderPreview';
export default function FamilyOrderPreviewPage() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex,nofollow'; document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  return <section className="p-5 text-center" aria-label="معاينة طلب لحد تاني">
    <h1 className="text-xl font-extrabold text-green-dark mb-3">معاينة خاصة: اطلب لحد تاني</h1>
    <p className="text-sm text-text-muted mb-4">تصميم تجريبي فقط، مش خدمة شغالة. مفيش رابط مشاركة ولا حفظ بيانات ولا دفع.</p>
    <button type="button" className="text-green font-extrabold p-3" onClick={() => setOpen(true)}>افتح المعاينة</button>
    {open && <FamilyOrderPreview onClose={() => setOpen(false)} />}
  </section>;
}
