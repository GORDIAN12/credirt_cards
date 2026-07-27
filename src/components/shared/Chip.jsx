export default function Chip({ tone = "info", children }) {
  return <span className={`chip chip--${tone}`}>{children}</span>;
}
