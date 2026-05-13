import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Récupère le profil et redirige manuellement
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    
    window.location.href = profile?.role === 'coach' ? '/coach' : '/app'
  }

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  if (resetSent) return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 w-full max-w-sm p-8 text-center">
        <p className="text-3xl mb-3">📬</p>
        <h1 className="text-lg font-medium text-gray-800 mb-2">Email envoyé !</h1>
        <p className="text-sm text-gray-400 mb-6">
          Vérifie ta boîte mail (et tes spams) pour réinitialiser ton mot de passe.
        </p>
        <button
          onClick={() => { setResetSent(false); setResetMode(false) }}
          className="text-sm text-rose-500 underline"
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 w-full max-w-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-medium text-gray-800">Nico Coach</h1>
          <p className="text-sm text-gray-400 mt-1">Régulation féminine · Phase 1</p>
        </div>

        {resetMode ? (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <p className="text-sm text-gray-500 text-center">
              Entre ton email pour recevoir un lien de réinitialisation.
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300"
                placeholder="ton@email.com"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
            <button
              type="button"
              onClick={() => setResetMode(false)}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-rose-300"
                placeholder="ton@email.com"
                required
              />
            </div>
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
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="text-sm text-gray-400 hover:text-gray-600 text-center"
            >
              Mot de passe oublié ?
            </button>
          </form>
        )}
      </div>
    </div>
  )
}