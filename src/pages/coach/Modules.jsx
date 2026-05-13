import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function ModuleForm({ module, onSave, onCancel }) {
  const [form, setForm] = useState(module || {
    title: '',
    phase: 'phase_1',
    week_unlock: 1,
    video_url: '',
    body_text: '',
    status: 'draft',
    position: 1,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    if (!form.title.trim()) { setError('Le titre est requis'); return }
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (module?.id) {
      const { error } = await supabase
        .from('content_modules')
        .update({ ...form })
        .eq('id', module.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase
        .from('content_modules')
        .insert({ ...form, coach_id: user.id })
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-800">
            {module ? 'Modifier le module' : 'Nouveau module'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-medium text-gray-800">Informations</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Titre du module</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex : Comprendre le cortisol et la prise de poids"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phase</label>
                <select
                  value={form.phase}
                  onChange={e => setForm({ ...form, phase: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
                >
                  <option value="phase_1">Phase 1</option>
                  <option value="phase_2">Phase 2</option>
                  <option value="phase_3">Phase 3</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Débloqué semaine</label>
                <input
                  type="number"
                  value={form.week_unlock}
                  onChange={e => setForm({ ...form, week_unlock: parseInt(e.target.value) })}
                  min="1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Position</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={e => setForm({ ...form, position: parseInt(e.target.value) })}
                  min="1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">URL de la vidéo</label>
              <input
                type="url"
                value={form.video_url}
                onChange={e => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtube.com/... ou https://vimeo.com/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              />
              <p className="text-xs text-gray-400 mt-1">YouTube, Vimeo, ou lien direct</p>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-800">Contenu texte</h2>
            <textarea
              value={form.body_text}
              onChange={e => setForm({ ...form, body_text: e.target.value })}
              placeholder="Texte pédagogique, explications, points clés du module..."
              rows={10}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300 resize-none"
            />
          </div>
        </div>

        {/* Panneau droit */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-sm font-medium text-gray-800">Statut</h2>
            <div className="flex flex-col gap-2">
              {[
                { value: 'draft', label: '✏️ Brouillon', desc: 'Non visible par les clientes' },
                { value: 'published', label: '✅ Publié', desc: 'Visible selon la semaine' },
              ].map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm({ ...form, status: s.value })}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    form.status === s.value
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{s.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-xl p-5">
            <h2 className="text-sm font-medium text-rose-800 mb-3">Résumé</h2>
            <div className="flex flex-col gap-2 text-xs text-rose-700">
              <div className="flex justify-between">
                <span>Phase</span>
                <span className="font-medium">{form.phase.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Débloqué à</span>
                <span className="font-medium">Semaine {form.week_unlock}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut</span>
                <span className="font-medium">{form.status === 'published' ? 'Publié' : 'Brouillon'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Modules() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [filterPhase, setFilterPhase] = useState('all')

  useEffect(() => { fetchModules() }, [])

  async function fetchModules() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('content_modules')
      .select('*')
      .eq('coach_id', user.id)
      .order('phase')
      .order('week_unlock')
      .order('position')
    setModules(data || [])
    setLoading(false)
  }

  async function toggleStatus(module) {
    const newStatus = module.status === 'published' ? 'draft' : 'published'
    await supabase
      .from('content_modules')
      .update({ status: newStatus })
      .eq('id', module.id)
    fetchModules()
  }

  async function deleteModule(id) {
    if (!confirm('Supprimer ce module ?')) return
    await supabase.from('content_modules').delete().eq('id', id)
    fetchModules()
  }

  const filtered = filterPhase === 'all'
    ? modules
    : modules.filter(m => m.phase === filterPhase)

  if (creating || editing) {
    return (
      <ModuleForm
        module={editing}
        onSave={() => { setCreating(false); setEditing(null); fetchModules() }}
        onCancel={() => { setCreating(false); setEditing(null) }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Vidéos & modules</h1>
          <p className="text-sm text-gray-400 mt-0.5">{modules.length} module{modules.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'Tous' },
              { value: 'phase_1', label: 'Phase 1' },
              { value: 'phase_2', label: 'Phase 2' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterPhase(f.value)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${
                  filterPhase === f.value
                    ? 'bg-white text-gray-800 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCreating(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            + Nouveau module
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
          Aucun module pour le moment.<br />Crée ton premier module pédagogique !
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-rose-200 transition-colors">
              {/* Thumbnail vidéo */}
              <div className="h-24 bg-gradient-to-br from-rose-50 to-teal-50 flex items-center justify-center relative">
                {m.video_url ? (
                  <a href={m.video_url} target="_blank" rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors">
                    ▶
                  </a>
                ) : (
                  <span className="text-gray-300 text-2xl">🎬</span>
                )}
                <span className={`absolute top-2 left-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.status === 'published'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {m.status === 'published' ? 'Publié' : 'Brouillon'}
                </span>
                <span className="absolute top-2 right-3 text-xs bg-white/80 text-gray-600 px-2 py-0.5 rounded-full">
                  {m.phase?.replace('_', ' ')} · S{m.week_unlock}
                </span>
              </div>

              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-medium text-gray-800">{m.title}</p>
                {m.body_text && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.body_text}</p>
                )}
              </div>

              <div className="px-4 py-3 flex gap-2">
                <button
                  onClick={() => setEditing(m)}
                  className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => toggleStatus(m)}
                  className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {m.status === 'published' ? '⬇️ Dépublier' : '✅ Publier'}
                </button>
                <button
                  onClick={() => deleteModule(m.id)}
                  className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => setCreating(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400 hover:border-rose-200 hover:text-rose-400 transition-colors min-h-40"
          >
            + Nouveau module
          </button>
        </div>
      )}
    </div>
  )
}