import type { Metadata, Viewport } from 'next';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Anton&family=Cairo:wght@400;600;700' +
  '&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Kaushan+Script&family=Lalezar' +
  '&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,700;0,800;1,600&family=Poppins:wght@400;500;600;700' +
  '&family=Reem+Kufi:wght@500;700&display=swap';

export const metadata: Metadata = {
  title: 'PizzArt · Menu',
  description: 'Menu de PizzArt, pizza au feu de bois à Draria, Alger',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#941B25' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
