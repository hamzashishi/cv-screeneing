import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const PrivateRoute = ({ children, requiredRole = null, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !(user?.is_staff || user?.is_superuser)) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
