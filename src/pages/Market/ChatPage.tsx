// ─── /market/chat/:listingId/:buyerId: messages between a buyer and the owner of a post
import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { Send } from 'lucide-react';
import { marketRepo, type MarketListing, type MarketMessage } from '@/repositories';
import { categoryIcon, isLive, timeAgo } from '@/config/market';
import { ROUTES, marketItemPath } from '@/routes';
import { BackBar, PhotoBox, PriceLine, useMarketUser, usePageTitle } from './shared';

const POLL_MS = 8000;

export default function MarketChatPage() {
  const { listingId = '', buyerId = '' } = useParams();
  const user = useMarketUser();
  const [listing, setListing] = useState<MarketListing | null | undefined>(undefined);
  const [messages, setMessages] = useState<MarketMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  usePageTitle('رسايل الإعلان • قريتي');

  useEffect(() => {
    if (!user) return;
    let alive = true;
    marketRepo
      .get(listingId)
      .then((l) => alive && setListing(l))
      .catch(() => alive && setListing(null));
    const load = () =>
      marketRepo
        .thread(listingId, buyerId)
        .then((m) => {
          if (!alive) return;
          setMessages((old) => (old.length === m.length && old[old.length - 1]?.id === m[m.length - 1]?.id ? old : m));
          if (m.some((x) => x.senderId !== user.id && !x.readAt)) void marketRepo.markRead(listingId, buyerId).catch(() => undefined);
        })
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [listingId, buyerId, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (!user) return <Navigate to={ROUTES.login} state={{ from: window.location.pathname }} replace />;

  const iAmOwner = !!listing && listing.ownerId === user.id;
  const iAmBuyer = buyerId === user.id;
  // The owner answers only after the buyer wrote; a buyer writes only while the post is live
  const canWrite = !!listing && (iAmOwner ? messages.some((m) => m.senderId === buyerId) : iAmBuyer && isLive(listing));

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      const m = await marketRepo.send(listingId, buyerId, body);
      setMessages((old) => [...old, m]);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'الرسالة مااتبعتتش');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="max-w-[720px] mx-auto pb-4 flex flex-col" style={{ minHeight: 'calc(100dvh - 220px)' }}>
      <BackBar title={iAmOwner ? 'رسايل عن إعلانك' : listing?.ownerName ? `رسايل مع ${listing.ownerName}` : 'الرسايل'} />

      {listing && (
        <Link to={marketItemPath(listing.id)} className="flex items-center gap-3 bg-white rounded-2xl p-2.5 shadow-card mb-3">
          <PhotoBox src={listing.photos[0]} alt="" icon={categoryIcon(listing.category)} className="w-14 h-14 rounded-xl shrink-0 text-[24px]" />
          <div className="min-w-0">
            <p className="font-extrabold text-sm truncate">{listing.title}</p>
            <PriceLine listing={listing} />
          </div>
        </Link>
      )}
      {listing === null && (
        <p className="bg-white rounded-2xl p-3 shadow-card mb-3 text-sm text-text-muted">الإعلان ده مبقاش موجود.</p>
      )}

      <div className="flex-1 bg-white rounded-2xl shadow-card p-3 flex flex-col gap-2 overflow-y-auto" aria-live="polite" aria-label="الرسايل">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-text-muted my-auto py-8">
            {iAmBuyer ? 'اسأل عن الحاجة، وصاحب الإعلان هيرد عليك هنا.' : 'مفيش رسايل لسه.'}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={`max-w-[80%] ${mine ? 'self-start' : 'self-end'}`}>
                <p
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line break-words ${
                    mine ? 'bg-green text-white rounded-br-md' : 'bg-cream text-text rounded-bl-md'
                  }`}
                >
                  {m.body}
                </p>
                <p className={`text-[10px] text-text-muted mt-0.5 ${mine ? 'text-right' : 'text-left'}`}>{timeAgo(m.createdAt)}</p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {canWrite ? (
        <form onSubmit={send} className="mt-3 flex gap-2 items-end">
          <label className="sr-only" htmlFor="mk-msg">
            رسالتك
          </label>
          <textarea
            id="mk-msg"
            rows={1}
            maxLength={1000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(e);
              }
            }}
            placeholder={iAmBuyer && messages.length === 0 ? 'السلام عليكم، لسه موجودة؟' : 'اكتب رسالتك…'}
            className="q-input flex-1 resize-none max-h-32"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="shrink-0 w-12 h-12 rounded-full bg-green text-white flex items-center justify-center disabled:opacity-50"
            aria-label="ابعت"
          >
            <Send className="w-5 h-5 -scale-x-100" aria-hidden="true" />
          </button>
        </form>
      ) : (
        listing !== undefined && (
          <p className="mt-3 text-center text-[13px] text-text-muted">
            {iAmOwner ? 'تقدر ترد بعد ما حد يبعتلك الأول.' : 'الإعلان ده مبقاش منشور، فماتقدرش تبعت رسايل جديدة.'}
          </p>
        )
      )}
      {error && (
        <p className="text-red-600 text-sm font-bold mt-2" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
