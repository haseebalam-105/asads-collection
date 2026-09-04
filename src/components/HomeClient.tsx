"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Truck,
  MousePointerClick,
  Headphones,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { StarRatingDisplay } from "@/components/StarRating";
import { useLanguage } from "@/context/LanguageContext";
import { Category, Product } from "@/types/product";

const whyIcons = [ShieldCheck, Truck, MousePointerClick, Headphones, BadgeCheck];

/** Static fallback image mapping for the legacy seed categories. New
 *  admin-created categories can attach their own image via the category
 *  editor; if neither exists, we render a neutral gradient tile. */
const legacyCategoryImages: Record<string, string> = {
  raincoats: "/images/rain-suit.jpeg",
  "bike-covers": "/images/bike-cover.jpeg",
  "car-covers": "/images/car-cover.jpeg",
  "home-protection": "/images/bedsheet-cover.jpeg",
};

const testimonials = [
  {
    name: "Hamza R.",
    location: "Lahore",
    rating: 5,
    text: "Great quality and fast delivery. The product matched the description perfectly. Will order again.",
  },
  {
    name: "Adnan M.",
    location: "Karachi",
    rating: 5,
    text: "Excellent service and genuine products. Cash on delivery made it an easy decision to order.",
  },
  {
    name: "Mariam A.",
    location: "Islamabad",
    rating: 4,
    text: "Good quality product, exactly as described. Delivery was quick and the packaging was secure.",
  },
];

const faqsByLocale = {
  en: [
    {
      q: "Is Cash on Delivery available everywhere in Pakistan?",
      a: "Yes, we offer Cash on Delivery across all major cities and most towns in Pakistan.",
    },
    {
      q: "How long does delivery take?",
      a: "Orders are dispatched within 24 hours and typically arrive within 2-5 business days depending on your city.",
    },
    {
      q: "Can I return a product if it doesn't fit?",
      a: "Yes, unused products in original packaging can be returned within 7 days. Contact us on WhatsApp to arrange a pickup.",
    },
    {
      q: "Do I need to create an account to order?",
      a: "No — you can check out as a guest with just your name, phone number and address.",
    },
  ],
  ur: [
    {
      q: "کیا کیش آن ڈیلیوری پورے پاکستان میں دستیاب ہے؟",
      a: "جی ہاں، ہم پاکستان کے تمام بڑے شہروں اور اکثر قصبوں میں کیش آن ڈیلیوری فراہم کرتے ہیں۔",
    },
    {
      q: "ڈیلیوری میں کتنا وقت لگتا ہے؟",
      a: "آرڈر 24 گھنٹوں میں بھیج دیا جاتا ہے اور عام طور پر 2-5 کاروباری دنوں میں پہنچ جاتا ہے۔",
    },
    {
      q: "اگر پروڈکٹ فٹ نہ ہو تو کیا واپس کر سکتے ہیں؟",
      a: "جی ہاں، غیر استعمال شدہ پروڈکٹس 7 دن کے اندر واپس کی جا سکتی ہیں۔ واٹس ایپ پر رابطہ کریں۔",
    },
    {
      q: "کیا آرڈر کے لیے اکاؤنٹ بنانا ضروری ہے؟",
      a: "نہیں — آپ صرف نام، فون نمبر اور پتہ دے کر بطور مہمان آرڈر کر سکتے ہیں۔",
    },
  ],
};

export default function HomeClient({
  featured,
  categories,
}: {
  featured: Product[];
  categories: Category[];
}) {
  const { t, locale } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const faqs = faqsByLocale[locale];

  return (
    <div>
      <Hero
        featuredProducts={featured
          .filter((p) => p.images?.[0])
          .slice(0, 4)
          .map((p) => ({
            slug: p.slug,
            name: p.name.en,
            image: p.images[0],
            price: p.price,
          }))}
      />

      {/* Offer banner */}
      <section className="bg-gold">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 px-4 py-3 text-center sm:flex-row sm:gap-3">
          <span className="font-display text-sm font-extrabold text-deep">
            {t.home.offer}:
          </span>
          <span className="text-sm font-medium text-deep">{t.home.offerSub}</span>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {t.home.featured}
          </h2>
          <p className="mt-2 text-sm text-storm">{t.home.featuredSub}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <div className="drip-divider mx-auto max-w-7xl" />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {t.home.categories}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {categories.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-storm">
              No categories yet. Add some in the admin panel.
            </p>
          ) : (
            categories.map((c) => {
              const imageSrc = c.image || legacyCategoryImages[c.slug];
              return (
                <Link
                  key={c.id}
                  href={`/shop?category=${c.slug}`}
                  className="focus-ring group relative block aspect-[4/5] overflow-hidden rounded-xl2 bg-mist shadow-card transition-shadow hover:shadow-card-hover"
                >
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={c.name[locale]}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-deep to-deep-light" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <span className="absolute bottom-4 rtl:right-4 ltr:left-4 font-display text-sm font-bold text-white sm:text-base">
                    {c.name[locale]}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-mist py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
              {t.home.whyUs}
            </h2>
            <p className="mt-2 text-sm text-storm">{t.home.whyUsSub}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [t.why.w1t, t.why.w1d],
              [t.why.w2t, t.why.w2d],
              [t.why.w3t, t.why.w3d],
              [t.why.w4t, t.why.w4d],
              [t.why.w5t, t.why.w5d],
            ].map(([title, desc], i) => {
              const Icon = whyIcons[i];
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-xl2 bg-white p-6 shadow-card"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-deep/5 text-deep">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-storm">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
          {t.home.reviews}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {testimonials.map((r) => (
            <div key={r.name} className="rounded-xl2 border border-mist-dark p-6">
              <StarRatingDisplay rating={r.rating} size={16} />
              <p className="mt-3 text-sm leading-relaxed text-ink/80">“{r.text}”</p>
              <p className="mt-4 text-xs font-semibold text-storm">
                {r.name} · {r.location}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-mist py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
            {t.home.faq}
          </h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="overflow-hidden rounded-xl2 bg-white shadow-card">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left rtl:text-right"
                >
                  <span className="text-sm font-semibold text-ink">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-storm transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm leading-relaxed text-storm">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
