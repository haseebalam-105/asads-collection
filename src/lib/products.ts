import { Product } from "@/types/product";

// NOTE: This is a static catalog for the initial build. Once MongoDB Atlas is
// connected, replace these functions with real queries (see lib/db.ts) —
// the shape of `Product` already matches the intended Mongo document schema,
// so the swap is a drop-in change, not a rewrite.

export const products: Product[] = [
  {
    id: "1",
    slug: "premium-waterproof-rain-suit",
    sku: "ARC-RS-001",
    name: { en: "Premium Waterproof Rain Suit", ur: "پریمیم واٹر پروف رین سوٹ" },
    category: "raincoats",
    shortDescription: {
      en: "100% waterproof jacket + trouser set with adjustable hood.",
      ur: "100% واٹر پروف جیکٹ اور پتلون سیٹ، ایڈجسٹ ایبل ہڈ کے ساتھ۔",
    },
    description: {
      en: "Stay completely dry in any downpour with our premium two-piece rain suit. Built from 100% waterproof, ripstop fabric with sealed seams, this suit includes a hooded jacket and matching trousers designed for daily commuters, bikers, and outdoor workers. An adjustable cap keeps rain off your face, underarm air holes stop you from overheating, and the reinforced main pocket keeps your phone and wallet dry.",
      ur: "ہمارے پریمیم ٹو پیس رین سوٹ کے ساتھ کسی بھی بارش میں مکمل خشک رہیں۔ یہ سوٹ 100% واٹر پروف کپڑے سے بنا ہے اور روزانہ سفر کرنے والوں، بائیکرز اور آؤٹ ڈور ورکرز کے لیے ڈیزائن کیا گیا ہے۔",
    },
    features: [
      { en: "100% waterproof, wind-resistant fabric", ur: "100% واٹر پروف اور ونڈ ریزسٹنٹ کپڑا" },
      { en: "Adjustable cap for full face coverage", ur: "مکمل چہرے کی حفاظت کے لیے ایڈجسٹ ایبل کیپ" },
      { en: "Underarm air holes for breathability", ur: "ہوا کی گزرگاہ کے لیے بغل میں سوراخ" },
      { en: "Reinforced main pocket, storm flap over buttons", ur: "مضبوط مرکزی جیب، بٹنوں پر سٹارم فلیپ" },
    ],
    price: 2799,
    compareAtPrice: 3499,
    images: ["/images/rain-suit.jpeg"],
    sizes: [
      { value: "M", inStock: true },
      { value: "L", inStock: true },
      { value: "XL", inStock: true },
      { value: "XXL", inStock: false },
    ],
    colors: [
      { value: "Black", colorHex: "#161A1F", inStock: true },
      { value: "Blue", colorHex: "#2C6CB0", inStock: true },
    ],
    stock: 42,
    rating: 4.7,
    reviewCount: 3,
    reviews: [
      {
        id: "r1",
        customerName: "Hamza R.",
        rating: 5,
        comment: "Kept me completely dry on the bike during heavy rain. Great stitching quality.",
        approved: true,
        createdAt: "2026-07-10T10:00:00.000Z",
      },
      {
        id: "r2",
        customerName: "Ayesha K.",
        rating: 4,
        comment: "Good fit, hood could be a little bigger for helmet use.",
        approved: true,
        createdAt: "2026-07-15T10:00:00.000Z",
      },
      {
        id: "r3",
        customerName: "Bilal S.",
        rating: 5,
        comment: "Excellent value, delivered in 3 days.",
        approved: true,
        createdAt: "2026-07-20T10:00:00.000Z",
      },
    ],
    isFeatured: true,
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "2",
    slug: "waterproof-motorcycle-cover",
    sku: "ARC-BC-002",
    name: { en: "Waterproof Motorcycle Cover", ur: "واٹر پروف موٹر سائیکل کور" },
    category: "bike-covers",
    shortDescription: {
      en: "All-weather protection for standard bikes, sports bikes, scooters & cruisers.",
      ur: "تمام موسموں میں بائیک کے لیے مکمل تحفظ۔",
    },
    description: {
      en: "Shield your motorcycle from rain, dust, UV rays, and scratches with this heavy-duty, double-stitched cover. The adjustable strap and elastic hem lock the cover in place even on windy days, while the built-in air vent system prevents moisture buildup underneath. Fits standard bikes, sports bikes, scooters, and cruisers, and folds down into its own carry pouch for easy storage.",
      ur: "اپنی موٹر سائیکل کو بارش، دھول، سورج کی روشنی اور خراشوں سے بچائیں۔ یہ کور مضبوط اور واٹر پروف مواد سے بنا ہے۔",
    },
    features: [
      { en: "100% waterproof & dust proof", ur: "100% واٹر پروف اور دھول سے محفوظ" },
      { en: "UV resistant, protects paint from sun damage", ur: "سورج کی روشنی سے حفاظت" },
      { en: "Double stitched, scratch & tear resistant", ur: "ڈبل سلائی، خراش سے محفوظ" },
      { en: "Adjustable strap + air vent system", ur: "ایڈجسٹ ایبل پٹی اور ہوا کی گزرگاہ" },
      { en: "Comes with a storage bag", ur: "سٹوریج بیگ کے ساتھ" },
    ],
    price: 1899,
    compareAtPrice: 2400,
    images: ["/images/bike-cover.jpeg"],
    sizes: [
      { value: "Standard", inStock: true },
      { value: "Large (Cruiser)", inStock: true },
    ],
    colors: [{ value: "Black", colorHex: "#161A1F", inStock: true }],
    stock: 60,
    rating: 4.8,
    reviewCount: 2,
    reviews: [
      {
        id: "r1",
        customerName: "Usman T.",
        rating: 5,
        comment: "Fits my sports bike perfectly, no water gets through at all.",
        approved: true,
        createdAt: "2026-07-05T10:00:00.000Z",
      },
      {
        id: "r2",
        customerName: "Fatima N.",
        rating: 5,
        comment: "Strong material, straps keep it from flying off in wind.",
        approved: true,
        createdAt: "2026-07-18T10:00:00.000Z",
      },
    ],
    isFeatured: true,
    createdAt: "2026-06-03T10:00:00.000Z",
  },
  {
    id: "3",
    slug: "premium-car-cover",
    sku: "ARC-CC-003",
    name: { en: "Premium Waterproof Car Cover", ur: "پریمیم واٹر پروف کار کور" },
    category: "car-covers",
    shortDescription: {
      en: "Full protection for hatchbacks, sedans, SUVs & MPVs against rain, sun and dust.",
      ur: "ہیچ بیک، سیڈان، ایس یو وی اور ایم پی وی کے لیے مکمل حفاظت۔",
    },
    description: {
      en: "Give your car complete outdoor protection with this premium cover, engineered from strong, durable, long-lasting fabric with a gold piping trim. It's waterproof, UV-resistant, dust-proof, and scratch-resistant, with a secure elastic hem and buckle straps that keep it locked in place, plus air vents to prevent condensation. Fits hatchbacks, sedans, SUVs, and MPVs, and packs into its own zip-up carry bag.",
      ur: "اپنی گاڑی کو مکمل آؤٹ ڈور تحفظ دیں۔ یہ کور واٹر پروف، دھوپ اور دھول سے محفوظ ہے۔",
    },
    features: [
      { en: "Waterproof, UV & dust protection", ur: "واٹر پروف، سورج اور دھول سے تحفظ" },
      { en: "Scratch resistant premium fabric", ur: "خراش سے محفوظ پریمیم کپڑا" },
      { en: "Elastic hem + secure buckle straps", ur: "لچکدار کنارہ اور محفوظ بکل پٹیاں" },
      { en: "Air vents for breathability", ur: "ہوا کی گزرگاہ کے لیے سوراخ" },
      { en: "Fits hatchback, sedan, SUV & MPV", ur: "ہیچ بیک، سیڈان، ایس یو وی اور ایم پی وی کے لیے موزوں" },
    ],
    price: 4499,
    compareAtPrice: 5200,
    images: ["/images/car-cover.jpeg"],
    sizes: [
      { value: "Hatchback", inStock: true },
      { value: "Sedan", inStock: true },
      { value: "SUV", inStock: true },
      { value: "MPV", inStock: true },
    ],
    colors: [{ value: "Black / Gold Trim", colorHex: "#161A1F", inStock: true }],
    stock: 25,
    rating: 4.9,
    reviewCount: 2,
    reviews: [
      {
        id: "r1",
        customerName: "Adnan M.",
        rating: 5,
        comment: "Premium quality, exact fit for my sedan. Worth the price.",
        approved: true,
        createdAt: "2026-07-08T10:00:00.000Z",
      },
      {
        id: "r2",
        customerName: "Sana Q.",
        rating: 5,
        comment: "The gold trim looks classy and the straps hold it firmly even on the highway side.",
        approved: true,
        createdAt: "2026-07-22T10:00:00.000Z",
      },
    ],
    isFeatured: true,
    createdAt: "2026-06-05T10:00:00.000Z",
  },
  {
    id: "4",
    slug: "waterproof-bedsheet-cover",
    sku: "ARC-HP-004",
    name: { en: "Waterproof Bedsheet Cover", ur: "واٹر پروف بیڈ شیٹ کور" },
    category: "home-protection",
    shortDescription: {
      en: "Soft, quilted, 100% waterproof mattress protector for spills, stains & dust.",
      ur: "نرم، 100% واٹر پروف گدے کا کور، داغ اور دھول سے تحفظ۔",
    },
    description: {
      en: "Protect your mattress and enhance your sleep with a soft, quilted, 100% waterproof bedsheet cover. It blocks spills, stains, dust, and allergens while staying silent and comfortable to sleep on. Machine washable and easy to wipe clean, it's ideal for kids, elders, and pets, and travels well thanks to its compact carry case.",
      ur: "اپنے گدے کی حفاظت کریں اور نیند بہتر بنائیں۔ یہ کور نرم اور 100% واٹر پروف ہے، داغ، دھول اور الرجی سے بچاتا ہے۔",
    },
    features: [
      { en: "100% waterproof against spills & liquids", ur: "مائعات اور داغوں سے 100% تحفظ" },
      { en: "Dust & allergen proof", ur: "دھول اور الرجی سے محفوظ" },
      { en: "Soft, silent & breathable fabric", ur: "نرم، خاموش اور ہوا دار کپڑا" },
      { en: "Machine washable, easy wipe-clean", ur: "مشین سے دھونے کے قابل" },
      { en: "Ideal for kids, elders & pets", ur: "بچوں، بزرگوں اور پالتو جانوروں کے لیے موزوں" },
    ],
    price: 1599,
    compareAtPrice: 1999,
    images: ["/images/bedsheet-cover.jpeg"],
    sizes: [
      { value: "Single Bed", inStock: true },
      { value: "Double Bed", inStock: true },
      { value: "King Size", inStock: true },
    ],
    colors: [{ value: "White", colorHex: "#FFFFFF", inStock: true }],
    stock: 80,
    rating: 4.6,
    reviewCount: 1,
    reviews: [
      {
        id: "r1",
        customerName: "Mariam A.",
        rating: 4,
        comment: "Very soft for a waterproof cover, no plastic crinkle sound at all.",
        approved: true,
        createdAt: "2026-07-25T10:00:00.000Z",
      },
    ],
    isFeatured: false,
    createdAt: "2026-06-10T10:00:00.000Z",
  },
];

export function getAllProducts() {
  return products;
}

export function getFeaturedProducts() {
  return products.filter((p) => p.isFeatured);
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 4) {
  const current = getProductBySlug(slug);
  if (!current) return [];
  return products
    .filter((p) => p.slug !== slug && p.category === current.category)
    .concat(products.filter((p) => p.slug !== slug && p.category !== current.category))
    .slice(0, limit);
}

export const categories = [
  { slug: "raincoats", name: { en: "Rain Coats", ur: "رین کوٹ" } },
  { slug: "bike-covers", name: { en: "Bike Covers", ur: "بائیک کور" } },
  { slug: "car-covers", name: { en: "Car Covers", ur: "کار کور" } },
  { slug: "home-protection", name: { en: "Home Protection", ur: "گھریلو تحفظ" } },
] as const;
