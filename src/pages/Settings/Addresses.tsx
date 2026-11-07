import { Link } from 'react-router';
import MyAddresses from '@/components/address/MyAddresses';
/** Reuse the same address store/editor as Profile, no parallel address book. */
export default function AddressesSettingsPage() { return <section className="p-4 max-w-xl mx-auto"><Link to="/settings" className="inline-block text-green font-bold py-2 mb-2">‹ الإعدادات</Link><h1 className="text-2xl font-black text-text mb-3">عناوين التوصيل</h1><MyAddresses /></section>; }
