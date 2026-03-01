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
    const { action, code, ...params } = await req.json();

    // Validate leader code
    const { data: equipe, error: eqErr } = await supabase
      .from('equipes')
      .select('*')
      .eq('leader_code', code)
      .single();

    if (eqErr || !equipe) {
      return new Response(JSON.stringify({ error: 'Código inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'login') {
      // Get team members and their XP
      const { data: membros } = await supabase
        .from('alunos')
        .select('*')
        .eq('equipe_id', equipe.id);

      // Get lancamentos for XP calculation
      const { data: lancEquipes } = await supabase
        .from('lancamento_equipes')
        .select('lancamento_id')
        .eq('equipe_id', equipe.id);

      const lancIds = lancEquipes?.map(le => le.lancamento_id) || [];
      const membroIds = membros?.map(m => m.id) || [];

      const { data: lancAlunos } = await supabase
        .from('lancamento_alunos')
        .select('lancamento_id, aluno_id')
        .in('aluno_id', membroIds.length > 0 ? membroIds : ['none']);

      const allLancIds = [...new Set([...lancIds, ...(lancAlunos?.map(la => la.lancamento_id) || [])])];

      const { data: lancamentos } = await supabase
        .from('lancamentos_xp')
        .select('*')
        .in('id', allLancIds.length > 0 ? allLancIds : ['none'])
        .eq('estornado', false);

      // Calculate team XP (no longer deduct purchases)
      const equipeXP = (lancEquipes || []).reduce((sum, le) => {
        const lanc = lancamentos?.find(l => l.id === le.lancamento_id);
        return sum + (lanc?.xp_concedido || 0);
      }, 0);

      const alunoXP = (lancAlunos || []).reduce((sum, la) => {
        const lanc = lancamentos?.find(l => l.id === la.lancamento_id);
        return sum + (lanc?.xp_concedido || 0);
      }, 0);

      const totalXP = Math.max(0, equipeXP + alunoXP);

      // Calculate individual XP
      const membrosWithXP = (membros || []).map(m => {
        const mXP = (lancAlunos || [])
          .filter(la => la.aluno_id === m.id)
          .reduce((sum, la) => {
            const lanc = lancamentos?.find(l => l.id === la.lancamento_id);
            return sum + (lanc?.xp_concedido || 0);
          }, 0);
        return { ...m, xp_individual: mXP };
      });

      // Get sala info
      const { data: sala } = await supabase
        .from('salas')
        .select('nome')
        .eq('id', equipe.sala_id)
        .single();

      return new Response(JSON.stringify({
        equipe: { ...equipe, xp_total: totalXP },
        membros: membrosWithXP,
        sala
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_shop') {
      // Get all active items with stock, then filter by sala
      const { data: allItems } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', equipe.user_id)
        .eq('ativo', true)
        .gt('estoque', 0);

      // Filter items: show only if sala_ids is null (all salas) or includes the equipe's sala_id
      const items = (allItems || []).filter((item: any) => {
        if (!item.sala_ids || item.sala_ids.length === 0) return true;
        return item.sala_ids.includes(equipe.sala_id);
      });

      const { data: purchases } = await supabase
        .from('shop_purchases')
        .select('*')
        .eq('equipe_id', equipe.id)
        .order('data', { ascending: false });

      return new Response(JSON.stringify({ items, purchases, cristais: equipe.cristais ?? 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'purchase') {
      const { item_id } = params;
      const { data: item } = await supabase
        .from('shop_items')
        .select('*')
        .eq('id', item_id)
        .single();

      if (!item || item.estoque <= 0 || !item.ativo) {
        return new Response(JSON.stringify({ error: 'Item indisponível' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check XP requirement - refetch equipe for fresh XP calc
      // We need to recalculate XP to check unlock
      const { data: lancEquipes2 } = await supabase.from('lancamento_equipes').select('lancamento_id').eq('equipe_id', equipe.id);
      const { data: membros2 } = await supabase.from('alunos').select('id').eq('equipe_id', equipe.id);
      const membroIds2 = membros2?.map(m => m.id) || [];
      const { data: lancAlunos2 } = await supabase.from('lancamento_alunos').select('lancamento_id').in('aluno_id', membroIds2.length > 0 ? membroIds2 : ['none']);
      const allIds2 = [...new Set([...(lancEquipes2?.map(le => le.lancamento_id) || []), ...(lancAlunos2?.map(la => la.lancamento_id) || [])])];
      const { data: lancs2 } = await supabase.from('lancamentos_xp').select('xp_concedido').in('id', allIds2.length > 0 ? allIds2 : ['none']).eq('estornado', false);
      const currentXP = (lancs2 || []).reduce((s, l) => s + (l.xp_concedido || 0), 0);

      if (item.xp_necessario && currentXP < item.xp_necessario) {
        return new Response(JSON.stringify({ error: `XP insuficiente para desbloquear. Necessário: ${item.xp_necessario} XP` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check crystals
      // Refetch equipe for fresh cristais
      const { data: freshEquipe } = await supabase.from('equipes').select('cristais').eq('id', equipe.id).single();
      const cristais = freshEquipe?.cristais ?? 0;
      if (cristais < item.preco_xp) {
        return new Response(JSON.stringify({ error: `Cristais insuficientes. Necessário: ${item.preco_xp}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Insert purchase
      await supabase.from('shop_purchases').insert({
        user_id: equipe.user_id,
        item_id,
        equipe_id: equipe.id,
        cristais_gasto: item.preco_xp
      });

      // Decrement stock and crystals
      await supabase.from('shop_items').update({ estoque: item.estoque - 1 }).eq('id', item_id);
      await supabase.from('equipes').update({ cristais: cristais - item.preco_xp }).eq('id', equipe.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_ocorrencias') {
      const { data: ocorrencias } = await supabase
        .from('ocorrencias')
        .select('*')
        .eq('equipe_id', equipe.id)
        .order('created_at', { ascending: false });

      return new Response(JSON.stringify({ ocorrencias }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'create_ocorrencia') {
      const { descricao } = params;
      if (!descricao || descricao.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Descrição obrigatória' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await supabase.from('ocorrencias').insert({
        user_id: equipe.user_id,
        equipe_id: equipe.id,
        descricao: descricao.trim(),
        registrado_por: 'lider'
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
