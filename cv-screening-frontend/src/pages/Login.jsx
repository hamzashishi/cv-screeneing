import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

const Login = () => {
  const appName = import.meta.env.VITE_APP_NAME || 'CV Screening System'
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [isLoading, setIsLoading] = useState(false)
  const [loginRole, setLoginRole] = useState('hr')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await authAPI.login(formData.email, formData.password)
      const expectedRole = loginRole === 'hr' ? 'hr' : 'applicant'
      const isAdmin = response.data?.user?.is_staff || response.data?.user?.is_superuser
      if (!isAdmin && response.data?.user?.role !== expectedRole) {
        toast.error(`This account is not ${expectedRole === 'hr' ? 'HR' : 'Applicant'}. Switch login type.`)
        return
      }
      setAuth(response.data.user, response.data.token)
      toast.success('Login successful!')
      if (response.data.user?.is_staff || response.data.user?.is_superuser) {
        navigate('/admin-dashboard')
      } else {
        navigate(response.data.user.role === 'hr' ? '/hr-dashboard' : '/applicant-dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />

      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-center gap-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider ${
              isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'
            }`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/about-us"
          className={({ isActive }) =>
            `rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider ${
              isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'
            }`
          }
        >
          About
        </NavLink>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl lg:grid-cols-5">
        <section className="relative hidden bg-gradient-to-br from-[#0874d1] via-[#0b63c9] to-[#0857b5] p-12 text-white lg:col-span-3 lg:block">
          <div className="relative mt-14">
            <p className="mb-3 inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
              Smart Hiring Platform
            </p>
            <h1 className="max-w-md text-5xl font-black leading-tight">
              Intelligent <span className="text-cyan-200">CV Screening</span> and Ranking System
            </h1>
            <ul className="mt-10 space-y-3 text-base text-cyan-50">
              <li>Create HR and applicant accounts with OTP verification</li>
              <li>Post jobs and manage company hiring requirements</li>
              <li>Upload and extract CV data automatically</li>
              <li>Rank candidates by skills, education, and experience</li>
              <li>Approve HR accounts and track hiring decisions</li>
            </ul>
          </div>
        </section>

        <section className="flex flex-col justify-between bg-[#f4f6ff] p-8 sm:p-10 lg:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{appName}</p>
              <Link to="/register" className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100">
                Register
              </Link>
            </div>

            <h2 className="mt-8 text-4xl font-extrabold text-slate-900">Login</h2>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setLoginRole('hr')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${loginRole === 'hr' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
              >
                HR Login
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('applicant')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${loginRole === 'applicant' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
              >
                Applicant Login
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Email or Username</label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="admin or you@gmail.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="********"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-500">
                  <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300" />
                  Save User
                </label>
                <Link to="/forgot-password" className="font-bold uppercase tracking-wide text-cyan-600 hover:text-cyan-700">
                  Forget Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          <footer className="mt-8 text-center text-xs text-slate-500">
            {appName} (c) {currentYear}
          </footer>
        </section>
      </div>
    </div>
  )
}

export default Login
