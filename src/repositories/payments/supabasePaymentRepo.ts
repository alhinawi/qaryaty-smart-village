// ─── Paymob checkout through the `paymob-checkout` Edge Function
import { getSupabase } from '@/repositories/supabaseClient';

/**
 * Opens Paymob's checkout page for a saved order. Resolves only on failure
 * (the page navigates away on success), with an Arabic message to show.
 */
export async function startOnlinePayment(orderId: string): Promise<string> {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
      'paymob-checkout',
      { body: { orderId } }
    );
    if (error || !data?.url) {
      return 'الدفع أونلاين مش متاح دلوقتي. الطلب اتسجل، وتقدر تدفع كاش عند الاستلام.';
    }
    window.location.assign(data.url);
    return '';
  } catch {
    return 'معرفناش نفتح صفحة الدفع. الطلب اتسجل، وتقدر تدفع كاش عند الاستلام.';
  }
}
