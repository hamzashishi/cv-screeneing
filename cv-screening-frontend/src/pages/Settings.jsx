import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { userAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Camera, Monitor, Moon, Sun, UserCircle2 } from 'lucide-react'

const Settings = () => {
  const { user, updateUser } = useAuthStore()
  const [prefs, setPrefs] = useState({ emailNotifications: true, theme: 'light' })
  const [profilePreview, setProfilePreview] = useState('')
  const [uploading, setUploading] = useState(false)

  const resolveImageUrl = (value) => {
    if (!value) return ''
    if (/^https?:\/\//i.test(value) || value.startsWith('data:image')) return value
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
    const backendBase = apiBase.replace(/\/api$/, '')
    return value.startsWith('/') ? `${backendBase}${value}` : `${backendBase}/${value}`
  }

  const applyTheme = (theme) => {
    try {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark)
      document.documentElement.classList.toggle('dark', shouldUseDark)
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('app_settings')
    let parsed = null
    if (saved) {
      try {
        parsed = JSON.parse(saved)
        setPrefs(parsed)
      } catch (err) {
        parsed = null
      }
    }
    setProfilePreview(resolveImageUrl(user?.profile_picture || ''))
    applyTheme(parsed?.theme || 'light')
  }, [user?.profile_picture])

  const handleProfilePicture = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('profile_picture', file)
    setUploading(true)
    try {
      const response = await userAPI.updateProfile(formData)
      const updated = response.data
      updateUser({ ...user, ...updated })
      setProfilePreview(resolveImageUrl(updated.profile_picture || ''))
      toast.success('Profile picture updated')
    } catch {
      toast.error('Failed to upload profile picture')
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  const clearProfilePicture = async () => {
    setUploading(true)
    try {
      const response = await userAPI.updateProfile({ profile_picture: null })
      const updated = response.data
      updateUser({ ...user, ...updated })
      setProfilePreview('')
      toast.success('Profile picture removed')
    } catch {
      toast.error('Failed to remove profile picture')
    } finally {
      setUploading(false)
    }
  }

  const toggleEmail = () => {
    const n = { ...prefs, emailNotifications: !prefs.emailNotifications }
    setPrefs(n)
    localStorage.setItem('app_settings', JSON.stringify(n))
  }

  const handleThemeChange = (e) => {
    const theme = e.target.value
    const n = { ...prefs, theme }
    setPrefs(n)
    localStorage.setItem('app_settings', JSON.stringify(n))
    applyTheme(theme)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 sm:px-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="mx-auto max-w-4xl space-y-6">
        {user?.role === 'hr' && (
          <Link
            to="/hr-dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Hiring Dashboard
          </Link>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Preferences</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Update your notifications and display preferences.</p>

          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">Profile picture</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {profilePreview || user?.profile_picture ? (
                    <img src={profilePreview || resolveImageUrl(user?.profile_picture || '')} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 size={40} />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  <Camera size={16} />
                  Upload
                  <input type="file" accept="image/*" onChange={handleProfilePicture} className="hidden" disabled={uploading} />
                </label>
                {(profilePreview || user?.profile_picture) && (
                  <button
                    type="button"
                    onClick={clearProfilePicture}
                    disabled={uploading}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {uploading ? 'Updating...' : 'Remove'}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={prefs.emailNotifications}
                  onChange={toggleEmail}
                  className="h-4 w-4 accent-slate-900"
                />
                <span className="font-medium text-slate-800 dark:text-slate-100">Email notifications</span>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">Theme</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={prefs.theme === 'light'}
                    onChange={handleThemeChange}
                    className="h-4 w-4 accent-slate-900"
                  />
                  <Sun size={16} />
                  <span>Light</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={prefs.theme === 'dark'}
                    onChange={handleThemeChange}
                    className="h-4 w-4 accent-slate-900"
                  />
                  <Moon size={16} />
                  <span>Dark</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 p-3 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={prefs.theme === 'system'}
                    onChange={handleThemeChange}
                    className="h-4 w-4 accent-slate-900"
                  />
                  <Monitor size={16} />
                  <span>System</span>
                </label>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Choose Light, Dark, or follow your system preference.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
