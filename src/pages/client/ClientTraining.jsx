import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function ClientTraining({ client }) {
  const [assignments, setAssignments] = useState([])
  const [activeSeance, setActiveSeance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (client) fetchAssignments()
  }, [client])

  async function fetchAssignments() {
    const monday = getMonday(new Date())
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    const { data } = await supabase
      .from('plan_assignments')
      .select('*, training_plans(*, exercises(*))')
      .eq('client_id', client.id)
      .gte('scheduled_date', monday.toISOString().split('T')[0])
      .lte('scheduled_date', sunday.toISOString().split('T')[0])
      .order('scheduled_date')
    setAssignments(data || [])
    setLoading(false)
  }

  async function completeSeance(assignmentId) {
    await supabase
      .from('plan_assignments')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', assignmentId)
    setActiveSeance(null)
    fetchAssignments()
  }

  function getMonday(date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d
  }

  const today = new Date().toISOString().split('T')[0]

  if (activeSeance) {
    const plan = activeSeance.training_plans
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
          <button onClick={() => setActiveSeance(null)} className="text-gray-400 text-sm mb-3">← Retour</button>
          <h1 className="text-xl font-medium text-gray-800">{plan.title}</h1>
          <p className="text-xs text-gray-400 mt-1">{plan.duration_min} min · {plan.exercises?.length} exercices</p>
        </div>

        {plan.notes && (
          <div className="mx-5 mt-4 bg-rose-50 border border-rose-100 rounded-xl p-4">
            <p className="text-xs text-rose-700 leading-relaxed">💬 {plan.notes}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 p-5">
          {plan.exercises?.sort((a,b) => a.position - b.position).map((ex, i) => (
            <div key={ex.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs flex items-center justify-center font-medium shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{ex.name}</p>
                  {ex.description && <p className="text-xs text-gray-400 mt-0.5">{ex.description}</p>}
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                      {ex.sets} séries
                    </span>
                    <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg">
                      {ex.reps_or_duration}
                    </span>
                    {ex.muscle_group && (
                      <span className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-lg">
                        {ex.muscle_group}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!activeSeance.completed && (
          <div className="fixed bottom-20 left-0 right-0 px-5">
            <button
              onClick={() => completeSeance(activeSeance.id)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-2xl text-sm font-medium transition-colors shadow-lg"
            >
              ✓ Terminer la séance
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-medium text-gray-800">Entraînement</h1>
        <p className="text-xs text-gray-400 mt-0.5">Semaine en cours</p>
      </div>

      <div className="p-5 flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Chargement...</div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            Aucune séance planifiée cette semaine.
          </div>
        ) : (
          assignments.map(a => {
            const isToday = a.scheduled_date === today
            const isPast = a.scheduled_date < today
            const date = new Date(a.scheduled_date + 'T12:00:00')
            return (
              <div
                key={a.id}
                className={`bg-white rounded-2xl p-4 border transition-colors ${
                  isToday ? 'border-rose-300' : 'border-gray-100'
                } ${a.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        a.completed ? 'bg-teal-400' :
                        isToday ? 'bg-rose-500' : 'bg-gray-200'
                      }`} />
                      <span className={`text-xs font-medium ${isToday ? 'text-rose-500' : 'text-gray-400'}`}>
                        {isToday ? "Aujourd'hui" : `${DAYS_FR[date.getDay()]} ${date.getDate()}`}
                      </span>
                      {a.completed && <span className="text-xs text-teal-600">✓ Complété</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-800">{a.training_plans?.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.training_plans?.duration_min} min · {a.training_plans?.exercises?.length} exercices
                    </p>
                  </div>
                  {!a.completed && (
                    <button
                      onClick={() => setActiveSeance(a)}
                      className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isToday
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isToday ? 'Démarrer' : 'Voir'}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}