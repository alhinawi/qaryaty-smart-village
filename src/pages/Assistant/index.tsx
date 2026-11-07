// ─── مساعد قريتي: the role-aware assistant screen
// Today every answer comes from the curated demo engine (no live AI key in the
// app; see docs/proposals/ai-assistant.md for the secure Groq/Gemini path).
import { useEffect, useRef, useState } from 'react';
import { SendHorizonal } from 'lucide-react';
import { useAuthStore, selectRole } from '@/stores/useAuthStore';
import {
  ASSISTANT_NAME,
  demoReply,
  greetingFor,
  quickPromptsFor,
  type AssistantMessage,
} from '@/services/assistant/demoAssistant';

export default function AssistantPage() {
  const role = useAuthStore(selectRole);
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { from: 'assistant', text: greetingFor(role) },
  ]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const prompts = quickPromptsFor(role);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { from: 'user', text: q },
      { from: 'assistant', text: demoReply(q, role) },
    ]);
    setInput('');
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28 flex flex-col min-h-[calc(100dvh-120px)]" dir="rtl">
      <h1 className="text-[18px] font-black text-green-dark m-0 mb-1">🤖 {ASSISTANT_NAME}</h1>
      <p className="text-[12px] text-text-muted m-0 mb-3">اسأل عن أي حاجة في التطبيق، وهجاوبك بالمصري.</p>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto flex flex-col gap-2 mb-3"
        aria-live="polite"
        aria-label="المحادثة"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-line ${
              m.from === 'user'
                ? 'self-start bg-green text-white rounded-tl-md'
                : 'self-end bg-white border border-green/15 text-text rounded-tr-md'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-3" aria-label="أسئلة جاهزة">
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => ask(p.question)}
              className="bg-cream border border-gold-light/60 text-text text-[13px] font-bold rounded-full px-3.5 py-1.5 hover:bg-[#f5eedd] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك…"
          aria-label="اكتب سؤالك"
          className="flex-1 min-w-0 rounded-2xl border border-green/20 bg-white px-4 py-2.5 text-[14px] outline-none focus:border-green"
        />
        <button
          type="submit"
          aria-label="ابعت السؤال"
          disabled={!input.trim()}
          className="shrink-0 w-11 h-11 rounded-2xl bg-green text-white flex items-center justify-center disabled:opacity-40"
        >
          <SendHorizonal size={19} aria-hidden="true" className="-scale-x-100" />
        </button>
      </form>
    </div>
  );
}
