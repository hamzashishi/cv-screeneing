import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient

// Auth API calls
export const authAPI = {
  register: (data) => apiClient.post('/users/register/', data),
  login: (email, password) => apiClient.post('/users/login/', { email, password }),
  verifyOtp: (email, otp) => apiClient.post('/users/verify_otp/', { email, otp }),
  resendOtp: (email) => apiClient.post('/users/resend_otp/', { email }),
  forgotPassword: (email) => apiClient.post('/users/forgot_password/', { email }),
  resetPassword: (email, otp, new_password, confirm_password) =>
    apiClient.post('/users/reset_password/', { email, otp, new_password, confirm_password }),
}

// User API calls
export const userAPI = {
  getProfile: () => apiClient.get('/users/profile/'),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      return apiClient.patch('/users/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return apiClient.patch('/users/profile/', data)
  },
}

// HR API calls
export const hrAPI = {
  getProfile: () => apiClient.get('/hr/my_profile/'),
  updateProfile: (id, data) => apiClient.patch(`/hr/${id}/`, data),
  createJob: (data) => apiClient.post('/jobs/', data),
  updateScreeningCriteria: (jobId, data) => apiClient.patch(`/jobs/${jobId}/screening_criteria/`, data),
  getJobs: (params) => apiClient.get('/jobs/', { params }),
  updateJob: (id, data) => apiClient.patch(`/jobs/${id}/`, data),
  deleteJob: (id) => apiClient.delete(`/jobs/${id}/`),
  getApplicants: (jobId) => apiClient.get(`/jobs/${jobId}/applicants/`),
  getApplications: () => apiClient.get('/applications/'),
  rankCandidates: (jobId) => apiClient.post(`/jobs/${jobId}/rank_candidates/`),
  makeDecision: (appId, decision, notes) => apiClient.post(`/applications/${appId}/make_decision/`, { decision, notes }),
  allowReapply: (appId) => apiClient.post(`/applications/${appId}/allow_reapply/`),
}

// Admin API calls
export const adminAPI = {
  getPendingHRs: () => apiClient.get('/admin-approvals/?status=pending'),
  getApprovedHRs: () => apiClient.get('/admin-approvals/?status=approved'),
  approveHR: (hrId) => apiClient.post(`/admin-approvals/${hrId}/approve/`),
  rejectHR: (hrId) => apiClient.post(`/admin-approvals/${hrId}/reject/`),
}

// Applicant API calls
export const applicantAPI = {
  getProfile: () => apiClient.get('/applicants/my_profile/'),
  updateProfile: (id, data) => apiClient.patch(`/applicants/${id}/`, data),
  getJobs: (params) => apiClient.get('/jobs/', { params }),
  applyJob: (jobId, cvId) => apiClient.post('/applications/', { job: jobId, cv: cvId }),
  getApplications: () => apiClient.get('/applications/'),
  requestHelp: (applicationId, message) => apiClient.post(`/applications/${applicationId}/request_help/`, { message }),
}

// CV API calls
export const cvAPI = {
  uploadCV: (formData) => apiClient.post('/cvs/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createFromTemplate: (data) => apiClient.post('/cvs/create_from_template/', data),
  getCVs: () => apiClient.get('/cvs/'),
  setPrimary: (cvId) => apiClient.post(`/cvs/${cvId}/set_primary/`),
  deleteCV: (cvId) => apiClient.delete(`/cvs/${cvId}/`),
}

// Notification API calls
export const notificationAPI = {
  getNotifications: () => apiClient.get('/notifications/'),
  getUnread: () => apiClient.get('/notifications/unread/'),
  markAsRead: (notificationId) => apiClient.post(`/notifications/${notificationId}/mark_as_read/`),
  deleteNotification: (notificationId) => apiClient.delete(`/notifications/${notificationId}/`),
  replyHelp: (notificationId, message) => apiClient.post(`/notifications/${notificationId}/reply_help/`, { message }),
}
