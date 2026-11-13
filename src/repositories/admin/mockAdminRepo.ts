// ─── Admin dashboard without a backend (local dev): empty lists, nothing saved
import { DELIVERY_FEE_DEFAULT } from '@/config/delivery';
import { overviewFromJson } from './logic';
import type { AdminRepo } from './types';

const notLive = async (): Promise<never> => {
  throw new Error('لوحة التحكم محتاجة قاعدة البيانات، ومش متوصّلة دلوقتي');
};

export function createMockAdminRepo(): AdminRepo {
  return {
    overview: async () => overviewFromJson({}),
    listOrders: async () => [],
    setOrderStatus: notLive,
    listShops: async () => [],
    saveShop: notLive,
    listProducts: async () => [],
    saveProduct: notLive,
    listServices: async () => [],
    saveService: notLive,
    listProviders: async () => [],
    saveProvider: notLive,
    uploadPhoto: notLive,
    listDonations: async () => [],
    setDonation: notLive,
    listVillages: async () => [],
    setVillageServed: notLive,
    setVillageDeliveryFee: notLive,
    getDefaultDeliveryFee: async () => DELIVERY_FEE_DEFAULT,
    setDefaultDeliveryFee: notLive,
  };
}
