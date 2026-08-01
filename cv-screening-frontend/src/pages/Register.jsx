import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const Register = () => {
  const appName = import.meta.env.VITE_APP_NAME || 'CV Screening System'
  const currentYear = new Date().getFullYear()
  const navigate = useNavigate()

  const [role, setRole] = useState('applicant')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    password_confirm: '',
    company_name: '',
    company_description: '',
    company_location: '',
    location: '',
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
      const submitData = {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        password: formData.password,
        password_confirm: formData.password_confirm,
        role,
      }

      if (role === 'hr') {
        submitData.company_name = formData.company_name
        submitData.company_description = formData.company_description
        submitData.company_location = formData.company_location
      } else {
        submitData.location = formData.location
      }

      const response = await authAPI.register(submitData)
      toast.success(response.data?.message || 'Registration successful. Verify OTP to activate account.')
      navigate('/verify-registration-otp', {
        state: {
          email: response.data?.email || formData.email,
          pending_admin_approval: !!response.data?.pending_admin_approval,
        },
      })
    } catch (error) {
      const resp = error.response?.data
      let message = 'Registration failed'
      if (resp) {
        if (typeof resp === 'string') message = resp
        else if (resp.detail) message = resp.detail
        else if (resp.error) message = resp.error
        else message = JSON.stringify(resp)
      }
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-2xl lg:grid-cols-5">
        <section className="relative hidden bg-gradient-to-br from-[#0874d1] via-[#0b63c9] to-[#0857b5] p-12 text-white lg:col-span-3 lg:block">
          <div className="absolute left-8 top-8 h-16 w-16 rounded-2xl border border-white/20 bg-white/10" />
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
              <Link to="/login" className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100">
                Login
              </Link>
            </div>

            <h2 className="mt-8 text-4xl font-extrabold text-slate-900">Register</h2>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setRole('hr')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${role === 'hr' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
              >
                HR Register
              </button>
              <button
                type="button"
                onClick={() => setRole('applicant')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${role === 'applicant' ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
              >
                Applicant Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="First Name" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                <input name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Last Name" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              </div>

              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email (Gmail only)" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              <input name="username" value={formData.username} onChange={handleChange} required placeholder="Username" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              <input name="phone_number" value={formData.phone_number} onChange={handleChange} required placeholder="Phone Number" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />

              {role === 'hr' ? (
                <>
                  <input name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="Company Name" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                  <textarea name="company_description" value={formData.company_description} onChange={handleChange} required rows={2} placeholder="Company Description" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                  <input name="company_location" value={formData.company_location} onChange={handleChange} required placeholder="Company Location" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                </>
              ) : (
                <input name="location" value={formData.location} onChange={handleChange} required placeholder="Location" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="Password" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
                <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} required minLength={8} placeholder="Confirm Password" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none" />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
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

export default Register
