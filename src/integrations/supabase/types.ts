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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      competition_athletes: {
        Row: {
          codigo: string | null
          competition_id: string
          created_at: string
          data_nascimento: string | null
          documento: string | null
          genero: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo?: string | null
          competition_id: string
          created_at?: string
          data_nascimento?: string | null
          documento?: string | null
          genero?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string | null
          competition_id?: string
          created_at?: string
          data_nascimento?: string | null
          documento?: string | null
          genero?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_athletes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_matches: {
        Row: {
          competition_id: string
          created_at: string
          horario: string | null
          id: string
          local: string | null
          participante_a: string
          participante_b: string
          placar_a: number | null
          placar_b: number | null
          rodada: number
        }
        Insert: {
          competition_id: string
          created_at?: string
          horario?: string | null
          id?: string
          local?: string | null
          participante_a: string
          participante_b: string
          placar_a?: number | null
          placar_b?: number | null
          rodada: number
        }
        Update: {
          competition_id?: string
          created_at?: string
          horario?: string | null
          id?: string
          local?: string | null
          participante_a?: string
          participante_b?: string
          placar_a?: number | null
          placar_b?: number | null
          rodada?: number
        }
        Relationships: [
          {
            foreignKeyName: "competition_matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_modalities: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_modalities_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_teams: {
        Row: {
          competition_id: string
          created_at: string
          genero: string | null
          id: string
          nome: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          genero?: string | null
          id?: string
          nome: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          genero?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_teams_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          coordenador_quadra: string | null
          created_at: string
          data: string | null
          email_organizador: string | null
          email_responsavel: string | null
          equipe_arbitragem: string | null
          espacos_disponiveis: number | null
          finalizado: boolean | null
          horario: string | null
          id: string
          intervalo_refeicao: boolean | null
          local: string | null
          logistica_dia: string | null
          logistica_horario_inicio: string | null
          logistica_local: string | null
          modalidade: string | null
          modalidade_selecionada: string | null
          nome: string
          organizadores: string | null
          outros_envolvidos: string | null
          responsavel: string | null
          sistema_disputa: string | null
          sugestao_manual: string | null
          tempo_intervalo: number | null
          tempo_por_partida: number | null
          tempo_total_disponivel: number | null
          tipo_competidor: string | null
          updated_at: string
        }
        Insert: {
          coordenador_quadra?: string | null
          created_at?: string
          data?: string | null
          email_organizador?: string | null
          email_responsavel?: string | null
          equipe_arbitragem?: string | null
          espacos_disponiveis?: number | null
          finalizado?: boolean | null
          horario?: string | null
          id?: string
          intervalo_refeicao?: boolean | null
          local?: string | null
          logistica_dia?: string | null
          logistica_horario_inicio?: string | null
          logistica_local?: string | null
          modalidade?: string | null
          modalidade_selecionada?: string | null
          nome: string
          organizadores?: string | null
          outros_envolvidos?: string | null
          responsavel?: string | null
          sistema_disputa?: string | null
          sugestao_manual?: string | null
          tempo_intervalo?: number | null
          tempo_por_partida?: number | null
          tempo_total_disponivel?: number | null
          tipo_competidor?: string | null
          updated_at?: string
        }
        Update: {
          coordenador_quadra?: string | null
          created_at?: string
          data?: string | null
          email_organizador?: string | null
          email_responsavel?: string | null
          equipe_arbitragem?: string | null
          espacos_disponiveis?: number | null
          finalizado?: boolean | null
          horario?: string | null
          id?: string
          intervalo_refeicao?: boolean | null
          local?: string | null
          logistica_dia?: string | null
          logistica_horario_inicio?: string | null
          logistica_local?: string | null
          modalidade?: string | null
          modalidade_selecionada?: string | null
          nome?: string
          organizadores?: string | null
          outros_envolvidos?: string | null
          responsavel?: string | null
          sistema_disputa?: string | null
          sugestao_manual?: string | null
          tempo_intervalo?: number | null
          tempo_por_partida?: number | null
          tempo_total_disponivel?: number | null
          tipo_competidor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          codigo: string | null
          created_at: string
          data_nascimento: string | null
          documento: string | null
          genero: string | null
          id: string
          nome: string
          team_id: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          data_nascimento?: string | null
          documento?: string | null
          genero?: string | null
          id?: string
          nome: string
          team_id: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          data_nascimento?: string | null
          documento?: string | null
          genero?: string | null
          id?: string
          nome?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "competition_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
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
    Enums: {
      app_role: ["admin", "viewer"],
    },
  },
} as const
