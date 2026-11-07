import { useState } from 'react';
import { Share2, Copy, X } from 'lucide-react';
import { catalogShareUrl, type CatalogKind } from '@/utils/catalogLinks';
import { Modal } from '@/components/ui/Modal';
export function CatalogShareButton({ kind, id, name }: { kind: CatalogKind; id: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const url = catalogShareUrl(kind, id);
  const text = `${name} على قريتي`;
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: text, text, url }); return; }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return; }
    }
    setOpen(true);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url); setStatus('تم نسخ الرابط'); }
    catch { setStatus('النسخ مش متاح هنا. دوس مطولًا على الرابط وانسخه.'); }
  }
  return <span onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}>
    <button type="button" onClick={() => void share()} aria-label={`مشاركة ${name}`} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-green/20 bg-white px-3 text-green font-bold text-xs"><Share2 size={17} aria-hidden="true" />مشاركة</button>
    {open && <Modal isOpen onClose={() => setOpen(false)} title={`مشاركة ${name}`}>
      <p className="text-sm text-text-muted mb-4">ابعت رابط مباشر. فتح واتساب مش بيبعت الرسالة لوحده، إنت بتختار الشخص وبتراجعها.</p>
      <a className="flex justify-center bg-green text-white rounded-xl p-3 font-bold" href={`whatsapp://send?text=${encodeURIComponent(`${text}\n${url}`)}`}>فتح واتساب المثبت</a>
      <button type="button" onClick={() => void copy()} className="flex items-center justify-center gap-2 w-full border border-green/20 rounded-xl p-3 mt-3 text-green font-bold"><Copy size={17} />نسخ الرابط</button>
      <input aria-label="رابط المشاركة" readOnly value={url} onFocus={e => e.currentTarget.select()} className="w-full border border-gray-200 rounded-lg p-3 mt-3 text-xs bg-cream" dir="ltr" />
      <p role="status" className="text-sm text-green mt-2">{status}</p>
      <button type="button" onClick={() => setOpen(false)} className="p-3 text-text-muted flex items-center gap-1"><X size={16} />إغلاق</button>
    </Modal>}
  </span>;
}
