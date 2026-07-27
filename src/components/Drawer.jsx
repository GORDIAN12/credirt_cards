import { useEffect } from "react";
import { NAV_TABS } from "./navTabs";
import { IconClose } from "./icons";

export default function Drawer({ open, onClose, active, onChange, brand, balance, account }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Menú de navegación">
        <div className="drawer-panel__header">
          {brand}
          <button className="drawer-panel__close" onClick={onClose} title="Cerrar">
            <IconClose width={16} height={16} />
          </button>
        </div>
        <nav className="drawer-nav">
          {NAV_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`drawer-tab${active === key ? " active" : ""}`}
              onClick={() => {
                onChange(key);
                onClose();
              }}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        {balance}
        {account ? <div className="drawer-account">{account}</div> : null}
      </div>
    </div>
  );
}
