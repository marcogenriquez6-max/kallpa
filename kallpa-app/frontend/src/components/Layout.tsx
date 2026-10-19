import { useState } from 'react'
import type { ComponentType } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ROL_COLOR, etiquetaRol } from '../lib/roles'
import type { Rol } from '../types'
import {
  IconAjustes,
  IconBitacora,
  IconCalidad,
  IconCatalogo,
  IconCerrar,
  IconCliente,
  IconCompras,
  IconContrato,
  IconEntrega,
  IconFinanzas,
  IconInicio,
  IconInventario,
  IconMenu,
  IconPerfil,
  IconPersonal,
  IconProduccion,
  IconProveedor,
  IconReportes,
  IconSalir,
  IconUsuarios,
} from './icons'

interface Item {
  to: string
  label: string
  descripcion?: string
  icon: ComponentType<{ className?: string }>
  roles?: Rol[]
}

interface Grupo {
  titulo: string
  items: Item[]
}

const GRUPOS: Grupo[] = [
  {
    titulo: 'General',
    items: [
      { to: '/', label: 'Panel principal', descripcion: 'Indicadores y alertas', icon: IconInicio },
      {
        to: '/contratos',
        label: 'Contratos y eventos',
        descripcion: 'Cotizaciones y reservas',
        icon: IconContrato,
        roles: ['GERENTE', 'GERENTE_GASTRONOMICO', 'CONSULTA'],
      },
      {
        to: '/clientes',
        label: 'Clientes',
        descripcion: 'Directorio e historial',
        icon: IconCliente,
        roles: ['GERENTE', 'GERENTE_GASTRONOMICO', 'CONSULTA'],
      },
    ],
  },
  {
    titulo: 'Cocina',
    items: [
      { to: '/catalogo', label: 'Catálogo y recetas', descripcion: 'Platos y fichas técnicas', icon: IconCatalogo },
      {
        to: '/produccion',
        label: 'Producción y cocina',
        descripcion: 'Órdenes y responsables',
        icon: IconProduccion,
        roles: ['GERENTE', 'COCINA', 'CONSULTA'],
      },
      {
        to: '/calidad',
        label: 'Control de calidad',
        descripcion: 'Temperaturas e incidencias',
        icon: IconCalidad,
        roles: ['GERENTE', 'COCINA', 'CONSULTA'],
      },
    ],
  },
  {
    titulo: 'Almacén',
    items: [
      { to: '/inventario', label: 'Inventario', descripcion: 'Existencias, lotes y mermas', icon: IconInventario },
      {
        to: '/proveedores',
        label: 'Proveedores',
        descripcion: 'Directorio y precios',
        icon: IconProveedor,
        roles: ['GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'CONSULTA'],
      },
      {
        to: '/compras',
        label: 'Compras',
        descripcion: 'Solicitud y recepción',
        icon: IconCompras,
        roles: ['GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'CONSULTA'],
      },
      {
        to: '/entregas',
        label: 'Entrega de insumos',
        descripcion: 'Despacho hacia cocina',
        icon: IconEntrega,
        roles: ['GERENTE', 'LOGISTICA', 'COCINA', 'CONSULTA'],
      },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { to: '/personal', label: 'Personal', descripcion: 'Asignaciones y jornales', icon: IconPersonal, roles: ['GERENTE', 'CONSULTA'] },
      { to: '/finanzas', label: 'Finanzas y pagos', descripcion: 'Anticipos, gastos y saldos', icon: IconFinanzas, roles: ['GERENTE', 'CONSULTA'] },
      { to: '/reportes', label: 'Reportes', descripcion: 'Estadísticas y rentabilidad', icon: IconReportes, roles: ['GERENTE', 'CONSULTA'] },
      { to: '/usuarios', label: 'Usuarios y auditoría', descripcion: 'Permisos y roles', icon: IconUsuarios, roles: ['GERENTE'] },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { to: '/bitacora', label: 'Bitácora', descripcion: 'Historial de acciones', icon: IconBitacora, roles: ['GERENTE', 'CONSULTA'] },
      { to: '/parametros', label: 'Parámetros', descripcion: 'Valores del negocio', icon: IconAjustes },
      { to: '/perfil', label: 'Mi perfil', descripcion: 'Datos y contraseña', icon: IconPerfil },
    ],
  },
]

const META: Record<string, { titulo: string; descripcion?: string }> = {
  '/': { titulo: 'Panel principal', descripcion: 'Resumen del negocio' },
  '/perfil': { titulo: 'Mi perfil', descripcion: 'Datos y contraseña' },
  '/usuarios': { titulo: 'Usuarios y auditoría', descripcion: 'Permisos y roles' },
  '/parametros': { titulo: 'Parámetros de negocio', descripcion: 'Valores configurables' },
  '/bitacora': { titulo: 'Bitácora de auditoría', descripcion: 'Historial de acciones' },
  '/contratos': { titulo: 'Contratos y eventos', descripcion: 'Cotizaciones y reservas' },
  '/clientes': { titulo: 'Clientes', descripcion: 'Directorio e historial' },
  '/catalogo': { titulo: 'Catálogo y recetas', descripcion: 'Platos y fichas técnicas' },
  '/inventario': { titulo: 'Inventario', descripcion: 'Existencias, lotes y mermas' },
  '/proveedores': { titulo: 'Proveedores', descripcion: 'Directorio y precios' },
  '/compras': { titulo: 'Compras', descripcion: 'Solicitud y recepción' },
  '/entregas': { titulo: 'Entrega de insumos', descripcion: 'Despacho hacia cocina' },
  '/produccion': { titulo: 'Producción y cocina', descripcion: 'Órdenes y responsables' },
  '/calidad': { titulo: 'Control de calidad', descripcion: 'Temperaturas e incidencias' },
  '/personal': { titulo: 'Personal', descripcion: 'Asignaciones y jornales' },
  '/finanzas': { titulo: 'Finanzas y pagos', descripcion: 'Anticipos, gastos y saldos' },
  '/reportes': { titulo: 'Reportes', descripcion: 'Estadísticas y rentabilidad' },
}

function visible(item: { roles?: Rol[] }, rol: Rol): boolean {
  return !item.roles || item.roles.includes(rol)
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase() || 'K'
}

export function Layout() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [abierto, setAbierto] = useState(false)

  if (!usuario) return null
  const meta = META[ubicacion.pathname] ?? { titulo: 'KALLPA' }

  const salir = () => {
    logout()
    navegar('/login', { replace: true })
  }

  const clasesEnlace = (isActive: boolean) =>
    `flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-white font-bold text-grafito [&_svg]:text-brand'
        : 'font-medium text-[#B9BDC6] hover:bg-white/[0.06] hover:text-white'
    }`

  const navegacion = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4" aria-label="Menú principal">
      {GRUPOS.map((grupo) => {
        const items = grupo.items.filter((item) => visible(item, usuario.rol))
        if (items.length === 0) return null
        return (
          <div key={grupo.titulo} className="flex flex-col gap-0.5">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6F7480]">
              {grupo.titulo}
            </p>
            {items.map((item) => {
              const Icono = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setAbierto(false)}
                  className={({ isActive }) => clasesEnlace(isActive)}
                >
                  <Icono className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        )
      })}
    </nav>
  )

  const marca = (
    <div className="flex items-center gap-3 px-2">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-brand font-title text-lg font-bold text-white">
        K
      </span>
      <span className="leading-tight">
        <span className="block font-title text-lg font-bold tracking-[0.08em] text-white">KALLPA</span>
        <span className="block text-[10px] font-semibold tracking-[0.14em] text-[#8E939E]">
          GESTIÓN GASTRONÓMICA
        </span>
      </span>
    </div>
  )

  const pieUsuario = (
    <div className="mt-auto flex items-center gap-3 rounded-md bg-white/[0.05] p-3">
      <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-[#2A2D35] text-[13px] font-bold text-white">
        {iniciales(usuario.nombre)}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13px] font-semibold text-white">{usuario.nombre}</span>
        <span className="block truncate text-xs font-medium text-[#8E939E]">{etiquetaRol(usuario.rol)}</span>
      </span>
      <button
        onClick={salir}
        aria-label="Cerrar sesión"
        className="shrink-0 rounded-sm p-1.5 text-[#B9BDC6] transition-colors hover:bg-white/10 hover:text-white"
      >
        <IconSalir className="h-[18px] w-[18px]" />
      </button>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Barra lateral (escritorio) */}
      <aside className="hidden w-[264px] shrink-0 flex-col gap-5 bg-grafito px-4 py-7 md:flex">
        {marca}
        {navegacion}
        {pieUsuario}
      </aside>

      {/* Barra lateral móvil */}
      {abierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAbierto(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col gap-5 bg-grafito px-4 py-6 shadow-kallpaElev">
            <div className="flex items-center justify-between">
              {marca}
              <button onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="text-white">
                <IconCerrar />
              </button>
            </div>
            {navegacion}
            {pieUsuario}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-3 border-b border-linea bg-white px-4 py-3 sm:px-8">
          <button onClick={() => setAbierto(true)} aria-label="Abrir menú" className="text-grafito md:hidden">
            <IconMenu />
          </button>
          <div className="min-w-0 flex-1">
            {meta.descripcion && (
              <p className="truncate text-[13px] font-semibold text-texto-2">{meta.descripcion}</p>
            )}
            <h1 className="truncate font-title text-2xl font-semibold tracking-[-0.01em] text-grafito">
              {meta.titulo}
            </h1>
          </div>
          <span className={`hidden rounded-full px-3 py-1 text-xs font-bold sm:inline ${ROL_COLOR[usuario.rol]}`}>
            {etiquetaRol(usuario.rol)}
          </span>
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-semibold text-grafito">{usuario.nombre}</p>
            <p className="text-xs text-texto-2">{usuario.email}</p>
          </div>
          <button
            onClick={salir}
            className="flex items-center gap-2 rounded-md border border-linea px-3 py-2 text-sm font-semibold text-grafito transition-colors hover:border-brand hover:text-brand"
          >
            <IconSalir className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-fondo p-4 sm:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
