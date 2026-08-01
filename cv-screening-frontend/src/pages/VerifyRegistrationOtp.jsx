import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { authAPI } from '../services/api'

const VerifyRegistrationOtp = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  const initialEmail = location.state?.email || ''
  const pendingAdminApproval = !!location.state?.pending_admin_approval

  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await authAPI.verifyOtp(email, otp)
      setAuth(response.data.user, response.data.token)
      toast.success('Email verified successfully')
      if (pendingAdminApproval || response.data.user?.role === 'hr') {
        toast.success('HR account verification complete. Wait for admin approval if not yet approved.')
      }
      navigate(response.data.user.role === 'hr' ? '/login' : '/applicant-dashboard')
    } catch (error) {
      toast.error(error.response?.data?.error || 'OTP verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter email first')
      return
    }
    setIsLoading(true)
    try {
      const response = await authAPI.resendOtp(email)
      toast.success(response.data?.message || 'OTP resent')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] p-4 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="panel-card mx-auto mt-10 max-w-lg rounded-2xl p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Verify Registration OTP</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Enter the OTP sent to your email to activate your account.
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="6-digit OTP"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading}
            className="w-full rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Resend OTP
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Back to{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default VerifyRegistrationOtp
