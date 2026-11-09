// ─── «فاضل ساعتين وربع» countdown text for عروض اليوم
import { counted } from './plural';

export function countdownText(endsAt: string, now = Date.now()): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return 'خلص';
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const hTxt = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : `${hours} ${counted(hours, 'ساعة', 'ساعتين', 'ساعات')}`;
  const mTxt = mins === 1 ? 'دقيقة' : mins === 2 ? 'دقيقتين' : `${mins} ${counted(mins, 'دقيقة', 'دقيقتين', 'دقائق')}`;
  if (hours === 0) return `فاضل ${mTxt}`;
  if (mins === 0) return `فاضل ${hTxt}`;
  return `فاضل ${hTxt} و${mTxt}`;
}

export function isOfferActive(endsAt: string, now = Date.now()): boolean {
  return new Date(endsAt).getTime() > now;
}
