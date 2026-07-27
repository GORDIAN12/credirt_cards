import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { saldoGlobal } from "../lib/calc";
import { formatMoney } from "../lib/format";
import { NAV_TABS } from "./navTabs";
import { IconMenu } from "./icons";
import Drawer from "./Drawer";
import TelegramSettings from "./auth/TelegramSettings";

export default function Navbar({ active, onChange }) {
  const { profile, user, signOut } = useAuth();
  const { compras, cuotas, pagos } = useData();
  const total = saldoGlobal(compras, cuotas, pagos);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const displayName = profile?.nombre || user?.email || "Usuario";
  const telegramLinked = !!profile?.telegram_chat_id;

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

  const account = (
    <div className="navbar-account">
      <span className="navbar-account__name" title={user?.email || ""}>
        {displayName}
      </span>
      <button
        type="button"
        className={`btn btn--ghost navbar-account__tg${telegramLinked ? " is-linked" : ""}`}
        title={telegramLinked ? "Telegram vinculado" : "Vincular Telegram"}
        onClick={() => setTelegramOpen(true)}
      >
        TG
      </button>
      <button type="button" className="btn btn--ghost navbar-account__out" onClick={() => signOut()}>
        Salir
      </button>
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
        {account}
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
        account={account}
      />

      <TelegramSettings open={telegramOpen} onClose={() => setTelegramOpen(false)} />
    </>
  );
}
