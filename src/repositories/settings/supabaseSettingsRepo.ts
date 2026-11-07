// ─── app_settings on Supabase (demo_mode lives there, 1/0)
import type { SupabaseClient } from '@supabase/supabase-js';
import { RepoError } from '@/repositories/errors';
import type { SettingsRepo } from './types';

const KEY = 'demo_mode';
const WA_KEY = 'whatsapp_notifications';

export function createSupabaseSettingsRepo(getClient: () => Promise<SupabaseClient>): SettingsRepo {
  return {
    async getAppearanceEnabled() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'appearance_enabled').maybeSingle();
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب إعداد الثيمات', { cause: error });
      return data !== null && Number(data.value) === 1;
    },
    async setAppearanceEnabled(on) {
      const supabase = await getClient();
      const { error } = await supabase.from('app_settings').upsert({ key: 'appearance_enabled', value: on ? 1 : 0, updated_at: new Date().toISOString() });
      if (error) throw new RepoError('rejected', 'إعداد الثيمات ماتحفظش', { cause: error });
    },
    async getDemoMode() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', KEY).maybeSingle();
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب إعدادات الموقع', { cause: error });
      // No row yet: the site starts in demo mode
      return data === null || Number(data.value) === 1;
    },
    async setDemoMode(on) {
      const supabase = await getClient();
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: KEY, value: on ? 1 : 0, updated_at: new Date().toISOString() });
      if (error) throw new RepoError('rejected', 'ماقدرناش نحفظ الإعداد — محتاج صلاحية إدارة', { cause: error });
    },
    async getWhatsappEnabled() {
      const supabase = await getClient();
      const { data, error } = await supabase.from('app_settings').select('value').eq('key', WA_KEY).maybeSingle();
      if (error) throw new RepoError('unavailable', 'ماقدرناش نجيب إعدادات الموقع', { cause: error });
      // No row yet: WhatsApp notifications stay OFF (they fail closed, never open)
      return data !== null && Number(data.value) === 1;
    },
    async setWhatsappEnabled(on) {
      const supabase = await getClient();
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: WA_KEY, value: on ? 1 : 0, updated_at: new Date().toISOString() });
      if (error) throw new RepoError('rejected', 'ماقدرناش نحفظ الإعداد — محتاج صلاحية إدارة', { cause: error });
    },
  };
}
