import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import CoachDashboard from './pages/coach/Dashboard'
import ClientHome from './pages/client/Home'
import ResetPassword from './pages/ResetPassword'
import AcceptInvite from './pages/AcceptInvite'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setSession(null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password'
        return
      }
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setSession(s => s)
    setProfile(data)
  }

  // Attend que tout soit chargé
  if (session === undefined || (session && profile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/login" element={
        !session ? <Login /> : <Navigate to={profile?.role === 'coach' ? '/coach' : '/app'} replace />
      } />
      <Route path="/coach/*" element={
        !session ? <Navigate to="/login" replace /> :
        profile?.role === 'coach' ? <CoachDashboard /> :
        <Navigate to="/app" replace />
      } />
      <Route path="/app/*" element={
        !session ? <Navigate to="/login" replace /> :
        profile?.role === 'client' ? <ClientHome /> :
        <Navigate to="/coach" replace />
      } />
      <Route path="/" element={
        !session ? <Navigate to="/login" replace /> :
        <Navigate to={profile?.role === 'coach' ? '/coach' : '/app'} replace />
      } />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}