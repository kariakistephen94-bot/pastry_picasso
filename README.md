# The Pastry Picasso 🧁

A premium, Apple-inspired ordering app for **The Pastry Picasso** (Egbeda, Lagos),
built with Next.js 15, TypeScript, Tailwind CSS v4, Framer Motion and Zustand.

- **Mobile** → feels like a native iOS app (floating glass tab bar, bottom sheets, safe-area support)
- **Desktop** → a macOS-style three-column app (glass sidebar · discovery dashboard · live cart panel)
- **Checkout** → composes the order into a WhatsApp message to **0814 436 3688**

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Pages

| Route | What it is |
|---|---|
| `/` | App-style home: hero, categories, featured, popular, about, contact, payment |
| `/menu` | Full catalogue with search, sticky category pills, item sheets, extras |
| `/order` | Cart + WhatsApp checkout + recent orders |
| `/favorites`, `/account` | Saved dishes · profile & order history |
| `/gallery`, `/about`, `/contact` | Masonry gallery with lightbox · story · contact + map link |
| `/admin` | Owner dashboard: analytics, orders, menu editor (with photo upload), settings |

## Things to know

- **Two placeholder prices.** No prices were provided for the *Odogwu* (set to ₦45,000)
  and *All-In-One* (set to ₦15,000) platters. Update them in **Dashboard → Menu** or in
  [src/lib/data.ts](src/lib/data.ts).
- **Data is client-side.** Orders, menu edits and settings persist in the browser's
  localStorage (no backend). Orders reach the business via WhatsApp; the dashboard
  mirrors orders placed on the same device. The dashboard seeds clearly-marked
  *sample* orders so analytics look alive; remove them in **Dashboard → Settings**.
- **Domain.** SEO files use `https://thepastrypicasso.com` as a placeholder; search
  for that string and replace it when the real domain exists.
- **Brand assets** live in `public/images/` (renamed copies of the originals in the
  project root).
