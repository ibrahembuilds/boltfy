export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            subscribers: {
                Row: {
                    id: string
                    email: string
                    name: string
                    status: string
                    source: string | null
                    user_id: string | null
                    unsubscribe_token: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    status?: string
                    source?: string | null
                    user_id?: string | null
                    unsubscribe_token?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    status?: string
                    source?: string | null
                    user_id?: string | null
                    unsubscribe_token?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            email_templates: {
                Row: {
                    id: string
                    name: string
                    subject: string | null
                    content: Json
                    preview_text: string | null
                    user_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    subject?: string | null
                    content?: Json
                    preview_text?: string | null
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    subject?: string | null
                    content?: Json
                    preview_text?: string | null
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            campaigns: {
                Row: {
                    id: string
                    subject: string
                    content: string | null
                    template_id: string | null
                    status: string
                    recipients_count: number | null
                    open_rate: number | null
                    sent_at: string | null
                    scheduled_for: string | null
                    failed_count: number
                    last_error: string | null
                    user_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    subject: string
                    content?: string | null
                    template_id?: string | null
                    status?: string
                    recipients_count?: number | null
                    open_rate?: number | null
                    sent_at?: string | null
                    scheduled_for?: string | null
                    failed_count?: number
                    last_error?: string | null
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    subject?: string
                    content?: string | null
                    template_id?: string | null
                    status?: string
                    recipients_count?: number | null
                    open_rate?: number | null
                    sent_at?: string | null
                    scheduled_for?: string | null
                    failed_count?: number
                    last_error?: string | null
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "campaigns_template_id_fkey"
                        columns: ["template_id"]
                        isOneToOne: false
                        referencedRelation: "email_templates"
                        referencedColumns: ["id"]
                    }
                ]
            }
            custom_forms: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    fields: Json
                    settings: Json
                    user_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    fields?: Json
                    settings?: Json
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    fields?: Json
                    settings?: Json
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            form_submissions: {
                Row: {
                    id: string
                    subscriber_id: string | null
                    form_id: string | null
                    form_name: string | null
                    metadata: Json | null
                    user_id: string | null
                    notified_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    subscriber_id?: string | null
                    form_id?: string | null
                    form_name?: string | null
                    metadata?: Json | null
                    user_id?: string | null
                    notified_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    subscriber_id?: string | null
                    form_id?: string | null
                    form_name?: string | null
                    metadata?: Json | null
                    user_id?: string | null
                    notified_at?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "form_submissions_subscriber_id_fkey"
                        columns: ["subscriber_id"]
                        isOneToOne: false
                        referencedRelation: "subscribers"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "form_submissions_form_id_fkey"
                        columns: ["form_id"]
                        isOneToOne: false
                        referencedRelation: "custom_forms"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_settings: {
                Row: {
                    user_id: string
                    sender_name: string | null
                    reply_to_email: string | null
                    postal_address: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    sender_name?: string | null
                    reply_to_email?: string | null
                    postal_address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    sender_name?: string | null
                    reply_to_email?: string | null
                    postal_address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            audit_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    action: string
                    table_name: string | null
                    record_id: string | null
                    old_data: Json | null
                    new_data: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    action: string
                    table_name?: string | null
                    record_id?: string | null
                    old_data?: Json | null
                    new_data?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    action?: string
                    table_name?: string | null
                    record_id?: string | null
                    old_data?: Json | null
                    new_data?: Json | null
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            submit_public_form: {
                Args: {
                    p_form_id: string
                    p_metadata: Json
                    /** @deprecated ignored by the server; the form's own settings decide */
                    p_add_subscriber?: boolean
                    /** @deprecated ignored by the server; taken from the form's email field */
                    p_subscriber_email?: string | null
                    p_subscriber_name?: string | null
                }
                Returns: string
            }
            get_public_form: {
                Args: { p_slug: string }
                Returns: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    fields: Json
                    settings: Json
                }[]
            }
            unsubscribe_by_token: {
                Args: { p_token: string }
                Returns: boolean
            }
            /** @deprecated legacy ?owner=&email= links; use unsubscribe_by_token */
            unsubscribe_email: {
                Args: {
                    p_email: string
                    p_owner_id: string
                }
                Returns: boolean
            }
            get_dashboard_stats: {
                Args: Record<PropertyKey, never>
                Returns: {
                    total_forms: number
                    total_submissions: number
                    submissions_this_week: number
                    total_subscribers: number
                    active_subscribers: number
                }[]
            }
            get_form_submission_counts: {
                Args: Record<PropertyKey, never>
                Returns: {
                    form_id: string
                    submissions: number
                    last_submission_at: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
