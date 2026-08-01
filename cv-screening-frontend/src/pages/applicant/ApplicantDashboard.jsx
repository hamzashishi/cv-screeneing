import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bell, Briefcase, CheckCircle2, FileText, HelpCircle, Send, Upload } from 'lucide-react'
import { applicantAPI, cvAPI, notificationAPI } from '../../services/api'
import LoadingSpinner from '../../components/LoadingSpinner'

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
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

const getCvViewUrl = (cvFile) => {
  if (!cvFile) return ''
  if (/^https?:\/\//i.test(cvFile)) return cvFile
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')
  const backendBase = apiBase.replace(/\/api$/, '')
  if (cvFile.startsWith('/')) return `${backendBase}${cvFile}`
  return `${backendBase}/${cvFile}`
}

const getCvDisplayName = (cv) => {
  const isTemplate = cv?.parsed_data?.template_source === 'builder'
  if (isTemplate) {
    const templateName = cv?.parsed_data_record?.full_name?.trim()
    if (templateName) {
      return `${templateName} cv.docx`
    }
    return 'user cv.docx'
  }
  if (cv.original_filename) return cv.original_filename
  if (cv.cv_file) {
    const clean = cv.cv_file.split('?')[0]
    return clean.split('/').pop() || `CV #${cv.id}`
  }
  return `CV #${cv.id}`
}

const getCvOptionLabel = (cv) => {
  const base = getCvDisplayName(cv)
  const isTemplate = cv?.parsed_data?.template_source === 'builder'
  return `${base}${isTemplate ? ' (Template)' : ' (Uploaded)'}`
}

const ApplicantDashboard = () => {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [cvs, setCvs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [creatingTemplate, setCreatingTemplate] = useState(false)
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false)
  const [helpApplicationId, setHelpApplicationId] = useState('')
  const [helpMessage, setHelpMessage] = useState('')
  const [sendingHelp, setSendingHelp] = useState(false)
  const [selectedCvByJob, setSelectedCvByJob] = useState({})
  const [template, setTemplate] = useState({
    full_name: '',
    surname: '',
    given_names: '',
    sex: '',
    marital_status: '',
    date_of_birth: '',
    nationality: '',
    email: '',
    phone_number: '',
    alt_phone: '',
    location: '',
    summary: '',
    skills: '',
    education: '',
    highest_education: 'bachelor',
    work_experience: [
      { organization: '', position: '', date_range: '', responsibilities: '' },
    ],
    training_workshop: [
      { institution: '', date_range: '', duties: '' },
    ],
    total_years_experience: 0,
    certifications: '',
    languages: '',
    hobbies: '',
    referees: '',
    additional_details: '',
    declaration: '',
    is_primary: true,
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [jobsRes, appsRes, cvsRes, notesRes] = await Promise.all([
        applicantAPI.getJobs(),
        applicantAPI.getApplications(),
        cvAPI.getCVs(),
        notificationAPI.getNotifications(),
      ])
      setJobs(normalizeList(jobsRes.data))
      setApplications(normalizeList(appsRes.data))
      setCvs(normalizeList(cvsRes.data))
      setNotifications(normalizeList(notesRes.data))
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications()
      setNotifications(normalizeList(response.data))
    } catch {
      // silent background refresh
    }
  }

  useEffect(() => {
    const timer = setInterval(fetchNotifications, 15000)
    return () => clearInterval(timer)
  }, [])

  const applicationsByJobId = useMemo(() => {
    const map = new Map()
    applications.forEach((app) => map.set(String(app.job), app))
    return map
  }, [applications])
  const primaryCv = useMemo(() => cvs.find((cv) => cv.is_primary), [cvs])
  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5)
  }, [applications])

  const recentNotifications = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 4)
  }, [notifications])

  const faqItems = [
    {
      q: 'How do I know if HR reviewed my application?',
      a: 'Check Notifications and Recent Applications status. HR updates appear there.',
    },
    {
      q: 'Can I update my CV after applying?',
      a: 'Yes. Upload a new CV and set it as primary for future applications.',
    },
    {
      q: 'Why was my application rejected?',
      a: 'HR may include decision notes. You can also send a direct help request below.',
    },
  ]

  const stats = useMemo(() => {
    const totalApplications = applications.length
    const hiredCount = applications.filter((a) => a.status === 'hired').length
    const rejectedCount = applications.filter((a) => a.status === 'rejected').length
    const pendingCount = applications.filter((a) => !['hired', 'rejected'].includes(a.status)).length
    return { totalApplications, hiredCount, rejectedCount, pendingCount }
  }, [applications])

  const handleApply = async (jobId) => {
    const selectedCvId = selectedCvByJob[jobId] || primaryCv?.id || cvs?.[0]?.id
    if (!selectedCvId) {
      toast.error('Please upload or create a CV first')
      return
    }
    setApplyingJobId(jobId)
    try {
      await applicantAPI.applyJob(jobId, selectedCvId)
      toast.success('Application submitted')
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply')
    } finally {
      setApplyingJobId(null)
    }
  }

  const handleSetPrimaryCv = async (cvId) => {
    try {
      await cvAPI.setPrimary(cvId)
      toast.success('Primary CV updated')
      await fetchData()
    } catch (err) {
      toast.error('Failed to set primary CV')
    }
  }

  const handleDeleteCv = async (cvId) => {
    if (!window.confirm('Delete this CV?')) return
    try {
      await cvAPI.deleteCV(cvId)
      toast.success('CV deleted')
      await fetchData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete CV')
    }
  }

  const handleUploadCv = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const formData = new FormData()
    formData.append('cv_file', file)
    formData.append('is_primary', String(!primaryCv))

    setUploadingCv(true)
    try {
      await cvAPI.uploadCV(formData)
      toast.success('CV uploaded')
      await fetchData()
    } catch (err) {
      const resp = err.response?.data
      const message =
        resp?.cv_file?.[0] ||
        resp?.detail ||
        resp?.error ||
        (typeof resp === 'string' ? resp : null) ||
        'Failed to upload CV'
      toast.error(message)
    } finally {
      setUploadingCv(false)
    }
  }

  const handleTemplateChange = (e) => {
    const { name, value, type, checked } = e.target
    setTemplate((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const splitLines = (value) => value.split('\n').map((v) => v.trim()).filter(Boolean)
  const splitComma = (value) => value.split(',').map((v) => v.trim()).filter(Boolean)
  const updateExperienceItem = (index, field, value) => {
    setTemplate((prev) => {
      const next = [...(prev.work_experience || [])]
      if (!next[index]) next[index] = { organization: '', position: '', date_range: '', responsibilities: '' }
      next[index] = { ...next[index], [field]: value }
      return { ...prev, work_experience: next }
    })
  }
  const addExperienceItem = () => {
    setTemplate((prev) => ({
      ...prev,
      work_experience: [...(prev.work_experience || []), { organization: '', position: '', date_range: '', responsibilities: '' }],
    }))
  }
  const removeExperienceItem = (index) => {
    setTemplate((prev) => ({
      ...prev,
      work_experience: (prev.work_experience || []).filter((_, i) => i !== index),
    }))
  }
  const cleanExperienceItems = (items) => {
    return (items || [])
      .map((item) => ({
        organization: (item.organization || '').trim(),
        position: (item.position || '').trim(),
        date_range: (item.date_range || '').trim(),
        responsibilities: (item.responsibilities || '').trim(),
      }))
      .filter((item) => item.organization || item.date_range || item.responsibilities)
  }
  const updateTrainingItem = (index, field, value) => {
    setTemplate((prev) => {
      const next = [...(prev.training_workshop || [])]
      if (!next[index]) next[index] = { institution: '', date_range: '', duties: '' }
      next[index] = { ...next[index], [field]: value }
      return { ...prev, training_workshop: next }
    })
  }
  const addTrainingItem = () => {
    setTemplate((prev) => ({
      ...prev,
      training_workshop: [...(prev.training_workshop || []), { institution: '', date_range: '', duties: '' }],
    }))
  }
  const removeTrainingItem = (index) => {
    setTemplate((prev) => ({
      ...prev,
      training_workshop: (prev.training_workshop || []).filter((_, i) => i !== index),
    }))
  }
  const cleanTrainingItems = (items) => {
    return (items || [])
      .map((item) => ({
        institution: (item.institution || '').trim(),
        date_range: (item.date_range || '').trim(),
        duties: (item.duties || '').trim(),
      }))
      .filter((item) => item.institution || item.date_range || item.duties)
  }

  const handleCreateTemplateCv = async (e) => {
    e.preventDefault()
    setCreatingTemplate(true)
    try {
      await cvAPI.createFromTemplate({
        full_name: template.full_name,
        surname: template.surname,
        given_names: template.given_names,
        sex: template.sex,
        marital_status: template.marital_status,
        date_of_birth: template.date_of_birth,
        nationality: template.nationality,
        email: template.email,
        phone_number: template.phone_number,
        alt_phone: template.alt_phone,
        location: template.location,
        summary: template.summary,
        skills: splitComma(template.skills),
        education: splitLines(template.education),
        highest_education: template.highest_education,
        work_experience: cleanExperienceItems(template.work_experience),
        training_workshop: cleanTrainingItems(template.training_workshop),
        total_years_experience: Number(template.total_years_experience || 0),
        certifications: splitComma(template.certifications),
        languages: splitComma(template.languages),
        hobbies: template.hobbies,
        referees: splitLines(template.referees),
        additional_details: template.additional_details,
        declaration: template.declaration,
        is_primary: template.is_primary,
      })
      toast.success('Template CV created')
      setShowTemplateBuilder(false)
      await fetchData()
    } catch (err) {
      toast.error('Failed to create template CV')
    } finally {
      setCreatingTemplate(false)
    }
  }

  const handleSendHelpRequest = async (e) => {
    e.preventDefault()
    if (!helpApplicationId) {
      toast.error('Select an application first')
      return
    }
    if (!helpMessage.trim()) {
      toast.error('Write your help message')
      return
    }
    setSendingHelp(true)
    try {
      await applicantAPI.requestHelp(helpApplicationId, helpMessage.trim())
      toast.success('Help request sent to HR')
      setHelpMessage('')
      await fetchNotifications()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send help request')
    } finally {
      setSendingHelp(false)
    }
  }

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />

      <div className="mx-auto max-w-7xl rounded-3xl border border-white/70 bg-white/80 p-4 shadow-2xl sm:p-6">
        <div className="mx-auto max-w-6xl space-y-8">
        <section className="panel-hero rounded-2xl p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Candidate Space</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Applicant Dashboard</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">Track applications, manage CVs, and apply to open jobs.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/profile" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                Profile
              </Link>
              <Link to="/settings" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                Settings
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Applications</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.totalApplications}</p>
          </div>
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{stats.pendingCount}</p>
          </div>
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Hired</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.hiredCount}</p>
          </div>
          <div className="panel-card rounded-xl p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.rejectedCount}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="panel-card rounded-2xl p-6 shadow-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Open Jobs</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">{jobs.length} available</span>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Upload size={14} />
                  {uploadingCv ? 'Uploading...' : 'Upload CV'}
                  <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleUploadCv} disabled={uploadingCv} />
                </label>
                <button
                  type="button"
                  onClick={() => setShowTemplateBuilder(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  Create CV Template
                </button>
              </div>
            </div>
            {jobs.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                No jobs available right now.
              </p>
            ) : (
              <ul className="space-y-3">
                {jobs.slice(0, 8).map((job) => {
                  const existingApplication = applicationsByJobId.get(String(job.id))
                  const canReapply = Boolean(existingApplication?.reapply_allowed)
                  const alreadyApplied = Boolean(existingApplication) && !canReapply
                  const selectedCvId = selectedCvByJob[job.id] || primaryCv?.id || cvs?.[0]?.id || ''
                  return (
                    <li key={job.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{job.job_title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Company: {job.hr_company_name || 'Company not set'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{job.location || 'Location not set'} | {job.job_type || 'Type not set'}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Maximum people needed: {job.max_people_needed ?? 'Not specified'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Education: {job.required_education || 'Not specified'} | Experience: {job.required_experience || 'Not specified'}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Salary: {job.salary_min || job.salary_max ? `${job.salary_min || '-'} - ${job.salary_max || '-'}` : 'Not specified'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                            {job.job_description || 'No job description provided.'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <select
                            value={selectedCvId}
                            onChange={(e) => setSelectedCvByJob((prev) => ({ ...prev, [job.id]: e.target.value }))}
                            disabled={alreadyApplied || cvs.length === 0}
                            className="min-w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          >
                            {cvs.length === 0 ? (
                              <option value="">No CV available</option>
                            ) : (
                              cvs.map((cv) => (
                                <option key={cv.id} value={cv.id}>
                                  {getCvOptionLabel(cv)}{cv.is_primary ? ' - Primary' : ''}
                                </option>
                              ))
                            )}
                          </select>
                          <button
                            type="button"
                            disabled={alreadyApplied || applyingJobId === job.id || !selectedCvId}
                            onClick={() => handleApply(job.id)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-80 dark:bg-slate-100 dark:text-slate-900"
                          >
                            <Send size={14} />
                            {alreadyApplied ? 'Applied' : applyingJobId === job.id ? 'Applying...' : canReapply ? 'Reapply' : 'Apply'}
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <aside className="panel-card rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Your CVs</h3>
              {cvs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No CV uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {cvs.map((cv) => (
                    <li key={cv.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                      <span className="truncate pr-2 text-slate-700 dark:text-slate-200">{getCvDisplayName(cv)}</span>
                      <div className="flex items-center gap-3">
                        {cv.cv_file && (
                          <a
                            href={getCvViewUrl(cv.cv_file)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:text-blue-800"
                          >
                            View
                          </a>
                        )}
                        {cv.is_primary ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 size={14} />
                            Primary
                          </span>
                        ) : (
                          <button className="text-blue-700 hover:text-blue-800" onClick={() => handleSetPrimaryCv(cv.id)}>Set primary</button>
                        )}
                        <button
                          type="button"
                          className="text-rose-700 hover:text-rose-800"
                          onClick={() => handleDeleteCv(cv.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <aside className="panel-card rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Applications</h3>
              {recentApplications.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No applications yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentApplications.map((app) => (
                    <li key={app.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {app.job_title || 'Application'}
                      </p>
                      <div className="mt-1">
                        <span className={`status-chip ${getStatusClass(app.status)}`}>{app.status || 'applied'}</span>
                      </div>
                      {app.reapply_allowed && (
                        <p className="mt-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                          HR opened permission: You can apply again for this job from Open Jobs.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <aside className="panel-card rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
                <Link to="/notifications" className="text-sm font-semibold text-blue-700 hover:text-blue-800">View all</Link>
              </div>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentNotifications.map((note) => (
                    <li key={note.id} className={`rounded-lg border p-3 text-sm ${
                      note.is_read ? 'border-slate-200 dark:border-slate-700' : 'border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20'
                    }`}>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{note.title || 'Notification'}</p>
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{note.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <aside className="panel-card rounded-2xl p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">FAQs & Help</h3>
              </div>
              <div className="space-y-3">
                {faqItems.map((item) => (
                  <details key={item.q} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-800 dark:text-slate-100">{item.q}</summary>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.a}</p>
                  </details>
                ))}
              </div>

              <form onSubmit={handleSendHelpRequest} className="mt-4 space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ask HR for help</p>
                <select
                  value={helpApplicationId}
                  onChange={(e) => setHelpApplicationId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.job_title || `Application ${app.id?.slice?.(0, 8) || app.id}`} ({app.status || 'applied'})
                    </option>
                  ))}
                </select>
                <textarea
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  rows={3}
                  placeholder="Write your question or issue to HR..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  disabled={sendingHelp}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                >
                  {sendingHelp ? 'Sending...' : 'Send to HR'}
                </button>
              </form>
            </aside>
          </div>
        </section>

        <section className="panel-card rounded-xl p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2"><Briefcase size={16} /> Browse jobs and apply instantly.</span>
            <span className="inline-flex items-center gap-2"><FileText size={16} /> Set one CV as primary before applying.</span>
            <span className="inline-flex items-center gap-2"><Bell size={16} /> Decision messages appear in Notifications.</span>
          </div>
        </section>
        </div>
      </div>

      {showTemplateBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create CV Template</h3>
              <button className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300" onClick={() => setShowTemplateBuilder(false)}>Close</button>
            </div>
            <form onSubmit={handleCreateTemplateCv} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input name="full_name" value={template.full_name} onChange={handleTemplateChange} placeholder="Full name" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" required />
                <input name="surname" value={template.surname} onChange={handleTemplateChange} placeholder="Surname" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="given_names" value={template.given_names} onChange={handleTemplateChange} placeholder="Other names" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="sex" value={template.sex} onChange={handleTemplateChange} placeholder="Sex" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="marital_status" value={template.marital_status} onChange={handleTemplateChange} placeholder="Marital status" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="date_of_birth" value={template.date_of_birth} onChange={handleTemplateChange} placeholder="Date of birth (e.g., 13 September 2002)" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="nationality" value={template.nationality} onChange={handleTemplateChange} placeholder="Nationality" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="email" type="email" value={template.email} onChange={handleTemplateChange} placeholder="Email" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" required />
                <input name="phone_number" value={template.phone_number} onChange={handleTemplateChange} placeholder="Phone number" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="alt_phone" value={template.alt_phone} onChange={handleTemplateChange} placeholder="Alternate phone" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
                <input name="location" value={template.location} onChange={handleTemplateChange} placeholder="Location" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </div>

              <textarea name="summary" value={template.summary} onChange={handleTemplateChange} placeholder="Professional summary" rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <input name="skills" value={template.skills} onChange={handleTemplateChange} placeholder="Skills (comma separated)" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <textarea name="education" value={template.education} onChange={handleTemplateChange} placeholder="Education (one entry per line)" rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />

              <div className="grid gap-4 sm:grid-cols-2">
                <select name="highest_education" value={template.highest_education} onChange={handleTemplateChange} className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="high_school">High School</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                </select>
                <input name="total_years_experience" type="number" min="0" step="0.5" value={template.total_years_experience} onChange={handleTemplateChange} placeholder="Total years of experience" className="rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Work Experience</p>
                  <button
                    type="button"
                    onClick={addExperienceItem}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Add Entry
                  </button>
                </div>
                {(template.work_experience || []).length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add your work experience entries so they match the CV database structure.
                  </p>
                )}
                {(template.work_experience || []).map((item, idx) => (
                  <div key={`exp-${idx}`} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={item.organization || ''}
                        onChange={(e) => updateExperienceItem(idx, 'organization', e.target.value)}
                        placeholder="Organization / Company"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        value={item.position || ''}
                        onChange={(e) => updateExperienceItem(idx, 'position', e.target.value)}
                        placeholder="Position / Role"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        value={item.date_range || ''}
                        onChange={(e) => updateExperienceItem(idx, 'date_range', e.target.value)}
                        placeholder="Date range (e.g., Aug – Sept 2021)"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <textarea
                      value={item.responsibilities || ''}
                      onChange={(e) => updateExperienceItem(idx, 'responsibilities', e.target.value)}
                      placeholder="Responsibilities / Duties"
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeExperienceItem(idx)}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Training & Workshop</p>
                  <button
                    type="button"
                    onClick={addTrainingItem}
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Add Entry
                  </button>
                </div>
                {(template.training_workshop || []).length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add training or workshop entries.
                  </p>
                )}
                {(template.training_workshop || []).map((item, idx) => (
                  <div key={`train-${idx}`} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={item.institution || ''}
                        onChange={(e) => updateTrainingItem(idx, 'institution', e.target.value)}
                        placeholder="Institute / Organization"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                      <input
                        value={item.date_range || ''}
                        onChange={(e) => updateTrainingItem(idx, 'date_range', e.target.value)}
                        placeholder="Date range (e.g., Aug – Sept 2021)"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <textarea
                      value={item.duties || ''}
                      onChange={(e) => updateTrainingItem(idx, 'duties', e.target.value)}
                      placeholder="Training / Duties"
                      rows={2}
                      className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeTrainingItem(idx)}
                        className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <input name="certifications" value={template.certifications} onChange={handleTemplateChange} placeholder="Certifications (comma separated)" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <input name="languages" value={template.languages} onChange={handleTemplateChange} placeholder="Languages (comma separated)" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <input name="hobbies" value={template.hobbies} onChange={handleTemplateChange} placeholder="Hobbies" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <textarea name="referees" value={template.referees} onChange={handleTemplateChange} placeholder="Referees (one entry per line: name | role | contact)" rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <textarea name="additional_details" value={template.additional_details} onChange={handleTemplateChange} placeholder="Additional details (optional)" rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              <textarea name="declaration" value={template.declaration} onChange={handleTemplateChange} placeholder="Declaration (optional)" rows={3} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" name="is_primary" checked={template.is_primary} onChange={handleTemplateChange} className="h-4 w-4" />
                Set as primary CV
              </label>

              <button type="submit" disabled={creatingTemplate} className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900">
                {creatingTemplate ? 'Creating...' : 'Create CV'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApplicantDashboard
