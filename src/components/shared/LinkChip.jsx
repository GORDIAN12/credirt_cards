export default function LinkChip({ href }) {
  if (!href) return null;
  let label = href;
  try {
    label = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    // href sin protocolo o inválida: se muestra tal cual
  }
  return (
    <a className="link-chip" href={href} target="_blank" rel="noopener noreferrer">
      {label} ↗
    </a>
  );
}
