import React, { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Briefcase, LayoutDashboard, LogOut, Menu, PlusCircle, Settings, ShieldCheck, User, X } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { applicantAPI, hrAPI, notificationAPI } from '../services/api'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [identityLabel, setIdentityLabel] = useState('')
  const [profilePicture, setProfilePicture] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const dashboardPath = user?.is_staff || user?.is_superuser
    ? '/admin-dashboard'
    : user?.role === 'hr'
      ? '/hr-dashboard'
      : '/applicant-dashboard'
  useEffect(() => {
    let mounted = true
    let timer = null

    const fetchUnread = async () => {
      if (!user) {
        if (mounted) setUnreadCount(0)
        return
      }
      try {
        const response = await notificationAPI.getUnread()
        const payload = response.data
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.results) ? payload.results : []
        if (mounted) setUnreadCount(list.length)
      } catch {
        if (mounted) setUnreadCount(0)
      }
    }

    fetchUnread()
    timer = setInterval(fetchUnread, 15000)

    return () => {
      mounted = false
      if (timer) clearInterval(timer)
    }
  }, [user])

  const resolveProfileUrl = (value) => {
    if (!value) return ''
    if (/^https?:\/\//i.test(value)) return value
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
    const backendBase = apiBase.replace(/\/api$/, '')
    return value.startsWith('/') ? `${backendBase}${value}` : `${backendBase}/${value}`
  }

  useEffect(() => {
    let mounted = true

    const fallbackName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || user?.username || ''
    if (!user) {
      setIdentityLabel('')
      return
    }

    const loadIdentity = async () => {
      try {
        if (user.role === 'hr') {
          const response = await hrAPI.getProfile()
          const person = response?.data?.user?.first_name || user.first_name || user.username
          if (mounted) setIdentityLabel(person)
          if (mounted) setProfilePicture(resolveProfileUrl(response?.data?.user?.profile_picture || user?.profile_picture))
          return
        }

        if (user.role === 'applicant') {
          const response = await applicantAPI.getProfile()
          const firstName = response?.data?.user?.first_name || user.first_name
          const lastName = response?.data?.user?.last_name || user.last_name
          const label = [firstName, lastName].filter(Boolean).join(' ').trim() || user.username
          if (mounted) setIdentityLabel(label)
          if (mounted) setProfilePicture(resolveProfileUrl(response?.data?.user?.profile_picture || user?.profile_picture))
          return
        }

        if (mounted) setIdentityLabel(fallbackName)
        if (mounted) setProfilePicture(resolveProfileUrl(user?.profile_picture))
      } catch {
        if (mounted) setIdentityLabel(fallbackName)
        if (mounted) setProfilePicture(resolveProfileUrl(user?.profile_picture))
      }
    }

    loadIdentity()
    return () => { mounted = false }
  }, [user])

  const navLinks = useMemo(() => {
    if (!user) return []
    if (user.is_staff || user.is_superuser) {
      return [
        { to: '/admin-dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
      ]
    }
    if (user.role === 'hr') {
      return [
        { to: '/hr-dashboard', label: 'Hr Dashboard', icon: LayoutDashboard },
        { to: '/hr/jobs', label: 'Jobs', icon: Briefcase },
        { to: '/hr/jobs/create', label: 'Create Job', icon: PlusCircle },
      ]
    }
    return [
      { to: '/applicant-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  }, [user])

  const linkClassName = ({ isActive }) =>
    `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold transition ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
    }`

  return (
    <nav className="sticky top-0 z-50 border-b border-cyan-100/80 bg-gradient-to-r from-sky-50/95 via-white/90 to-emerald-50/90 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to={dashboardPath} className="group flex items-center gap-1.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-black text-white shadow-lg shadow-blue-500/30">
              CV
            </span>
            <span className="bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-500 bg-clip-text text-lg font-extrabold text-transparent">
              CV Screening
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden items-center gap-2 md:flex">
            {user && (
              <>
                {navLinks.map((item) => (
                  <NavLink key={item.to} to={item.to} className={linkClassName}>
                    <item.icon size={15} />
                    {item.label}
                  </NavLink>
                ))}
                <Link
                  to="/notifications"
                  className="relative inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                >
                  <Bell size={18} />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <NavLink to="/profile" className={linkClassName}>
                  <User size={15} />
                  Profile
                </NavLink>
                <NavLink to="/settings" className={linkClassName}>
                  <Settings size={15} />
                  Settings
                </NavLink>
                <div className="ml-1 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="h-7 w-7 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                    />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      <User size={14} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="max-w-44 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {identityLabel || user?.first_name || user?.username}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {user?.is_staff || user?.is_superuser ? 'Admin' : user?.role === 'hr' ? 'HR' : 'User'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg border border-slate-200 p-2 text-slate-700 dark:border-slate-700 dark:text-slate-200 md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="space-y-2 pb-4 md:hidden">
            {user && (
              <>
                {navLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <item.icon size={16} />
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Bell size={16} />
                  Notifications {unreadCount > 0 ? `(${unreadCount > 99 ? '99+' : unreadCount})` : ''}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <User size={16} />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-left font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
