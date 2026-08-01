import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, FileText, Filter, Medal, Sparkles, Users } from 'lucide-react'
import apiClient, { hrAPI } from '../services/api'

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const getCvViewUrl = (cvFile) => {
  if (!cvFile) return ''
  if (/^https?:\/\//i.test(cvFile)) return cvFile
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
  const backendBase = apiBase.replace(/\/api$/, '')
  if (cvFile.startsWith('/')) return `${backendBase}${cvFile}`
  return `${backendBase}/${cvFile}`
}

const getStatusClass = (status) => {
  switch (status) {
    case 'shortlisted':
      return 'status-shortlisted'
    case 'interview_scheduled':
      return 'status-interview'
    case 'hired':
      return 'status-hired'
    case 'rejected':
      return 'status-rejected'
    default:
      return 'status-applied'
  }
}

const formatExperienceItems = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    if (typeof item === 'string') return item
    if (!item || typeof item !== 'object') return String(item || '')

    const org = item.organization || item.company || item.employer || ''
    const date = item.date_range || ''
    const duties = item.responsibilities || item.description || ''
    const fallbackText = item.text || ''

    const headParts = []
    if (org) headParts.push(org)
    if (date) headParts.push(`(${date})`)
    let line = headParts.join(' ')
    if (duties) {
      line = line ? `${line} — ${duties}` : duties
    }
    if (!line && fallbackText) return fallbackText
    return line || '-'
  }).filter((line) => line && line !== '-')
}

const formatTrainingItems = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    if (typeof item === 'string') return item
    if (!item || typeof item !== 'object') return String(item || '')
    const inst = item.institution || item.organization || ''
    const date = item.date_range || ''
    const duties = item.duties || item.responsibilities || ''
    const head = [inst, date ? `(${date})` : ''].filter(Boolean).join(' ')
    if (duties) return head ? `${head} — ${duties}` : duties
    return head || item.text || '-'
  }).filter((line) => line && line !== '-')
}

const JobDetailsEnhanced = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)
  const [ranking, setRanking] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(12)
  const [processingDecision, setProcessingDecision] = useState('')
  const [decisionNotes, setDecisionNotes] = useState({})
  const [exporting, setExporting] = useState(false)
  const [cvSummaryModal, setCvSummaryModal] = useState({
    open: false,
    mode: 'single',
    applicationId: '',
  })
  const [decisionModal, setDecisionModal] = useState({
    open: false,
    applicationId: '',
    decision: '',
  })

  const fetchJobData = async () => {
    setLoading(true)
    try {
      const [jobRes, applicantsRes] = await Promise.all([
        apiClient.get(`/jobs/${id}/`),
        hrAPI.getApplicants(id),
      ])
      setJob(jobRes.data)
      setApplicants(normalizeList(applicantsRes.data))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobData()
  }, [id])

  const filteredApplicants = useMemo(() => {
    return applicants.filter((app) => {
      const name = app.applicant_name || ''
      const title = app.job_title || ''
      const text = `${name} ${title}`.toLowerCase()
      const statusOk = statusFilter === 'all' || app.status === statusFilter
      const queryOk = !query || text.includes(query.toLowerCase())
      return statusOk && queryOk
    })
  }, [applicants, query, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / rowsPerPage))
  const pagedApplicants = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredApplicants.slice(start, start + rowsPerPage)
  }, [filteredApplicants, currentPage, rowsPerPage])

  const stats = useMemo(() => {
    const total = applicants.length
    const ranked = applicants.filter((a) => a.application_rank).length
    const shortlisted = applicants.filter((a) => a.status === 'shortlisted').length
    const hired = applicants.filter((a) => a.status === 'hired').length
    return { total, ranked, shortlisted, hired }
  }, [applicants])

  const pdfSummaryApplicants = useMemo(
    () => applicants.filter((app) => {
      const hasAppliedPdf = app.cv_is_uploaded && app.cv_is_pdf
      const hasFallbackPdf = Boolean(app.applicant_uploaded_pdf_parsed_data)
      const hasTemplate = Boolean(app.cv_is_template)
      return hasAppliedPdf || hasFallbackPdf || hasTemplate
    }),
    [applicants]
  )

  const handleRank = async () => {
    setRanking(true)
    try {
      await hrAPI.rankCandidates(id)
      toast.success('Ranking updated')
      await fetchJobData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to rank candidates')
    } finally {
      setRanking(false)
    }
  }

  const openDecisionPreview = (applicationId, decision) => {
    setDecisionModal({ open: true, applicationId, decision })
  }

  const closeDecisionPreview = () => {
    if (processingDecision) return
    setDecisionModal({ open: false, applicationId: '', decision: '' })
  }

  const handleDecisionConfirm = async () => {
    const { applicationId, decision } = decisionModal
    if (!applicationId || !decision) return
    const notes = (decisionNotes[applicationId] || '').trim()
    if (!notes) {
      toast.error('Please write a message to candidate before confirming.')
      return
    }
    setProcessingDecision(applicationId)
    try {
      await hrAPI.makeDecision(applicationId, decision, notes)
      toast.success(`Candidate ${decision === 'hire' ? 'hired' : 'rejected'}`)
      setDecisionNotes((prev) => ({ ...prev, [applicationId]: '' }))
      setDecisionModal({ open: false, applicationId: '', decision: '' })
      await fetchJobData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Decision failed')
    } finally {
      setProcessingDecision('')
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const response = await apiClient.get(`/jobs/${id}/export_applicants_excel/`, {
        responseType: 'blob',
      })
      const disposition = response.headers['content-disposition'] || ''
      const match = disposition.match(/filename=\"?([^\";]+)\"?/)
      const filename = match?.[1] || `job_${id}_applicants.xls`
      const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Excel exported')
    } catch (err) {
      toast.error('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }

  const handleAllowReapply = async (applicationId) => {
    try {
      await hrAPI.allowReapply(applicationId)
      toast.success('Candidate can reapply now')
      await fetchJobData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to allow reapply')
    }
  }

  const handleDeleteJob = async () => {
    if (!window.confirm('Delete this job?')) return
    try {
      await hrAPI.deleteJob(id)
      toast.success('Job deleted')
      navigate('/hr/jobs')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete job')
    }
  }

  const openSingleCvSummary = (applicationId) => {
    setCvSummaryModal({ open: true, mode: 'single', applicationId })
  }

  const openAllCvSummaries = () => {
    setCvSummaryModal({ open: true, mode: 'all', applicationId: '' })
  }

  const closeCvSummary = () => {
    setCvSummaryModal({ open: false, mode: 'single', applicationId: '' })
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter, rowsPerPage, applicants.length])

  if (loading) return <div className="p-8">Loading job details...</div>
  if (!job) return <div className="p-8">Job not found</div>
  const selectedApplicant = applicants.find((a) => a.id === decisionModal.applicationId)
  const selectedSummaryApplicant = applicants.find((a) => a.id === cvSummaryModal.applicationId)
  const summaryRows = cvSummaryModal.mode === 'all'
    ? pdfSummaryApplicants
    : (selectedSummaryApplicant ? [selectedSummaryApplicant] : [])
  const previewMessage = decisionModal.decision === 'hire'
    ? `Congratulations! You have been hired for ${job.job_title} at ${job.hr_company_name || 'our company'}`
    : `Your application for ${job.job_title} has been rejected`
  const previewNotes = (decisionNotes[decisionModal.applicationId] || '').trim()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 sm:px-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/hr-dashboard" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <ArrowLeft size={16} />
            Back to Hiring Dashboard
          </Link>
          <Link to="/hr/jobs" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            Back to Jobs
          </Link>
          <Link to={`/hr/jobs/${id}/screening`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            Screening Criteria
          </Link>
          <Link to={`/hr/jobs/${id}/edit`} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60">
            Edit Job
          </Link>
          <button
            type="button"
            onClick={handleDeleteJob}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60"
          >
            Delete Job
          </button>
        </div>

        <section className="panel-hero rounded-2xl p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{job.job_title}</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{job.location || 'Location not set'} | {job.job_type || 'Type not set'}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Maximum people needed: {job.max_people_needed ?? 'Not specified'}
              </p>
              <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{job.job_description}</p>
            </div>
            <button
              type="button"
              onClick={handleRank}
              disabled={ranking}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              <Sparkles size={16} />
              {ranking ? 'Ranking...' : 'Run Ranking'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Applicants</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Ranked</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.ranked}</p>
          </div>
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Shortlisted</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{stats.shortlisted}</p>
          </div>
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Hired</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.hired}</p>
          </div>
        </section>

        <section className="panel-card rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Applicants</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                type="button"
                onClick={openAllCvSummaries}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FileText size={14} />
                All PDF CV Summaries
              </button>
              <div className="relative">
                <Filter size={14} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="all">All status</option>
                  <option value="applied">Applied</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interview_scheduled">Interview</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search applicant..."
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {filteredApplicants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
              <Users className="mx-auto mb-2 text-slate-400" size={24} />
              <p className="font-medium text-slate-700 dark:text-slate-200">No applicants match your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <th className="py-3 pr-4">Applicant</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Phone</th>
                    <th className="py-3 pr-4">Location</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Rank</th>
                    <th className="py-3 pr-4">Score</th>
                    <th className="py-3 pr-4">Applied</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedApplicants.map((app) => (
                    <tr key={app.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{app.applicant_name || 'Applicant'}</p>
                      </td>
                      <td className="py-3 pr-4">{app.applicant_email || '-'}</td>
                      <td className="py-3 pr-4">{app.applicant_phone || '-'}</td>
                      <td className="py-3 pr-4">{app.applicant_location || '-'}</td>
                      <td className="py-3 pr-4">
                        <span className={`status-chip ${getStatusClass(app.status)}`}>
                          {app.status || 'applied'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {app.application_rank !== null && app.application_rank !== undefined ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
                            <Medal size={14} /> #{app.application_rank}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {app.application_score !== null && app.application_score !== undefined
                          ? Number(app.application_score).toFixed(1)
                          : '-'}
                      </td>
                      <td className="py-3 pr-4">{app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '-'}</td>
                      <td className="py-3 pr-4">
                        <div className="flex min-w-44 flex-col gap-2">
                          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                            Actions for: {app.applicant_name || 'Applicant'}
                          </div>
                          {app.cv_pdf_url ? (
                            <a
                              href={getCvViewUrl(app.cv_pdf_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Preview CV
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="PDF not available yet"
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-center text-xs font-semibold text-slate-400"
                            >
                              Preview CV
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openSingleCvSummary(app.id)}
                            disabled={!((app.cv_is_uploaded && app.cv_is_pdf) || app.cv_is_template)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            CV Summary
                          </button>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openDecisionPreview(app.id, 'hire')}
                              disabled={processingDecision === app.id || app.status === 'hired'}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Hire
                            </button>
                            <button
                              type="button"
                              onClick={() => openDecisionPreview(app.id, 'reject')}
                              disabled={processingDecision === app.id || app.status === 'rejected'}
                              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAllowReapply(app.id)}
                            disabled={Boolean(app.reapply_allowed) || app.status !== 'rejected'}
                            className="w-full rounded-md border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                          >
                            {app.reapply_allowed ? 'Reapply Enabled' : 'Allow Reapply'}
                          </button>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {app.status === 'rejected'
                              ? 'Enable if you want this candidate to apply again.'
                              : 'Reapply can only be enabled after rejection.'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {filteredApplicants.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {(currentPage - 1) * rowsPerPage + 1}-
                {Math.min(currentPage * rowsPerPage, filteredApplicants.length)} of {filteredApplicants.length}
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Rows:
                </label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value={12}>12</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Prev
                </button>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {cvSummaryModal.open && (
          <div className="fixed inset-0 z-[58] flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {cvSummaryModal.mode === 'all' ? 'All CV Summaries' : 'CV Summary'}
                </h3>
                <button
                  type="button"
                  onClick={closeCvSummary}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Close
                </button>
              </div>

              {summaryRows.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No CV summary found for this selection.
                </p>
              ) : (
                <div className="space-y-4">
                  {summaryRows.map((app) => {
                    const isTemplate = Boolean(app.cv_is_template)
                    const parsed = isTemplate
                      ? (app.cv_template_data || {})
                      : (app.cv_parsed_data || app.applicant_uploaded_pdf_parsed_data || {})
                    const usingFallback = !isTemplate && !app.cv_parsed_data && Boolean(app.applicant_uploaded_pdf_parsed_data)
                    const experienceLines = formatExperienceItems(parsed.work_experience)
                    const trainingLines = formatTrainingItems(parsed.training_workshop)
                    return (
                      <section key={app.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {app.applicant_name || 'Applicant'}
                          </h4>
                          {app.cv_pdf_url ? (
                            <a
                              href={getCvViewUrl(app.cv_pdf_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              Preview CV
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              title="PDF not available yet"
                              className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-400"
                            >
                              Preview CV
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {parsed.email || app.applicant_email || '-'} | {parsed.phone_number || app.applicant_phone || '-'}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Location: {parsed.location || app.applicant_location || '-'}
                        </p>
                        {isTemplate && (
                          <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            Showing summary from template CV.
                          </p>
                        )}
                        {usingFallback && (
                          <p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                            Showing summary from candidate's uploaded PDF CV (application used a different CV).
                          </p>
                        )}
                        {app.cv_parsed_data ? (
                          <>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Summary:</span> {parsed.summary || '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Skills:</span> {Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills.join(', ') : '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Education:</span> {parsed.highest_education || '-'} | {parsed.total_years_experience ?? '-'} years experience
                            </p>
                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Work Experience:</span>
                              {experienceLines.length ? (
                                <div className="mt-1 space-y-1">
                                  {experienceLines.map((line, idx) => (
                                    <div key={`${app.id}-exp-${idx}`} className="text-slate-700 dark:text-slate-200">
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="ml-1">-</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Certifications:</span> {Array.isArray(parsed.certifications) && parsed.certifications.length ? parsed.certifications.join(', ') : '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Languages:</span> {Array.isArray(parsed.languages) && parsed.languages.length ? parsed.languages.join(', ') : '-'}
                            </p>
                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Extracted text preview:</span>
                              <p className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
                                {parsed.text_preview || '-'}
                              </p>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Extraction confidence: {parsed.extraction_confidence ?? 0}
                            </p>
                          </>
                        ) : app.applicant_uploaded_pdf_parsed_data ? (
                          <>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Summary:</span> {parsed.summary || '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Skills:</span> {Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills.join(', ') : '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Education:</span> {parsed.highest_education || '-'} | {parsed.total_years_experience ?? '-'} years experience
                            </p>
                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Work Experience:</span>
                              {experienceLines.length ? (
                                <div className="mt-1 space-y-1">
                                  {experienceLines.map((line, idx) => (
                                    <div key={`${app.id}-exp-fallback-${idx}`} className="text-slate-700 dark:text-slate-200">
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="ml-1">-</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Certifications:</span> {Array.isArray(parsed.certifications) && parsed.certifications.length ? parsed.certifications.join(', ') : '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Languages:</span> {Array.isArray(parsed.languages) && parsed.languages.length ? parsed.languages.join(', ') : '-'}
                            </p>
                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Extracted text preview:</span>
                              <p className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-50 p-2 dark:bg-slate-800/60">
                                {parsed.text_preview || '-'}
                              </p>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Extraction confidence: {parsed.extraction_confidence ?? 0}
                            </p>
                          </>
                        ) : isTemplate ? (
                          <>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Personal details:</span> {parsed.surname || '-'} {parsed.given_names || parsed.full_name || ''}
                            </p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Sex:</span> {parsed.sex || '-'} | <span className="font-semibold">Marital status:</span> {parsed.marital_status || '-'}
                            </p>
                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Date of birth:</span> {parsed.date_of_birth || '-'} | <span className="font-semibold">Nationality:</span> {parsed.nationality || '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Skills:</span> {Array.isArray(parsed.skills) && parsed.skills.length ? parsed.skills.join(', ') : '-'}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Education:</span> {Array.isArray(parsed.education) && parsed.education.length ? parsed.education.join(' | ') : '-'}
                            </p>
                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Work Experience:</span>
                              {experienceLines.length ? (
                                <div className="mt-1 space-y-1">
                                  {experienceLines.map((line, idx) => (
                                    <div key={`${app.id}-exp-template-${idx}`} className="text-slate-700 dark:text-slate-200">
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="ml-1">-</span>
                              )}
                            </div>
                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Training & Workshop:</span>
                              {trainingLines.length ? (
                                <div className="mt-1 space-y-1">
                                  {trainingLines.map((line, idx) => (
                                    <div key={`${app.id}-train-template-${idx}`} className="text-slate-700 dark:text-slate-200">
                                      {line}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="ml-1">-</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                              <span className="font-semibold">Hobbies:</span> {parsed.hobbies || '-'}
                            </p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                            PDF uploaded, but summary is not available yet. Re-open this page after backend restart.
                          </p>
                        )}
                      </section>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {decisionModal.open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Notification Preview</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Candidate: <span className="font-semibold">{selectedApplicant?.applicant_name || 'Applicant'}</span>
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Decision: <span className={`font-semibold ${decisionModal.decision === 'hire' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {decisionModal.decision === 'hire' ? 'Hire' : 'Reject'}
                </span>
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Message to candidate</p>
                <p className="mt-2 text-slate-700 dark:text-slate-200">{previewMessage}</p>
                <textarea
                  value={decisionNotes[decisionModal.applicationId] ?? ''}
                  onChange={(e) => setDecisionNotes((prev) => ({ ...prev, [decisionModal.applicationId]: e.target.value }))}
                  placeholder="Write message to candidate..."
                  rows={3}
                  className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                {previewNotes && (
                  <p className="mt-3 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Message from HR:</span> {previewNotes}
                  </p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDecisionPreview}
                  disabled={Boolean(processingDecision)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecisionConfirm}
                  disabled={Boolean(processingDecision)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    decisionModal.decision === 'hire' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {processingDecision ? 'Sending...' : `Confirm ${decisionModal.decision === 'hire' ? 'Hire' : 'Reject'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default JobDetailsEnhanced
