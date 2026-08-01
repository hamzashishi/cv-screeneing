import React from 'react'
import { Link, NavLink } from 'react-router-dom'

const teamMembers = [
  {
    name: 'SAID HAMZA',
    role: 'Developer',
    regNo: '2023-04-12789',
    email: 'saidshishi919@gmail.com',
    phone: '+255615461963',
    bio: 'Built and coordinated core project implementation and integration.',
  },
  {
    name: 'VICTORY MANYALA',
    role: 'Developer',
    regNo: '2023-04-05600',
    email: 'victormanyala67@gmail.com',
    phone: '+25567992981',
    bio: 'Implemented frontend experience and interaction flows for usability.',
  },
  {
    name: 'THOMAS ANDREW',
    role: 'Developer',
    regNo: '2023-04-12103',
    email: 'thomas@gmail.com',
    phone: '+255673144200',
    bio: 'Implemented backend logic, APIs, and screening/ranking data flow.',
  },
]

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-emerald-100 px-4 py-10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-center gap-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider ${
              isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'
            }`
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/about-us"
          className={({ isActive }) =>
            `rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider ${
              isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-white/80 text-slate-700 hover:bg-white'
            }`
          }
        >
          About
        </NavLink>
      </div>
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">About The Project</p>
              <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-slate-100">Intelligent CV Screening and Ranking System</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                This final year project supports HR teams with secure onboarding, automated CV extraction, ranking, and recruitment decision support.
              </p>
            </div>
            <Link to="/" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white hover:opacity-90">
              Back To Login
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {teamMembers.map((member) => (
              <article key={member.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="mb-3 h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{member.name}</h2>
                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">{member.role}</p>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{member.bio}</p>
                <div className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <p>Reg No: {member.regNo}</p>
                  <p>Email: {member.email}</p>
                  <p>Phone: {member.phone}</p>
                </div>
              </article>
            ))}
          </div>

          <footer className="mt-8 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-5 text-sm leading-relaxed text-slate-700 dark:border-cyan-900/40 dark:bg-cyan-900/20 dark:text-slate-200">
            Intelligent CV Screening and Ranking System is a Final Year Project developed in 2026 at the College of Information and Communication Technologies (CoICT), University of Dar es Salaam. The system applies Artificial Intelligence and Natural Language Processing (NLP) to automate CV analysis, candidate ranking, and recruitment decision support, promoting efficiency, fairness, and data-driven hiring practices. The project is supervised by Dr. Salome Malo.
          </footer>
        </div>
      </div>
    </div>
  )
}

export default AboutUs
