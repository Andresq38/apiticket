import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import HomeP from './components/Home/HomeP';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleProtectedRoute from './components/Auth/RoleProtectedRoute';
import Login from './components/Auth/Login';

// Lazy-loaded routes to reduce initial bundle size
const PageNotFound = lazy(() => import('./components/Home/PageNotFound'));
const TicketsPorTecnico = lazy(() => import('./components/Tickets/TicketsPorTecnico'));
const TicketsList = lazy(() => import('./components/Tickets/TicketsList'));
const CreateTicket = lazy(() => import('./components/Tickets/CreateTicket'));
const EditTicket = lazy(() => import('./components/Tickets/EditTicket'));
const TicketsPorAdmi = lazy(() => import('./components/Tickets/TicketsPorAdmi'));
const TicketsPorCliente = lazy(() => import('./components/Tickets/TicketsPorCliente'));
const DetalleTicket = lazy(() => import('./components/Tickets/DetalleTicket'));
const TecnicosList = lazy(() => import('./components/Tecnicos/TecnicosList'));
const TecnicosHub = lazy(() => import('./components/Tecnicos/TecnicosHub'));
const TecnicoDetalle = lazy(() => import('./components/Tecnicos/TecnicoDetalle'));
const CreateTecnico = lazy(() => import('./components/Tecnicos/CreateTecnico'));
const EditTecnico = lazy(() => import('./components/Tecnicos/EditTecnico'));
const DetallePerfilTecnico = lazy(() => import('./pages/DetallePerfilTecnico'));
const IncidentesPendientes = lazy(() => import('./pages/IncidentesPendientes'));
const MiPerfilTecnico = lazy(() => import('./components/Tecnicos/MiPerfilTecnico'));
const CategoriasList = lazy(() => import('./components/Categorias/CategoriasList'));
const CategoriaDetalle = lazy(() => import('./components/Categorias/CategoriaDetalle'));
const CreateCategoria = lazy(() => import('./components/Categorias/CreateCategoria')); // mantenido para compatibilidad si se accede directo
const EditCategoria = lazy(() => import('./components/Categorias/EditCategoria'));
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const AsignacionesTecnicos = lazy(() => import('./components/Asignaciones/AsignacionesTecnicos'));
const AsignacionManager = lazy(() => import('./components/Asignaciones/AsignacionManager'));
const MantenimientosHome = lazy(() => import('./components/Mantenimientos/MantenimientosHome'));
const MantenimientosCategorias = lazy(() => import('./components/Mantenimientos/MantenimientosCategorias'));
const NotificacionesPage = lazy(() => import('./components/common/NotificacionesPage'));
const SlaMonitor = lazy(() => import('./components/SLA/SlaMonitor'));
const ClienteHub = lazy(() => import('./components/Cliente/ClienteHub'));

export default function App() {
    // Limpiar sesión y localStorage al iniciar la app para mostrar siempre el login
    React.useEffect(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }, []);
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<div style={{ padding: 24 }}>Cargando…</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <Dashboard />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/homeP" element={<HomeP />} />
              <Route path="/asignaciones" element={<Navigate to="/tecnicos/asignaciones" replace />} />
              <Route path="/tickets" element={
                <ProtectedRoute>
                  <TicketsList />
                </ProtectedRoute>
              } />
              <Route path="/tickets/crear" element={
                <ProtectedRoute>
                  <CreateTicket />
                </ProtectedRoute>
              } />
              <Route path="/tickets/Administrador" element={<ProtectedRoute><TicketsPorAdmi /></ProtectedRoute>} />
              <Route path="/tickets/cliente" element={<ProtectedRoute><TicketsPorCliente /></ProtectedRoute>} />
              <Route path="/tickets/tecnico" element={<ProtectedRoute><TicketsPorTecnico /></ProtectedRoute>} />
              <Route path="/tickets/:id" element={<ProtectedRoute><DetalleTicket /></ProtectedRoute>} />
              <Route path="/tickets/editar/:id" element={<ProtectedRoute><EditTicket /></ProtectedRoute>} />
              <Route path="/cliente/*" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Cliente']}>
                    <ClienteHub />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/tecnicos/*" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <TecnicosHub />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } >
                <Route index element={<Navigate to="listado" replace />} />
                <Route path="listado" element={<TecnicosList />} />
                <Route path="asignaciones" element={<AsignacionesTecnicos />} />
                <Route path="tickets" element={<TicketsPorTecnico />} />
                <Route path="crear" element={<CreateTecnico />} />
              </Route>
              <Route path="/asignaciones/gestionar" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <AsignacionManager />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/tecnicos/:id" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador', 'Tecnico']}>
                    <TecnicoDetalle />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/tecnicos/editar/:id" element={<ProtectedRoute><EditTecnico /></ProtectedRoute>} />
              <Route path="/editar-tecnico/:id" element={<ProtectedRoute><EditTecnico /></ProtectedRoute>} />
              <Route path="/mi-perfil-tecnico" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Tecnico']}>
                    <DetallePerfilTecnico />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/incidentes-pendientes" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Tecnico']}>
                    <IncidentesPendientes />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/mi-perfil" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Tecnico']}>
                    <MiPerfilTecnico />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/categorias" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <CategoriasList />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/categorias/crear" element={<Navigate to="/categorias" replace />} />
              <Route path="/categorias/:id" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <CategoriaDetalle />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/categorias/editar/:id" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <EditCategoria />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/mantenimientos" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <MantenimientosHome />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/mantenimientos/categorias" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <MantenimientosCategorias />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/sla/monitor" element={
                <ProtectedRoute>
                  <RoleProtectedRoute allowedRoles={['Administrador']}>
                    <SlaMonitor />
                  </RoleProtectedRoute>
                </ProtectedRoute>
              } />
              <Route path="/notificaciones" element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}