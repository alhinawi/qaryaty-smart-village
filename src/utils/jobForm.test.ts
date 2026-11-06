import { describe, expect, it } from 'vitest';
import { jobFormSchema } from './jobForm';

const valid = {
  title: '  بائع   في سوبر ماركت ',
  employer: 'سوبر ماركت البركة',
  village: 'منية سندوب',
  type: 'daily',
  hours: '',
  salary: '',
  description: 'محتاجين شاب يقف على الكاشير',
  phone: '+20 101 234 5678',
  whatsapp: true,
};

describe('job form', () => {
  it('tidies the text and the phone number', () => {
    const parsed = jobFormSchema.parse(valid);
    expect(parsed.title).toBe('بائع في سوبر ماركت');
    expect(parsed.phone).toBe('01012345678');
  });

  it('needs a title, an employer, a village and a short description', () => {
    const result = jobFormSchema.safeParse({ ...valid, title: 'x', employer: '', village: '', description: 'قصير' });
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['title', 'employer', 'village', 'description']));
  });

  it('turns down a wrong phone number and an unknown job type', () => {
    expect(jobFormSchema.safeParse({ ...valid, phone: '12345' }).success).toBe(false);
    expect(jobFormSchema.safeParse({ ...valid, type: 'remote' }).success).toBe(false);
  });
});
