import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import HRDashboard from './pages/hr/HRDashboard'
import JobList from './pages/hr/JobList'
import JobCreate from './pages/hr/JobCreate'
import JobDetail from './pages/hr/JobDetail'
import JobDetailsEnhanced from './pages/JobDetailsEnhanced'
import ScreeningCriteria from './pages/hr/ScreeningCriteria'
import './index.css'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import ApplicantDashboard from './pages/applicant/ApplicantDashboard'
import Notifications from './pages/Notifications'
import AdminDashboard from './pages/admin/AdminDashboard'
import ForgotPassword from './pages/ForgotPassword'
import VerifyRegistrationOtp from './pages/VerifyRegistrationOtp'
import AboutUs from './pages/AboutUs'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-registration-otp" element={<VerifyRegistrationOtp />} />
        <Route path="/about-us" element={<AboutUs />} />
        
        {/* HR Routes */}
        <Route
          path="/hr-dashboard"
          element={
            <PrivateRoute requiredRole="hr">
              <HRDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/jobs"
          element={
            <PrivateRoute requiredRole="hr">
              <JobList />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/jobs/create"
          element={
            <PrivateRoute requiredRole="hr">
              <JobCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/jobs/:id/edit"
          element={
            <PrivateRoute requiredRole="hr">
              <JobCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/jobs/:id"
          element={
            <PrivateRoute requiredRole="hr">
              <JobDetailsEnhanced />
            </PrivateRoute>
          }
        />
        <Route
          path="/hr/jobs/:id/screening"
          element={
            <PrivateRoute requiredRole="hr">
              <ScreeningCriteria />
            </PrivateRoute>
          }
        />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoute adminOnly>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        
        {/* Applicant Routes */}
        <Route
          path="/applicant-dashboard"
          element={
            <PrivateRoute requiredRole="applicant">
              <ApplicantDashboard />
            </PrivateRoute>
          }
        />
        
        {/* Default Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
