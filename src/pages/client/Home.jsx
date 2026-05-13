import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import ClientHome from './ClientHome'
import ClientTraining from './ClientTraining'
import ClientProgress from './ClientProgress'
import ClientLearn from './ClientLearn'
import ClientQuestionnaire from './ClientQuestionnaire'

function BottomNav() {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors ${
      isActive ? 'text-rose-500' : 'text-gray-400'
    }`

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center px-2 pb-2 z-50">
      <NavLink to="/app" end className={linkClass}>
        <span className="text-xl">🏠</span>
        <span>Accueil</span>
      </NavLink>
      <NavLink to="/app/training" className={linkClass}>
        <span className="text-xl">🏋️</span>
        <span>Entraînement</span>
      </NavLink>
      <NavLink to="/app/learn" className={linkClass}>
        <span className="text-xl">📖</span>
        <span>Comprendre</span>
      </NavLink>
      <NavLink to="/app/progress" className={linkClass}>
        <span className="text-xl">📈</span>
        <span>Progression</span>
      </NavLink>
    </nav>
  )
}

export default function Home() {
  const [profile, setProfile] = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)

      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setClient(clientData)
    } catch (err) {
      console.error('Erreur fetchData:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!client) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-8 text-center">
      <p className="text-gray-500 text-sm">Ton compte n'est pas encore lié à un programme.</p>
      <p className="text-gray-400 text-xs">Contacte ton coach pour activer ton accès.</p>
      <button onClick={handleLogout} className="text-xs text-rose-500 underline">Se déconnecter</button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Routes>
        <Route index element={<ClientHome client={client} profile={profile} onLogout={handleLogout} />} />
        <Route path="training" element={<ClientTraining client={client} />} />
        <Route path="learn" element={<ClientLearn client={client} />} />
        <Route path="progress" element={<ClientProgress client={client} />} />
        <Route path="questionnaire" element={<ClientQuestionnaire client={client} />} />
      </Routes>
      <BottomNav />
    </div>
  )
}