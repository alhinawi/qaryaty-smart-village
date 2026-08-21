// ─── Imports
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/stores/useUIStore';
import { useOrderStore } from '@/stores/useOrderStore';
import { useUserStore } from '@/stores/useUserStore';

// ─── Component
export function RatingModal() {
  const isOpen = useUIStore((state) => state.isRatingModalOpen);
  const ratingOrder = useUIStore((state) => state.ratingOrder);
  const closeModal = useUIStore((state) => state.closeRatingModal);
  const showToast = useUIStore((state) => state.showToast);

  const addRating = useOrderStore((state) => state.addRating);
  const addRewardPoints = useUserStore((state) => state.addRewardPoints);

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  if (!isOpen || !ratingOrder) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRating(ratingOrder.id, rating, feedback);
    addRewardPoints(20); // +20 points for review
    showToast('🌟 شكراً لتقييمك! كسبت +20 نقطة مكافآت');
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      emoji="⭐"
      title="كيف كانت تجربتك؟"
    >
      <form onSubmit={handleSubmit} className="text-center">
        <p className="text-sm text-text-muted mb-5">
          تقييمك لطلب <strong>{ratingOrder.serviceName}</strong> (
          {ratingOrder.orderNumber})
        </p>

        {/* 5-Star Interactive Rating */}
        <div className="flex justify-center gap-2 mb-5" role="radiogroup" aria-label="اختر عدد النجوم">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`bg-transparent border-none text-[36px] cursor-pointer transition-all duration-150 ${star <= rating ? 'text-gold scale-110' : 'text-gray-300'}`}
              onClick={() => setRating(star)}
              aria-label={`${star} من 5 نجوم`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Feedback Notes */}
        <div className="form-group mb-4">
          <label htmlFor="ratingFeedback">📝 ملاحظاتك أو كلمة للمزود (اختياري)</label>
          <textarea
            id="ratingFeedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="اكتب رأيك بصراحة لمساعدتنا في تحسين الخدمة..."
            rows={3}
          />
        </div>

        <div className="bg-green-50 text-green-dark text-[13px] p-2 rounded-lg mb-4">
          🎁 ستحصل على <strong>+20 نقطة مكافآت</strong> عند إرسال التقييم!
        </div>

        <Button type="submit" variant="gold" size="lg" className="w-full">
          إرسال التقييم 🌟
        </Button>
      </form>
    </Modal>
  );
}
