export interface SpeechResultEvent {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
  resultIndex: number;
}
export interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  abort(): void;
}
export type SpeechConstructor = new () => BrowserSpeechRecognition;
export function speechConstructor(): SpeechConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const browser = window as unknown as { SpeechRecognition?: SpeechConstructor; webkitSpeechRecognition?: SpeechConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}
export function voiceQuery(text: string): string {
  // Remove only common opening request words, not terms inside a product name.
  return text.trim().replace(/^[،,.؟\s]+|[،,.؟\s]+$/g, '').replace(/^(?:انا\s+)?(?:عايز|عاوز|عايزة|عاوزه|عاوزة|محتاج|محتاجة|محتاجه|دورلي\s+على|دور\s+على)\s+/u, '').trim();
}
export function voiceError(error: string): string {
  switch (error) {
    case 'not-allowed': case 'service-not-allowed': return 'إذن الميكروفون مقفول. تقدر تسمح بيه من إعدادات المتصفح، أو تكتب بحثك.';
    case 'audio-capture': return 'مش قادرين نوصل للميكروفون. اتأكد إنه متاح، أو اكتب بحثك.';
    case 'no-speech': return 'مسمعناش كلام واضح. جرّب تاني أو اكتب بحثك.';
    case 'network': return 'خدمة الصوت مش متاحة دلوقتي. راجع الإنترنت أو اكتب بحثك.';
    case 'language-not-supported': return 'التعرّف على العربي مش متاح على المتصفح ده. اكتب بحثك.';
    default: return 'البحث بالصوت ماكملش. جرّب تاني أو اكتب بحثك.';
  }
}
