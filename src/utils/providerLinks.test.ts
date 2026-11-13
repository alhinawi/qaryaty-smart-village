import { describe, expect, it } from 'vitest';
import { safeProviderLinks } from './providerLinks';

describe('safeProviderLinks', () => {
  it('keeps labelled https links with their kind', () => {
    expect(
      safeProviderLinks([
        { label: ' حاصل على شهادة IELTS ', url: 'https://drive.google.com/file/d/x/view', kind: 'certificate' },
        { label: 'عينة من شروحاتي', url: 'https://drive.google.com/drive/folders/y', kind: 'samples' },
      ]),
    ).toEqual([
      { label: 'حاصل على شهادة IELTS', url: 'https://drive.google.com/file/d/x/view', kind: 'certificate' },
      { label: 'عينة من شروحاتي', url: 'https://drive.google.com/drive/folders/y', kind: 'samples' },
    ]);
  });

  it('shows nothing for an empty or missing value', () => {
    expect(safeProviderLinks(null)).toEqual([]);
    expect(safeProviderLinks(undefined)).toEqual([]);
    expect(safeProviderLinks([])).toEqual([]);
    expect(safeProviderLinks('https://example.com')).toEqual([]);
  });

  it('drops unsafe, unlabelled or broken links and unknown kinds', () => {
    expect(
      safeProviderLinks([
        { label: 'x', url: 'javascript:alert(1)' },
        { label: 'x', url: 'http://example.com' },
        { label: '', url: 'https://example.com' },
        { label: 'x', url: 'not a url' },
        { label: 'x' },
        null,
        { label: 'رابط', url: 'https://example.com/a', kind: 'weird' },
      ]),
    ).toEqual([{ label: 'رابط', url: 'https://example.com/a' }]);
  });
});
