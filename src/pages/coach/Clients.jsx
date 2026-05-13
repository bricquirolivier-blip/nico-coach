import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [inviting, setInviting] = useState(null)
  const [invited, setInvited] = useState([])

  useEffect(() => { fetchClients() }, [])

  async function fetchClients() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function handleAddClient(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('clients').insert({
      ...form,
      coach_id: user.id,
      current_phase: 'phase_1',
      current_week: 1,
    })
    if (error) setError(error.message)
    else {
      setShowForm(false)
      setForm({ first_name: '', last_name: '', email: '' })
      fetchClients()
    }
    setSaving(false)
  }

  async function handleInvite(client) {
    setInviting(client.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-client`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: client.email,
            first_name: client.first_name,
            last_name: client.last_name,
          }),
        }
      )
      const result = await response.json()
      if (result.error) {
        alert('Erreur : ' + result.error)
      } else {
        setInvited(prev => [...prev, client.id])
      }
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setInviting(null)
  }

  const profileColors = {
    'Stress dominant': 'bg-rose-50 text-rose-700',
    'Nutrition': 'bg-amber-50 text-amber-700',
    'Surcharge': 'bg-blue-50 text-blue-700',
    'Biologique': 'bg-teal-50 text-teal-700',
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} cliente{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Nouvelle cliente
        </button>
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-white border border-rose-100 rounded-xl p-5">
          <h2 className="text-sm font-medium text-gray-800 mb-4">Ajouter une cliente</h2>
          <form onSubmit={handleAddClient} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Prénom</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nom</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
                required
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement...</div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Aucune cliente pour le moment.<br />Ajoute ta première cliente !
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Cliente</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Phase</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">IS actuel</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Profil</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Semaine</th>
                <th className="text-left text-xs text-gray-400 font-medium px-5 py-3">Invitation</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-gray-50 hover:bg-rose-50/30 transition-colors ${i === clients.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-medium">
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                      {c.current_phase?.replace('_', ' ')} · S{c.current_week}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-rose-500">—</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.dominant_profile ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${profileColors[c.dominant_profile] || 'bg-gray-50 text-gray-600'}`}>
                        {c.dominant_profile}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Pas encore de questionnaire</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    S{c.current_week}
                  </td>
                  <td className="px-5 py-3.5">
                    {invited.includes(c.id) ? (
                      <span className="text-xs text-teal-600 font-medium">✓ Invitée</span>
                    ) : (
                      <button
                        onClick={() => handleInvite(c)}
                        disabled={inviting === c.id}
                        className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {inviting === c.id ? 'Envoi...' : '✉️ Inviter'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}