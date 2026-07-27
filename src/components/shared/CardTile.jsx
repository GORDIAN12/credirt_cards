import { resolveBrand } from "../../lib/brands";

export default function CardTile({ tarjeta, wide = false, actions = null }) {
  const brand = resolveBrand(tarjeta);
  const style = {
    "--c1": brand.c1,
    "--c2": brand.c2,
    color: brand.text,
    borderBottom: brand.accent ? `4px solid ${brand.accent}` : undefined,
  };

  return (
    <article className={`card-tile${wide ? " card-tile--wide" : ""}`} style={style}>
      {actions && <div className="card-tile__actions">{actions}</div>}
      <div className="card-tile__row">
        <span className="card-tile__issuer">{tarjeta.emisor === "otro" ? "" : brand.label}</span>
        {!actions && <span className="card-tile__chip" />}
      </div>
      <div>
        <div className="card-tile__alias">{tarjeta.alias}</div>
        <div className="card-tile__number">
          {tarjeta.ultimos4 ? `•••• ${tarjeta.ultimos4}` : "•••• ••••"}
        </div>
        <div className="card-tile__dates">
          <div>
            <span>Corte</span>
            <strong>{wide ? `Día ${tarjeta.fechaCorte}` : tarjeta.fechaCorte}</strong>
          </div>
          <div>
            <span>{wide ? "Fecha de pago" : "Pago"}</span>
            <strong>{wide ? `Día ${tarjeta.fechaLimitePago}` : tarjeta.fechaLimitePago}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
