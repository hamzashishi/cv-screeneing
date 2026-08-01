import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Briefcase, PlusCircle } from 'lucide-react'
import apiClient, { hrAPI } from '../../services/api'

const JobCreate = () => {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingJob, setLoadingJob] = useState(isEditMode)
  const [form, setForm] = useState({
    job_title: '',
    job_description: '',
    required_skills: '',
    required_education: 'bachelor',
    required_experience: 'mid',
    location: '',
    salary_min: '',
    salary_max: '',
    job_type: 'full_time',
  })

  React.useEffect(() => {
    let mounted = true
    const loadJob = async () => {
      if (!isEditMode) return
      setLoadingJob(true)
      try {
        const response = await apiClient.get(`/jobs/${id}/`)
        const existing = response.data
        if (mounted) {
          setForm({
            job_title: existing.job_title || '',
            job_description: existing.job_description || '',
            required_skills: existing.required_skills || '',
            required_education: existing.required_education || 'bachelor',
            required_experience: existing.required_experience || 'mid',
            location: existing.location || '',
            salary_min: existing.salary_min || '',
            salary_max: existing.salary_max || '',
            job_type: existing.job_type || 'full_time',
          })
        }
      } catch {
        toast.error('Failed to load job')
        navigate('/hr/jobs')
      } finally {
        if (mounted) setLoadingJob(false)
      }
    }
    loadJob()
    return () => { mounted = false }
  }, [id, isEditMode, navigate])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEditMode) {
        await hrAPI.updateJob(id, form)
        toast.success('Job updated')
      } else {
        await hrAPI.createJob(form)
        toast.success('Job created')
      }
      navigate('/hr/jobs')
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Save job failed')
    } finally {
      setLoading(false)
    }
  }

  if (loadingJob) return <div className="p-8">Loading job...</div>

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 via-white to-blue-50 px-4 py-8 sm:px-8 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/hr-dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to HR Hiring Dashboard
          </Link>
          <Link
            to="/hr/jobs"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Briefcase size={16} />
            Back to Jobs
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">HR Workspace</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{isEditMode ? 'Edit Job' : 'Create Job'}</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {isEditMode ? 'Update the role details and requirements.' : 'Publish a new role with clear requirements for better candidate matching.'}
              </p>
            </div>
            <PlusCircle className="hidden text-slate-300 sm:block dark:text-slate-600" size={34} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              placeholder="Job Title"
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <textarea
              name="job_description"
              value={form.job_description}
              onChange={handleChange}
              placeholder="Job Description"
              required
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <input
              name="required_skills"
              value={form.required_skills}
              onChange={handleChange}
              placeholder="Required Skills (e.g. Python, React, SQL)"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Experience Level
                <select
                  name="required_experience"
                  value={form.required_experience}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Education Level
                <select
                  name="required_education"
                  value={form.required_education}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="high_school">High School</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Job Location"
                className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Employment Type
                <select
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="number"
                name="salary_min"
                value={form.salary_min}
                onChange={handleChange}
                placeholder="Minimum Salary"
                className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                type="number"
                name="salary_max"
                value={form.salary_max}
                onChange={handleChange}
                placeholder="Maximum Salary"
                className="rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              <PlusCircle size={18} />
              {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Job')}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default JobCreate
