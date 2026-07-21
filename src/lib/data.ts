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
  image: string;
  /** object-position crop into the source photo */
  position?: string;
  /** extra zoom for tight crops out of the big spread photo */
  zoom?: number;
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
  popular?: boolean;
  featured?: boolean;
  chefSpecial?: boolean;
  available?: boolean; // undefined = available
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
  { id: "small-chops", label: "Small Chops", emoji: "🥟", image: IMG.fried, position: "50% 55%" },
  { id: "grills", label: "Grills", emoji: "🍗", image: IMG.hero, position: "46% 88%", zoom: 1.7 },
  { id: "shawarma", label: "Shawarma", emoji: "🌯", image: IMG.hero, position: "80% 52%", zoom: 1.8 },
  { id: "burgers", label: "Burgers", emoji: "🍔", image: IMG.waffleBurger, position: "52% 42%" },
  { id: "bubble-tea", label: "Bubble Tea", emoji: "🧋", image: IMG.hero, position: "31% 21%", zoom: 1.9 },
  { id: "milkshakes", label: "Milkshakes", emoji: "🥤", image: IMG.hero, position: "88% 76%", zoom: 1.9 },
  { id: "pastries", label: "Pastries", emoji: "🥐", image: IMG.sausageRolls, position: "40% 60%" },
  { id: "loaded-fries", label: "Loaded Fries", emoji: "🍟", image: IMG.hero, position: "50% 71%", zoom: 2 },
  { id: "drinks", label: "Drinks", emoji: "🍹", image: IMG.hero, position: "71% 15%", zoom: 1.9 },
];

/*
  NOTE FOR THE OWNER:
  Prices for "Odogwu Small Chops Platter" (₦45,000) and "All-In-One Small
  Chops Platter" (₦15,000) were not provided and are placeholders. Update
  them anytime from the Dashboard → Menu.
*/
export const BASE_MENU: MenuItem[] = [
  /* ── Small Chops ─────────────────────────────────────────── */
  {
    id: "odogwu-platter",
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

  /* ── Grills ──────────────────────────────────────────────── */
  {
    id: "grilled-chicken-jollof",
    name: "Grilled Chicken & Jollof",
    category: "grills",
    description:
      "Smoky char-grilled chicken served over party-style jollof with a proper kick of pepper.",
    price: 12000,
    image: IMG.hero,
    position: "46% 88%",
    zoom: 1.7,
    popular: true,
  },
  {
    id: "peppered-gizzard",
    name: "Peppered Gizzard Skewers",
    category: "grills",
    description:
      "Tender gizzards tossed in our fiery pepper sauce, stacked on skewers.",
    price: 5000,
    image: IMG.allInOne,
    position: "63% 55%",
    zoom: 1.5,
  },
  {
    id: "peppered-chicken-pack",
    name: "Peppered Chicken Pack",
    category: "grills",
    description:
      "Juicy chicken pieces smothered in slow-cooked, smoky ata din din.",
    price: 8000,
    image: IMG.odogwu,
    position: "52% 38%",
    zoom: 1.5,
  },

  /* ── Shawarma ────────────────────────────────────────────── */
  {
    id: "chicken-shawarma",
    name: "Chicken Shawarma",
    category: "shawarma",
    description:
      "Char-grilled chicken, crunchy veg and garlic mayo rolled in a toasted wrap.",
    price: 6500,
    image: IMG.hero,
    position: "80% 52%",
    zoom: 1.8,
    popular: true,
  },
  {
    id: "double-sausage-shawarma",
    name: "Double Sausage Shawarma",
    category: "shawarma",
    description:
      "The loaded one: double sausage, extra chicken and our house pepper-mayo.",
    price: 8000,
    image: IMG.hero,
    position: "72% 56%",
    zoom: 2.2,
  },

  /* ── Burgers ─────────────────────────────────────────────── */
  {
    id: "waffle-burger",
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
  {
    id: "crunchy-chicken-burger",
    name: "Crunchy Chicken Burger",
    category: "burgers",
    description:
      "Double-crisped chicken thigh, melted cheddar and house burger sauce on a toasted sesame bun.",
    price: 9500,
    image: IMG.hero,
    position: "20% 47%",
    zoom: 1.6,
    popular: true,
  },

  /* ── Bubble Tea ──────────────────────────────────────────── */
  {
    id: "signature-milk-tea",
    name: "Signature Milk Tea",
    category: "bubble-tea",
    description:
      "Silky milk tea shaken over chewy tapioca pearls. Our best-loved boba.",
    price: 4500,
    image: IMG.hero,
    position: "31% 21%",
    zoom: 1.9,
    popular: true,
    featured: true,
  },
  {
    id: "strawberry-milk-tea",
    name: "Strawberry Milk Tea",
    category: "bubble-tea",
    description: "Creamy strawberry milk tea with classic boba pearls.",
    price: 5000,
    image: IMG.hero,
    position: "33% 26%",
    zoom: 2.4,
  },

  /* ── Milkshakes ──────────────────────────────────────────── */
  {
    id: "chocolate-oreo-shake",
    name: "Chocolate Oreo Shake",
    category: "milkshakes",
    description:
      "Thick chocolate shake blended with Oreo and crowned with whipped cream.",
    price: 5500,
    image: IMG.hero,
    position: "88% 76%",
    zoom: 1.9,
    popular: true,
    featured: true,
  },
  {
    id: "salted-caramel-shake",
    name: "Salted Caramel Shake",
    category: "milkshakes",
    description: "Velvety vanilla shake ribboned with golden salted caramel.",
    price: 5500,
    image: IMG.hero,
    position: "86% 68%",
    zoom: 2.4,
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
  {
    id: "chocolate-drizzle-waffles",
    name: "Chocolate Drizzle Waffles",
    category: "pastries",
    description:
      "Crisp golden waffles drizzled with chocolate, caramel and cream.",
    price: 7500,
    image: IMG.hero,
    position: "84% 32%",
    zoom: 1.8,
  },

  /* ── Loaded Fries ────────────────────────────────────────── */
  {
    id: "chicken-loaded-fries",
    name: "Chicken Loaded Fries",
    category: "loaded-fries",
    description:
      "Golden fries buried under peppered chicken, cheese sauce and our house drizzle.",
    price: 8500,
    image: IMG.hero,
    position: "50% 71%",
    zoom: 2,
    popular: true,
  },
  {
    id: "suya-beef-fries",
    name: "Suya Beef Loaded Fries",
    category: "loaded-fries",
    description:
      "Crispy fries topped with suya-spiced beef, onions and yaji heat.",
    price: 9000,
    image: IMG.hero,
    position: "13% 70%",
    zoom: 1.9,
  },

  /* ── Drinks ──────────────────────────────────────────────── */
  {
    id: "berry-yoghurt-parfait",
    name: "Berry Yoghurt Parfait",
    category: "drinks",
    description:
      "Creamy Greek yoghurt layered with granola, strawberries and blueberries.",
    price: 4000,
    image: IMG.hero,
    position: "71% 15%",
    zoom: 1.9,
    popular: true,
  },
  {
    id: "chilled-zobo",
    name: "Chilled Zobo",
    category: "drinks",
    description: "House-brewed hibiscus punch: spiced, sweet and ice-cold.",
    price: 1500,
    image: IMG.hero,
    position: "10% 17%",
    zoom: 1.9,
  },
];

/* ── Extras (reusable add-ons) ─────────────────────────────── */
export const EXTRAS: MenuItem[] = [
  { id: "extra-samosa", name: "Samosa", category: "extras", price: 400, image: IMG.fried, position: "45% 58%", zoom: 2 },
  { id: "extra-spring-roll", name: "Spring Roll", category: "extras", price: 400, image: IMG.fried, position: "18% 66%", zoom: 2 },
  { id: "extra-chicken", name: "Chicken", category: "extras", price: 2000, image: IMG.odogwu, position: "48% 38%", zoom: 2 },
  { id: "extra-prawn-mayo", name: "Prawn in Mayo", category: "extras", price: 1500, image: IMG.allInOne, position: "44% 38%", zoom: 2.2 },
  { id: "extra-puff-puff", name: "Puff Puff", category: "extras", price: 150, image: IMG.fried, position: "68% 33%", zoom: 2 },
  { id: "extra-money-bag", name: "Money Bag", category: "extras", price: 1500, image: IMG.allInOne, position: "38% 34%", zoom: 2.2 },
  { id: "extra-corn-dog", name: "Corn Dog", category: "extras", price: 500, image: IMG.odogwu, position: "38% 72%", zoom: 2 },
  { id: "extra-turkey", name: "Turkey", category: "extras", price: 6000, image: IMG.odogwu, position: "60% 42%", zoom: 2.2 },
  { id: "extra-beef", name: "Beef", category: "extras", price: 500, image: IMG.allInOne, position: "68% 58%", zoom: 2.2 },
  { id: "extra-gizzard", name: "Gizzard", category: "extras", price: 500, image: IMG.allInOne, position: "58% 52%", zoom: 2.2 },
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

export type ReviewSource = "Instagram" | "WhatsApp" | "TikTok" | "In store";

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
    text: "Milk tea was creamy and the pearls were soft. Delivery to Akowonjo took less than an hour.",
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
    text: "Oreo shake was thick, just how I like it. Would love a bigger cup size but the taste is 100.",
    source: "WhatsApp",
    daysAgo: 20,
    visible: false,
  },
];
