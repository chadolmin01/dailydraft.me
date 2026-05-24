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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      atom_relations: {
        Row: {
          confidence: number
          created_at: string
          extracted_by: string
          from_atom_id: string
          id: string
          tenant_id: string
          to_atom_id: string
          type: string
        }
        Insert: {
          confidence: number
          created_at?: string
          extracted_by: string
          from_atom_id: string
          id?: string
          tenant_id: string
          to_atom_id: string
          type: string
        }
        Update: {
          confidence?: number
          created_at?: string
          extracted_by?: string
          from_atom_id?: string
          id?: string
          tenant_id?: string
          to_atom_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "atom_relations_from_atom_id_fkey"
            columns: ["from_atom_id"]
            isOneToOne: false
            referencedRelation: "active_atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atom_relations_from_atom_id_fkey"
            columns: ["from_atom_id"]
            isOneToOne: false
            referencedRelation: "atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atom_relations_from_atom_id_fkey"
            columns: ["from_atom_id"]
            isOneToOne: false
            referencedRelation: "triples"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "atom_relations_from_atom_id_fkey"
            columns: ["from_atom_id"]
            isOneToOne: false
            referencedRelation: "triples"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "atom_relations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atom_relations_to_atom_id_fkey"
            columns: ["to_atom_id"]
            isOneToOne: false
            referencedRelation: "active_atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atom_relations_to_atom_id_fkey"
            columns: ["to_atom_id"]
            isOneToOne: false
            referencedRelation: "atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atom_relations_to_atom_id_fkey"
            columns: ["to_atom_id"]
            isOneToOne: false
            referencedRelation: "triples"
            referencedColumns: ["object_id"]
          },
          {
            foreignKeyName: "atom_relations_to_atom_id_fkey"
            columns: ["to_atom_id"]
            isOneToOne: false
            referencedRelation: "triples"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      atoms: {
        Row: {
          attributes: Json
          confidence: number
          content: string
          created_at: string
          id: string
          provenance: Json
          series_atom_id: string | null
          status: string
          tenant_id: string
          type: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          attributes?: Json
          confidence: number
          content: string
          created_at?: string
          id?: string
          provenance: Json
          series_atom_id?: string | null
          status?: string
          tenant_id: string
          type: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          attributes?: Json
          confidence?: number
          content?: string
          created_at?: string
          id?: string
          provenance?: Json
          series_atom_id?: string | null
          status?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atoms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          content: Json
          created_at: string
          folder_id: string | null
          id: string
          role: string
          tool_calls: Json | null
          workspace_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          folder_id?: string | null
          id?: string
          role: string
          tool_calls?: Json | null
          workspace_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          folder_id?: string | null
          id?: string
          role?: string
          tool_calls?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_atoms: {
        Row: {
          attributes: Json
          confidence: number
          content: string
          created_at: string
          id: string
          local_id: string
          processed_file_id: string
          provenance: Json
          type: string
          workspace_id: string
        }
        Insert: {
          attributes?: Json
          confidence: number
          content: string
          created_at?: string
          id?: string
          local_id: string
          processed_file_id: string
          provenance: Json
          type: string
          workspace_id: string
        }
        Update: {
          attributes?: Json
          confidence?: number
          content?: string
          created_at?: string
          id?: string
          local_id?: string
          processed_file_id?: string
          provenance?: Json
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_atoms_processed_file_id_fkey"
            columns: ["processed_file_id"]
            isOneToOne: false
            referencedRelation: "processed_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_atoms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_relations: {
        Row: {
          confidence: number
          created_at: string
          from_atom_id: string
          id: string
          processed_file_id: string
          to_atom_id: string
          type: string
          workspace_id: string
        }
        Insert: {
          confidence: number
          created_at?: string
          from_atom_id: string
          id?: string
          processed_file_id: string
          to_atom_id: string
          type: string
          workspace_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          from_atom_id?: string
          id?: string
          processed_file_id?: string
          to_atom_id?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_relations_from_atom_id_fkey"
            columns: ["from_atom_id"]
            isOneToOne: false
            referencedRelation: "extracted_atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_relations_processed_file_id_fkey"
            columns: ["processed_file_id"]
            isOneToOne: false
            referencedRelation: "processed_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_relations_to_atom_id_fkey"
            columns: ["to_atom_id"]
            isOneToOne: false
            referencedRelation: "extracted_atoms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_relations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      file_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          id: string
          processed_file_id: string
          token_count: number | null
          workspace_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          processed_file_id: string
          token_count?: number | null
          workspace_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          processed_file_id?: string
          token_count?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_chunks_processed_file_id_fkey"
            columns: ["processed_file_id"]
            isOneToOne: false
            referencedRelation: "processed_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      file_series: {
        Row: {
          created_at: string
          detected_by: string
          id: string
          series_name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          detected_by: string
          id?: string
          series_name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          detected_by?: string
          id?: string
          series_name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_series_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string | null
          filename: string
          id: string
          mime_type: string
          parsed_metadata: Json | null
          parsed_text: string | null
          parsing_completed_at: string | null
          series_id: string | null
          series_position: number | null
          size_bytes: number
          storage_url: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          filename: string
          id?: string
          mime_type: string
          parsed_metadata?: Json | null
          parsed_text?: string | null
          parsing_completed_at?: string | null
          series_id?: string | null
          series_position?: number | null
          size_bytes: number
          storage_url: string
          tenant_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          filename?: string
          id?: string
          mime_type?: string
          parsed_metadata?: Json | null
          parsed_text?: string | null
          parsing_completed_at?: string | null
          series_id?: string | null
          series_position?: number | null
          size_bytes?: number
          storage_url?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "file_series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          drive_folder_id: string | null
          id: string
          last_synced_at: string | null
          name: string
          program: string | null
          program_start_date: string | null
          sheet_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          drive_folder_id?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          program?: string | null
          program_start_date?: string | null
          sheet_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          drive_folder_id?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          program?: string | null
          program_start_date?: string | null
          sheet_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      google_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string | null
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email?: string | null
          refresh_token: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string | null
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      output_rules: {
        Row: {
          code_module: string | null
          created_at: string
          description: string
          id: string
          name: string
          prompt_template: string | null
          tenant_id: string
          version: number
          yaml_definition: string
        }
        Insert: {
          code_module?: string | null
          created_at?: string
          description: string
          id?: string
          name: string
          prompt_template?: string | null
          tenant_id: string
          version?: number
          yaml_definition: string
        }
        Update: {
          code_module?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          prompt_template?: string | null
          tenant_id?: string
          version?: number
          yaml_definition?: string
        }
        Relationships: [
          {
            foreignKeyName: "output_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outputs: {
        Row: {
          citations: Json
          composed_at: string
          composed_by: string
          content: string
          id: string
          rule_id: string
          rule_version: number
          tenant_id: string
        }
        Insert: {
          citations?: Json
          composed_at?: string
          composed_by: string
          content: string
          id?: string
          rule_id: string
          rule_version: number
          tenant_id: string
        }
        Update: {
          citations?: Json
          composed_at?: string
          composed_by?: string
          content?: string
          id?: string
          rule_id?: string
          rule_version?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outputs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "output_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outputs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_files: {
        Row: {
          atom_count: number
          created_at: string
          drive_file_id: string
          drive_modified_at: string | null
          filename: string
          folder_id: string | null
          id: string
          mime_type: string
          parsed_text: string | null
          parsing_completed_at: string | null
          parsing_error: string | null
          relation_count: number
          size_bytes: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          atom_count?: number
          created_at?: string
          drive_file_id: string
          drive_modified_at?: string | null
          filename: string
          folder_id?: string | null
          id?: string
          mime_type: string
          parsed_text?: string | null
          parsing_completed_at?: string | null
          parsing_error?: string | null
          relation_count?: number
          size_bytes?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          atom_count?: number
          created_at?: string
          drive_file_id?: string
          drive_modified_at?: string | null
          filename?: string
          folder_id?: string | null
          id?: string
          mime_type?: string
          parsed_text?: string | null
          parsing_completed_at?: string | null
          parsing_error?: string | null
          relation_count?: number
          size_bytes?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_files_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_version: {
        Row: {
          applied_at: string
          glossary_version: string
          version: string
        }
        Insert: {
          applied_at?: string
          glossary_version: string
          version: string
        }
        Update: {
          applied_at?: string
          glossary_version?: string
          version?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          folder_id: string | null
          id: string
          position: number
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          folder_id?: string | null
          id?: string
          position?: number
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          folder_id?: string | null
          id?: string
          position?: number
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_atoms: {
        Row: {
          attributes: Json | null
          confidence: number | null
          content: string | null
          created_at: string | null
          id: string | null
          provenance: Json | null
          series_atom_id: string | null
          status: string | null
          tenant_id: string | null
          type: string | null
          updated_at: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          attributes?: Json | null
          confidence?: number | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          provenance?: Json | null
          series_atom_id?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          attributes?: Json | null
          confidence?: number | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          provenance?: Json | null
          series_atom_id?: string | null
          status?: string | null
          tenant_id?: string | null
          type?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atoms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      triples: {
        Row: {
          object_content: string | null
          object_id: string | null
          object_type: string | null
          predicate: string | null
          relation_confidence: number | null
          relation_id: string | null
          subject_content: string | null
          subject_id: string | null
          subject_type: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atom_relations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      search_file_chunks: {
        Args: {
          folder_id_filter?: string
          match_count?: number
          query_embedding: string
          workspace_id_filter: string
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          content: string
          filename: string
          processed_file_id: string
          similarity: number
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
