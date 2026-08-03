export function formatPKR(amount: number) {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function discountPercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function generateOrderNumber() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(date.getDate()).padStart(2, "0")}`;
  return `AC-${stamp}-${rand}`;
}
