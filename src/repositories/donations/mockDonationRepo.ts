// ─── Demo mode: donation requests stay on this device
import type { DonationRepo, NewDonationRequest } from './types';

const KEY = 'qaryati_donation_requests';

export function createMockDonationRepo(): DonationRepo {
  return {
    async submitDonationRequest(input: NewDonationRequest) {
      const id = crypto.randomUUID();
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[];
        saved.push({ id, ...input, createdAt: new Date().toISOString() });
        localStorage.setItem(KEY, JSON.stringify(saved.slice(-20)));
      } catch {
        // Storage full or blocked: the demo still says it was sent
      }
      return id;
    },
  };
}
