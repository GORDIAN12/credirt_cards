import { useState } from "react";
import { useData } from "../context/DataContext";
import { saldoGlobal } from "../lib/calc";
import { formatMoney } from "../lib/format";
import { NAV_TABS } from "./navTabs";
import { IconMenu } from "./icons";
import Drawer from "./Drawer";

export default function Navbar({ active, onChange }) {
  const { compras, cuotas, pagos } = useData();
  const total = saldoGlobal(compras, cuotas, pagos);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const brand = (
    <div className="brand">
      <div className="brand__mark">$</div>
      <div>
        <div className="brand__name">Control de Tarjetas</div>
        <div className="brand__sub">Compras, pagos y meses sin intereses</div>
      </div>
    </div>
  );

  const balance = (
    <div className="global-stat">
      <div className="global-stat__label">Saldo total pendiente</div>
      <div className="global-stat__value">{formatMoney(total)}</div>
    </div>
  );

  return (
    <>
      <header className="navbar">
        {brand}
        <nav className="navbar__tabs" role="tablist">
          {NAV_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={active === key}
              className={active === key ? "active" : ""}
              onClick={() => onChange(key)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        {balance}
        <button className="navbar__burger" onClick={() => setDrawerOpen(true)} title="Abrir menú">
          <IconMenu />
        </button>
      </header>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        active={active}
        onChange={onChange}
        brand={brand}
        balance={<div className="drawer-balance">{balance}</div>}
      />
    </>
  );
}
