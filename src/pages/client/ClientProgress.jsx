import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function ClientProgress({ client }) {
  const [responses, setResponses] = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (client) fetchData()
  }, [client])

  async function fetchData() {
    const [{ data: respData }, { data: checkinData }] = await Promise.all([
      supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('client_id', client.id)
        .order('completed_at', { ascending: false }),
      supabase
        .from('weekly_checkins')
        .select('*')
        .eq('client_id', client.id)
        .order('week_number', { ascending: false })
    ])
    setResponses(respData || [])
    setCheckins(checkinData || [])
    setLoading(false)
  }

  const latest = responses[0]
  const previous = responses[1]
  const delta = latest && previous ? latest.is_score - previous.is_score : null

  return (
    <div className="flex flex-col">
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-medium text-gray-800">Progression</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ton évolution semaine par semaine</p>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* IS actuel */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Indice de stabilisation</p>
            {delta !== null && (
              <span className={`text-xs font-medium ${delta >= 0 ? 'text-teal-600' : 'text-red-400'}`}>
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)} pts
              </span>
            )}
          </div>
          {latest ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-medium text-rose-500">{latest.is_score}</span>
                <span className="text-sm text-gray-400 mb-1">/100</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all duration-700"
                  style={{ width: `${latest.is_score}%` }}
                />
              </div>
              {/* Scores par catégorie */}
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: 'Stress & nerveux', value: latest.score_stress, color: 'bg-rose-400' },
                  { label: 'Nutrition', value: latest.score_nutrition, color: 'bg-amber-400' },
                  { label: 'Rythme biologique', value: latest.score_rythme, color: 'bg-teal-400' },
                  { label: 'Entraînement', value: latest.score_training, color: 'bg-blue-400' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span className="text-xs font-medium text-gray-700">{s.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Pas encore de questionnaire complété.</p>
          )}
        </div>

        {/* Historique poids */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="text-xs text-gray-400 mb-3">Évolution du poids</p>
          {checkins.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnée pour le moment.</p>
          ) : (
            <div className="flex items-end gap-2 h-20">
              {checkins.slice(0, 8).reverse().map((c, i) => {
                const max = Math.max(...checkins.map(x => x.weight_kg || 0))
                const min = Math.min(...checkins.map(x => x.weight_kg || 0))
                const range = max - min || 1
                const height = ((c.weight_kg - min) / range) * 60 + 20
                return (
                  <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{c.weight_kg}</span>
                    <div
                      className="w-full bg-rose-200 rounded-t-sm"
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-xs text-gray-400">S{c.week_number}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bouton questionnaire */}
        <button
          onClick={() => navigate('/app/questionnaire')}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl text-sm font-medium transition-colors"
        >
          📋 Faire le questionnaire de la semaine
        </button>

        {/* Historique IS */}
        {responses.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Historique IS</p>
            <div className="flex flex-col gap-2">
              {responses.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">Semaine {r.week_number}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${r.is_score}%` }} />
                    </div>
                    <span className="text-sm font-medium text-rose-500 w-8 text-right">{r.is_score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}