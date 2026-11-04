import { highlightParts } from '@/utils/searchScreen';

/** The text with the words that match the search marked in gold. */
export function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-gold-light/45 text-inherit rounded-[3px] px-px">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}
