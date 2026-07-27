import { resolveBrand } from "../../lib/brands";

export default function Pill({ tarjeta }) {
  const brand = resolveBrand(tarjeta);
  return (
    <span className="pill" style={{ background: brand.c1, color: brand.text }}>
      <span className="pill__dot" style={{ background: brand.text }} />
      {tarjeta.alias}
    </span>
  );
}
