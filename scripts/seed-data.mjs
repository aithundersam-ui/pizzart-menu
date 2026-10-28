// Starting menu, typed from PizzArt's printed menu (October 2026).
// The owner can change everything from the admin panel afterwards.

const ING = {
  tomatoSauce: ['sauce tomate', 'صلصة الطماطم', 'tomato sauce'],
  whiteSauce: ['sauce blanche', 'صلصة بيضاء', 'white sauce'],
  houseSauce: ['sauce maison', 'صلصة البيت', 'house sauce'],
  algerianSauce: ['sauce algérienne', 'صلصة جزائرية', 'Algerian sauce'],
  mozzarella: ['mozzarella', 'موزاريلا', 'mozzarella'],
  cheese: ['fromage', 'جبن', 'cheese'],
  pepper: ['poivron', 'فلفل', 'bell pepper'],
  tomato: ['tomate', 'طماطم', 'tomato'],
  onion: ['oignons', 'بصل', 'onions'],
  olives: ['olives noires', 'زيتون أسود', 'black olives'],
  mushrooms: ['champignons', 'فطر', 'mushrooms'],
  chicken: ['poulet', 'دجاج', 'chicken'],
  smokedChicken: ['poulet fumé', 'دجاج مدخن', 'smoked chicken'],
  anchovies: ['anchois', 'أنشوفة', 'anchovies'],
  capers: ['câpres', 'كبر', 'capers'],
  meat: ['viande', 'لحم', 'minced beef'],
  smokedMeat: ['viande fumée', 'لحم مدخن', 'smoked beef'],
  tuna: ['thon', 'تونة', 'tuna'],
  gruyere: ['gruyère', 'غرويير', 'gruyère'],
  camembert: ['camembert', 'كاممبير', 'camembert'],
  gouda: ['gouda', 'غودا', 'gouda'],
  salmon: ['saumon', 'سلمون', 'salmon'],
  shrimp: ['crevette', 'جمبري', 'shrimp'],
  salad: ['salade', 'خس', 'lettuce'],
  meat80: ['viande (80 g)', 'لحم (80 غ)', 'beef patty (80 g)'],
  meat80x2: ['viande (80 g) x2', 'لحم (80 غ) ×2', 'two beef patties (80 g)'],
  chicken80: ['poulet (80 g)', 'دجاج (80 غ)', 'chicken (80 g)'],
  caramelOnion: ['oignons caramélisés', 'بصل مكرمل', 'caramelised onions'],
};

const desc = (...keys) => ({
  fr: cap(keys.map((k) => ING[k][0]).join(', ')),
  ar: keys.map((k) => ING[k][1]).join('، '),
  en: cap(keys.map((k) => ING[k][2]).join(', ')),
});
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const n = (fr, ar, en = fr) => ({ fr, ar, en });
const base = ['tomatoSauce', 'mozzarella', 'cheese'];

export const CATEGORIES = [
  {
    name: n('Pizza', 'بيتزا'),
    note: n('Cuite au feu de bois', 'مطهوة على الحطب', 'Baked in a wood-fired oven'),
    items: [
      { name: n('Margherita', 'مارغريتا'), price: 450, d: base, image: 'margherita.jpg' },
      { name: n('Végétarienne', 'نباتية', 'Vegetarian'), price: 550, d: [...base, 'pepper', 'tomato', 'onion', 'olives'] },
      { name: n('Champignons', 'فطر', 'Mushroom'), price: 650, d: [...base, 'mushrooms'] },
      { name: n('Poulet', 'دجاج', 'Chicken'), price: 700, d: [...base, 'chicken'] },
      { name: n('Napolitaine', 'نابوليتان', 'Napoletana'), price: 750, d: [...base, 'anchovies', 'capers'] },
      { name: n('Poulet fumé', 'دجاج مدخن', 'Smoked chicken'), price: 750, d: [...base, 'smokedChicken'] },
      { name: n('Viande', 'لحم', 'Beef'), price: 750, d: [...base, 'meat'] },
      { name: n('Thon', 'تونة', 'Tuna'), price: 750, d: [...base, 'tuna'] },
      { name: n('Chef', 'الشيف', "Chef's"), price: 750, d: [...base, 'meat', 'chicken'] },
      { name: n('Suprême', 'سوبريم', 'Supreme'), price: 800, d: ['whiteSauce', 'mozzarella', 'cheese', 'chicken'] },
      { name: n('Végé viande', 'نباتية باللحم', 'Veggie beef'), price: 850, d: [...base, 'meat', 'pepper', 'tomato', 'onion', 'olives'] },
      { name: n('Pepperoni', 'بيبروني'), price: 850, d: [...base, 'smokedMeat'], badges: ['spicy'], image: 'pepperoni.jpg' },
      { name: n('4 Fromages', 'أربعة أجبان', 'Four cheese'), price: 850, d: [...base, 'gruyere', 'camembert'], badges: ['new'], image: '4-fromages.jpg' },
      { name: n('5 Fromages', 'خمسة أجبان', 'Five cheese'), price: 950, d: [...base, 'gruyere', 'camembert', 'gouda'] },
      { name: n('Royale blanche', 'رويال بيضاء', 'Royal white'), price: 1000, d: ['whiteSauce', 'mushrooms', 'smokedChicken', 'chicken'] },
      { name: n('Saumon', 'سلمون', 'Salmon'), price: 1200, d: [...base, 'salmon'] },
      { name: n('Crevette', 'جمبري', 'Shrimp'), price: 1200, d: [...base, 'shrimp'] },
      { name: n('Pizza Art', 'بيتزا آرت'), price: 1100, d: [...base, 'gruyere', 'camembert', 'smokedChicken', 'meat', 'salmon'], badges: ['chef'], image: 'pizza-art.jpg' },
    ],
  },
  {
    name: n('Tacos', 'تاكوس'),
    note: n('', ''),
    items: [
      { name: n('Tacos poulet', 'تاكوس دجاج', 'Chicken tacos'), price: 500, image: 'tacos.jpg' },
      { name: n('Tacos viande', 'تاكوس لحم', 'Beef tacos'), price: 550 },
      { name: n('Tacos mix', 'تاكوس ميكس', 'Mixed tacos'), price: 550 },
      { name: n('Tacos poulet mariné', 'تاكوس دجاج متبل', 'Marinated chicken tacos'), price: 550 },
      { name: n('Tacos poulet fumé', 'تاكوس دجاج مدخن', 'Smoked chicken tacos'), price: 650 },
    ],
  },
  {
    name: n('Burger', 'برغر'),
    note: n('', ''),
    items: [
      { name: n('Classic', 'كلاسيك'), price: 350, d: ['houseSauce', 'salad', 'tomato', 'meat80', 'gruyere'], image: 'burger.jpg' },
      { name: n('Chicken', 'تشيكن'), price: 350, d: ['houseSauce', 'salad', 'tomato', 'chicken80', 'gruyere'] },
      { name: n('Algérien', 'جزائري', 'Algerian'), price: 350, d: ['algerianSauce', 'salad', 'tomato', 'meat80', 'gruyere'] },
      { name: n('Burger double', 'برغر مزدوج', 'Double burger'), price: 500, d: ['houseSauce', 'salad', 'tomato', 'meat80x2', 'gruyere'] },
    ],
  },
  {
    name: n('Poutine', 'بوتين'),
    note: n('', ''),
    items: [
      { name: n('Poutine viande', 'بوتين لحم', 'Beef poutine'), price: 700, d: ['meat', 'cheese', 'whiteSauce', 'caramelOnion'] },
      { name: n('Poutine poulet', 'بوتين دجاج', 'Chicken poutine'), price: 700, d: ['chicken', 'cheese', 'whiteSauce', 'caramelOnion'] },
      { name: n('Poutine mix', 'بوتين ميكس', 'Mixed poutine'), price: 700, d: ['chicken', 'meat', 'cheese', 'whiteSauce', 'caramelOnion'] },
    ],
  },
  {
    name: n('Suppléments pizza', 'إضافات البيتزا', 'Pizza extras'),
    note: n('À ajouter à votre pizza', 'تضاف إلى البيتزا', 'Add to any pizza'),
    items: [
      { name: n('Fromage', 'جبن', 'Cheese'), price: 200 },
      { name: n('Bordure', 'حواف محشوة', 'Stuffed crust'), price: 150 },
      { name: n('Viande', 'لحم', 'Beef'), price: 150 },
      { name: n('Poulet', 'دجاج', 'Chicken'), price: 150 },
      { name: n('Thon', 'تونة', 'Tuna'), price: 150 },
    ],
  },
  {
    name: n('Suppléments burger', 'إضافات البرغر', 'Burger extras'),
    note: n('À ajouter à votre burger', 'تضاف إلى البرغر', 'Add to any burger'),
    items: [
      { name: n('Oignons caramélisés', 'بصل مكرمل', 'Caramelised onions'), price: 50 },
      { name: n('Œuf', 'بيض', 'Egg'), price: 50 },
      { name: n('Gruyère', 'غرويير'), price: 100 },
      { name: n('Frites', 'بطاطا مقلية', 'Fries'), price: 200 },
    ],
  },
].map((c) => ({
  ...c,
  items: c.items.map(({ d, ...it }) => ({ ...it, description: d ? desc(...d) : n('', '', '') })),
}));

export const SETTINGS = {
  restaurant: {
    name: 'PizzArt',
    slogan: n('Pizza au feu de bois', 'بيتزا على الحطب', 'Wood-fired pizza'),
    address: n('Draria, Alger', 'الدرارية، الجزائر', 'Draria, Algiers'),
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=PizzArt+Draria+Alger',
    phone: '0541020543',
    whatsapp: '',
    instagram: 'pizza_art.16',
    facebook: 'PIZZA ART',
    tiktok: '',
    delivery: n('Livraison disponible', 'التوصيل متوفر', 'Delivery available'),
    announcement: n('', '', ''),
    // 0 = Sunday ... 6 = Saturday, times in Algiers local time
    hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: '11:00', close: '23:00', closed: false })),
  },
  branding: {
    primary: '#941B25',
    accent: '#E5A823',
    background: '#F7F0E3',
    text: '#3B2A22',
    font: 'classic',
    logoImageId: null,
    coverImageId: null,
    featuredItemId: null,
  },
  languages: { enabled: ['fr', 'ar', 'en'], default: 'fr', labels: { fr: {}, ar: {}, en: {} } },
};
