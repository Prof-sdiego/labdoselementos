
-- Profiles for professors
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Salas
CREATE TABLE public.salas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ano_serie TEXT NOT NULL DEFAULT '',
  periodo TEXT NOT NULL DEFAULT 'manhã',
  status TEXT NOT NULL DEFAULT 'ativa',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own salas" ON public.salas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Equipes
CREATE TABLE public.equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sala_id UUID REFERENCES public.salas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  leader_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.equipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own equipes" ON public.equipes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Alunos
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  sala_id UUID REFERENCES public.salas(id) ON DELETE CASCADE NOT NULL,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL,
  classe TEXT NOT NULL DEFAULT 'Pesquisador',
  poder_usado_nesta_fase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own alunos" ON public.alunos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tipos de atividade
CREATE TABLE public.tipos_atividade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'por_aluno',
  descricao TEXT DEFAULT '',
  is_bonus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tipos_atividade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own atividades" ON public.tipos_atividade FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Lancamentos de XP
CREATE TABLE public.lancamentos_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  atividade_id UUID REFERENCES public.tipos_atividade(id) NOT NULL,
  sala_id UUID REFERENCES public.salas(id) NOT NULL,
  xp_concedido INTEGER NOT NULL DEFAULT 0,
  estornado BOOLEAN DEFAULT false,
  data TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.lancamentos_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own lancamentos" ON public.lancamentos_xp FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Junction tables for lancamentos
CREATE TABLE public.lancamento_equipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id UUID REFERENCES public.lancamentos_xp(id) ON DELETE CASCADE NOT NULL,
  equipe_id UUID REFERENCES public.equipes(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.lancamento_equipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages lancamento_equipes" ON public.lancamento_equipes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.lancamentos_xp WHERE id = lancamento_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.lancamentos_xp WHERE id = lancamento_id AND user_id = auth.uid()));

CREATE TABLE public.lancamento_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id UUID REFERENCES public.lancamentos_xp(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.lancamento_alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages lancamento_alunos" ON public.lancamento_alunos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.lancamentos_xp WHERE id = lancamento_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.lancamentos_xp WHERE id = lancamento_id AND user_id = auth.uid()));

-- Fases
CREATE TABLE public.fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  data_inicio TIMESTAMPTZ DEFAULT now(),
  data_fim TIMESTAMPTZ,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.fases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own fases" ON public.fases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transferencias (sem limite por semestre)
CREATE TABLE public.transferencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  aluno_id UUID REFERENCES public.alunos(id) NOT NULL,
  equipe_origem_id UUID REFERENCES public.equipes(id) NOT NULL,
  equipe_destino_id UUID REFERENCES public.equipes(id) NOT NULL,
  data TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own transferencias" ON public.transferencias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shop items
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  preco_xp INTEGER NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own shop_items" ON public.shop_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Shop purchases
CREATE TABLE public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shop_items(id) NOT NULL,
  equipe_id UUID REFERENCES public.equipes(id) NOT NULL,
  xp_gasto INTEGER NOT NULL DEFAULT 0,
  data TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own purchases" ON public.shop_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ocorrencias
CREATE TABLE public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  equipe_id UUID REFERENCES public.equipes(id) NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT DEFAULT 'problema',
  status TEXT DEFAULT 'aberta',
  registrado_por TEXT DEFAULT 'lider',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own ocorrencias" ON public.ocorrencias FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Artefatos
CREATE TABLE public.artefatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  raridade TEXT NOT NULL DEFAULT 'Simples',
  descricao TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.artefatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own artefatos" ON public.artefatos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Artefatos atribuidos
CREATE TABLE public.artefatos_atribuidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  artefato_id UUID REFERENCES public.artefatos(id) NOT NULL,
  equipe_id UUID REFERENCES public.equipes(id),
  aluno_id UUID REFERENCES public.alunos(id),
  data TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.artefatos_atribuidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Professor manages own artefatos_atribuidos" ON public.artefatos_atribuidos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed default activity types function (professor calls after signup)
CREATE OR REPLACE FUNCTION public.seed_default_atividades(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.tipos_atividade (user_id, nome, xp, tipo, descricao, is_bonus) VALUES
    (p_user_id, 'Completar Experiência', 3, 'por_aluno', '+3 por membro que fez', false),
    (p_user_id, 'Todos entregaram no prazo', 10, 'por_equipe', '+10 bônus quando todos completam', true),
    (p_user_id, 'Missão Especial', 5, 'por_aluno', '+5 por membro que fez', false),
    (p_user_id, 'Chefão — média ≥ 7', 15, 'por_equipe', '+15 para equipe', false),
    (p_user_id, 'Chefão — alguém tirou 10', 10, 'por_equipe', '+10 bônus', true),
    (p_user_id, 'Missão Bônus', 5, 'por_aluno', '+5 por membro que fez', true),
    (p_user_id, 'Missão Relâmpago', 8, 'por_equipe', '+8 para equipe vencedora', false),
    (p_user_id, 'Participação destaque', 3, 'por_aluno', '+3 individual', false),
    (p_user_id, 'Membro mandado à direção', -10, 'por_equipe', '-10 penalidade', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
