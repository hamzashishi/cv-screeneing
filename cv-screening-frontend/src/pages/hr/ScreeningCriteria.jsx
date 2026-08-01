import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import apiClient, { hrAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

const ScreeningCriteria = () => {
  const { id } = useParams()
  const [criteria, setCriteria] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    apiClient.get(`/jobs/${id}/screening_criteria/`).then(r => { if (mounted) setCriteria(r.data) })
      .catch(() => toast.error('Failed to load criteria'))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [id])

  const handleChange = (e) => setCriteria({ ...criteria, [e.target.name]: e.target.value })

  const handleSave = async () => {
    try {
      await hrAPI.updateScreeningCriteria(id, criteria)
      toast.success('Saved')
    } catch (e) {
      toast.error('Save failed')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!criteria) return <div className="p-8">No criteria found</div>

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 sm:px-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/hr-dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={16} />
            Back to Hiring Dashboard
          </Link>
          <Link
            to={`/hr/jobs/${id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Back to Job
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Screening Criteria</h1>
          <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Skills weight</label>
          <input name="skills_weight" value={criteria.skills_weight} onChange={handleChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Experience weight</label>
          <input name="experience_weight" value={criteria.experience_weight} onChange={handleChange} className="mb-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">Education weight</label>
          <input name="education_weight" value={criteria.education_weight} onChange={handleChange} className="mb-5 w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          <button onClick={handleSave} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800">Save</button>
        </section>
      </div>
    </div>
  )
}

export default ScreeningCriteria
