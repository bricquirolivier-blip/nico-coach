import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function ExerciseRow({ exercise, index, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-5 text-center">{index + 1}</span>
      <div className="flex-1 grid grid-cols-3 gap-2">
        <input
          type="text"
          placeholder="Nom de l'exercice"
          value={exercise.name}
          onChange={e => onChange({ ...exercise, name: e.target.value })}
          className="col-span-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
        />
        <input
          type="text"
          placeholder="Groupe musculaire"
          value={exercise.muscle_group}
          onChange={e => onChange({ ...exercise, muscle_group: e.target.value })}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
        />
        <input
          type="text"
          placeholder="Description"
          value={exercise.description}
          onChange={e => onChange({ ...exercise, description: e.target.value })}
          className="col-span-3 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
        />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Séries</p>
          <input
            type="number"
            value={exercise.sets}
            onChange={e => onChange({ ...exercise, sets: parseInt(e.target.value) })}
            className="w-14 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-rose-300"
          />
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">Reps/durée</p>
          <input
            type="text"
            value={exercise.reps_or_duration}
            onChange={e => onChange({ ...exercise, reps_or_duration: e.target.value })}
            className="w-20 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-rose-300"
          />
        </div>
      </div>
      <button
        onClick={onDelete}
        className="text-gray-300 hover:text-red-400 transition-colors text-lg"
      >
        ×
      </button>
    </div>
  )
}

function PlanEditor({ plan, onSave, onCancel }) {
  const [form, setForm] = useState(plan || {
    title: '',
    phase: 'phase_1',
    week_number: 1,
    intensity: 'low',
    duration_min: 30,
    equipment: '',
    notes: '',
  })
  const [exercises, setExercises] = useState(plan?.exercises || [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function addExercise() {
    setExercises([...exercises, {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      muscle_group: '',
      sets: 3,
      reps_or_duration: '10',
      position: exercises.length + 1,
    }])
  }

  function updateExercise(index, updated) {
    const arr = [...exercises]
    arr[index] = updated
    setExercises(arr)
  }

  function deleteExercise(index) {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Le titre est requis'); return }
    setSaving(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()

    let planId = plan?.id
    if (plan?.id) {
      const { error } = await supabase
        .from('training_plans')
        .update({ ...form })
        .eq('id', plan.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase
        .from('training_plans')
        .insert({ ...form, coach_id: user.id })
        .select()
        .single()
      if (error) { setError(error.message); setSaving(false); return }
      planId = data.id
    }

    // Supprimer anciens exercices et réinsérer
    await supabase.from('exercises').delete().eq('plan_id', planId)
    if (exercises.length > 0) {
      const { error } = await supabase.from('exercises').insert(
        exercises.map((ex, i) => ({
          plan_id: planId,
          position: i + 1,
          name: ex.name,
          description: ex.description,
          muscle_group: ex.muscle_group,
          sets: ex.sets,
          reps_or_duration: ex.reps_or_duration,
        }))
      )
      if (error) { setError(error.message); setSaving(false); return }
    }

    setSaving(false)
    onSave()
  }

  const intensityLabels = {
    very_low: 'Très faible',
    low: 'Faible',
    moderate: 'Modérée',
    high: 'Élevée',
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div className="flex-1">
          <h1 className="text-xl font-medium text-gray-800">{plan ? 'Modifier le plan' : 'Nouveau plan'}</h1>
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
        {/* Infos plan */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
          <h2 className="text-sm font-medium text-gray-800">Informations</h2>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Titre de la séance</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Ex : Mobilité & Activation"
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
              <label className="text-xs text-gray-500 mb-1 block">Semaine</label>
              <input
                type="number"
                value={form.week_number}
                onChange={e => setForm({ ...form, week_number: parseInt(e.target.value) })}
                min="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Durée (min)</label>
              <input
                type="number"
                value={form.duration_min}
                onChange={e => setForm({ ...form, duration_min: parseInt(e.target.value) })}
                min="5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Intensité</label>
              <select
                value={form.intensity}
                onChange={e => setForm({ ...form, intensity: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              >
                {Object.entries(intensityLabels).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Matériel</label>
              <input
                type="text"
                value={form.equipment}
                onChange={e => setForm({ ...form, equipment: e.target.value })}
                placeholder="Ex : Tapis, haltères"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Note pour la cliente</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Conseils, précautions, objectif de la séance..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-300 resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Résumé */}
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 flex flex-col gap-3">
          <h2 className="text-sm font-medium text-rose-800">Résumé</h2>
          <div className="flex flex-col gap-2 text-xs text-rose-700">
            <div className="flex justify-between"><span>Exercices</span><span className="font-medium">{exercises.length}</span></div>
            <div className="flex justify-between"><span>Durée</span><span className="font-medium">{form.duration_min} min</span></div>
            <div className="flex justify-between"><span>Intensité</span><span className="font-medium">{intensityLabels[form.intensity]}</span></div>
            <div className="flex justify-between"><span>Phase</span><span className="font-medium">{form.phase.replace('_', ' ')}</span></div>
            <div className="flex justify-between"><span>Semaine</span><span className="font-medium">S{form.week_number}</span></div>
          </div>
        </div>
      </div>

      {/* Exercices */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-800">Exercices ({exercises.length})</h2>
          <button
            onClick={addExercise}
            className="text-sm text-rose-500 hover:text-rose-700 font-medium"
          >
            + Ajouter un exercice
          </button>
        </div>
        {exercises.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">
            Aucun exercice — clique sur "+ Ajouter un exercice"
          </div>
        ) : (
          exercises.map((ex, i) => (
            <ExerciseRow
              key={ex.id || i}
              exercise={ex}
              index={i}
              onChange={updated => updateExercise(i, updated)}
              onDelete={() => deleteExercise(i)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { fetchPlans() }, [])

  async function fetchPlans() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('training_plans')
      .select('*, exercises(*)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
    setPlans(data || [])
    setLoading(false)
  }

  async function deletePlan(id) {
    if (!confirm('Supprimer ce plan ?')) return
    await supabase.from('training_plans').delete().eq('id', id)
    fetchPlans()
  }

  const intensityLabels = {
    very_low: 'Très faible',
    low: 'Faible',
    moderate: 'Modérée',
    high: 'Élevée',
  }

  if (creating || editing) {
    return (
      <PlanEditor
        plan={editing}
        onSave={() => { setCreating(false); setEditing(null); fetchPlans() }}
        onCancel={() => { setCreating(false); setEditing(null) }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Plans d'entraînement</h1>
          <p className="text-sm text-gray-400 mt-0.5">{plans.length} plan{plans.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Créer un plan
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-gray-400">Chargement...</div>
      ) : plans.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-sm text-gray-400">
          Aucun plan pour le moment.<br />Crée ton premier plan d'entraînement !
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-rose-200 transition-colors">
              <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{plan.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {plan.phase?.replace('_', ' ')} · S{plan.week_number} · {plan.duration_min} min
                  </p>
                </div>
                <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                  {intensityLabels[plan.intensity]}
                </span>
              </div>
              <div className="px-5 py-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                  {plan.exercises?.length || 0} exercices
                </span>
                {plan.equipment && (
                  <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                    {plan.equipment}
                  </span>
                )}
              </div>
              <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
                <button
                  onClick={() => setEditing({ ...plan, exercises: plan.exercises || [] })}
                  className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  🗑 Supprimer
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setCreating(true)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400 hover:border-rose-200 hover:text-rose-400 transition-colors"
          >
            + Nouveau plan
          </button>
        </div>
      )}
    </div>
  )
}