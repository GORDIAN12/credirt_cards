export default function ProgressBar({ percent, color }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="progress">
      <span style={{ width: `${clamped}%`, background: color }} />
    </div>
  );
}
