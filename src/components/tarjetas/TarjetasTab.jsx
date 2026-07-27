import { useState } from "react";
import { useData } from "../../context/DataContext";
import CardTile from "../shared/CardTile";
import TarjetaModal from "./TarjetaModal";

export default function TarjetasTab() {
  const { tarjetas, compras, deleteTarjeta } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(tarjeta) {
    setEditing(tarjeta);
    setOpen(true);
  }

  function handleDelete(tarjeta) {
    const asociadas = compras.filter((c) => c.tarjetaId === tarjeta.id).length;
    const aviso = asociadas
      ? `"${tarjeta.alias}" tiene ${asociadas} compra(s) asociada(s), que también se eliminarán. ¿Continuar?`
      : `¿Eliminar "${tarjeta.alias}"?`;
    if (window.confirm(aviso)) deleteTarjeta(tarjeta.id);
  }

  return (
    <section className="panel active">
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Gestión de tarjetas
      </h2>
      <div className="tarjetas-grid">
        {tarjetas.map((t) => (
          <CardTile
            key={t.id}
            tarjeta={t}
            wide
            actions={
              <>
                <button className="icon-btn" title="Editar" onClick={() => openEdit(t)}>
                  ✎
                </button>
                <button className="icon-btn" title="Eliminar" onClick={() => handleDelete(t)}>
                  ✕
                </button>
              </>
            }
          />
        ))}
        <button className="add-card-tile" onClick={openAdd}>
          <span className="add-card-tile__plus">+</span>
          <span>Agregar tarjeta</span>
        </button>
      </div>

      <TarjetaModal open={open} onClose={() => setOpen(false)} tarjeta={editing} />
    </section>
  );
}
