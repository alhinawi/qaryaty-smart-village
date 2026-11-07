import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/stores/useUIStore';
import { Mic, X } from 'lucide-react';
import { speechConstructor, voiceError, voiceQuery, type BrowserSpeechRecognition } from './voiceSearch';
export function VoiceSearchButton({ onText, openInitially = false }: { onText: (text: string) => void; openInitially?: boolean }) {
  const [open, setOpen] = useState(openInitially);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState('');
  const timeout = useRef<number | null>(null);
  const recognition = useRef<BrowserSpeechRecognition | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const supported = Boolean(speechConstructor()) && window.isSecureContext;
  const cancel = () => {
    if (timeout.current !== null) { clearTimeout(timeout.current); timeout.current = null; }
    const current = recognition.current; recognition.current = null;
    if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.onstart = null; current.abort(); }
    setListening(false);
  };
  const close = () => { cancel(); setOpen(false); button.current?.focus(); };
  useEffect(() => () => { if (timeout.current !== null) clearTimeout(timeout.current); const current = recognition.current; recognition.current = null; if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.onstart = null; current.abort(); } }, []);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => dialog.current?.focus());
    useUIStore.getState().setVoiceSearchRequested(false);
    return () => cancelAnimationFrame(frame);
  }, [open]);
  useEffect(() => {
    const stopWhenHidden = () => { if (document.hidden) { const current = recognition.current; recognition.current = null; if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.onstart = null; current.abort(); } if (timeout.current !== null) clearTimeout(timeout.current); setListening(false); } };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => document.removeEventListener('visibilitychange', stopWhenHidden);
  }, []);
  const start = () => {
    const Constructor = speechConstructor(); if (!Constructor || !supported) return;
    cancel(); setMessage('');
    const current = new Constructor(); recognition.current = current;
    current.lang = 'ar-EG'; current.continuous = false; current.interimResults = false; current.maxAlternatives = 1;
    current.onstart = () => { if (recognition.current === current) setListening(true); };
    current.onerror = event => { if (recognition.current === current) { cancel(); setMessage(voiceError(event.error)); } };
    current.onend = () => { if (recognition.current === current) { setListening(false); recognition.current = null; if (timeout.current !== null) clearTimeout(timeout.current); } };
    current.onresult = event => {
      if (recognition.current !== current) return;
      const result = event.results[event.resultIndex];
      if (!result?.isFinal) return;
      const text = voiceQuery(result[0]?.transcript ?? '');
      if (!text) { setMessage('مسمعناش كلمة بحث واضحة. جرّب تاني أو اكتب بحثك.'); return; }
      onText(text); close();
    };
    try { setListening(true); current.start(); timeout.current = window.setTimeout(() => { if (recognition.current === current) { cancel(); setMessage('وقت الاستماع خلص. جرّب تاني أو اكتب بحثك.'); } }, 15000); } catch { cancel(); setMessage('تعذر بدء الميكروفون. جرّب تاني أو اكتب بحثك.'); }
  };
  return <>
    <button ref={button} type="button" aria-label="البحث بالصوت" className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-green hover:bg-green/10" onClick={() => { setMessage(''); setOpen(true); }}><Mic size={19} aria-hidden="true" /></button>
    {open && createPortal(<div className="fixed inset-0 z-[230] bg-black/45 flex items-center justify-center p-4" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="البحث بالصوت" dir="rtl" className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-xl outline-none" onKeyDown={event => {
        event.stopPropagation();
        if (event.key === 'Escape') close();
        if (event.key === 'Tab') { const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])'); if (!buttons?.length) return; const first=buttons[0], last=buttons[buttons.length-1]; if (event.shiftKey && (document.activeElement===first || document.activeElement===dialog.current)) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first.focus(); } }
      }}>
        <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-black text-green-dark">قول بتدوّر على إيه</h2><button type="button" aria-label="إغلاق البحث بالصوت" onClick={close} className="p-2 text-text-muted"><X size={20} /></button></div>
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${listening ? 'bg-red-50 text-red-600' : 'bg-green/10 text-green'}`}><Mic size={34} aria-hidden="true" /></div>
        <p role="status" className="my-4 text-center text-sm font-bold text-green-dark">{listening ? 'سامعينك... قول مثلًا: عايز فراخ مشوية' : supported ? 'قول مثلًا: عايز فراخ مشوية، أو سباك' : 'البحث بالصوت مش متاح في المتصفح ده. تقدر تكتب بحثك عادي.'}</p>
        <p className="text-xs leading-6 text-text-muted">الميكروفون مش بيشتغل غير لما تضغط ابدأ وتسمح للمتصفح. قريتي مش بتسجل أو تحفظ الصوت. المتصفح ممكن يبعت الصوت لخدمة التعرّف الخاصة بيه، وده ممكن يحتاج إنترنت.</p>
        {message && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-950">{message}</p>}
        {supported && <button type="button" onClick={listening ? cancel : start} className="mt-5 w-full rounded-xl bg-green py-3 text-sm font-extrabold text-white">{listening ? 'وقف الميكروفون' : 'ابدأ البحث بالصوت'}</button>}
        <button type="button" onClick={close} className="mt-2 w-full p-3 text-sm font-bold text-green">اكتب بدل الصوت</button>
      </div>
    </div>, document.body)}
  </>;
}
