// Static settings for the initial build. Once the admin dashboard + MongoDB
// are wired up, these values move into a `settings` collection and become
// editable from /admin/settings — every place that imports this file will
// keep working unchanged, just swap the source of these values.

export const siteSettings = {
  brandName: "Asad's Collection",
  brandNameUr: "اسد کلیکشن",
  logoSrc: "/images/logo.jpeg",
  deliveryFee: 200, // PKR, flat rate
  freeDeliveryThreshold: 3000, // PKR
  phone: "+92 300 1234567",
  whatsapp: "923001234567",
  email: "support@asadscollection.pk",
  facebook: "https://facebook.com/asadscollection",
  city: "Lahore, Pakistan",
};

export function getDeliveryFee(subtotal: number) {
  if (subtotal >= siteSettings.freeDeliveryThreshold) return 0;
  return siteSettings.deliveryFee;
}
