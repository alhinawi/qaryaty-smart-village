import { useAppearanceEnabled } from '@/hooks/useAppearanceEnabled';
import { Link, Navigate } from 'react-router';
import { ThemeSelector } from '@/components/shared/ThemeSelector';
export default function ThemeSettingsPage() { const enabled = useAppearanceEnabled(); if (enabled !== true) return <Navigate to="/settings" replace />; return <section className="p-4 max-w-xl mx-auto"><Link to="/settings" className="inline-block text-green font-bold py-2 mb-2">‹ الإعدادات</Link><h1 className="text-2xl font-black text-text mb-3">شكل التطبيق</h1><ThemeSelector /></section>; }
