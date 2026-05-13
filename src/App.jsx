import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import CoachDashboard from './pages/coach/Dashboard'
import ClientHome from './pages/client/Home'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      console.log('Profile chargé:', data)
    setProfile(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={
        !session ? <Login /> : <Navigate to={profile?.role === 'coach' ? '/coach' : '/app'} />
      } />
      <Route path="/coach/*" element={
        session && profile?.role === 'coach' ? <CoachDashboard /> : <Navigate to="/login" />
      } />
      <Route path="/app/*" element={
        session && profile?.role === 'client' ? <ClientHome /> : <Navigate to="/login" />
      } />
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Routes>
  )
}