import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const QUESTIONS = [
  {
    section: 'Stress & Système nerveux',
    emoji: '🧠',
    items: [
      { id: 'q1', text: "Temps d'endormissement", opts: ['< 15 min', '15–30 min', '30–60 min', '> 60 min'] },
      { id: 'q2', text: 'Réveils nocturnes', opts: ['Aucun', '1 réveil court', '2 réveils', 'Fréquents / insomnie'] },
      { id: 'q3', text: 'Fatigue au réveil', opts: ['En forme', 'Légère fatigue', 'Fatigue marquée', 'Épuisée malgré 7–8h'] },
      { id: 'q4', text: 'Irritabilité en journée', opts: ['Rare', 'Occasionnelle', 'Fréquente', 'Quotidienne'] },
      { id: 'q5', text: 'Difficulté à couper mentalement le soir', opts: ['Jamais', 'Parfois', 'Souvent', 'Toujours'] },
      { id: 'q6', text: 'Envie de sucre/gras en fin de journée', opts: ['Jamais', '1–2x/semaine', '3–4x/semaine', 'Presque tous les jours'] },
      { id: 'q7', text: 'Compulsions alimentaires', opts: ['Aucune', 'Occasionnelles', 'Hebdomadaires', 'Plusieurs fois/semaine'] },
    ]
  },
  {
    section: 'Nutrition structurelle',
    emoji: '🥗',
    items: [
      { id: 'q8', text: 'Nombre de repas par jour', opts: ['1–2', '3 fixes', '3 + grignotage', 'Irrégulier'] },
      { id: 'q9', text: 'Protéines estimées/jour', opts: ['< 60g', '60–80g', '80–100g', '> 100g'] },
      { id: 'q10', text: 'Légumes quotidiens', opts: ['< 1 portion', '1 portion', '2 portions', '3+ portions'] },
      { id: 'q11', text: 'Apport en eau', opts: ['< 1L', '1–1,5L', '1,5–2L', '> 2L'] },
      { id: 'q12', text: 'Restriction alimentaire fréquente ?', opts: ['Jamais', 'Par périodes', 'Souvent au régime', 'Restriction stricte actuelle'] },
    ]
  },
  {
    section: 'Rythme biologique',
    emoji: '🌙',
    items: [
      { id: 'q13', text: 'Heure de lever moyenne', opts: ['Avant 7h', '7h–8h', '8h–9h', 'Variable'] },
      { id: 'q14', text: 'Exposition à la lumière naturelle le matin', opts: ['Quotidienne', '3–4x/semaine', 'Rare', 'Jamais'] },
      { id: 'q15', text: 'Heure du dernier écran', opts: ['> 1h avant coucher', '30–60 min', 'Juste avant dormir', 'Dans le lit'] },
      { id: 'q16', text: 'Café après 14h', opts: ['Jamais', '1x/semaine', 'Plusieurs fois/semaine', 'Tous les jours'] },
    ]
  },
  {
    section: 'Entraînement & Charge physique',
    emoji: '💪',
    items: [
      { id: 'q17', text: 'Nombre de séances/semaine', opts: ['0–1', '2–3', '4–5', '6+'] },
      { id: 'q18', text: "Type dominant d'entraînement", opts: ['Marche / doux', 'Musculation modérée', 'HIIT / cardio intense', 'Mix intense + volume élevé'] },
      { id: 'q19', text: 'Sensation après entraînement', opts: ['Énergisée', 'Fatiguée mais ok', 'Vidée', 'Épuisée / douleurs persistantes'] },
    ]
  },
  {
    section: 'Marqueurs physiologiques',
    emoji: '📊',
    items: [
      { id: 'q20', text: 'Ballonnements fréquents', opts: ['Jamais', 'Occasionnels', 'Fréquents', 'Quotidiens'] },
      { id: 'q21', text: 'Rétention d\'eau (cycle ou stress)', opts: ['Rare', 'Parfois', 'Fréquente', 'Très marquée'] },
      { id: 'q22', text: 'Plateau de poids depuis > 4 semaines', opts: ['Non', 'Oui malgré déficit', 'Oui sans déficit clair', 'Poids fluctuant fortement'] },
    ]
  },
]

function calculateScores(answers) {
  let stress = 0, nutrition = 0, rythme = 0, training = 0

  QUESTIONS[0].items.forEach(q => { stress += answers[q.id] || 0 })
  QUESTIONS[1].items.forEach(q => { nutrition += answers[q.id] || 0 })
  QUESTIONS[2].items.forEach(q => { rythme += answers[q.id] || 0 })
  QUESTIONS[3].items.forEach(q => { training += answers[q.id] || 0 })

  const maxStress = 21, maxNutrition = 15, maxRythme = 12, maxTraining = 9
  const sStress = Math.round((1 - stress / maxStress) * 100)
  const sNutrition = Math.round((1 - nutrition / maxNutrition) * 100)
  const sRythme = Math.round((1 - rythme / maxRythme) * 100)
  const sTraining = Math.round((1 - training / maxTraining) * 100)
  const is = Math.round((sStress + sNutrition + sRythme + sTraining) / 4)

  const ratios = [
    { profile: 'Stress dominant', ratio: stress / maxStress },
    { profile: 'Nutrition', ratio: nutrition / maxNutrition },
    { profile: 'Surcharge', ratio: training / maxTraining },
    { profile: 'Biologique', ratio: rythme / maxRythme },
  ]
  const dominant = ratios.reduce((a, b) => a.ratio > b.ratio ? a : b).profile

  return {
    score_stress: sStress,
    score_nutrition: sNutrition,
    score_rythme: sRythme,
    score_training: sTraining,
    is_score: is,
    dominant_profile: dominant,
  }
}

export default function ClientQuestionnaire({ client }) {
  const [section, setSection] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const currentSection = QUESTIONS[section]
  const totalSections = QUESTIONS.length
  const progress = Math.round(((section) / totalSections) * 100)

  const allAnswered = currentSection.items.every(q => answers[q.id] !== undefined)

  async function handleSubmit() {
    setSaving(true)
    const scores = calculateScores(answers)
    const { error } = await supabase
      .from('questionnaire_responses')
      .insert({
        client_id: client.id,
        week_number: client.current_week,
        answers,
        ...scores,
      })

    if (!error) {
      await supabase
        .from('clients')
        .update({ dominant_profile: scores.dominant_profile })
        .eq('id', client.id)
      setResult(scores)
    }
    setSaving(false)
  }

  if (result) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="bg-white px-5 pt-12 pb-5 border-b border-gray-100">
          <h1 className="text-xl font-medium text-gray-800">Tes résultats</h1>
          <p className="text-xs text-gray-400 mt-0.5">Semaine {client.current_week}</p>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
            <p className="text-xs text-gray-400 mb-2">Ton indice de stabilisation</p>
            <p className="text-6xl font-medium text-rose-500 mb-1">{result.is_score}</p>
            <p className="text-sm text-gray-400">/100</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-700"
                style={{ width: `${result.is_score}%` }}
              />
            </div>
          </div>

          <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
            <p className="text-xs text-rose-600 mb-1">Profil dominant</p>
            <p className="text-sm font-medium text-rose-800">{result.dominant_profile}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Détail par catégorie</p>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Stress & nerveux', value: result.score_stress, color: 'bg-rose-400' },
                { label: 'Nutrition', value: result.score_nutrition, color: 'bg-amber-400' },
                { label: 'Rythme biologique', value: result.score_rythme, color: 'bg-teal-400' },
                { label: 'Entraînement', value: result.score_training, color: 'bg-blue-400' },
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
          </div>

          <button
            onClick={() => navigate('/app')}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl text-sm font-medium transition-colors"
          >
            Voir mon programme →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => section > 0 ? setSection(section - 1) : navigate('/app/progress')}
            className="text-gray-400 text-sm"
          >←</button>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Section {section + 1} / {totalSections}</p>
            <h1 className="text-base font-medium text-gray-800">
              {currentSection.emoji} {currentSection.section}
            </h1>
          </div>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-3">
        {currentSection.items.map(q => (
          <div key={q.id} className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-sm font-medium text-gray-800 mb-3">{q.text}</p>
            <div className="flex flex-col gap-2">
              {q.opts.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers({ ...answers, [q.id]: i })}
                  className={`text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                    answers[q.id] === i
                      ? 'border-rose-400 bg-rose-50 text-rose-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-rose-200 hover:bg-rose-50/50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-white border-t border-gray-100">
        {section < totalSections - 1 ? (
          <button
            onClick={() => setSection(section + 1)}
            disabled={!allAnswered}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl text-sm font-medium transition-colors disabled:opacity-40"
          >
            Section suivante →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl text-sm font-medium transition-colors disabled:opacity-40"
          >
            {saving ? 'Calcul en cours...' : 'Calculer mon score ✓'}
          </button>
        )}
      </div>
    </div>
  )
}