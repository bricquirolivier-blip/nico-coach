import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Clients from './Clients'
import Plans from './Plans'
import Programme from './Programme'
import Modules from './Modules'

function Sidebar({ onLogout }) {
  const nav = useNavigate()
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? 'bg-rose-50 text-rose-700 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
    }`

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-100">
        <p className="font-medium text-gray-800">Nico Coach</p>
        <p className="text-xs text-gray-400 mt-0.5">Interface coach</p>
      </div>
      <nav className="flex-1 p-2 flex flex-col gap-0.5">
        <p className="text-xs text-gray-400 px-3 py-2 mt-1">Principal</p>
        <NavLink to="/coach" end className={linkClass}>
          <span>📊</span> Dashboard
        </NavLink>
        <NavLink to="/coach/clients" className={linkClass}>
          <span>👥</span> Clientes
        </NavLink>
        <NavLink to="/coach/plans" className={linkClass}>
          <span>🏋️</span> Plans d'entraîn.
        </NavLink>
        <NavLink to="/coach/programme" className={linkClass}>
          <span>📅</span> Programmation
        </NavLink>
        <p className="text-xs text-gray-400 px-3 py-2 mt-2">Contenu</p>
        <NavLink to="/coach/modules" className={linkClass}>
          <span>🎬</span> Vidéos & modules
        </NavLink>
      </nav>
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>
  )
}

function DashboardHome() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-medium text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Vue globale de ton activité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Clientes actives', value: '—', sub: 'Ajoute tes premières clientes', color: 'text-gray-800' },
          { label: 'IS moyen', value: '—', sub: 'Après les premiers questionnaires', color: 'text-rose-500' },
          { label: 'Assiduité globale', value: '—', sub: 'Séances réalisées', color: 'text-gray-800' },
          { label: 'Bilans en attente', value: '—', sub: 'À valider', color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Alertes */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-800">Alertes & actions requises</h2>
          <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">0 nouvelles</span>
        </div>
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          Aucune alerte pour le moment.<br />Les alertes apparaîtront quand tes clientes seront actives.
        </div>
      </div>
    </div>
  )
}

export default function CoachDashboard() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-6">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="clients/*" element={<Clients />} />
          <Route path="plans/*" element={<Plans />} />
          <Route path="programme" element={<Programme />} />
          <Route path="modules" element={<Modules />} />
        </Routes>
      </main>
    </div>
  )
}