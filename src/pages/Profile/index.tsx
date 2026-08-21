// ─── Imports
import React, { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/ui/Button';

// ─── Component
export default function ProfilePage() {
  const profile = useUserStore((state) => state.profile);
  const updateProfile = useUserStore((state) => state.updateProfile);
  const orders = useOrderStore((state) => state.orders);
  const showToast = useUIStore((state) => state.showToast);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone, address });
    setIsEditing(false);
    showToast('✅ تم حفظ بيانات الحساب بنجاح!');
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
    } else {
      showToast('🔗 تم نسخ رابط دعوة أهالي القرية!');
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
      <div className="bg-gradient-to-br from-green-dark to-green text-white rounded-2xl p-6 flex items-center gap-5 mb-6">
        <div className="w-16 h-16 bg-gold rounded-[20px] flex items-center justify-center text-[32px]">👤</div>
        <div>
          <h2 className="text-[1.375rem] font-black font-['Tajawal',sans-serif]">{profile.name}</h2>
          <p className="text-[13px] opacity-90">📍 {profile.village}</p>
          <span className="text-[11px] opacity-70">عضو منذ {profile.memberSince}</span>
        </div>
      </div>

      {/* Rewards Points Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-gold-light mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[13px] text-text-muted font-bold">🌟 رصيد نقاط المكافآت</span>
            <div className="text-[1.75rem] font-black text-gold font-['Tajawal',sans-serif]">{profile.rewardPoints} نقطة</div>
          </div>
          <span className="text-[36px]">🎁</span>
        </div>

        {/* Progress to Free Delivery */}
        <div className="points-progress-container">
          <div className="h-[10px] bg-gray-100 rounded-[5px] overflow-hidden mb-1.5">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-light rounded-[5px]"
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
        <div className="bg-white rounded-md p-3.5 text-center shadow-sm">
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">{orders.length}</span>
          <span className="text-[11px] text-text-muted font-bold">إجمالي الطلبات</span>
        </div>
        <div className="bg-white rounded-md p-3.5 text-center shadow-sm">
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">{profile.rewardPoints}</span>
          <span className="text-[11px] text-text-muted font-bold">نقاط مكتسبة</span>
        </div>
        <div className="bg-white rounded-md p-3.5 text-center shadow-sm">
          <span className="block text-[1.25rem] font-black text-green font-['Tajawal',sans-serif]">100%</span>
          <span className="text-[11px] text-text-muted font-bold">دعم الاقتصاد المحلي</span>
        </div>
      </div>

      {/* User Information Form */}
      <div className="bg-white rounded-xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-extrabold">👤 بيانات الحساب والعنوان</h3>
          {!isEditing && (
            <button
              type="button"
              className="bg-transparent border-none text-green font-extrabold cursor-pointer font-['Cairo',sans-serif] text-[13px]"
              onClick={() => setIsEditing(true)}
            >
              تعديل ✏️
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
            <div className="form-group">
              <label>الاسم الكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>رقم الموبايل</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>العنوان في القرية</label>
              <input
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
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]">📱 رقم الموبايل:</span>
              <span className="font-bold">{profile.phone}</span>
            </div>
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]">📍 العنوان:</span>
              <span className="font-bold">{profile.address}</span>
            </div>
            <div className="flex gap-2 py-2 border-b border-gray-50 text-sm last:border-b-0">
              <span className="text-text-muted font-bold min-w-[100px]">🏡 المنطقة:</span>
              <span className="font-bold">{profile.village}</span>
            </div>
          </div>
        )}
      </div>

      {/* Share with village */}
      <div className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] text-white rounded-xl p-5 flex items-center justify-between">
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
