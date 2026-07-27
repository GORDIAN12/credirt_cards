const common = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconDashboard(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" />
    </svg>
  );
}

export function IconCompras(props) {
  return (
    <svg {...common} {...props}>
      <path d="M6.5 8h11l.9 11.5a1.5 1.5 0 0 1-1.5 1.5H7.1a1.5 1.5 0 0 1-1.5-1.5L6.5 8z" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
    </svg>
  );
}

export function IconPagos(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="6.5" width="18" height="11.5" rx="2" />
      <circle cx="12" cy="12.25" r="2.4" />
      <path d="M6.5 6.5v11.5M17.5 6.5v11.5" />
    </svg>
  );
}

export function IconMsi(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3M16 3v3" />
      <circle cx="8.2" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTarjetas(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
      <path d="M3 10h18" strokeWidth="3" />
      <path d="M6.5 15h4" />
    </svg>
  );
}

export function IconLiquidado(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.2 12.4l2.6 2.6 5-5.4" />
    </svg>
  );
}

export function IconMenu(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...common} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconAdeudos(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3 20c0-4 3.1-6.5 7-6.5" />
      <circle cx="17.5" cy="17" r="4" />
      <path d="M17.5 14.5v.6M17.5 19.4v.6" />
      <path d="M15.8 15.8c.3-.5.9-.9 1.7-.9.9 0 1.6.6 1.6 1.4 0 .7-.5 1.1-1.3 1.4-.9.3-1.6.7-1.6 1.5 0 .8.7 1.3 1.6 1.3.8 0 1.4-.4 1.7-.9" />
    </svg>
  );
}
