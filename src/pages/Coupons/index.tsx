// ─── قسايمي: the coupons a customer can use, as cards with copy and «استخدمها»
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Copy, Check, TicketPercent } from 'lucide-react';
import { couponRepo } from '@/repositories';
import { ROUTES } from '@/routes';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCartStore } from '@/stores/useCartStore';
import { useCouponStore } from '@/stores/useCouponStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import { useUserStore } from '@/stores/useUserStore';
import { hasRealOrders } from '@/utils/pricing';
import {
  COUPON_STATUS_LABEL,
  couponConditions,
  couponExpiry,
  couponHeadline,
  couponStatus,
  sortMyCoupons,
  type CouponStatus,
  type MyCoupon,
} from '@/utils/coupons';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older phones: a hidden field and execCommand
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}

const BADGE: Record<CouponStatus, string> = {
  available: 'bg-green/10 text-green',
  upcoming: 'bg-gold/20 text-[#8a6100]',
  used: 'bg-gray-200 text-gray-600',
  expired: 'bg-gray-200 text-gray-600',
  sold_out: 'bg-gray-200 text-gray-600',
  off: 'bg-gray-200 text-gray-600',
};

function CouponCard({ coupon, status, onUse }: { coupon: MyCoupon; status: CouponStatus; onUse: () => void }) {
  const showToast = useUIStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);
  const live = status === 'available';
  const dim = status !== 'available' && status !== 'upcoming';

  const copy = async () => {
    if (await copyText(coupon.code)) {
      setCopied(true);
      showToast(`اتنسخ الكود ${coupon.code}`);
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      showToast('ماقدرناش ننسخه، اكتبه بإيدك');
    }
  };

  return (
    <article
      aria-label={`${coupon.title}: ${couponHeadline(coupon)}`}
      className={`relative flex rounded-2xl overflow-hidden shadow-sm border ${
        dim ? 'bg-gray-50 border-gray-200 grayscale opacity-70' : 'bg-white border-green/15'
      }`}
    >
      {/* The stub with what it gives */}
      <div
        className={`w-[104px] shrink-0 flex flex-col items-center justify-center gap-1 p-3 text-center text-white ${
          dim ? 'bg-gray-400' : 'bg-linear-to-b from-green to-green-dark'
        }`}
      >
        <TicketPercent size={26} aria-hidden="true" />
        <span className="text-[15px] font-black leading-tight">{couponHeadline(coupon)}</span>
      </div>
      {/* The perforation between the stub and the body */}
      <div aria-hidden="true" className="relative w-0 border-r-2 border-dashed border-gray-200">
        <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-cream" />
        <span className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-cream" />
      </div>

      <div className="flex-1 min-w-0 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="m-0 text-[16px] font-black text-green-dark leading-snug">{coupon.title}</h2>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${BADGE[status]}`}>
            {COUPON_STATUS_LABEL[status]}
          </span>
        </div>
        {coupon.description && <p className="m-0 mt-1 text-[13px] text-text-muted leading-relaxed">{coupon.description}</p>}
        <ul className="list-none m-0 mt-2 p-0 flex flex-wrap gap-1.5">
          {couponConditions(coupon).map((line) => (
            <li key={line} className="rounded-full bg-cream px-2.5 py-0.5 text-[12px] font-bold text-green-dark">
              {line}
            </li>
          ))}
          <li className="rounded-full bg-cream px-2.5 py-0.5 text-[12px] font-bold text-green-dark">⏳ {couponExpiry(coupon)}</li>
        </ul>

        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => void copy()}
            aria-label={`انسخ الكود ${coupon.code}`}
            className="flex items-center gap-1.5 min-h-[40px] rounded-xl border-2 border-dashed border-green/40 bg-white px-3 font-black tracking-wider text-green-dark cursor-pointer"
          >
            <span dir="ltr">{coupon.code}</span>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          </button>
          {live && (
            <button
              type="button"
              onClick={onUse}
              className="flex-1 min-h-[40px] rounded-xl bg-gold border-0 px-3 font-black text-[14px] text-green-dark cursor-pointer"
            >
              استخدمها
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CouponsPage() {
  const navigate = useNavigate();
  const signedIn = useAuthStore((s) => Boolean(s.session));
  const orders = useOrderStore((s) => s.orders);
  const usedCodes = useUserStore((s) => s.usedPromoCodes);
  const cartCount = useCartStore((s) => s.items.length);
  const setIsCartOpen = useUIStore((s) => s.setIsCartOpen);
  const showToast = useUIStore((s) => s.showToast);
  const setPendingCode = useCouponStore((s) => s.setPendingCode);
  const [list, setList] = useState<MyCoupon[] | null>(null);
  const [failed, setFailed] = useState(false);
  const hasOrders = hasRealOrders(orders);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    couponRepo
      .listMine({ signedIn, hasOrders, usedCodes })
      .then((rows) => alive && setList(rows))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [signedIn, hasOrders, usedCodes]);

  const use = (coupon: MyCoupon) => {
    setPendingCode(coupon.code);
    if (cartCount > 0) {
      setIsCartOpen(true);
    } else {
      showToast(`الكوبون ${coupon.code} جاهز، هيتحط لوحده في أول طلب تعمله`);
      navigate(ROUTES.home);
    }
  };

  const sorted = list ? sortMyCoupons(list, signedIn) : [];
  const live = sorted.filter((c) => ['available', 'upcoming'].includes(couponStatus(c, signedIn)));
  const past = sorted.filter((c) => !['available', 'upcoming'].includes(couponStatus(c, signedIn)));

  return (
    <div className="max-w-2xl mx-auto px-1 pb-8" dir="rtl">
      <header className="mb-4">
        <h1 className="m-0 text-[22px] font-black text-green-dark">🎟️ قسايمي</h1>
        <p className="m-0 mt-1 text-[14px] text-text-muted">
          ادوس «استخدمها» والكوبون هيتحط لوحده في السلة، أو انسخ الكود واكتبه في خانة الكوبون.
        </p>
      </header>

      {!signedIn && (
        <div className="mb-4 rounded-2xl bg-gold/15 border border-gold/40 p-3.5 text-[13px] font-bold text-green-dark">
          فيه قسايم محتاجة حساب، زي كوبون أول طلب.{' '}
          <Link to={ROUTES.login} state={{ from: ROUTES.coupons }} className="text-green underline">
            سجّل دخول
          </Link>{' '}
          علشان تستخدمها.
        </div>
      )}

      {failed && (
        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-[14px] font-bold text-red-700">
          ماقدرناش نجيب القسايم دلوقتي، جرّب تاني بعد شوية.
        </div>
      )}
      {!list && !failed && (
        <div className="grid gap-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-[140px] rounded-2xl bg-white/70 animate-pulse" />
          ))}
        </div>
      )}

      {list && live.length === 0 && (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="m-0 text-[36px]" aria-hidden="true">🎟️</p>
          <p className="m-0 mt-2 font-black text-green-dark">مفيش قسايم متاحة دلوقتي</p>
          <p className="m-0 mt-1 text-[13px] text-text-muted">أول ما ينزل كوبون جديد هتلاقيه هنا.</p>
        </div>
      )}

      <div className="grid gap-3">
        {live.map((c) => (
          <CouponCard key={c.id} coupon={c} status={couponStatus(c, signedIn)} onUse={() => use(c)} />
        ))}
      </div>

      {past.length > 0 && (
        <section className="mt-6">
          <h2 className="m-0 mb-2 text-[15px] font-black text-text-muted">استخدمتها أو خلصت</h2>
          <div className="grid gap-3">
            {past.map((c) => (
              <CouponCard key={c.id} coupon={c} status={couponStatus(c, signedIn)} onUse={() => use(c)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
