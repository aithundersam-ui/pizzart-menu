import type { Metadata } from 'next';
import { getPublicMenu } from '@/lib/data';
import { tr } from '@/lib/i18n';
import Menu from '@/components/Menu';
import './menu.css';

// Rebuilt instantly whenever the admin saves; the hourly refresh is only a safety net.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublicMenu();
  const r = data.restaurant;
  return {
    title: `${r.name} · Menu`,
    description: `${tr(r.slogan, 'fr')} · ${tr(r.address, 'fr')}`,
    icons: data.branding.logoImageId ? { icon: `/api/img/${data.branding.logoImageId}` } : undefined,
  };
}

export default async function Page() {
  const data = await getPublicMenu();
  return <Menu data={data} />;
}
