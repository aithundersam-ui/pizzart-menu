import type { Lang, Text } from './types';

export const LANG_NAMES: Record<Lang, string> = { fr: 'Français', ar: 'العربية', en: 'English' };
export const LANG_SHORT: Record<Lang, string> = { fr: 'FR', ar: 'ع', en: 'EN' };

/** Fixed words on the public menu. The owner can override any of them from Admin > Languages. */
export const LABELS = {
  search: { fr: 'Rechercher un plat, un ingrédient…', ar: 'ابحث عن طبق أو مكوّن…', en: 'Search a dish or ingredient…' },
  open: { fr: 'Ouvert', ar: 'مفتوح', en: 'Open' },
  closed: { fr: 'Fermé', ar: 'مغلق', en: 'Closed' },
  until: { fr: "jusqu'à", ar: 'حتى', en: 'until' },
  opensAt: { fr: 'ouvre à', ar: 'يفتح على', en: 'opens at' },
  chef: { fr: 'Le choix du chef', ar: 'اختيار الشيف', en: "Chef's pick" },
  new: { fr: 'Nouveau', ar: 'جديد', en: 'New' },
  spicy: { fr: 'Piquant', ar: 'حار', en: 'Spicy' },
  soldOut: { fr: 'Épuisé', ar: 'نفد', en: 'Sold out' },
  noResults: { fr: 'Aucun plat trouvé', ar: 'لا توجد نتائج', en: 'No dishes found' },
  call: { fr: 'Appeler', ar: 'اتصل', en: 'Call' },
  directions: { fr: 'Itinéraire', ar: 'الاتجاهات', en: 'Directions' },
  hours: { fr: "Horaires d'ouverture", ar: 'أوقات العمل', en: 'Opening hours' },
  info: { fr: 'Infos & contact', ar: 'معلومات واتصال', en: 'Info & contact' },
  close: { fr: 'Fermer', ar: 'إغلاق', en: 'Close' },
  currency: { fr: 'DA', ar: 'دج', en: 'DA' },
  table: { fr: 'Table', ar: 'طاولة', en: 'Table' },
} satisfies Record<string, Record<Lang, string>>;

export type LabelKey = keyof typeof LABELS;

export const DAY_NAMES: Record<Lang, string[]> = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** Text in the wanted language, falling back to French, then to any language that has it. */
export function tr(text: Text | undefined, lang: Lang): string {
  if (!text) return '';
  return text[lang]?.trim() || text.fr?.trim() || text.ar?.trim() || text.en?.trim() || '';
}

/** 1100 -> "1 100" with a narrow no-break space, the usual Algerian/French grouping. */
export function formatPrice(price: number): string {
  return Math.round(price).toLocaleString('fr-FR').replace(/\s/g, ' ');
}
