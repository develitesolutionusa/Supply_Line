export const COMPANY = {
  name: "SupplyLine",
  tagline: "Wholesale foodservice disposables",
  email: "sales@supplyline.example",
  phone: "(214) 555-0140",
  hours: "Monday–Friday, 7:00 a.m.–5:00 p.m. CT",
  warehouse: {
    label: "Dallas DC",
    line1: "100 Freight Way",
    city: "Dallas",
    state: "TX",
    zip: "75201",
  },
  social: [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/supplyline" },
    { name: "Instagram", href: "https://www.instagram.com/supplyline" },
    { name: "Facebook", href: "https://www.facebook.com/supplyline" },
    { name: "X", href: "https://x.com/supplyline" },
  ],
} as const;

export function companyAddressLine() {
  const { line1, city, state, zip } = COMPANY.warehouse;
  return `${line1}, ${city}, ${state} ${zip}`;
}
