type Props = { className?: string }

const S = 'h-5 w-5'
const svg = (className: string) => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export function IconInicio({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.6V21h14V9.6" />
    </svg>
  )
}

export function IconPerfil({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function IconUsuarios({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20c0-3.6 3-5.6 6.5-5.6s6.5 2 6.5 5.6" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6" />
      <path d="M18 14.5c2.3.5 4 2 4 4.5" />
    </svg>
  )
}

export function IconAjustes({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="14" cy="18" r="2" />
    </svg>
  )
}

export function IconBitacora({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  )
}

export function IconSalir({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 12h10M17 9l3 3-3 3" />
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

export function IconMenu({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function IconCerrar({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconHerramienta({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4l-2 2-1-1 2-2Z" />
    </svg>
  )
}

export function IconCatalogo({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
      <path d="M4 5.5V20.5" />
      <path d="M8 7.5h8M8 11h6" />
    </svg>
  )
}

export function IconContrato({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v5h5" />
      <path d="M8.5 13.5l1.5 1.5 3-3.5" />
      <path d="M8 18h7" />
    </svg>
  )
}

export function IconProveedor({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M3 9.5 12 4l9 5.5" />
      <path d="M5 10.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9.5" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

export function IconInventario({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M4 8.5 12 4l8 4.5v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M4 8.5 12 13l8-4.5M12 13v9" />
    </svg>
  )
}

export function IconProduccion({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M5 11h14a7 7 0 0 1-7 7 7 7 0 0 1-7-7Z" />
      <path d="M4 21h16" />
      <path d="M9 7c0-1 1-1.5 1-2.5M13 7c0-1 1-1.5 1-2.5M12 8.5v2" />
    </svg>
  )
}

export function IconPersonal({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.5 2.5-5.5 5.5-5.5s5.5 2 5.5 5.5" />
      <path d="M16 8h5M16 12h5M16 16h3" />
    </svg>
  )
}

export function IconFinanzas({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9v6M18 9v6" />
    </svg>
  )
}

export function IconCompras({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M3 4h2l2.3 11.3a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L20 8H6" />
      <circle cx="9" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </svg>
  )
}

export function IconEntrega({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M3 6.5h10v9H3zM13 9.5h3.8l3.2 3.2v2.8h-7" />
      <circle cx="6.5" cy="17.5" r="1.7" />
      <circle cx="16.5" cy="17.5" r="1.7" />
    </svg>
  )
}

export function IconCalidad({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M12 3 5 6v5c0 4.4 2.9 8 7 10 4.1-2 7-5.6 7-10V6Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

export function IconReportes({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M8 17v-3M11 17v-5M14 17v-2" />
    </svg>
  )
}

export function IconCliente({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M21 20v-1a4 4 0 0 0-3-3.9" />
      <path d="M16 4.1a3.5 3.5 0 0 1 0 6.8" />
    </svg>
  )
}

export function IconBuscar({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

export function IconMas({ className = S }: Props) {
  return (
    <svg {...svg(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

