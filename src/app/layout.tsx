import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import StoreHydration from "@/components/StoreHydration";
import { BUSINESS } from "@/lib/data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const SITE_URL = "https://thepastrypicasso.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "The Pastry Picasso | Small Chops, Burgers & Treats in Egbeda, Lagos",
    template: "%s · The Pastry Picasso",
  },
  description: BUSINESS.description,
  keywords: [
    "small chops Lagos",
    "small chops Egbeda",
    "waffle burger Lagos",
    "bubble tea Lagos",
    "milkshakes Lagos",
    "shawarma Egbeda",
    "pastries Lagos",
    "The Pastry Picasso",
  ],
  openGraph: {
    type: "website",
    siteName: BUSINESS.name,
    title: BUSINESS.tagline,
    description: BUSINESS.description,
    url: SITE_URL,
    locale: "en_NG",
    images: [
      {
        url: "/images/hero-spread.jpg",
        width: 853,
        height: 1280,
        alt: "The Pastry Picasso: burgers, bubble tea, shawarma, waffles and shakes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BUSINESS.tagline,
    description:
      "Freshly made small chops, burgers, bubble tea, milkshakes and more in Egbeda, Lagos. Order on WhatsApp.",
    images: ["/images/hero-spread.jpg"],
  },
  alternates: { canonical: SITE_URL },
};

export const viewport: Viewport = {
  themeColor: "#faf6f1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  description: BUSINESS.description,
  url: SITE_URL,
  image: `${SITE_URL}/images/hero-spread.jpg`,
  logo: `${SITE_URL}/images/logo.png`,
  telephone: BUSINESS.phoneTel,
  email: BUSINESS.email,
  servesCuisine: ["Small Chops", "Fast Food", "Grills", "Desserts", "Bubble Tea"],
  priceRange: "₦₦",
  currenciesAccepted: "NGN",
  address: {
    "@type": "PostalAddress",
    streetAddress: "4 Olugbede Street, Egbeda",
    addressLocality: "Alimosho",
    addressRegion: "Lagos",
    addressCountry: "NG",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday", "Tuesday", "Wednesday", "Thursday",
        "Friday", "Saturday", "Sunday",
      ],
      opens: BUSINESS.opens,
      closes: BUSINESS.closes,
    },
  ],
  menu: `${SITE_URL}/menu`,
  acceptsReservations: "False",
  sameAs: [BUSINESS.instagramUrl, BUSINESS.tiktokUrl],
  potentialAction: {
    "@type": "OrderAction",
    target: `https://wa.me/${BUSINESS.whatsappNumber}`,
    deliveryMethod: ["http://purl.org/goodrelations/v1#DeliveryModePickUp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <div className="ambient" aria-hidden />
        <StoreHydration />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </body>
    </html>
  );
}
