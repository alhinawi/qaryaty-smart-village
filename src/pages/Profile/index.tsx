import { ChevronLeft, House, MessagesSquare, Megaphone, Share2, Link2, UserRound, Camera, Trash2, Smartphone, Pencil, TicketPercent } from 'lucide-react';

// ─── Imports
import React, { useEffect, useRef, useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Link, useNavigate } from 'react-router';
import { useAuthStore, selectUser } from '@/stores/useAuthStore';
import { AuthError, referralRepo, type ReferralInfo } from '@/repositories';
import { referralLink } from '@/utils/referral';
import { PHONE_INVALID_MESSAGE } from '@/services/auth';
import { ROUTES } from '@/routes';
import { useVillageStore } from '@/stores/useVillageStore';
import { VillagePicker } from '@/components/address/VillagePicker';
import MyAddresses from '@/components/address/MyAddresses';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { normalizeEgyptianPhone } from '@/utils/validators';
import { ACCEPTED_IMAGE_TYPES, fileToDataUrl } from '@/utils/imageFile';

// ─── Component
export default function ProfilePage() {
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const favorites = useUserStore((state) => state.favorites);
  const orders = useOrderStore((state) => state.orders);
  const showToast = useUIStore((state) => state.showToast);
  const user = useAuthStore(selectUser);
  const updateAuthUser = useAuthStore((state) => state.updateUser);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  // Guests can't save details for good, so "تعديل" asks them to sign in instead
  const [isSignInPromptOpen, setIsSignInPromptOpen] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const markVillageChosen = useVillageStore((state) => state.markChosen);
  const savedVillage = user?.village || profile.village;
  const [villageDraft, setVillageDraft] = useState(savedVillage);

  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Profile photo: accounts save it to their user record, guests keep it on the device
  const setAuthAvatar = useAuthStore((state) => state.setAvatar);
  const avatarUrl = user?.avatarUrl || profile.avatarUrl || '';
  const [photoOpen, setPhotoOpen] = useState(false);

  // دعوة الأصحاب: the personal code and how much it earned (signed-in only)
  const [referralState, setReferral] = useState<{ owner: string; info: ReferralInfo } | null>(null);
  const referral = referralState?.owner === user?.id ? referralState?.info : null;
  const referralOwner = user?.id;
  useEffect(() => {
    if (!referralOwner) return;
    let alive = true;
    referralRepo
      .getInfo(referralOwner)
      .then((info) => {
        if (alive) setReferral({ owner: referralOwner, info });
      })
      .catch(() => {
        /* the card keeps showing the share fallback */
      });
    return () => {
      alive = false;
    };
  }, [referralOwner]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const applyPhoto = async (dataUrl: string | null) => {
    setPhotoBusy(true);
    try {
      if (user) {
        const blob = dataUrl ? await (await fetch(dataUrl)).blob() : null;
        await setAuthAvatar(blob);
      } else {
        updateProfile({ avatarUrl: dataUrl ?? '' });
      }
      showToast(dataUrl ? '✅ صورتك اتحطت' : '✅ الصورة اتشالت');
      setPhotoOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? `⚠️ ${error.message}` : '⚠️ الصورة مااترفعتش، جرّب صورة تانية');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onPhotoPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await applyPhoto(await fileToDataUrl(file));
    } catch (error) {
      showToast(error instanceof Error ? `⚠️ ${error.message}` : '⚠️ الصورة مااترفعتش، جرّب صورة تانية');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (villageDraft.trim().length < 2) {
      showToast('⚠️ اختار قريتك من القايمة، أو اكتبها بنفسك');
      return;
    }
    const villageChanged = villageDraft.trim() !== savedVillage;
    const cleanPhone = normalizeEgyptianPhone(phone);
    if (user && !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setPhoneError(PHONE_INVALID_MESSAGE);
      return;
    }
    setPhoneError('');
    if (user) {
      // Signed in: saved to the account first (the phone through its own checked path);
      // the auth store mirrors the saved row into the profile
      const phoneChanged = cleanPhone !== user.phone;
      setSaving(true);
      try {
        await updateAuthUser({
          name,
          ...(villageChanged ? { village: villageDraft } : {}),
          ...(phoneChanged ? { phone: cleanPhone } : {}),
        });
      } catch (error) {
        const message = error instanceof AuthError ? error.message : 'ماقدرناش نحفظ التعديل، جرّب تاني';
        if (message === PHONE_INVALID_MESSAGE) setPhoneError(message);
        showToast(`⚠️ ${message}`);
        return;
      } finally {
        setSaving(false);
      }
    } else {
      updateProfile({ name, phone: normalizeEgyptianPhone(phone), ...(villageChanged ? { village: villageDraft } : {}) });
    }
    if (villageChanged) markVillageChosen();
    setIsEditing(false);
    showToast('✅ بيانات حسابك اتحفظت');
  };

  const handleLogout = async () => {
    await logout();
    showToast('👋 خرجت من حسابك');
    navigate(ROUTES.home);
  };

  const personalLink = user && referral?.code ? referralLink(referral.code, window.location.origin) : window.location.origin;
  const shareText = user && referral?.code
    ? `جرّب تطبيق قريتي لخدمات وتوصيل القرية وسجّل من اللينك ده عشان تكسب 25 نقطة هدية: ${personalLink}`
    : 'جرب تطبيق قريتي لخدمات وتوصيل القرية واستخدم كود QARYA1 وأول طلب ليك من غير رسوم!';

  const handleShareApp = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'تطبيق قريتي - القرية الذكية',
          text: shareText,
          url: personalLink,
        })
        .catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(personalLink)
        .then(() => showToast('🔗 لينك الدعوة اتنسخ'))
        .catch(() => showToast(`🔗 ابعت الرابط ده لأهل القرية: ${personalLink}`));
    } else {
      showToast(`🔗 ابعت الرابط ده لأهل القرية: ${personalLink}`);
    }
  };

  const handleCopyCode = () => {
    if (!referral?.code) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(personalLink)
        .then(() => showToast('🔗 لينك الدعوة اتنسخ'))
        .catch(() => showToast(`🔗 لينك دعوتك: ${personalLink}`));
    } else {
      showToast(`🔗 لينك دعوتك: ${personalLink}`);
    }
  };

  const targetPoints = 200;
  const progressPercent = Math.min(
    100,
    Math.round((profile.rewardPoints / targetPoints) * 100)
  );

  return (
    <div className="profile-page-container">
      <Link to="/settings" className="flex justify-between items-center rounded-2xl bg-white border border-green/15 p-4 my-3 text-green font-bold">الإعدادات <span aria-hidden="true">‹</span></Link>
      {/* Profile Header */}
      <div className="bg-linear-to-br from-green-dark to-green text-white rounded-2xl p-6 flex items-center gap-5 mb-6" dir="rtl">
        <button
          type="button"
          onClick={() => setPhotoOpen(true)}
          aria-label="غيّر صورتك الشخصية"
          className="relative w-16 h-16 shrink-0 bg-gold rounded-2xl flex items-center justify-center text-[32px] overflow-hidden cursor-pointer border-0 p-0"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={`صورة ${profile.name}`} className="w-full h-full object-cover" />
          ) : (
            '👤'
          )}
          <span
            aria-hidden="true"
            className="absolute bottom-1 end-1 w-5 h-5 rounded-full bg-white text-[11px] flex items-center justify-center shadow"
          >
            📷
          </span>
        </button>
        <div className="min-w-0 flex-1 text-right">
          <h2 dir="auto" className="text-[1.375rem] font-black font-['Tajawal',sans-serif] text-right break-words [overflow-wrap:anywhere]">{profile.name}</h2>
          {user?.username && (
            <p className="text-[13px] opacity-90 text-right break-words [overflow-wrap:anywhere]" dir="ltr">
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
            <div className="text-[1.75rem] font-black text-amber-800 font-['Tajawal',sans-serif]">{profile.rewardPoints} نقطة</div>
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
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">{favorites.length}</span>
          <span className="text-[11px] text-text-muted font-bold">خدمات في المفضلة</span>
        </div>
      </div>

      {/* User Information Form */}
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-extrabold"><UserRound size={18} aria-hidden="true" className="inline-block align-middle" /> بيانات الحساب</h3>
          {!isEditing && (
            <button
              type="button"
              className="bg-transparent border-none text-green font-extrabold cursor-pointer font-['Cairo',sans-serif] text-[13px]"
              onClick={() => {
                if (!user) {
                  setIsSignInPromptOpen(true);
                  return;
                }
                setName(profile.name);
                setPhone(user.phone || profile.phone);
                setPhoneError('');
                setVillageDraft(savedVillage);
                setIsEditing(true);
              }}
            >
              تعديل <Pencil size={15} aria-hidden="true" className="inline-block align-middle" />
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
              <PhoneInput
                id="profilePhone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                }}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'profilePhoneError' : undefined}
                required
              />
              {phoneError && (
                <span id="profilePhoneError" role="alert" className="input-error-msg">
                  {phoneError}
                </span>
              )}
            </div>
            <VillagePicker

              id="profileVillage"

              value={villageDraft}

              onChange={(next) => setVillageDraft(next)}

              hint="بنعرضلك المدرسين والصنايعية من قريتك"

            />
            <div className="flex gap-3 mt-2">
              <Button type="submit" variant="primary" size="md" loading={saving} disabled={saving}>
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
                <span className="text-text-muted font-bold min-w-[100px]"><UserRound size={15} aria-hidden="true" className="inline-block align-middle" /> اسم المستخدم:</span>
                <span className="font-bold" dir="ltr">
                  @{user.username}
                </span>
              </div>
            )}
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]"><Smartphone size={15} aria-hidden="true" className="inline-block align-middle" /> رقم الموبايل:</span>
              <span className="font-bold">{profile.phone || '—'}</span>
            </div>
          </div>
        )}
      </div>

      <MyAddresses />

      {/* قسايمي: the coupons this customer can use */}
      <Link
        to={ROUTES.coupons}
        className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm mb-5 min-h-[44px] font-extrabold text-sm text-green-dark transition-colors hover:bg-cream"
      >
        <span>
          <TicketPercent size={18} aria-hidden="true" className="inline-block align-middle" /> قسايمي
        </span>
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>

      {/* About the app: phones and tablets have no footer, so the link lives here too */}
      <Link
        to={ROUTES.about}
        className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm mb-5 min-h-[44px] font-extrabold text-sm text-green-dark transition-colors hover:bg-cream"
      >
        <span>
          <House size={18} aria-hidden="true" className="inline-block align-middle" /> عن قريتي
        </span>
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>

      {/* WhatsApp groups until the platform launches */}
      <Link
        to={ROUTES.groups}
        className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm mb-5 min-h-[44px] font-extrabold text-sm text-green-dark transition-colors hover:bg-cream"
      >
        <span>
          <MessagesSquare size={18} aria-hidden="true" className="inline-block align-middle" /> جروبات قريتي على واتساب
        </span>
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>

      {/* Profile photo picker */}
      <Modal
        isOpen={photoOpen}
        onClose={() => !photoBusy && setPhotoOpen(false)}
        emoji="🖼️"
        title="صورتك الشخصية"
        maxWidth="420px"
      >
        <input
          ref={photoInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={(e) => void onPhotoPicked(e)}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="flex flex-col items-center gap-3 mt-2">
          <div className="w-28 h-28 rounded-2xl bg-[#e8f5ee] flex items-center justify-center text-[44px] overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`صورة ${profile.name}`} className="w-full h-full object-cover" />
            ) : (
              '👤'
            )}
          </div>
          <Button
            onClick={() => photoInputRef.current?.click()}
            disabled={photoBusy}
            className="w-full min-h-[46px]"
          >
            <Camera size={18} aria-hidden="true" /> {photoBusy ? 'بنحفظ الصورة...' : 'اختار صورة جديدة'}
          </Button>
          {avatarUrl && (
            <Button
              variant="danger"
              onClick={() => void applyPhoto(null)}
              disabled={photoBusy}
              className="w-full min-h-[46px]"
            >
              <Trash2 size={18} aria-hidden="true" /> شيل الصورة
            </Button>
          )}
          <p className="text-[12px] text-text-muted m-0 text-center">
            الصورة بتتصغّر على جهازك قبل ما تتحفظ.
            {!user && ' هتفضل على الجهاز ده بس — سجّل دخولك عشان تبقى على حسابك من أي موبايل.'}
          </p>
        </div>
      </Modal>

      {/* Guest tapped "تعديل": sign in first */}
      <Modal
        isOpen={isSignInPromptOpen}
        onClose={() => setIsSignInPromptOpen(false)}
        emoji="🔐"
        title="سجّل دخولك عشان تحفظ بياناتك وماتكتبهاش تاني مع كل طلب"
        maxWidth="420px"
      >
        <div className="flex gap-2.5 mt-3">
          <Link
            to={ROUTES.login}
            state={{ from: ROUTES.profile }}
            className="flex-1 min-h-[48px] flex items-center justify-center text-center bg-green text-white rounded-xl px-3 font-extrabold text-sm"
          >
            تسجيل الدخول
          </Link>
          <Link
            to={ROUTES.register}
            state={{ from: ROUTES.profile }}
            className="flex-1 min-h-[48px] flex items-center justify-center text-center bg-gold text-black rounded-xl px-3 font-extrabold text-sm"
          >
            حساب جديد
          </Link>
        </div>
        <button
          type="button"
          className="w-full min-h-[44px] mt-2 bg-transparent border-none text-text-muted font-bold text-sm cursor-pointer font-['Cairo',sans-serif] rounded-xl hover:bg-gray-50"
          onClick={() => setIsSignInPromptOpen(false)}
        >
          مش دلوقتي
        </button>
      </Modal>

      {/* دعوة الأصحاب: personal invite link + what it earned */}
      {/* Phones: the button sits under the text, compact; sm+ (640px): beside it */}
      <div className="bg-linear-to-br from-[#1e3a8a] to-[#3b82f6] text-white rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] sm:text-base font-extrabold leading-snug mb-1 text-balance"><Megaphone size={18} aria-hidden="true" className="inline-block align-middle" /> ادعُ أصحابك واكسبوا سوا</h4>
            <p className="text-xs leading-relaxed opacity-85">
              {user
                ? 'صاحبك يكسب 25 نقطة هدية لما يسجّل من لينكك، وانت تكسب 50 نقطة أول ما يخلّص أول طلب ليه'
                : 'شارك التطبيق مع جيرانك في القرية — وسجّل دخولك عشان يبقى ليك لينك دعوة باسمك وتكسب نقاط على كل صاحب يطلب'}
            </p>
          </div>
          <Button
            variant="gold"
            size="sm"
            className="shrink-0 whitespace-nowrap min-h-[40px] px-4"
            onClick={handleShareApp}
          >
            مشاركة الرابط <Share2 size={17} aria-hidden="true" />
          </Button>
        </div>
        {user && referral?.code && (
          <div className="flex flex-col gap-2.5 border-t border-white/20 pt-3" dir="rtl">
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 truncate bg-white/15 rounded-lg px-3 py-2 text-[13px] font-bold text-left" dir="ltr">
                {personalLink}
              </code>
              <Button
                variant="gold"
                size="sm"
                className="shrink-0 whitespace-nowrap min-h-[36px] px-3"
                onClick={handleCopyCode}
              >
                نسخ اللينك <Link2 size={17} aria-hidden="true" />
              </Button>
            </div>
            <p className="text-[12px] leading-relaxed opacity-85 m-0">
              دعوت {referral.invitedCount} {referral.invitedCount === 1 ? 'صاحب' : 'أصحاب'} وكسبت منهم {referral.pointsEarned} نقطة
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
