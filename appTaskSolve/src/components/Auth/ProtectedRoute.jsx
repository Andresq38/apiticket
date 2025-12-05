import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    const location = useLocation();
    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    return children;
}
