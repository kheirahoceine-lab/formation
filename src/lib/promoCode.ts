export function generatePromoCode(email: string) {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4) || "PROMO";
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `${base}${digits}`;
}
