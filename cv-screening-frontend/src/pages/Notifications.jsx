import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { notificationAPI } from '../services/api'
import useAuthStore from '../store/authStore'

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const Notifications = () => {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState('')
  const [deleting, setDeleting] = useState('')
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [selected, setSelected] = useState([])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await notificationAPI.getNotifications()
      setNotifications(normalizeList(response.data))
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id) => {
    setMarking(id)
    try {
      await notificationAPI.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      toast.error('Failed to mark notification as read')
    } finally {
      setMarking('')
    }
  }

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === notifications.length) {
      setSelected([])
      return
    }
    setSelected(notifications.map((n) => n.id))
  }

  const deleteOne = async (id) => {
    setDeleting(id)
    try {
      await notificationAPI.deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setSelected((prev) => prev.filter((item) => item !== id))
      toast.success('Notification deleted')
    } catch {
      toast.error('Failed to delete notification')
    } finally {
      setDeleting('')
    }
  }

  const deleteSelected = async () => {
    if (!selected.length) return
    setBulkDeleting(true)
    try {
      await Promise.all(selected.map((id) => notificationAPI.deleteNotification(id)))
      setNotifications((prev) => prev.filter((n) => !selected.includes(n.id)))
      setSelected([])
      toast.success('Selected notifications deleted')
    } catch {
      toast.error('Failed to delete selected notifications')
    } finally {
      setBulkDeleting(false)
    }
  }

  if (loading) return <div className="p-8">Loading notifications...</div>
  const backPath = user?.role === 'hr' ? '/hr-dashboard' : '/applicant-dashboard'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e9f2ff] px-4 py-8 sm:px-8 dark:bg-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/70 blur-sm" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full bg-blue-400/40 blur-sm" />
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="panel-card rounded-2xl p-6 shadow-sm backdrop-blur sm:p-8 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Inbox</p>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
            </div>
            <Link to={backPath} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              Back to Dashboard
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/40">
              <Bell className="mx-auto mb-2 text-slate-400" size={24} />
              <p className="font-medium text-slate-700 dark:text-slate-200">No notifications yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={selected.length > 0 && selected.length === notifications.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Select all
                </label>
                <button
                  type="button"
                  onClick={deleteSelected}
                  disabled={!selected.length || bulkDeleting}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Trash2 size={14} />
                  {bulkDeleting ? 'Deleting...' : `Delete selected (${selected.length})`}
                </button>
              </div>

              <ul className="space-y-3">
              {notifications.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-xl border p-4 ${
                    item.is_read
                      ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                      : 'border-blue-200 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title || 'Notification'}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{item.message}</p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!item.is_read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(item.id)}
                          disabled={marking === item.id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <CheckCheck size={14} />
                          {marking === item.id ? 'Saving...' : 'Mark read'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteOne(item.id)}
                        disabled={deleting === item.id || bulkDeleting}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <Trash2 size={14} />
                        {deleting === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

export default Notifications
