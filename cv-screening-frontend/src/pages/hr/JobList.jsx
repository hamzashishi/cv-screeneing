import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient, { hrAPI } from '../../services/api'

const normalizeJobs = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const JobList = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/jobs/')
      setJobs(normalizeJobs(res.data))
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job?')) return
    try {
      await hrAPI.deleteJob(jobId)
      toast.success('Job deleted')
      setJobs((prev) => prev.filter((job) => job.id !== jobId))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete job')
    }
  }

  if (loading) return <div className="p-8">Loading jobs...</div>

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 sm:px-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          to="/hr-dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={16} />
          Back to Hiring Dashboard
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your Job Postings</h1>
            <Link to="/hr/jobs/create" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Create Job
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
              No jobs found. <Link to="/hr/jobs/create" className="font-semibold text-blue-700">Create one</Link>.
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map(job => (
                <li key={job.id} className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:hover:border-slate-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-slate-100">{job.job_title}</h2>
                      <div className="text-sm text-slate-600 dark:text-slate-300">{job.location} | {job.job_type}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        Maximum people needed: {job.max_people_needed ?? 'Not specified'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/hr/jobs/${job.id}`} className="font-semibold text-blue-700 hover:text-blue-800">View</Link>
                      <Link to={`/hr/jobs/${job.id}/edit`} className="font-semibold text-emerald-700 hover:text-emerald-800">Edit</Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(job.id)}
                        className="font-semibold text-rose-700 hover:text-rose-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default JobList
