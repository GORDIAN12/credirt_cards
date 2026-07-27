import { useState } from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/dashboard/Dashboard";
import ComprasTab from "./components/compras/ComprasTab";
import PagosTab from "./components/pagos/PagosTab";
import MsiTab from "./components/msi/MsiTab";
import TarjetasTab from "./components/tarjetas/TarjetasTab";
import LiquidadoTab from "./components/liquidado/LiquidadoTab";

const PANELS = {
  dashboard: Dashboard,
  compras: ComprasTab,
  pagos: PagosTab,
  msi: MsiTab,
  tarjetas: TarjetasTab,
  liquidado: LiquidadoTab,
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const Panel = PANELS[tab];

  return (
    <div className="app">
      <Navbar active={tab} onChange={setTab} />
      <Panel />
      <footer className="note">
        <span>ⓘ</span>
        <span>
          Datos de ejemplo guardados solo en este navegador (localStorage). La app nunca solicita ni almacena número
          de tarjeta completo (PAN), CVV ni NIP.
        </span>
      </footer>
    </div>
  );
}
