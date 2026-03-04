import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // 1. Calculate and store XP for each equipe before clearing history
    const { data: equipes } = await supabase.from('equipes').select('id, xp_acumulado');
    
    for (const equipe of (equipes || [])) {
      // Get equipe lancamento XP
      const { data: lancEquipes } = await supabase
        .from('lancamento_equipes').select('lancamento_id').eq('equipe_id', equipe.id);
      
      // Get member aluno lancamento XP
      const { data: membros } = await supabase
        .from('alunos').select('id').eq('equipe_id', equipe.id);
      const membroIds = membros?.map(m => m.id) || [];
      const { data: lancAlunos } = await supabase
        .from('lancamento_alunos').select('lancamento_id')
        .in('aluno_id', membroIds.length > 0 ? membroIds : ['none']);

      const allLancIds = [...new Set([
        ...(lancEquipes?.map(le => le.lancamento_id) || []),
        ...(lancAlunos?.map(la => la.lancamento_id) || [])
      ])];

      if (allLancIds.length === 0) continue;

      const { data: lancs } = await supabase
        .from('lancamentos_xp').select('xp_concedido')
        .in('id', allLancIds).eq('estornado', false);

      const xpFromLancs = (lancs || []).reduce((s, l) => s + (l.xp_concedido || 0), 0);

      // Add to accumulated XP
      await supabase.from('equipes')
        .update({ xp_acumulado: (equipe.xp_acumulado || 0) + xpFromLancs })
        .eq('id', equipe.id);
    }

    // 2. Delete all lancamento junction tables, then lancamentos
    await supabase.from('lancamento_alunos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('lancamento_equipes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('lancamentos_xp').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Delete read notifications older than 10 days
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('notifications').delete()
      .eq('lida', true)
      .lt('created_at', tenDaysAgo);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
