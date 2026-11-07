// ─── مساعد قريتي: live AI answers behind the secure server path
// The app never sees a provider key: it calls OUR edge function
// (supabase/functions/assistant-reply, plan in docs/proposals/ai-assistant.md).
// Any failure — offline, function not deployed yet, quota reached, providers
// down — falls back to the curated demo engine, so the screen always answers.
import { getSupabase, isSupabaseConfigured } from '@/repositories/supabaseClient';
import { assistantAudienceFor, demoReply, type AssistantAudience, type AssistantMessage } from './demoAssistant';
import type { UserRole } from '@/types';

const LIVE_TIMEOUT_MS = 9000;

export interface LiveReply {
  ok: boolean;
  text?: string;
  reason?: 'quota' | 'unavailable' | 'bad_request';
}

/** Raw call to the edge function. Exported for tests; UI uses resolveReply. */
export async function askLive(messages: AssistantMessage[], audience: AssistantAudience): Promise<LiveReply> {
  if (!isSupabaseConfigured) return { ok: false, reason: 'unavailable' };
  try {
    const supabase = await getSupabase();
    const result = await Promise.race([
      supabase.functions.invoke('assistant-reply', { body: { messages, audience } }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), LIVE_TIMEOUT_MS)),
    ]);
    if (result.error) return { ok: false, reason: 'unavailable' };
    const data = result.data as { ok?: boolean; text?: string; reason?: LiveReply['reason'] } | null;
    if (data?.ok && typeof data.text === 'string' && data.text.trim()) return { ok: true, text: data.text.trim() };
    return { ok: false, reason: data?.reason ?? 'unavailable' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/**
 * The reply the screen shows: live first, canned demo reply on any failure.
 * `liveAsk` is injectable so the fallback path is tested without a network.
 */
export async function resolveReply(
  history: AssistantMessage[],
  question: string,
  role: UserRole | null | undefined,
  liveAsk: typeof askLive = askLive
): Promise<string> {
  const audience: AssistantAudience = assistantAudienceFor(role);
  try {
    const live = await liveAsk([...history, { from: 'user', text: question }], audience);
    const text = live.ok && typeof live.text === 'string' ? live.text.trim() : '';
    if (text) return text;
  } catch {
    // offline or a broken caller: the canned engine below always answers
  }
  return demoReply(question, role);
}
