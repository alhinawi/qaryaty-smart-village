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
      <div className="profile-header-card">
        <div className="profile-avatar-large">👤</div>
        <div className="profile-info-text">
          <h2>{profile.name}</h2>
          <p className="profile-village-tag">📍 {profile.village}</p>
          <span className="profile-joined">عضو منذ {profile.memberSince}</span>
        </div>
      </div>

      {/* Rewards Points Card */}
      <div className="reward-points-card">
        <div className="points-top-row">
          <div>
            <span className="points-label">🌟 رصيد نقاط المكافآت</span>
            <div className="points-number">{profile.rewardPoints} نقطة</div>
          </div>
          <span className="points-gift-icon">🎁</span>
        </div>

        {/* Progress to Free Delivery */}
        <div className="points-progress-container">
          <div className="points-progress-bar">
            <div
              className="points-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="points-progress-text">
            <span>
              {profile.rewardPoints} / {targetPoints} نقطة
            </span>
            <span>باقي {Math.max(0, targetPoints - profile.rewardPoints)} نقطة لطلب مجاني!</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-box">
          <span className="stat-val">{orders.length}</span>
          <span className="stat-title">إجمالي الطلبات</span>
        </div>
        <div className="profile-stat-box">
          <span className="stat-val">{profile.rewardPoints}</span>
          <span className="stat-title">نقاط مكتسبة</span>
        </div>
        <div className="profile-stat-box">
          <span className="stat-val">100%</span>
          <span className="stat-title">دعم الاقتصاد المحلي</span>
        </div>
      </div>

      {/* User Information Form */}
      <div className="profile-details-card">
        <div className="section-header-row">
          <h3>👤 بيانات الحساب والعنوان</h3>
          {!isEditing && (
            <button
              type="button"
              className="edit-btn"
              onClick={() => setIsEditing(true)}
            >
              تعديل ✏️
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="profile-edit-form">
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
            <div className="profile-btn-row">
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
          <div className="profile-view-fields">
            <div className="field-row">
              <span className="field-label">📱 رقم الموبايل:</span>
              <span className="field-val">{profile.phone}</span>
            </div>
            <div className="field-row">
              <span className="field-label">📍 العنوان:</span>
              <span className="field-val">{profile.address}</span>
            </div>
            <div className="field-row">
              <span className="field-label">🏡 المنطقة:</span>
              <span className="field-val">{profile.village}</span>
            </div>
          </div>
        )}
      </div>

      {/* Share with village */}
      <div className="invite-friends-banner">
        <div className="invite-text">
          <h4>📢 ادعُ أهالي القرية لاستخدام التطبيق</h4>
          <p>شارك التطبيق مع جيرانك في القرية واكسبوا نقاط مكافآت مع كل طلب</p>
        </div>
        <Button variant="gold" size="md" onClick={handleShareApp}>
          مشاركة الرابط 📤
        </Button>
      </div>
    </div>
  );
}
