// ─── "عايز أتبرع" requests from the /donate page
import type { DonationType } from '@/config/donations';

export interface NewDonationRequest {
  name: string;
  phone: string;
  /** Cause id from src/config/donations.ts */
  cause: string;
  /** Cause name as shown today, kept with the request */
  causeName: string;
  type: DonationType;
  notes: string;
}

export interface DonationRepo {
  /** Saves the request and returns its id */
  submitDonationRequest(input: NewDonationRequest): Promise<string>;
}
