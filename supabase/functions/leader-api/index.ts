import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Faixa { limite: number; multiplicador: number; }

function calcMultiplicador(totalCristais: number, faixas: Faixa[], inflacaoAtiva: boolean): number {
  if (!inflacaoAtiva || !faixas || faixas.length === 0) return 1.0;
  const sorted = [...faixas].sort((a, b) => b.limite - a.limite);
  for (const f of sorted) {
    if (totalCristais >= f.limite) return f.multiplicador;
  }
  return 1.0;
}

function calcPrecoFinal(precoBase: number, mult: number): number {
  return Math.max(1, Math.ceil(precoBase * mult));
}

async function getEconomiaContext(supabase: any, userId: string) {
  // Get economia config
  const { data: ecoConfig } = await supabase
    .from('economia_config')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  // Get total cristais in circulation
  const { data: allEquipes } = await supabase
    .from('equipes')
    .select('cristais')
    .eq('user_id', userId);

  const totalCristais = (allEquipes || []).reduce((s: number, e: any) => s + (e.cristais || 0), 0);

  const inflacaoAtiva = ecoConfig?.inflacao_ativa ?? false;
  const faixas: Faixa[] = ecoConfig?.faixas ?? [];
  const promoAtiva = ecoConfig?.promocao_ativa ?? false;
  
  // Check if promo has expired
  let promoRealmenteAtiva = promoAtiva;
  if (promoAtiva && ecoConfig?.promocao_fim) {
    if (new Date(ecoConfig.promocao_fim).getTime() < Date.now()) {
      promoRealmenteAtiva = false;
      // Auto-expire the promo
      await supabase.from('economia_config').update({ promocao_ativa: false }).eq('id', ecoConfig.id);
    }
  }

  const promoMult = Number(ecoConfig?.promocao_multiplicador) || 0.75;
  const promoGlobal = ecoConfig?.promocao_global ?? true;
  const promoItemIds: string[] = ecoConfig?.promocao_item_ids || [];

  const inflacaoMult = calcMultiplicador(totalCristais, faixas, inflacaoAtiva);

  return { inflacaoMult, promoRealmenteAtiva, promoMult, promoGlobal, promoItemIds, totalCristais };
}

function getItemPrice(item: any, eco: Awaited<ReturnType<typeof getEconomiaContext>>): { preco: number; multiplicador: number; emPromocao: boolean } {
  const { inflacaoMult, promoRealmenteAtiva, promoMult, promoGlobal, promoItemIds } = eco;
  
  const isPromoItem = promoRealmenteAtiva && (promoGlobal || promoItemIds.includes(item.id));
  
  if (isPromoItem) {
    return {
      preco: calcPrecoFinal(item.preco_xp, promoMult),
      multiplicador: promoMult,
      emPromocao: true,
    };
  }
  
  return {
    preco: calcPrecoFinal(item.preco_xp, inflacaoMult),
    multiplicador: inflacaoMult,
    emPromocao: false,
  };
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
      const { data: membros } = await supabase
        .from('alunos')
        .select('*')
        .eq('equipe_id', equipe.id);

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

      const equipeXP = (lancEquipes || []).reduce((sum, le) => {
        const lanc = lancamentos?.find(l => l.id === le.lancamento_id);
        return sum + (lanc?.xp_concedido || 0);
      }, 0);

      const alunoXP = (lancAlunos || []).reduce((sum, la) => {
        const lanc = lancamentos?.find(l => l.id === la.lancamento_id);
        return sum + (lanc?.xp_concedido || 0);
      }, 0);

      const totalXP = Math.max(0, equipeXP + alunoXP + (equipe.xp_acumulado || 0));

      const membrosWithXP = (membros || []).map(m => {
        const mXP = (lancAlunos || [])
          .filter(la => la.aluno_id === m.id)
          .reduce((sum, la) => {
            const lanc = lancamentos?.find(l => l.id === la.lancamento_id);
            return sum + (lanc?.xp_concedido || 0);
          }, 0);
        return { ...m, xp_individual: mXP };
      });

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
      const { data: allItems } = await supabase
        .from('shop_items')
        .select('*')
        .eq('user_id', equipe.user_id)
        .eq('ativo', true)
        .gt('estoque', 0);

      const items = (allItems || []).filter((item: any) => {
        if (!item.sala_ids || item.sala_ids.length === 0) return true;
        return item.sala_ids.includes(equipe.sala_id);
      });

      // Get economia context for pricing
      const eco = await getEconomiaContext(supabase, equipe.user_id);

      const itemsWithPricing = items.map((item: any) => {
        const pricing = getItemPrice(item, eco);
        return {
          ...item,
          preco_original: item.preco_xp,
          preco_atual: pricing.preco,
          em_promocao: pricing.emPromocao,
          multiplicador: pricing.multiplicador,
        };
      });

      const { data: purchases } = await supabase
        .from('shop_purchases')
        .select('*')
        .eq('equipe_id', equipe.id)
        .order('data', { ascending: false });

      return new Response(JSON.stringify({
        items: itemsWithPricing,
        purchases,
        cristais: equipe.cristais ?? 0,
        promocao_ativa: eco.promoRealmenteAtiva,
        promo_desconto: eco.promoRealmenteAtiva ? Math.round((1 - eco.promoMult) * 100) : 0,
      }), {
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

      // Get economia context
      const eco = await getEconomiaContext(supabase, equipe.user_id);
      const pricing = getItemPrice(item, eco);

      // Check XP requirement
      const { data: lancEquipes2 } = await supabase.from('lancamento_equipes').select('lancamento_id').eq('equipe_id', equipe.id);
      const { data: membros2 } = await supabase.from('alunos').select('id').eq('equipe_id', equipe.id);
      const membroIds2 = membros2?.map(m => m.id) || [];
      const { data: lancAlunos2 } = await supabase.from('lancamento_alunos').select('lancamento_id').in('aluno_id', membroIds2.length > 0 ? membroIds2 : ['none']);
      const allIds2 = [...new Set([...(lancEquipes2?.map(le => le.lancamento_id) || []), ...(lancAlunos2?.map(la => la.lancamento_id) || [])])];
      const { data: lancs2 } = await supabase.from('lancamentos_xp').select('xp_concedido').in('id', allIds2.length > 0 ? allIds2 : ['none']).eq('estornado', false);
      const currentXP = (lancs2 || []).reduce((s, l) => s + (l.xp_concedido || 0), 0) + (equipe.xp_acumulado || 0);

      if (item.xp_necessario && currentXP < item.xp_necessario) {
        return new Response(JSON.stringify({ error: `XP insuficiente para desbloquear. Necessário: ${item.xp_necessario} XP` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check crystals using the calculated price
      const { data: freshEquipe } = await supabase.from('equipes').select('cristais').eq('id', equipe.id).single();
      const cristais = freshEquipe?.cristais ?? 0;
      if (cristais < pricing.preco) {
        return new Response(JSON.stringify({ error: `Cristais insuficientes. Necessário: ${pricing.preco}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Handle roulette
      let roleta_resultado: string | null = null;
      if (item.is_roleta && item.roleta_opcoes && item.roleta_opcoes.length > 0) {
        const opcoes = item.roleta_opcoes as { nome: string; peso: number }[];
        const totalPeso = opcoes.reduce((s: number, o: { peso: number }) => s + (o.peso || 1), 0);
        let rand = Math.random() * totalPeso;
        for (const op of opcoes) {
          rand -= (op.peso || 1);
          if (rand <= 0) { roleta_resultado = op.nome; break; }
        }
        if (!roleta_resultado) roleta_resultado = opcoes[opcoes.length - 1].nome;
      }

      // Insert purchase with multiplier info
      await supabase.from('shop_purchases').insert({
        user_id: equipe.user_id,
        item_id,
        equipe_id: equipe.id,
        cristais_gasto: pricing.preco,
        roleta_resultado,
        multiplicador_aplicado: pricing.multiplicador,
        em_promocao: pricing.emPromocao,
      });

      // Decrement stock and crystals
      await supabase.from('shop_items').update({ estoque: item.estoque - 1 }).eq('id', item_id);
      await supabase.from('equipes').update({ cristais: cristais - pricing.preco }).eq('id', equipe.id);

      // Create notification for professor
      const { data: salaData } = await supabase.from('salas').select('nome').eq('id', equipe.sala_id).single();
      await supabase.from('notifications').insert({
        user_id: equipe.user_id,
        tipo: 'purchase',
        mensagem: `🛒 ${equipe.nome} comprou "${item.nome}"${roleta_resultado ? ` (Roleta: ${roleta_resultado})` : ''} por 💎${pricing.preco}${pricing.emPromocao ? ' (PROMO)' : ''} — ${salaData?.nome || ''}`,
        metadata: { equipe_id: equipe.id, item_id, item_nome: item.nome, roleta_resultado, multiplicador: pricing.multiplicador, em_promocao: pricing.emPromocao }
      });

      return new Response(JSON.stringify({ success: true, roleta_resultado }), {
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
