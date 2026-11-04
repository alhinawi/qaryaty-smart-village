// ─── Imports
import React, { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/ui/Button';
import { Link, useNavigate } from 'react-router';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { ROUTES } from '@/routes';
import { useReach } from '@/hooks/useReach';
import { VILLAGES, villageLabel } from '@/data/villages';

// ─── Component
export default function ProfilePage() {
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const orders = useOrderStore((state) => state.orders);
  const showToast = useUIStore((state) => state.showToast);
  const user = useAuthStore(selectUser);
  const updateAuthUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const { village, setVillage } = useReach();
  const [villageDraft, setVillageDraft] = useState(village);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      // Signed in: the phone is the account id, so only name/address change
      updateProfile({ name, address });
      void updateAuthUser({ name, address });
    } else {
      updateProfile({ name, phone, address });
    }
    if (villageDraft !== village) setVillage(villageDraft);
    setIsEditing(false);
    showToast('✅ تم حفظ بيانات الحساب بنجاح!');
  };

  const handleLogout = async () => {
    await logout();
    showToast('👋 تم تسجيل الخروج');
    navigate(ROUTES.home);
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'تطبيق قريتي - القرية الذكية',
          text: 'جرب تطبيق قريتي لخدمات وتوصيل القرية واستخدم كود QARYA1 لأول طلب مجاني!',
          url: window.location.href,
        })
        .catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(window.location.origin)
        .then(() => showToast('🔗 تم نسخ رابط دعوة أهالي القرية!'))
        .catch(() => showToast(`🔗 ابعت الرابط ده لأهل القرية: ${window.location.origin}`));
    } else {
      showToast(`🔗 ابعت الرابط ده لأهل القرية: ${window.location.origin}`);
    }
  };

  const targetPoints = 200;
  const progressPercent = Math.min(
    100,
    Math.round((profile.rewardPoints / targetPoints) * 100)
  );

  return (
    <div className="profile-page-container">
      {/* Profile Header */}
      <div className="bg-linear-to-br from-green-dark to-green text-white rounded-2xl p-6 flex items-center gap-5 mb-6">
        <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center text-[32px]">👤</div>
        <div>
          <h2 className="text-[1.375rem] font-black font-['Tajawal',sans-serif]">{profile.name}</h2>
          {user?.username && (
            <p className="text-[13px] opacity-90" dir="ltr">
              @{user.username}
            </p>
          )}
          <p className="text-[13px] opacity-90">📍 {profile.village}</p>
          {user && profile.memberSince && (
            <span className="text-[11px] opacity-70">عضو منذ {profile.memberSince}</span>
          )}
          {!user && (
            <span className="text-[11px] opacity-80">سجّل دخولك عشان تحفظ بياناتك وطلباتك</span>
          )}
        </div>
      </div>

      {/* Account actions */}
      {user ? (
        <div className="flex flex-wrap gap-2.5 mb-5">
          <button type="button" className="btn-cancel" onClick={handleLogout}>
            تسجيل خروج
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 mb-5">
          <Link
            to={ROUTES.login}
            state={{ from: ROUTES.profile }}
            className="flex-1 text-center bg-green text-white rounded-xl py-3 font-extrabold text-sm"
          >
            تسجيل الدخول
          </Link>
          <Link
            to={ROUTES.register}
            state={{ from: ROUTES.profile }}
            className="flex-1 text-center bg-gold text-black rounded-xl py-3 font-extrabold text-sm"
          >
            حساب جديد
          </Link>
        </div>
      )}

      {/* Rewards Points Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gold-light mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[13px] text-text-muted font-bold">🌟 رصيد نقاط المكافآت</span>
            <div className="text-[1.75rem] font-black text-gold font-['Tajawal',sans-serif]">{profile.rewardPoints} نقطة</div>
          </div>
          <span className="text-[36px]">🎁</span>
        </div>

        {/* Progress to Free Delivery */}
        <div className="points-progress-container">
          <div className="h-[10px] bg-gray-100 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full bg-linear-to-r from-gold to-gold-light rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted font-bold">
            <span>
              {profile.rewardPoints} / {targetPoints} نقطة
            </span>
            <span>باقي {Math.max(0, targetPoints - profile.rewardPoints)} نقطة لطلب مجاني!</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm">
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">{orders.length}</span>
          <span className="text-[11px] text-text-muted font-bold">إجمالي الطلبات</span>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm">
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">{profile.rewardPoints}</span>
          <span className="text-[11px] text-text-muted font-bold">نقاط مكتسبة</span>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm">
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">100%</span>
          <span className="text-[11px] text-text-muted font-bold">دعم الاقتصاد المحلي</span>
        </div>
      </div>

      {/* User Information Form */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-extrabold">👤 بيانات الحساب والعنوان</h3>
          {!isEditing && (
            <button
              type="button"
              className="bg-transparent border-none text-green font-extrabold cursor-pointer font-['Cairo',sans-serif] text-[13px]"
              onClick={() => {
                setName(profile.name);
                setPhone(profile.phone);
                setAddress(profile.address);
                setVillageDraft(village);
                setIsEditing(true);
              }}
            >
              تعديل ✏️
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
            <div className="form-group">
              <label htmlFor="profileName">الاسم الكامل</label>
              <input
                id="profileName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profilePhone">رقم الموبايل</label>
              <input
                id="profilePhone"
                type="tel"
                value={user ? user.phone : phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={Boolean(user)}
                aria-describedby={user ? 'profilePhoneHint' : undefined}
                required
              />
              {user && (
                <span id="profilePhoneHint" className="text-[11px] text-text-muted">
                  رقم الموبايل هو اسم الدخول، ومش هيتغير من هنا
                </span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="profileVillage">القرية</label>
              <select id="profileVillage" value={villageDraft} onChange={(e) => setVillageDraft(e.target.value)}>
                {VILLAGES.map((v) => (
                  <option key={v} value={v}>
                    {villageLabel(v)}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-text-muted">بنعرضلك المدرسين والصنايعية من قريتك</span>
            </div>
            <div className="form-group">
              <label htmlFor="profileAddress">العنوان في القرية</label>
              <input
                id="profileAddress"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3 mt-2">
              <Button type="submit" variant="primary" size="md">
                حفظ التغييرات ✓
              </Button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <div>
            {user?.username && (
              <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
                <span className="text-text-muted font-bold min-w-[100px]">👤 اسم المستخدم:</span>
                <span className="font-bold" dir="ltr">
                  @{user.username}
                </span>
              </div>
            )}
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]">📱 رقم الموبايل:</span>
              <span className="font-bold">{profile.phone || '—'}</span>
            </div>
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]">📍 العنوان:</span>
              <span className="font-bold">{profile.address || '—'}</span>
            </div>
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]">🏡 القرية:</span>
              <span className="font-bold">{profile.village}</span>
            </div>
          </div>
        )}
      </div>

      {/* About the app: phones and tablets have no footer, so the link lives here too */}
      <Link
        to={ROUTES.about}
        className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm mb-5 min-h-[44px] font-extrabold text-sm text-green-dark transition-colors hover:bg-cream"
      >
        <span>
          <span aria-hidden="true">🏡</span> عن قريتي
        </span>
        <span aria-hidden="true">⬅️</span>
      </Link>

      {/* WhatsApp groups until the platform launches */}
      <Link
        to={ROUTES.groups}
        className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm mb-5 min-h-[44px] font-extrabold text-sm text-green-dark transition-colors hover:bg-cream"
      >
        <span>
          <span aria-hidden="true">💬</span> جروبات قريتي على واتساب
        </span>
        <span aria-hidden="true">⬅️</span>
      </Link>

      {/* Share with village */}
      <div className="bg-linear-to-br from-[#1e3a8a] to-[#3b82f6] text-white rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h4 className="text-base font-extrabold mb-1">📢 ادعُ أهالي القرية لاستخدام التطبيق</h4>
          <p className="text-xs opacity-85">شارك التطبيق مع جيرانك في القرية واكسبوا نقاط مكافآت مع كل طلب</p>
        </div>
        <Button variant="gold" size="md" onClick={handleShareApp}>
          مشاركة الرابط 📤
        </Button>
      </div>
    </div>
  );
}
