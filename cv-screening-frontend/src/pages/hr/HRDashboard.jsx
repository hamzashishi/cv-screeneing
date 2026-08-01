import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Briefcase, Clock3, Plus, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { hrAPI, notificationAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const getJobTypeLabel = (jobType) => {
  if (!jobType) return 'Type not set'
  return jobType.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const isLikelyOpen = (job) => {
  const status = (job.status || '').toLowerCase()
  if (!status) return true
  return !['closed', 'archived', 'filled'].includes(status)
}

const normalizeJobs = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const HRDashboard = () => {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [notifications, setNotifications] = useState([])
  const [replyText, setReplyText] = useState({})
  const [replyingId, setReplyingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchJobs = async () => {
    setLoading(true)
    setError('')
    try {
      const [jobsRes, appsRes, notesRes] = await Promise.all([
        hrAPI.getJobs(),
        hrAPI.getApplications(),
        notificationAPI.getNotifications(),
      ])
      const normalizeList = (payload) => {
        if (Array.isArray(payload)) return payload
        if (Array.isArray(payload?.results)) return payload.results
        return []
      }
      setJobs(normalizeJobs(jobsRes.data))
      setApplications(normalizeList(appsRes.data))
      setNotifications(normalizeList(notesRes.data))
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const stats = useMemo(() => {
    const totalJobs = jobs.length
    const openJobs = jobs.filter(isLikelyOpen).length
    const totalApplicants = jobs.reduce((sum, job) => {
      const count = Number(
        job.applicants_count ?? job.application_count ?? job.applications_count ?? 0
      )
      return sum + (Number.isNaN(count) ? 0 : count)
    }, 0)
    const screeningPending = jobs.filter((job) => !job.required_skills || !job.required_experience).length
    const hiredCount = applications.filter((a) => a.status === 'hired').length
    const rejectedCount = applications.filter((a) => a.status === 'rejected').length
    const scored = applications.filter((a) => a.application_score !== null && a.application_score !== undefined)
    const avgScore = scored.length
      ? scored.reduce((sum, app) => sum + Number(app.application_score || 0), 0) / scored.length
      : 0

    return { totalJobs, openJobs, totalApplicants, screeningPending, hiredCount, rejectedCount, avgScore }
  }, [jobs, applications])

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)
  }, [jobs])

  const helpRequests = useMemo(() => {
    return notifications
      .filter(
        (n) =>
          n.notification_type === 'system' &&
          String(n.title || '').startsWith('Help Request:') &&
          !n.is_read
      )
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6)
  }, [notifications])

  const handleReplyHelp = async (notificationId) => {
    const message = (replyText[notificationId] || '').trim()
    if (!message) {
      toast.error('Write a reply message first')
      return
    }
    setReplyingId(notificationId)
    try {
      await notificationAPI.replyHelp(notificationId, message)
      toast.success('Reply sent to candidate')
      setReplyText((prev) => ({ ...prev, [notificationId]: '' }))
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      await fetchJobs()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reply')
    } finally {
      setReplyingId('')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />

      <div className="mx-auto max-w-7xl rounded-3xl border border-white/70 bg-white/80 p-4 shadow-2xl sm:p-6">
        <div className="mx-auto max-w-6xl space-y-8">
        <section className="panel-hero rounded-2xl p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">HR Workspace</p>
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-100">HR Dashboard</h1>
              <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
                Track jobs, monitor pipeline health, and jump directly into your key recruiting actions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/hr/jobs/create" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                <Plus size={18} />
                Create Job
              </Link>
              <Link to="/hr/jobs" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Briefcase size={18} />
                Manage Jobs
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <section>
            <LoadingSpinner />
          </section>
        ) : error ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchJobs}
              className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Jobs</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalJobs}</p>
              </div>
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Open Jobs</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.openJobs}</p>
              </div>
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Applicants</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">{stats.totalApplicants}</p>
              </div>
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Needs Criteria</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">{stats.screeningPending}</p>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Hired</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.hiredCount}</p>
              </div>
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Rejected</p>
                <p className="mt-2 text-2xl font-bold text-rose-600">{stats.rejectedCount}</p>
              </div>
              <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg Candidate Score</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">{stats.avgScore.toFixed(1)}</p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="panel-card rounded-2xl p-6 shadow-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Recent Job Postings</h2>
                  <Link to="/hr/jobs" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                    View all
                  </Link>
                </div>
                {recentJobs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="font-medium text-slate-700 dark:text-slate-200">No jobs yet</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your first role to start screening candidates.</p>
                    <Link to="/hr/jobs/create" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                      <Plus size={16} />
                      Create Job
                    </Link>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentJobs.map((job) => (
                      <li key={job.id} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-slate-600">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{job.job_title}</h3>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              {job.location || 'Location not set'} | {getJobTypeLabel(job.job_type)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                              Maximum people needed: {job.max_people_needed ?? 'Not specified'}
                            </p>
                          </div>
                          <Link to={`/hr/jobs/${job.id}`} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                            Open
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <aside className="panel-card space-y-4 rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h2>
                <Link to="/hr/jobs/create" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  <Plus size={18} className="text-slate-700 dark:text-slate-200" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">Post a New Role</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Start collecting candidates</p>
                  </div>
                </Link>
                <Link to="/hr/jobs" className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  <Users size={18} className="text-slate-700 dark:text-slate-200" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">Review Applicants</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Open a job and rank candidates</p>
                  </div>
                </Link>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <p className="flex items-center gap-2 font-medium">
                    <AlertCircle size={16} />
                    Screening reminder
                  </p>
                  <p className="mt-1 text-sm">
                    {stats.screeningPending} job(s) may need clearer criteria.
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-800">
                  <p className="flex items-center gap-2 font-medium">
                    <Clock3 size={16} />
                    Weekly focus
                  </p>
                  <p className="mt-1 text-sm">Prioritize jobs with the highest applicant volume.</p>
                </div>
              </aside>
            </section>

            <section className="panel-card rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Candidate Help Requests (FAQ)</h2>
              </div>

              {helpRequests.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  No help requests yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {helpRequests.map((note) => (
                    <div key={note.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{note.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{note.message}</p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <textarea
                          value={replyText[note.id] || ''}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [note.id]: e.target.value }))}
                          placeholder="Write reply to candidate..."
                          rows={2}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleReplyHelp(note.id)}
                          disabled={replyingId === note.id}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                        >
                          {replyingId === note.id ? 'Sending...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        </div>
      </div>
    </div>
  )
}

export default HRDashboard
