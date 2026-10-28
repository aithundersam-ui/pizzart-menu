export const LANGS = ['fr', 'ar', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Text = Partial<Record<Lang, string>>;

export const BADGES = ['chef', 'new', 'spicy'] as const;
export type Badge = (typeof BADGES)[number];

export type Size = { label: Text; price: number };

export type Item = {
  id: number;
  categoryId: number;
  name: Text;
  description: Text;
  price: number | null;
  sizes: Size[];
  badges: Badge[];
  imageId: string | null;
  available: boolean;
  visible: boolean;
  position: number;
};

export type Category = {
  id: number;
  name: Text;
  note: Text;
  imageId: string | null;
  position: number;
  visible: boolean;
};

export type Hours = { day: number; open: string; close: string; closed: boolean };

export type Restaurant = {
  name: string;
  slogan: Text;
  address: Text;
  mapsUrl: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  delivery: Text;
  announcement: Text;
  hours: Hours[];
};

export type Branding = {
  primary: string;
  accent: string;
  background: string;
  text: string;
  font: 'classic' | 'modern' | 'street';
  logoImageId: string | null;
  coverImageId: string | null;
  featuredItemId: number | null;
};

export type Languages = {
  enabled: Lang[];
  default: Lang;
  labels: Partial<Record<Lang, Record<string, string>>>;
};

export type Settings = { restaurant: Restaurant; branding: Branding; languages: Languages };

export type MenuData = Settings & {
  categories: (Category & { items: Item[] })[];
};
