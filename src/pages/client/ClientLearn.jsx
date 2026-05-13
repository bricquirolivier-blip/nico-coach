import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ClientLearn({ client }) {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (client) fetchModules()
  }, [client])

  async function fetchModules() {
    const { data } = await supabase
      .from('content_modules')
      .select('*')
      .eq('status', 'published')
      .order('week_unlock')
      .order('position')
    setModules(data || [])
    setLoading(false)
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-medium text-gray-800">Comprendre</h1>
        <p className="text-xs text-gray-400 mt-0.5">Modules débloqués au fil des semaines</p>
      </div>
      <div className="p-5 flex flex-col gap-3">
        {loading && <div className="text-center py-8 text-sm text-gray-400">Chargement...</div>}
        {!loading && modules.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-400 border border-gray-100">
            Aucun module disponible pour le moment.
          </div>
        )}
        {!loading && modules.filter(m => m.week_unlock <= (client?.current_week || 1)).map(m => (
          <div key={m.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="h-28 bg-gradient-to-br from-rose-50 to-teal-50 flex items-center justify-center relative">
              <span className="text-4xl">🎬</span>
              <span className="absolute top-3 left-3 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                S{m.week_unlock}
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-gray-800">{m.title}</p>
            </div>
          </div>
        ))}
        {!loading && modules.filter(m => m.week_unlock > (client?.current_week || 1)).map(m => (
          <div key={m.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 opacity-50">
            <div className="h-20 bg-gray-50 flex items-center justify-center gap-2">
              <span className="text-gray-300 text-xl">🔒</span>
              <span className="text-xs text-gray-400">Disponible semaine {m.week_unlock}</span>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-gray-500">{m.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
