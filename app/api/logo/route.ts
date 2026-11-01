import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/data';

// Current logo, for pages that can't read settings (the admin login screen).
export async function GET(req: Request) {
  const { branding } = await getSettings();
  if (!branding.logoImageId) return new Response('No logo', { status: 404 });
  return NextResponse.redirect(new URL(`/api/img/${branding.logoImageId}`, req.url), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
