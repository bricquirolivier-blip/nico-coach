import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AcceptInvite() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase redirige avec les tokens dans le hash après vérification
    const hash = window.location.hash
    const params = new URLSearchParams(hash.replace('#', ''))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    console.log('Hash complet:', hash)
    console.log('Access token:', accessToken)
    console.log('Type:', type)

    if (accessToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        console.log('setSession result:', JSON.stringify({ data: data?.session?.user?.email, error }))
        if (error) setError('Lien invalide ou expiré : ' + error.message)
        else setReady(true)
      })
    } else {
      // Vérifie si une session existe déjà
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Session existante:', session?.user?.email)
        if (session) setReady(true)
        else setError('Lien invalide ou expiré. Demande à ton coach de renvoyer une invitation.')
      })
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Minimum 6 caractères'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else navigate('/app')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <p className="text-3xl mb-2">👋</p>
          <h1 className="text-xl font-medium text-gray-800">Bienvenue !</h1>
          <p className="text-sm text-gray-400 mt-1">Crée ton mot de passe pour accéder à ton programme</p>
        </div>

        {!ready && !error && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button onClick={() => navigate('/login')} className="text-xs text-rose-500 underline">
              Retour au login
            </button>
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300"
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Confirmer</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon compte →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}