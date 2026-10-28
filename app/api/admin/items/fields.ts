import { BADGES } from '@/lib/types';
import { cleanPrice, cleanText, HttpError } from '@/lib/api';

/** Validates the editable fields of a dish. */
export function itemFields(b: any) {
  const sizes = Array.isArray(b.sizes)
    ? b.sizes
        .slice(0, 6)
        .map((s: any) => ({ label: cleanText(s?.label, 40), price: cleanPrice(s?.price) }))
        .filter((s: any) => s.price !== null)
    : [];
  const price = cleanPrice(b.price);
  if (price === null && sizes.length === 0) throw new HttpError(400, 'Give the dish a price');
  return {
    categoryId: Number(b.categoryId) || null,
    name: cleanText(b.name, 80),
    description: cleanText(b.description, 400),
    price,
    sizes,
    badges: Array.isArray(b.badges) ? b.badges.filter((x: string) => (BADGES as readonly string[]).includes(x)) : [],
    imageId: typeof b.imageId === 'string' && b.imageId ? b.imageId : null,
    available: b.available !== false,
    visible: b.visible !== false,
  };
}
