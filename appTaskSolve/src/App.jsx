import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './components/Home/Home';
import HomeP from './components/Home/HomeP';
import ProtectedRoute from './components/Auth/ProtectedRoute';
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

export default function App() {
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
                  <Dashboard />
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
              <Route path="/tecnicos/*" element={<ProtectedRoute><TecnicosHub /></ProtectedRoute>} >
                <Route index element={<Navigate to="listado" replace />} />
                <Route path="listado" element={<TecnicosList />} />
                <Route path="asignaciones" element={<AsignacionesTecnicos />} />
                <Route path="tickets" element={<TicketsPorTecnico />} />
                <Route path="crear" element={<CreateTecnico />} />
              </Route>
              <Route path="/asignaciones/gestionar" element={<ProtectedRoute><AsignacionManager /></ProtectedRoute>} />
              <Route path="/tecnicos/:id" element={<ProtectedRoute><TecnicoDetalle /></ProtectedRoute>} />
              <Route path="/tecnicos/editar/:id" element={<ProtectedRoute><EditTecnico /></ProtectedRoute>} />
              <Route path="/categorias" element={<ProtectedRoute><CategoriasList /></ProtectedRoute>} />
              <Route path="/categorias/crear" element={<Navigate to="/categorias" replace />} />
              <Route path="/categorias/:id" element={<ProtectedRoute><CategoriaDetalle /></ProtectedRoute>} />
              <Route path="/categorias/editar/:id" element={<ProtectedRoute><EditCategoria /></ProtectedRoute>} />
              <Route path="/mantenimientos" element={<ProtectedRoute><MantenimientosHome /></ProtectedRoute>} />
              <Route path="/mantenimientos/categorias" element={<ProtectedRoute><MantenimientosCategorias /></ProtectedRoute>} />
              <Route path="/sla/monitor" element={<ProtectedRoute><SlaMonitor /></ProtectedRoute>} />
              <Route path="/notificaciones" element={<ProtectedRoute><NotificacionesPage /></ProtectedRoute>} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
