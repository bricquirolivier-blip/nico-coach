import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleReset(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Minimum 6 caractères'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 w-full max-w-sm p-8 text-center">
        <p className="text-2xl mb-3">✅</p>
        <h1 className="text-lg font-medium text-gray-800 mb-2">Mot de passe modifié !</h1>
        <p className="text-sm text-gray-400 mb-6">Tu peux maintenant te connecter.</p>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-rose-500 text-white py-2.5 rounded-lg text-sm font-medium"
        >
          Se connecter
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-rose-100 w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-medium text-gray-800">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-400 mt-1">Choisis ton nouveau mot de passe</p>
        </div>
        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nouveau mot de passe</label>
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
            {loading ? 'Modification...' : 'Modifier mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}