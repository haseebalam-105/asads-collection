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
};

export function getDeliveryFee(subtotal: number) {
  if (subtotal >= siteSettings.freeDeliveryThreshold) return 0;
  return siteSettings.deliveryFee;
}