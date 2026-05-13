import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function formatDate(date) {
  return date.toISOString().split('T')[0]
}

function formatDateFr(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const intensityColors = {
  very_low: 'bg-teal-50 text-teal-700',
  low: 'bg-blue-50 text-blue-700',
  moderate: 'bg-amber-50 text-amber-700',
  high: 'bg-rose-50 text-rose-700',
}

const intensityLabels = {
  very_low: 'Très faible',
  low: 'Faible',
  moderate: 'Modérée',
  high: 'Élevée',
}

export default function Programme() {
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [clients, setClients] = useState([])
  const [plans, setPlans] = useState([])
  const [assignments, setAssignments] = useState([])
  const [selectedClient, setSelectedClient] = useState('all')
  const [showModal, setShowModal] = useState(null) // { date, clientId }
  const [selectedPlan, setSelectedPlan] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  useEffect(() => { fetchAssignments() }, [weekStart, selectedClient])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: clientsData }, { data: plansData }] = await Promise.all([
      supabase.from('clients').select('*').eq('coach_id', user.id),
      supabase.from('training_plans').select('*').eq('coach_id', user.id),
    ])
    setClients(clientsData || [])
    setPlans(plansData || [])
    setLoading(false)
  }

  async function fetchAssignments() {
    const from = formatDate(weekStart)
    const to = formatDate(addDays(weekStart, 6))
    let query = supabase
      .from('plan_assignments')
      .select('*, training_plans(*), clients(*)')
      .gte('scheduled_date', from)
      .lte('scheduled_date', to)
    const { data } = await query
    setAssignments(data || [])
  }

  async function handleAssign() {
    if (!selectedPlan || !showModal) return
    setSaving(true)
    await supabase.from('plan_assignments').insert({
      plan_id: selectedPlan,
      client_id: showModal.clientId,
      scheduled_date: showModal.date,
    })
    setSaving(false)
    setShowModal(null)
    setSelectedPlan('')
    fetchAssignments()
  }

  async function handleDelete(id) {
    await supabase.from('plan_assignments').delete().eq('id', id)
    fetchAssignments()
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const filteredClients = selectedClient === 'all' ? clients : clients.filter(c => c.id === selectedClient)

  const getAssignments = (clientId, date) =>
    assignments.filter(a => a.client_id === clientId && a.scheduled_date === formatDate(date))

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Programmation</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Semaine du {formatDateFr(weekStart)} au {formatDateFr(addDays(weekStart, 6))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedClient}
            onChange={e => setSelectedClient(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
          >
            <option value="all">Toutes les clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
            >←</button>
            <button
              onClick={() => setWeekStart(getMonday(new Date()))}
              className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs"
            >Aujourd'hui</button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
            >→</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-400">Chargement...</div>
      ) : clients.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
          Ajoute d'abord des clientes dans l'onglet Clientes.
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {/* Entêtes jours */}
          <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}>
            <div className="px-4 py-3 text-xs text-gray-400 font-medium border-r border-gray-100">Cliente</div>
            {weekDays.map((day, i) => {
              const isToday = formatDate(day) === formatDate(new Date())
              return (
                <div key={i} className={`px-3 py-3 text-center border-r border-gray-100 last:border-0 ${isToday ? 'bg-rose-50' : ''}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-rose-600' : 'text-gray-500'}`}>{DAYS[i]}</p>
                  <p className={`text-xs mt-0.5 ${isToday ? 'text-rose-400' : 'text-gray-400'}`}>{formatDateFr(day)}</p>
                </div>
              )
            })}
          </div>

          {/* Lignes clientes */}
          {filteredClients.map((client, ci) => (
            <div
              key={client.id}
              className={`grid border-b border-gray-50 last:border-0`}
              style={{ gridTemplateColumns: '140px repeat(7, 1fr)' }}
            >
              {/* Nom cliente */}
              <div className="px-4 py-3 border-r border-gray-100 flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
                  {client.first_name?.[0]}{client.last_name?.[0]}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{client.first_name}</p>
                  <p className="text-xs text-gray-400">{client.last_name}</p>
                </div>
              </div>

              {/* Cases jours */}
              {weekDays.map((day, di) => {
                const dayAssignments = getAssignments(client.id, day)
                const isToday = formatDate(day) === formatDate(new Date())
                return (
                  <div
                    key={di}
                    className={`px-2 py-2 border-r border-gray-50 last:border-0 min-h-16 ${isToday ? 'bg-rose-50/30' : ''}`}
                  >
                    {dayAssignments.map(a => (
                      <div
                        key={a.id}
                        className={`mb-1 px-2 py-1.5 rounded-lg text-xs ${intensityColors[a.training_plans?.intensity] || 'bg-gray-50 text-gray-600'} ${a.completed ? 'opacity-50 line-through' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-medium leading-tight">{a.training_plans?.title}</span>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="text-gray-400 hover:text-red-400 shrink-0 ml-1"
                          >×</button>
                        </div>
                        <p className="opacity-70 mt-0.5">{a.training_plans?.duration_min} min</p>
                      </div>
                    ))}
                    <button
                      onClick={() => { setShowModal({ date: formatDate(day), clientId: client.id }); setSelectedPlan('') }}
                      className="w-full text-gray-300 hover:text-rose-400 hover:bg-rose-50 rounded-lg py-1 text-lg transition-colors"
                    >+</button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Modal assignation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-800">Assigner une séance</h2>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {clients.find(c => c.id === showModal.clientId)?.first_name} · {showModal.date}
              </p>
              <select
                value={selectedPlan}
                onChange={e => setSelectedPlan(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              >
                <option value="">Choisir un plan...</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title} · {p.phase?.replace('_', ' ')} S{p.week_number} · {p.duration_min}min
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowModal(null)}
                className="text-sm text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-50"
              >Annuler</button>
              <button
                onClick={handleAssign}
                disabled={!selectedPlan || saving}
                className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Assignation...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}