import { describe, expect, it } from 'vitest';
import { orderWhatsappTemplate } from './WhatsappSection';

describe('order WhatsApp template', () => {
  it('carries the order facts and the accept button', () => {
    const { body, button } = orderWhatsappTemplate('مطعم البركة');
    expect(body).toContain('طلب جديد');
    expect(body).toContain('العنوان');
    expect(body).toContain('الإجمالي');
    expect(body).toContain('مطعم البركة');
    expect(button).toContain('قبول');
  });
});
