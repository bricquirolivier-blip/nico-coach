import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ClientHome({ client, profile, onLogout }) {
  const [todayAssignment, setTodayAssignment] = useState(null)
  const [latestIS, setLatestIS] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (client) fetchData()
  }, [client])

  async function fetchData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data: todayData } = await supabase
        .from('plan_assignments')
        .select('*, training_plans(*, exercises(*))')
        .eq('client_id', client.id)
        .eq('scheduled_date', today)
        .maybeSingle()
      setTodayAssignment(todayData)

      const { data: isData } = await supabase
        .from('questionnaire_responses')
        .select('is_score, dominant_profile, completed_at')
        .eq('client_id', client.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLatestIS(isData)
    } catch (err) {
      console.error('Erreur ClientHome:', err)
    } finally {
      setLoading(false)
    }
  }

  const weekActions = [
    { text: 'Manger 3 repas fixes', done: false },
    { text: 'Lumière naturelle le matin', done: false },
    { text: 'Pas de café après 14h', done: false },
    { text: '10 min d\'étirements avant dormir', done: false },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col">
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400">Bonjour {profile?.first_name || 'toi'} 👋</p>
            <h1 className="text-xl font-medium text-gray-800 mt-0.5">
              Phase {client?.current_phase?.replace('phase_', '')} · Semaine {client?.current_week}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {client?.dominant_profile && (
              <span className="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded-full">
                {client.dominant_profile}
              </span>
            )}
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 px-2 py-1 rounded-lg hover:bg-gray-50"
            >
              Sortir
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">

        {/* IS Score */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#FDE8EF" strokeWidth="6"/>
              <circle
                cx="32" cy="32" r="26" fill="none"
                stroke="#D4537E" strokeWidth="6"
                strokeDasharray={`${(latestIS?.is_score || 0) * 1.634} 163.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-medium text-rose-500 leading-none">
                {latestIS?.is_score || '—'}
              </span>
              <span className="text-xs text-gray-400">IS</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Indice de stabilisation</p>
            {latestIS ? (
              <p className="text-sm text-gray-700">
                Dernier score : <span className="font-medium text-rose-500">{latestIS.is_score}/100</span>
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">Complète ton premier questionnaire !</p>
                <button
                  onClick={() => navigate('/app/progress')}
                  className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg"
                >
                  Commencer →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions de la semaine */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3">Actions de la semaine</p>
          <div className="flex flex-col gap-2.5">
            {weekActions.map((action, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  action.done ? 'bg-teal-500 border-teal-500' : 'border-gray-200'
                }`}>
                  {action.done && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`text-sm ${action.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {action.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Séance du jour */}
        {todayAssignment ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full opacity-60" />
            <p className="text-xs text-gray-400 mb-1">Séance du jour</p>
            <p className="text-lg font-medium text-gray-800 mb-1">
              {todayAssignment.training_plans?.title}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              {todayAssignment.training_plans?.duration_min} min
            </p>
            {todayAssignment.completed ? (
              <div className="flex items-center gap-2 text-teal-600">
                <span>✓</span>
                <span className="text-sm font-medium">Séance complétée !</span>
              </div>
            ) : (
              <button
                onClick={() => navigate('/app/training')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Commencer la séance →
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Séance du jour</p>
            <p className="text-sm text-gray-400">Aucune séance planifiée aujourd'hui 🌿</p>
          </div>
        )}

        {/* Activité recommandée */}
        <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 flex items-center gap-3">
          <span className="text-2xl">🚶‍♀️</span>
          <div>
            <p className="text-sm font-medium text-teal-800">Activité recommandée</p>
            <p className="text-xs text-teal-600 mt-0.5">Marcher 30 min à allure douce aujourd'hui</p>
          </div>
        </div>

        {/* Bilan semaine */}
        <button
          onClick={() => navigate('/app/progress')}
          className="w-full bg-white border border-gray-200 hover:border-rose-300 text-gray-700 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          📋 Faire mon bilan de la semaine
        </button>

      </div>
    </div>
  )
}