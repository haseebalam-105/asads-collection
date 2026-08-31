# Asad's Collection — Full E-Commerce Platform

A complete, premium, rain-themed e-commerce platform: customer storefront +
admin dashboard, built with Next.js 14 (App Router), TypeScript, Tailwind
CSS, Framer Motion, and MongoDB.

## What's included

**Storefront** — Home, Shop (search/filter/sort), Product detail (gallery,
variants, reviews, related products), Cart, Checkout (guest, COD, coupon
codes), Order confirmation, Order tracking, Blog, About/Contact/Policy
pages, English/Urdu with full RTL, WhatsApp button, SEO (metadata, sitemap,
robots, per-product schema markup).

**Admin dashboard** (`/admin`) — JWT + bcrypt authentication, dashboard with
revenue/order charts and low-stock alerts, product management with Cloudinary
image upload, order management (status updates, CSV export, WhatsApp
deep-link), customer list, review moderation (approve/reject/delete),
coupon management (percentage/fixed, expiry, min order value), blog post
management (with cover image upload, draft/publish), site settings
(delivery fee, contact info) — all backed by MongoDB.

**Backend** — MongoDB for products/orders/customers/coupons/settings, with a
static-data fallback so the storefront still works before you connect a
database. Nodemailer email templates for order confirmation and status
updates (no-op until SMTP is configured). Cloudinary for image uploads.

## Getting started

### 1. Install and run (storefront-only, no setup required)

```bash
npm install
npm run dev
```

The storefront works immediately at http://localhost:3000 using the 4
products already in `src/lib/products.ts`. The admin dashboard will show a
"database not connected" message until you complete step 2.

### 2. Connect MongoDB (enables the admin dashboard + live data)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`.   

mongodb+srv://<db_username>:axE5sWk12MFx3HAi@cluster0.bkpbpll.mongodb.net/?appName=Cluster0

3. Seed the database with your real product catalog:
   ```bash
   npm run seed
   ```
4. Restart `npm run dev`. The storefront now reads live data from MongoDB,
   and the admin dashboard is fully functional.

### 3. Set up admin login

```bash
npm run hash-password "YourStrongPassword123"
```

Copy the printed hash into `.env.local`:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD_HASH=<paste hash here>
SESSION_SECRET=<any long random string>
```

Log in at http://localhost:3000/admin/login.

### 4. Connect Cloudinary (enables image upload in the admin panel)

Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to
`.env.local` from your Cloudinary dashboard. Until then, product images can
still be added by pasting a URL directly into MongoDB or editing
`src/lib/products.ts`.

### 5. Connect email (order confirmation + status update emails)

Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` to
`.env.local`. Any standard SMTP provider works (Gmail app password,
SendGrid, Mailgun, etc). Emails are skipped silently if these aren't set —
orders still work fine without them.

### 6. Deploy

Push to GitHub, import into Vercel, add all the same environment variables
in the Vercel project settings, and deploy. Add your custom domain when
ready.

## Project structure

```
src/
  app/
    (storefront pages)         -> /, /shop, /product/[slug], /cart, /checkout, ...
    admin/                      -> admin dashboard pages (protected by middleware)
    api/
      orders/                   -> public order placement + tracking
      coupons/                  -> public coupon validation
      admin/                    -> protected admin CRUD endpoints
  components/
    admin/                      -> AdminShell (sidebar), ProductForm
    (storefront components)     -> Navbar, ProductCard, CartDrawer, ...
  context/                      -> CartContext, LanguageContext
  lib/
    db.ts                       -> MongoDB client singleton
    db/                         -> Mongo queries: products, orders, customers, coupons, settings
    catalog.ts                  -> merged accessor (Mongo when configured, static fallback)
    auth.ts                     -> admin session (JWT via jose)
    mail.ts                     -> order emails (nodemailer)
    cloudinary.ts               -> image upload helper
    products.ts                 -> static fallback catalog + your 4 real products
    orders-store.ts             -> order writes (Mongo when configured, in-memory fallback)
  middleware.ts                 -> protects /admin and /api/admin routes
  types/product.ts              -> shared types (Product, Order, Coupon, Customer, ...)
scripts/
  seed.mjs                      -> populate MongoDB with the initial catalog
  hash-password.mjs             -> generate ADMIN_PASSWORD_HASH
```

## How the live-data fallback works

Every piece of customer-facing data (`getAllProductsAsync`,
`getProductBySlugAsync`, etc. in `lib/catalog.ts`) checks whether
`MONGODB_URI` is set. If it is, it queries MongoDB — the same data the admin
dashboard edits. If not, it silently falls back to the static catalog in
`lib/products.ts`, so the site never breaks, it just isn't admin-editable
yet. Orders work the same way via `lib/orders-store.ts`.

## Notes on the current product photos

The 4 images you provided are marketing/ad graphics (with banners, feature
callouts, and Urdu text baked into the image) rather than plain product
photography. They work well for the homepage and category tiles. For the
sharpest-looking product gallery (with zoom on a clean background), plain
studio-style shots of each product — uploaded via the new Cloudinary
integration in the admin panel — would look more premium. Happy to help
once you have those.

## What's next (optional, not yet built)

- **Multi-image galleries per product** — currently one image per product
  (matching what you uploaded); the admin form already supports uploading
  multiple, the storefront gallery just shows the first for now.
- **Analytics date-range reports** — the dashboard shows last-14-days
  revenue and best sellers; a custom date-range report view could be added.
- **Rich text editor for blog content** — currently plain text (line breaks
  preserved); a WYSIWYG editor could be swapped in if you want formatted
  posts.

## Verification

This build has been verified with:
- `npm run build` — zero TypeScript or compilation errors across all 40 routes
- `npx next lint` — zero ESLint warnings or errors
