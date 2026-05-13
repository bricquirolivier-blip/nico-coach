import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Body reçu:', JSON.stringify(body))

    const { email, first_name, last_name } = body

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email manquant' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    console.log('URL Supabase:', supabaseUrl)
    console.log('Service key présente:', !!serviceKey)

    const supabaseAdmin = createClient(supabaseUrl ?? '', serviceKey ?? '')

    console.log('Envoi invitation à:', email)

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { first_name, last_name, role: 'client' },
      redirectTo: 'https://nico-coach-ecru.vercel.app/accept-invite',
    })

    console.log('Résultat:', JSON.stringify({ data, error }))

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.log('Erreur catch:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})