/* ──────────────────────────────────────────────────────────────
   The Pastry Picasso brand + menu data
   ────────────────────────────────────────────────────────────── */

export type CategoryId =
  | "small-chops"
  | "grills"
  | "shawarma"
  | "burgers"
  | "bubble-tea"
  | "milkshakes"
  | "pastries"
  | "loaded-fries"
  | "drinks";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: CategoryId | "extras";
  description?: string;
  price: number;
  image: string;
  position?: string;
  zoom?: number;
  serves?: string;
  includes?: string[];
  /** Item-specific add-ons, chosen in the extras dialog when adding to cart */
  extras?: ExtraOption[];
  rating?: number;
  popular?: boolean;
  featured?: boolean;
  chefSpecial?: boolean;
  available?: boolean; // undefined = available
}

/** Builds the cart line for an item plus its chosen extras. */
export function composeWithExtras(item: MenuItem, extraIds: string[]): MenuItem {
  const chosen = (item.extras ?? []).filter((e) => extraIds.includes(e.id));
  if (chosen.length === 0) return item;
  return {
    ...item,
    id: `${item.id}::${[...extraIds].sort().join("+")}`,
    name: `${item.name} (+ ${chosen.map((c) => c.name).join(", ")})`,
    price: item.price + chosen.reduce((n, c) => n + c.price, 0),
  };
}

export const BUSINESS = {
  name: "The Pastry Picasso",
  legalName: "The Pastry Picasso Enterprises",
  tagline:
    "Lagos' Favorite Destination for Irresistible Treats & Refreshing Delights",
  description:
    "Experience the perfect blend of delicious flavors with our burgers, creamy milkshakes, refreshing bubble teas, rich yoghurts, crispy waffles, tasty small chops, finger foods, and so much more. Every item is freshly prepared with premium ingredients, beautifully presented, and made with passion, because every bite and every sip should leave you craving for more.",
  address: "4 Olugbede Street, Egbeda, Alimosho, Lagos, Nigeria",
  addressLines: ["4 Olugbede Street", "Egbeda, Alimosho", "Lagos, Nigeria"],
  city: "Lagos, Nigeria",
  phoneDisplay: "0904 490 2139",
  phoneTel: "+2349044902139",
  whatsappDisplay: "0814 436 3688",
  whatsappNumber: "2348144363688",
  email: "Otubuoluwakemi5@gmail.com",
  instagramUrl: "https://www.instagram.com/the_pastrypicasso",
  instagramHandle: "@the_pastrypicasso",
  tiktokUrl: "https://www.tiktok.com/@thepastrypicasso",
  tiktokHandle: "@thepastrypicasso",
  hoursText: "9:00 AM – 9:00 PM",
  opens: "09:00",
  closes: "21:00",
  prepTime: "20–60 minutes",
  bank: {
    bankName: "Moniepoint",
    accountName: "The Pastry Picasso Enterprises",
    accountNumber: "5297795254",
  },
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=4+Olugbede+Street+Egbeda+Alimosho+Lagos+Nigeria",
} as const;

export const IMG = {
  logo: "/images/logo.png",
  hero: "/images/hero-spread.jpg",
  waffleBurger: "/images/waffle-burger.jpg",
  sausageRolls: "/images/sausage-rolls.jpg",
  odogwu: "/images/odogwu-platter.jpg",
  allInOne: "/images/allinone-platter.jpg",
  fried: "/images/fried-platter.jpg",
} as const;

export const CATEGORIES: Category[] = [
  { id: "small-chops", label: "Small Chops", emoji: "🥟" },
  { id: "grills", label: "Grills", emoji: "🍗" },
  { id: "shawarma", label: "Shawarma", emoji: "🌯" },
  { id: "burgers", label: "Burgers", emoji: "🍔" },
  { id: "bubble-tea", label: "Bubble Tea", emoji: "🧋" },
  { id: "milkshakes", label: "Milkshakes", emoji: "🥤" },
  { id: "pastries", label: "Pastries", emoji: "🥐" },
  { id: "loaded-fries", label: "Loaded Fries", emoji: "🍟" },
  { id: "drinks", label: "Drinks", emoji: "🍹" },
];

/* ── Per-item extras ───────────────────────────────────────── */

const SMALL_CHOPS_EXTRAS: ExtraOption[] = [
  { id: "samosa", name: "Samosa", price: 400 },
  { id: "spring-roll", name: "Spring Roll", price: 400 },
  { id: "chicken", name: "Chicken", price: 2000 },
  { id: "prawn-mayo", name: "Prawn in Mayo", price: 1500 },
  { id: "puff-puff", name: "Puff Puff", price: 150 },
  { id: "money-bag", name: "Money Bag", price: 1500 },
  { id: "corn-dog", name: "Corn Dog", price: 500 },
  { id: "turkey", name: "Turkey", price: 6000 },
  { id: "beef", name: "Beef", price: 500 },
  { id: "gizzard", name: "Gizzard", price: 500 },
];


const BURGER_EXTRAS: ExtraOption[] = [
  { id: "extra-chicken", name: "Extra chicken", price: 1500 },
  { id: "extra-cheese", name: "Extra cheese", price: 500 },
  { id: "extra-sausage", name: "Extra sausage", price: 500 },
];




/*
  NOTE FOR THE OWNER:
  Prices for "Odogwu Small Chops Platter" (₦45,000) and "All-In-One Small
  Chops Platter" (₦15,000) were not provided and are placeholders. Update
  them anytime from the Dashboard → Menu. Extra prices for shawarma,
  burgers, grills, fries and boba are placeholders too, in
  src/lib/data.ts.
*/
export const BASE_MENU: MenuItem[] = [
  /* ── Small Chops ─────────────────────────────────────────── */
  {
    id: "odogwu-platter",
    extras: SMALL_CHOPS_EXTRAS,
    name: "Odogwu Small Chops Platter",
    category: "small-chops",
    description:
      "Our flagship party platter, loaded edge to edge with golden small chops and peppered proteins. Built to feed the whole crew.",
    price: 45000,
    image: IMG.odogwu,
    position: "50% 55%",
    serves: "Serves up to 20 guests",
    includes: [
      "15 Samosa",
      "15 Spring Rolls",
      "10 Prawn in Mayo",
      "10 Corn Dogs",
      "30 Puff Puff",
      "6 Diced Turkey",
      "5 Chicken",
      "10 Beef / Gizzard",
    ],
    popular: true,
    featured: true,
    chefSpecial: true,
  },
  {
    id: "fried-platter",
    extras: SMALL_CHOPS_EXTRAS,
    name: "Fried Small Chops Platter",
    category: "small-chops",
    description:
      "A crowd-pleasing classic: crisp samosas, golden spring rolls and pillowy puff puff, fried fresh to order.",
    price: 28000,
    image: IMG.fried,
    position: "50% 55%",
    serves: "Serves up to 20 guests",
    includes: ["20 Samosa", "20 Spring Rolls", "60 Puff Puff"],
    popular: true,
    featured: true,
  },
  {
    id: "all-in-one-platter",
    extras: SMALL_CHOPS_EXTRAS,
    featured: true,
    name: "All-In-One Small Chops Platter",
    category: "small-chops",
    description:
      "Every favourite in one beautiful box, perfect for movie nights, date nights and small hangouts.",
    price: 15000,
    image: IMG.allInOne,
    position: "50% 50%",
    includes: [
      "5 Samosa",
      "5 Spring Rolls",
      "5 Money Bags",
      "5 Prawn in Mayo Rolls",
      "20 Puff Puff",
      "10 Beef / Gizzard",
    ],
    popular: true,
  },

  /* ── Burgers ─────────────────────────────────────────────── */
  {
    id: "waffle-burger",
    extras: BURGER_EXTRAS,
    name: "Waffle Burger",
    category: "burgers",
    description:
      "Waffle bun, crunchy chicken, tomatoes, cucumber, lettuce and cheese.",
    price: 11000,
    image: IMG.waffleBurger,
    position: "52% 42%",
    popular: true,
    featured: true,
    chefSpecial: true,
  },

  /* ── Pastries ────────────────────────────────────────────── */
  {
    id: "sausage-bread-rolls",
    name: "Sausage Bread Rolls",
    category: "pastries",
    description:
      "Butter-soft bread rolled around juicy sausages, baked golden fresh every morning.",
    price: 6000,
    image: IMG.sausageRolls,
    position: "40% 60%",
    popular: true,
    featured: true,
  },
];

/** Items removed from the default menu in v3 (no dedicated photo yet). */
export const RETIRED_ITEM_IDS = [
  "grilled-chicken-jollof", "peppered-gizzard", "peppered-chicken-pack",
  "chicken-shawarma", "double-sausage-shawarma", "crunchy-chicken-burger",
  "signature-milk-tea", "strawberry-milk-tea", "chocolate-oreo-shake",
  "salted-caramel-shake", "chocolate-drizzle-waffles", "chicken-loaded-fries",
  "suya-beef-fries", "berry-yoghurt-parfait", "chilled-zobo",
];

export const GALLERY = [
  { src: IMG.hero, alt: "The Pastry Picasso spread: burgers, bubble tea, shawarma, waffles and shakes", w: 853, h: 1280 },
  { src: IMG.waffleBurger, alt: "Signature Waffle Burger with crunchy chicken and cheese", w: 960, h: 1280 },
  { src: IMG.odogwu, alt: "Odogwu small chops platter with peppered chicken and corn dogs", w: 960, h: 1280 },
  { src: IMG.fried, alt: "Fried small chops platter with samosas, spring rolls and puff puff", w: 960, h: 1280 },
  { src: IMG.allInOne, alt: "All-in-one small chops box with money bags and gizzard", w: 960, h: 1280 },
  { src: IMG.sausageRolls, alt: "Fresh-baked sausage bread rolls in Pastry Picasso boxes", w: 960, h: 1280 },
];

export const TRUST_BADGES = [
  "Freshly Made",
  "Premium Ingredients",
  "Pickup Available",
  "Delivery Available",
] as const;

/* ── Reviews (seed content, curated from the dashboard) ────── */

export type ReviewSource = "Instagram" | "WhatsApp" | "TikTok" | "In store" | "Website";

export interface ReviewSeedItem {
  id: string;
  name: string;
  rating: number;
  text: string;
  source: ReviewSource;
  daysAgo: number;
  visible: boolean;
}

export const REVIEW_SEED: ReviewSeedItem[] = [
  {
    id: "rev-adaeze",
    name: "Adaeze N.",
    rating: 5,
    text: "The Odogwu platter fed my whole family at my mum's 60th. Everything was still crunchy by evening. 10/10!",
    source: "Instagram",
    daysAgo: 3,
    visible: true,
  },
  {
    id: "rev-tolu",
    name: "Tolu A.",
    rating: 5,
    text: "That waffle burger is not normal 😭 I have ordered three times this month. The chicken is so crispy.",
    source: "WhatsApp",
    daysAgo: 5,
    visible: true,
  },
  {
    id: "rev-chidinma",
    name: "Chidinma O.",
    rating: 4,
    text: "Ordered the fried platter for a house party. Delivery to Akowonjo took less than an hour and everything was still hot.",
    source: "Instagram",
    daysAgo: 8,
    visible: true,
  },
  {
    id: "rev-bello",
    name: "Mr Bello",
    rating: 5,
    text: "Ordered small chops for our office party. Beautiful presentation, and the samosa was the star. They even called to confirm my order.",
    source: "In store",
    daysAgo: 12,
    visible: true,
  },
  {
    id: "rev-sandra",
    name: "Sandra E.",
    rating: 5,
    text: "Their sausage rolls are elite. Baked fresh, butter soft. My kids finish a box in one sitting.",
    source: "TikTok",
    daysAgo: 15,
    visible: true,
  },
  {
    id: "rev-ifeanyi",
    name: "Ifeanyi K.",
    rating: 4,
    text: "The all-in-one box is perfect for two. The puff puff is soft and the gizzard has proper pepper. Taste is 100.",
    source: "WhatsApp",
    daysAgo: 20,
    visible: false,
  },
];
