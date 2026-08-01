import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { hrAPI, applicantAPI, userAPI } from '../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, UserCircle2 } from 'lucide-react'

const Profile = () => {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const resolveImageUrl = (value) => {
    if (!value) return ''
    if (/^https?:\/\//i.test(value) || value.startsWith('data:image')) return value
    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
    const backendBase = apiBase.replace(/\/api$/, '')
    return value.startsWith('/') ? `${backendBase}${value}` : `${backendBase}/${value}`
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        if (user.role === 'hr') {
          const r = await hrAPI.getProfile()
          if (mounted) setProfile(r.data)
        } else {
          const r = await applicantAPI.getProfile()
          if (mounted) setProfile(r.data)
        }
      } catch (e) {
        toast.error('Failed to load profile')
      } finally {
        mounted && setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user])

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value })
  const handleUserChange = (e) => setProfile({
    ...profile,
    user: { ...profile.user, [e.target.name]: e.target.value }
  })

  const handleSave = async () => {
    try {
      if (user.role === 'hr') {
        await hrAPI.updateProfile(profile.id, profile)
      } else {
        await Promise.all([
          applicantAPI.updateProfile(profile.id, {
            location: profile.location,
            bio: profile.bio,
            skills: profile.skills,
          }),
          userAPI.updateProfile({
            first_name: profile.user?.first_name || '',
            last_name: profile.user?.last_name || '',
            phone_number: profile.user?.phone_number || '',
          }),
        ])
      }
      toast.success('Profile updated')
      // update minimal user info
      updateUser({
        ...user,
        first_name: profile.user?.first_name || user.first_name,
        last_name: profile.user?.last_name || user.last_name,
        phone_number: profile.user?.phone_number || user.phone_number,
      })
    } catch (e) {
      toast.error(e.response?.data?.phone_number?.[0] || 'Save failed')
    }
  }

  const pictureSrc = resolveImageUrl(profile?.user?.profile_picture || user?.profile_picture || '')

  if (loading) return <div className="p-8">Loading profile...</div>
  if (!profile) return <div className="p-8">No profile found</div>

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
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Account</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Manage your account and profile information.</p>

          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="mb-3 font-medium text-slate-800 dark:text-slate-100">Profile picture</p>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  {pictureSrc ? (
                    <img src={pictureSrc} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle2 size={40} />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Profile picture is managed in <Link className="font-semibold text-blue-700 dark:text-blue-400" to="/settings">Settings</Link>.
                </p>
              </div>
            </div>

            {user.role === 'hr' ? (
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Company name</label>
                <input name="company_name" value={profile.company_name || ''} onChange={handleChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Company description</label>
                <textarea name="company_description" value={profile.company_description || ''} onChange={handleChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Company location</label>
                <input name="company_location" value={profile.company_location || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">First name</label>
                <input name="first_name" value={profile.user?.first_name || ''} onChange={handleUserChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Last name</label>
                <input name="last_name" value={profile.user?.last_name || ''} onChange={handleUserChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Phone number</label>
                <input name="phone_number" value={profile.user?.phone_number || ''} onChange={handleUserChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Location</label>
                <input name="location" value={profile.location || ''} onChange={handleChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Bio</label>
                <textarea name="bio" value={profile.bio || ''} onChange={handleChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Skills (comma-separated)</label>
                <input name="skills" value={profile.skills || ''} onChange={handleChange} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </div>
            )}

            <button onClick={handleSave} className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800">Save Profile</button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile
