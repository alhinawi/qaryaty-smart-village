export type Recipient = { name: string; village: string; address: string; phone: string };
export function validRecipient(r: Recipient): boolean {
  return r.name.trim().length >= 2 && r.village.trim().length >= 2 && r.address.trim().length >= 10 && /^01[0125][0-9]{8}$/.test(r.phone);
}
