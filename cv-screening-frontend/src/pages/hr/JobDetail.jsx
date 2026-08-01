import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import apiClient, { hrAPI } from '../../services/api'
import toast from 'react-hot-toast'

const JobDetail = () => {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    apiClient.get(`/jobs/${id}/`).then(res => { if (mounted) setJob(res.data) })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [id])

  const handleRank = async () => {
    try {
      await hrAPI.rankCandidates(id)
      toast.success('Ranking triggered')
    } catch (e) {
      toast.error('Failed to rank')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!job) return <div className="p-8">Job not found</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">{job.job_title}</h1>
      <div className="mb-4">{job.job_description}</div>
      <div className="mb-4">Location: {job.location}</div>
      <div className="mb-4">Maximum people needed: {job.max_people_needed ?? 'Not specified'}</div>
      <button onClick={handleRank} className="bg-primary text-white px-3 py-2 rounded">Rank Candidates</button>
    </div>
  )
}

export default JobDetail
