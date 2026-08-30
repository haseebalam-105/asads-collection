export const siteSettings = {
  brandName: "Asad's Collection",
  brandNameUr: "اسد کلیکشن",
  logoSrc: "/images/logo-new.jpeg",
  deliveryFee: 200,
  freeDeliveryThreshold: 3000,
  phone: "+92 300 1234567",
  whatsapp: "923001234567",
  email: "support@asadscollection.pk",
  facebook: "https://facebook.com/asadscollection",
  city: "Lahore, Pakistan",
  metaPixelId: "",
  // Server-side Meta Conversions API. Never exposed on the public
  // /api/settings endpoint — only used inside API routes on the server.
  metaAccessToken: "",
  metaTestEventCode: "",
};

export function getDeliveryFee(
  subtotal: number,
  settings: Pick<typeof siteSettings, "deliveryFee" | "freeDeliveryThreshold"> = siteSettings
) {
  if (subtotal >= settings.freeDeliveryThreshold) return 0;
  return settings.deliveryFee;
}