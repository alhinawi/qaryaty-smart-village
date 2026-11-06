// ─── Provider dashboard store (preview)
// Holds the edits a merchant or an independent professional makes in the
// dashboard preview. There is no backend for this yet: everything persists in
// localStorage on the provider's own device, keyed by shop/provider id, so the
// live catalog customers see is untouched.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_WORKING_DAYS } from '@/data/providerDashboard';

/** What a merchant changed about one product (nothing = the catalog's own row). */
export interface ProductOverride {
  available: boolean;
  price?: number;
}

export interface MerchantOverrides {
  open?: boolean;
  hours?: string;
  description?: string;
  products: Record<string, ProductOverride>;
}

/** One service a professional offers, with its price as people say it. */
export interface ProService {
  id: string;
  name: string;
  price: string;
  active: boolean;
}

export interface ProfessionalOverrides {
  bio?: string;
  /** Off = "مش متاح" shows instead of the booking button. */
  vacation: boolean;
  days: string[];
  from: string;
  to: string;
  services: ProService[];
}

interface ProviderDashboardState {
  merchants: Record<number, MerchantOverrides>;
  professionals: Record<number, ProfessionalOverrides>;
  setShopOpen: (shopId: number, open: boolean) => void;
  setShopHours: (shopId: number, hours: string) => void;
  setShopDescription: (shopId: number, description: string) => void;
  setProductAvailable: (shopId: number, productId: string, available: boolean) => void;
  setProductPrice: (shopId: number, productId: string, price: number) => void;
  setProBio: (providerId: number, bio: string) => void;
  setProVacation: (providerId: number, vacation: boolean) => void;
  setProAvailability: (providerId: number, days: string[], from: string, to: string) => void;
  toggleProService: (providerId: number, serviceId: string, defaults: ProService[]) => void;
  addProService: (providerId: number, name: string, price: string, defaults: ProService[]) => void;
}

const emptyMerchant = (): MerchantOverrides => ({ products: {} });

const emptyProfessional = (): ProfessionalOverrides => ({
  vacation: false,
  days: [...DEFAULT_WORKING_DAYS],
  from: '9:00 ص',
  to: '9:00 م',
  services: [],
});

export const useProviderDashboardStore = create<ProviderDashboardState>()(
  persist(
    (set, get) => ({
      merchants: {},
      professionals: {},

      setShopOpen: (shopId, open) =>
        set((s) => ({
          merchants: { ...s.merchants, [shopId]: { ...emptyMerchant(), ...s.merchants[shopId], open } },
        })),

      setShopHours: (shopId, hours) =>
        set((s) => ({
          merchants: { ...s.merchants, [shopId]: { ...emptyMerchant(), ...s.merchants[shopId], hours } },
        })),

      setShopDescription: (shopId, description) =>
        set((s) => ({
          merchants: { ...s.merchants, [shopId]: { ...emptyMerchant(), ...s.merchants[shopId], description } },
        })),

      setProductAvailable: (shopId, productId, available) => {
        const merchant = { ...emptyMerchant(), ...get().merchants[shopId] };
        const current = merchant.products[productId] ?? { available: true };
        set((s) => ({
          merchants: {
            ...s.merchants,
            [shopId]: { ...merchant, products: { ...merchant.products, [productId]: { ...current, available } } },
          },
        }));
      },

      setProductPrice: (shopId, productId, price) => {
        const merchant = { ...emptyMerchant(), ...get().merchants[shopId] };
        const current = merchant.products[productId] ?? { available: true };
        set((s) => ({
          merchants: {
            ...s.merchants,
            [shopId]: { ...merchant, products: { ...merchant.products, [productId]: { ...current, price } } },
          },
        }));
      },

      setProBio: (providerId, bio) =>
        set((s) => ({
          professionals: { ...s.professionals, [providerId]: { ...emptyProfessional(), ...s.professionals[providerId], bio } },
        })),

      setProVacation: (providerId, vacation) =>
        set((s) => ({
          professionals: { ...s.professionals, [providerId]: { ...emptyProfessional(), ...s.professionals[providerId], vacation } },
        })),

      setProAvailability: (providerId, days, from, to) =>
        set((s) => ({
          professionals: {
            ...s.professionals,
            [providerId]: { ...emptyProfessional(), ...s.professionals[providerId], days, from, to },
          },
        })),

      toggleProService: (providerId, serviceId, defaults) => {
        const pro = { ...emptyProfessional(), ...get().professionals[providerId] };
        const services = (pro.services.length ? pro.services : defaults).map((svc) =>
          svc.id === serviceId ? { ...svc, active: !svc.active } : svc
        );
        set((s) => ({ professionals: { ...s.professionals, [providerId]: { ...pro, services } } }));
      },

      addProService: (providerId, name, price, defaults) => {
        const pro = { ...emptyProfessional(), ...get().professionals[providerId] };
        const base = pro.services.length ? pro.services : defaults;
        const id = `svc-${Date.now().toString(36)}`;
        set((s) => ({
          professionals: {
            ...s.professionals,
            [providerId]: { ...pro, services: [...base, { id, name, price, active: true }] },
          },
        }));
      },
    }),
    { name: 'qaryati_provider_dashboard' }
  )
);
