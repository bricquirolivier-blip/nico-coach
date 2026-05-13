import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Cherche une fiche client avec le même email
    const { data: client, error } = await supabaseAdmin
      .from('clients')
      .select('id, user_id')
      .eq('email', record.email)
      .maybeSingle()

    if (error || !client) {
      return new Response(JSON.stringify({ message: 'Aucun client trouvé' }), { status: 200 })
    }

    // Si pas encore lié, on lie
    if (!client.user_id) {
      await supabaseAdmin
        .from('clients')
        .update({ user_id: record.id })
        .eq('id', client.id)

      // Met aussi à jour le profil avec le rôle client
      await supabaseAdmin
        .from('profiles')
        .update({
          role: 'client',
          first_name: record.raw_user_meta_data?.first_name || null,
          last_name: record.raw_user_meta_data?.last_name || null,
        })
        .eq('id', record.id)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})