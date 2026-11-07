import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { useAppearanceEnabled } from '@/hooks/useAppearanceEnabled';
import { selectUser, useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useConfirmStore } from '@/stores/useConfirmStore';

const row = 'flex w-full items-center justify-between gap-3 min-h-[64px] py-4 px-1 text-text text-[15px] font-bold bg-transparent border-0 text-right';
export default function SettingsPage() {
  const enabled = useAppearanceEnabled(); const user = useAuthStore(selectUser);
  const logout = useAuthStore(s => s.logout); const navigate = useNavigate();
  const openNotifications = useUIStore(s => s.setIsNotificationsOpen); const ask = useConfirmStore(s => s.ask);
  const [busy, setBusy] = useState(false);
  async function signOut() {
    if (busy || !await ask({ title: 'تسجيل الخروج', message: 'تخرج من حسابك على الجهاز ده؟', confirmLabel: 'تسجيل الخروج', cancelLabel: 'رجوع' })) return;
    setBusy(true); try { await logout(); navigate('/'); } finally { setBusy(false); }
  }
  return <section className="p-4 max-w-xl mx-auto">
    <h1 className="text-2xl font-black text-text mb-5">الإعدادات</h1>
    <div className="bg-white rounded-2xl px-4 border border-green/10 divide-y divide-green/10">
      <Link to="/profile" className={row}><span>معلومات الحساب</span><ChevronLeft size={19} aria-hidden="true" className="text-text-muted shrink-0" /></Link>
      <Link to="/settings/addresses" className={row}><span>عناوين التوصيل</span><ChevronLeft size={19} aria-hidden="true" className="text-text-muted shrink-0" /></Link>
      <button type="button" onClick={() => openNotifications(true)} className={row}><span>الإشعارات</span><span className="inline-flex items-center gap-2 text-text-muted text-xs"><span>داخل التطبيق</span><ChevronLeft size={19} aria-hidden="true" /></span></button>
      <div className={row}><span>اللغة</span><span className="text-text-muted text-sm">العربية</span></div>
      <div className={row}><span>الدولة</span><span className="text-text-muted text-sm">مصر</span></div>
      {enabled === true && <Link to="/settings/appearance" className={row}><span>شكل التطبيق</span><span className="inline-flex items-center gap-2 text-text-muted text-xs">الثيمات<ChevronLeft size={19} aria-hidden="true" /></span></Link>}
      {user ? <button type="button" disabled={busy} onClick={() => void signOut()} className={`${row} text-red-700 disabled:opacity-50`}><span>{busy ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}</span><ChevronLeft size={19} aria-hidden="true" /></button> : <Link to="/login" className={row}><span>تسجيل الدخول</span><ChevronLeft size={19} aria-hidden="true" /></Link>}
    </div>
    <p className="text-[11px] text-text-muted leading-relaxed mt-3">اللغة والدولة ثابتين حاليًا. الإشعارات متاحة داخل التطبيق، مش إشعارات على شاشة الموبايل.</p>
<Link to="/terms" className="block text-green font-bold py-3">شروط الاستخدام والتنبيهات</Link>
  </section>;
}

