"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { siteSettings } from "@/lib/settings";

export default function AboutPage() {
  const { locale } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-full">
          <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {locale === "ur" ? siteSettings.brandNameUr : siteSettings.brandName}
        </h1>
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-ink/80">
        {locale === "ur" ? (
          <>
            <p>
              اسد کلیکشن پاکستان بھر میں بارش سے تحفظ فراہم کرنے والی ایک قابل اعتماد برانڈ ہے۔
              ہم رین کوٹ، بائیک کور، کار کور اور واٹر پروف گھریلو مصنوعات تیار کرتے ہیں جو مضبوط،
              پائیدار اور مکمل طور پر واٹر پروف ہیں۔
            </p>
            <p>
              ہمارا مقصد ہر گاہک کو معیاری پروڈکٹ، آسان آرڈرنگ اور تیز ترسیل فراہم کرنا ہے —
              بغیر کسی اکاؤنٹ کی ضرورت کے، صرف کیش آن ڈیلیوری کے ساتھ۔
            </p>
          </>
        ) : (
          <>
            <p>
              Asad&apos;s Collection is Pakistan&apos;s trusted name in rain protection. We design
              rain coats, motorcycle covers, car covers, and waterproof home essentials
              built from durable, sealed-seam materials that hold up through monsoon
              season after season.
            </p>
            <p>
              Every product in our catalog is tested for real waterproofing, not just
              water resistance. Our goal is simple: give customers premium protection,
              a fast and easy checkout with no account required, and Cash on Delivery
              across Pakistan.
            </p>
            <p>
              We started as a small family business and have grown through word of
              mouth and repeat customers who trust us to keep their bikes, cars, and
              belongings dry when it matters most.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
