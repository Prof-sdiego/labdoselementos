export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          classe: string
          created_at: string | null
          equipe_id: string | null
          id: string
          nome: string
          poder_usado_nesta_fase: boolean | null
          sala_id: string
          user_id: string
        }
        Insert: {
          classe?: string
          created_at?: string | null
          equipe_id?: string | null
          id?: string
          nome: string
          poder_usado_nesta_fase?: boolean | null
          sala_id: string
          user_id: string
        }
        Update: {
          classe?: string
          created_at?: string | null
          equipe_id?: string | null
          id?: string
          nome?: string
          poder_usado_nesta_fase?: boolean | null
          sala_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alunos_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      artefatos: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          raridade: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          raridade?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          raridade?: string
          user_id?: string
        }
        Relationships: []
      }
      artefatos_atribuidos: {
        Row: {
          aluno_id: string | null
          artefato_id: string
          data: string | null
          equipe_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          aluno_id?: string | null
          artefato_id: string
          data?: string | null
          equipe_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          aluno_id?: string | null
          artefato_id?: string
          data?: string | null
          equipe_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artefatos_atribuidos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artefatos_atribuidos_artefato_id_fkey"
            columns: ["artefato_id"]
            isOneToOne: false
            referencedRelation: "artefatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artefatos_atribuidos_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          created_at: string | null
          id: string
          leader_code: string | null
          nome: string
          sala_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leader_code?: string | null
          nome: string
          sala_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leader_code?: string | null
          nome?: string
          sala_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      fases: {
        Row: {
          ativa: boolean | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          ativa?: boolean | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      lancamento_alunos: {
        Row: {
          aluno_id: string
          id: string
          lancamento_id: string
        }
        Insert: {
          aluno_id: string
          id?: string
          lancamento_id: string
        }
        Update: {
          aluno_id?: string
          id?: string
          lancamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamento_alunos_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_xp"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamento_equipes: {
        Row: {
          equipe_id: string
          id: string
          lancamento_id: string
        }
        Insert: {
          equipe_id: string
          id?: string
          lancamento_id: string
        }
        Update: {
          equipe_id?: string
          id?: string
          lancamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_equipes_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamento_equipes_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_xp"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_xp: {
        Row: {
          atividade_id: string
          created_at: string | null
          data: string | null
          estornado: boolean | null
          id: string
          sala_id: string
          user_id: string
          xp_concedido: number
        }
        Insert: {
          atividade_id: string
          created_at?: string | null
          data?: string | null
          estornado?: boolean | null
          id?: string
          sala_id: string
          user_id: string
          xp_concedido?: number
        }
        Update: {
          atividade_id?: string
          created_at?: string | null
          data?: string | null
          estornado?: boolean | null
          id?: string
          sala_id?: string
          user_id?: string
          xp_concedido?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_xp_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "tipos_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_xp_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          created_at: string | null
          descricao: string
          equipe_id: string
          id: string
          registrado_por: string | null
          status: string | null
          tipo: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          equipe_id: string
          id?: string
          registrado_por?: string | null
          status?: string | null
          tipo?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          equipe_id?: string
          id?: string
          registrado_por?: string | null
          status?: string | null
          tipo?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          user_id?: string
        }
        Relationships: []
      }
      salas: {
        Row: {
          ano_serie: string
          created_at: string | null
          id: string
          nome: string
          periodo: string
          status: string
          user_id: string
        }
        Insert: {
          ano_serie?: string
          created_at?: string | null
          id?: string
          nome: string
          periodo?: string
          status?: string
          user_id: string
        }
        Update: {
          ano_serie?: string
          created_at?: string | null
          id?: string
          nome?: string
          periodo?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          estoque: number
          id: string
          nome: string
          preco_xp: number
          user_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          estoque?: number
          id?: string
          nome: string
          preco_xp?: number
          user_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          estoque?: number
          id?: string
          nome?: string
          preco_xp?: number
          user_id?: string
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          data: string | null
          equipe_id: string
          id: string
          item_id: string
          user_id: string
          xp_gasto: number
        }
        Insert: {
          data?: string | null
          equipe_id: string
          id?: string
          item_id: string
          user_id: string
          xp_gasto?: number
        }
        Update: {
          data?: string | null
          equipe_id?: string
          id?: string
          item_id?: string
          user_id?: string
          xp_gasto?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_purchases_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_purchases_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_atividade: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_bonus: boolean | null
          nome: string
          tipo: string
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_bonus?: boolean | null
          nome: string
          tipo?: string
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_bonus?: boolean | null
          nome?: string
          tipo?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      transferencias: {
        Row: {
          aluno_id: string
          data: string | null
          equipe_destino_id: string
          equipe_origem_id: string
          id: string
          user_id: string
        }
        Insert: {
          aluno_id: string
          data?: string | null
          equipe_destino_id: string
          equipe_origem_id: string
          id?: string
          user_id: string
        }
        Update: {
          aluno_id?: string
          data?: string | null
          equipe_destino_id?: string
          equipe_origem_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transferencias_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_equipe_destino_id_fkey"
            columns: ["equipe_destino_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transferencias_equipe_origem_id_fkey"
            columns: ["equipe_origem_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_default_atividades: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
