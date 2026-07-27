import { useState } from "react";
import { useData } from "./context/DataContext";
import Navbar from "./components/Navbar";
import Dashboard from "./components/dashboard/Dashboard";
import ComprasTab from "./components/compras/ComprasTab";
import PagosTab from "./components/pagos/PagosTab";
import MsiTab from "./components/msi/MsiTab";
import TarjetasTab from "./components/tarjetas/TarjetasTab";
import LiquidadoTab from "./components/liquidado/LiquidadoTab";
import AdeudosTab from "./components/adeudos/AdeudosTab";

const PANELS = {
  dashboard: Dashboard,
  compras: ComprasTab,
  pagos: PagosTab,
  msi: MsiTab,
  tarjetas: TarjetasTab,
  liquidado: LiquidadoTab,
  adeudos: AdeudosTab,
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const { loading, dbError, reload } = useData();
  const Panel = PANELS[tab];

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p>Conectando con la base de datos…</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="app-loading">
        <div className="app-loading__error">
          <span className="app-loading__error-icon">⚠️</span>
          <p>No se pudo conectar con Supabase</p>
          <small>{dbError}</small>
          <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={reload}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Navbar active={tab} onChange={setTab} />
      <Panel />
      <footer className="note">
        <span>ⓘ</span>
        <span>
          Datos sincronizados con Supabase. La app nunca solicita ni almacena número
          de tarjeta completo (PAN), CVV ni NIP.
        </span>
      </footer>
    </div>
  );
}
