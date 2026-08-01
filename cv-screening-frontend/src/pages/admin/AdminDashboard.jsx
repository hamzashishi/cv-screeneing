import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminDashboard = () => {
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  const toList = (payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.results)) return payload.results
    return []
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [pendingResp, approvedResp] = await Promise.all([
        adminAPI.getPendingHRs(),
        adminAPI.getApprovedHRs(),
      ])
      setPending(toList(pendingResp.data))
      setApproved(toList(approvedResp.data))
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load approval data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const approve = async (id) => {
    setBusyId(id)
    try {
      await adminAPI.approveHR(id)
      toast.success('HR company approved')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve')
    } finally {
      setBusyId('')
    }
  }

  const reject = async (id) => {
    setBusyId(id)
    try {
      await adminAPI.rejectHR(id)
      toast.success('HR account rejected and disabled')
      await loadData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="mx-auto max-w-7xl space-y-6 px-0 py-0 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Approvals</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Review HR company registrations before they can access HR tools.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pending HR Accounts ({pending.length})</h2>
        {loading ? (
          <LoadingSpinner />
        ) : pending.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No pending accounts.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-2 py-2">Company</th>
                  <th className="px-2 py-2">HR Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Location</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pending.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2 text-sm text-slate-900 dark:text-slate-100">{item.company_name || '-'}</td>
                    <td className="px-2 py-2 text-sm text-slate-700 dark:text-slate-300">
                      {[item.user?.first_name, item.user?.last_name].filter(Boolean).join(' ').trim() || item.user?.username || '-'}
                    </td>
                    <td className="px-2 py-2 text-sm text-slate-700 dark:text-slate-300">{item.user?.email || '-'}</td>
                    <td className="px-2 py-2 text-sm text-slate-700 dark:text-slate-300">{item.company_location || '-'}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approve(item.id)}
                          disabled={busyId === item.id}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reject(item.id)}
                          disabled={busyId === item.id}
                          className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Approved HR Accounts ({approved.length})</h2>
        {loading ? (
          <LoadingSpinner />
        ) : approved.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No approved accounts yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {approved.slice(0, 20).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-semibold">{item.company_name || '-'}</span> - {item.user?.email || '-'}
                </p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Approved
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default AdminDashboard
