import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { Layout } from './components/Layout'
import { CambiarPasswordGate, RequireAuth, RequireRole } from './components/guards'
import { Login } from './pages/Login'
import { CambiarPassword } from './pages/CambiarPassword'
import { Inicio } from './pages/Inicio'
import { Perfil } from './pages/Perfil'
import { Usuarios } from './pages/Usuarios'
import { Parametros } from './pages/Parametros'
import { Bitacora } from './pages/Bitacora'
import { Catalogo } from './pages/catalogo/Catalogo'
import { Contratos } from './pages/contratos/Contratos'
import { Clientes } from './pages/contratos/Clientes'
import { ContratoForm } from './pages/contratos/ContratoForm'
import { ContratoDetalle } from './pages/contratos/ContratoDetalle'
import { Proveedores } from './pages/proveedores/Proveedores'
import { Inventario } from './pages/inventario/Inventario'
import { Compras } from './pages/compras/Compras'
import { SolicitudDetalle } from './pages/compras/SolicitudDetalle'
import { Entregas } from './pages/operaciones/Entregas'
import { Produccion } from './pages/operaciones/Produccion'
import { Calidad } from './pages/operaciones/Calidad'
import { Personal } from './pages/operaciones/Personal'
import { Finanzas } from './pages/operaciones/Finanzas'
import { Reportes } from './pages/operaciones/Reportes'
import { NoEncontrado } from './pages/NoEncontrado'
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/cambiar-password"
            element={
              <CambiarPasswordGate>
                <CambiarPassword />
              </CambiarPasswordGate>
            }
          />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route path="perfil" element={<Perfil />} />
              <Route
                path="usuarios"
                element={
                  <RequireRole roles={['GERENTE']}>
                    <Usuarios />
                  </RequireRole>
                }
              />
              <Route path="parametros" element={<Parametros />} />
              <Route path="catalogo" element={<Catalogo />} />
              <Route
                path="contratos"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO', 'CONSULTA']}>
                    <Contratos />
                  </RequireRole>
                }
              />
              <Route
                path="contratos/nuevo"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO']}>
                    <ContratoForm />
                  </RequireRole>
                }
              />
              <Route path="contratos/:id" element={<ContratoDetalle />} />
              <Route
                path="clientes"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO', 'CONSULTA']}>
                    <Clientes />
                  </RequireRole>
                }
              />
              <Route
                path="contratos/:id/editar"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO']}>
                    <ContratoForm />
                  </RequireRole>
                }
              />
              <Route
                path="proveedores"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'CONSULTA']}>
                    <Proveedores />
                  </RequireRole>
                }
              />
              <Route
                path="bitacora"
                element={
                  <RequireRole roles={['GERENTE', 'CONSULTA']}>
                    <Bitacora />
                  </RequireRole>
                }
              />
              <Route
                path="inventario"
                element={
                  <RequireRole
                    roles={['GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'COCINA', 'CONSULTA']}
                  >
                    <Inventario />
                  </RequireRole>
                }
              />
              <Route
                path="compras"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'CONSULTA']}>
                    <Compras />
                  </RequireRole>
                }
              />
              <Route
                path="compras/:id"
                element={
                  <RequireRole roles={['GERENTE', 'GERENTE_GASTRONOMICO', 'LOGISTICA', 'CONSULTA']}>
                    <SolicitudDetalle />
                  </RequireRole>
                }
              />
              <Route path="entregas" element={<Entregas />} />
              <Route path="produccion" element={<Produccion />} />
              <Route path="calidad" element={<Calidad />} />
              <Route path="personal" element={<RequireRole roles={['GERENTE', 'CONSULTA']}><Personal /></RequireRole>} />
              <Route path="finanzas" element={<RequireRole roles={['GERENTE', 'CONSULTA']}><Finanzas /></RequireRole>} />
              <Route path="reportes" element={<RequireRole roles={['GERENTE', 'CONSULTA']}><Reportes /></RequireRole>} />
              <Route path="*" element={<NoEncontrado />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
