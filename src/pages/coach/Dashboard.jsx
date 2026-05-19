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
    const [stats, setStats] = useState({ clients: 0, avgIS: null, bilans: 0 })
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)
  
    useEffect(() => { fetchStats() }, [])
  
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: clients } = await supabase
        .from('clients')
        .select(`*, questionnaire_responses(is_score, completed_at)`)
        .eq('coach_id', user.id)
  
      if (!clients) { setLoading(false); return }
  
      // IS moyen
      const clientsWithIS = clients.filter(c => c.questionnaire_responses?.length > 0)
      const avgIS = clientsWithIS.length > 0
        ? Math.round(clientsWithIS.reduce((sum, c) => {
            const sorted = [...c.questionnaire_responses].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
            return sum + sorted[0].is_score
          }, 0) / clientsWithIS.length)
        : null
  
      // Alertes — clientes avec IS en baisse
      const alertList = clients.filter(c => {
        const responses = c.questionnaire_responses || []
        if (responses.length < 2) return false
        const sorted = [...responses].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        return sorted[0].is_score < sorted[1].is_score
      })
  
      setStats({ clients: clients.length, avgIS, bilans: 0 })
      setAlerts(alertList)
      setLoading(false)
    }
  
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Vue globale de ton activité</p>
        </div>
  
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Clientes actives', value: stats.clients, sub: 'Total', color: 'text-gray-800' },
            { label: 'IS moyen', value: stats.avgIS ?? '—', sub: stats.avgIS ? 'Sur toutes les clientes' : 'Pas encore de questionnaire', color: 'text-rose-500' },
            { label: 'Assiduité globale', value: '—', sub: 'Bientôt disponible', color: 'text-gray-800' },
            { label: 'Alertes IS', value: alerts.length, sub: 'Clientes en baisse', color: alerts.length > 0 ? 'text-amber-600' : 'text-gray-800' },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
  
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-800">Alertes IS</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${alerts.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
              {alerts.length} alerte{alerts.length !== 1 ? 's' : ''}
            </span>
          </div>
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Chargement...</div>
          ) : alerts.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              Aucune alerte pour le moment. 🎉
            </div>
          ) : (
            alerts.map(c => {
              const sorted = [...c.questionnaire_responses].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
              const delta = sorted[0].is_score - sorted[1].is_score
              return (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-medium shrink-0">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-gray-400">
                      IS : <span className="font-medium text-rose-500">{sorted[0].is_score}</span>
                      <span className="text-red-400 ml-1">↓{delta}</span> vs semaine précédente
                    </p>
                  </div>
                  <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                    {c.current_phase?.replace('_', ' ')} · S{c.current_week}
                  </span>
                </div>
              )
            })
          )}
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