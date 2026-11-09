export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activities: {
        Row: {
          allow_late_join: boolean;
          apply_closes_at: string | null;
          apply_opens_at: string | null;
          audience: string;
          cancel_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          capacity: number | null;
          club_id: string | null;
          cover_path: string | null;
          created_at: string;
          created_by: string;
          description: string | null;
          ends_at: string | null;
          id: string;
          join_mode: string;
          kind: string;
          min_participants: number | null;
          organizer_kind: string;
          payee_user_id: string | null;
          price: number;
          required_activity_id: string | null;
          series_id: string | null;
          session_no: number | null;
          slug: string;
          starts_at: string | null;
          status: string;
          summary: string | null;
          title: string;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          allow_late_join?: boolean;
          apply_closes_at?: string | null;
          apply_opens_at?: string | null;
          audience?: string;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          capacity?: number | null;
          club_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          created_by: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          join_mode?: string;
          kind: string;
          min_participants?: number | null;
          organizer_kind: string;
          payee_user_id?: string | null;
          price?: number;
          required_activity_id?: string | null;
          series_id?: string | null;
          session_no?: number | null;
          slug: string;
          starts_at?: string | null;
          status?: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          allow_late_join?: boolean;
          apply_closes_at?: string | null;
          apply_opens_at?: string | null;
          audience?: string;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          capacity?: number | null;
          club_id?: string | null;
          cover_path?: string | null;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          join_mode?: string;
          kind?: string;
          min_participants?: number | null;
          organizer_kind?: string;
          payee_user_id?: string | null;
          price?: number;
          required_activity_id?: string | null;
          series_id?: string | null;
          session_no?: number | null;
          slug?: string;
          starts_at?: string | null;
          status?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_cancelled_by_fkey";
            columns: ["cancelled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_payee_user_id_fkey";
            columns: ["payee_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_required_activity_id_fkey";
            columns: ["required_activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_series_id_fkey";
            columns: ["series_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_hosts: {
        Row: {
          activity_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_hosts_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_hosts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_private: {
        Row: {
          activity_id: string;
          address_detail: string | null;
          video_url: string | null;
        };
        Insert: {
          activity_id: string;
          address_detail?: string | null;
          video_url?: string | null;
        };
        Update: {
          activity_id?: string;
          address_detail?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activity_private_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      attendances: {
        Row: {
          checked_at: string;
          checked_by: string;
          gathering_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          checked_at?: string;
          checked_by: string;
          gathering_id: string;
          status: string;
          user_id: string;
        };
        Update: {
          checked_at?: string;
          checked_by?: string;
          gathering_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendances_checked_by_fkey";
            columns: ["checked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_gathering_id_fkey";
            columns: ["gathering_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          activity_id: string | null;
          actor_id: string | null;
          club_id: string | null;
          created_at: string;
          detail: Json;
          id: number;
          order_id: string | null;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          activity_id?: string | null;
          actor_id?: string | null;
          club_id?: string | null;
          created_at?: string;
          detail?: Json;
          id?: never;
          order_id?: string | null;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          activity_id?: string | null;
          actor_id?: string | null;
          club_id?: string | null;
          created_at?: string;
          detail?: Json;
          id?: never;
          order_id?: string | null;
          target_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "audit_logs_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      certifications: {
        Row: {
          activity_id: string;
          body: string | null;
          cert_date: string;
          created_at: string;
          id: string;
          link: string | null;
          mission_id: string | null;
          rejected_by: string | null;
          rejected_reason: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          body?: string | null;
          cert_date: string;
          created_at?: string;
          id?: string;
          link?: string | null;
          mission_id?: string | null;
          rejected_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          body?: string | null;
          cert_date?: string;
          created_at?: string;
          id?: string;
          link?: string | null;
          mission_id?: string | null;
          rejected_by?: string | null;
          rejected_reason?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certifications_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certifications_mission_id_fkey";
            columns: ["mission_id"];
            isOneToOne: false;
            referencedRelation: "challenge_missions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certifications_rejected_by_fkey";
            columns: ["rejected_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_details: {
        Row: {
          activity_id: string;
          cert_formats: string[];
          cert_n: number | null;
          cert_rule: string;
          certs_visibility: string;
          completion_threshold: number;
          ends_on: string;
          starts_on: string;
        };
        Insert: {
          activity_id: string;
          cert_formats?: string[];
          cert_n?: number | null;
          cert_rule: string;
          certs_visibility?: string;
          completion_threshold: number;
          ends_on: string;
          starts_on: string;
        };
        Update: {
          activity_id?: string;
          cert_formats?: string[];
          cert_n?: number | null;
          cert_rule?: string;
          certs_visibility?: string;
          completion_threshold?: number;
          ends_on?: string;
          starts_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_details_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_missions: {
        Row: {
          activity_id: string;
          body: string | null;
          day_no: number | null;
          id: string;
          title: string;
        };
        Insert: {
          activity_id: string;
          body?: string | null;
          day_no?: number | null;
          id?: string;
          title: string;
        };
        Update: {
          activity_id?: string;
          body?: string | null;
          day_no?: number | null;
          id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "challenge_missions_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      club_invites: {
        Row: {
          club_id: string;
          code: string;
          created_at: string;
          created_by: string;
          expires_at: string | null;
          id: string;
          max_uses: number | null;
          revoked_at: string | null;
          used_count: number;
        };
        Insert: {
          club_id: string;
          code?: string;
          created_at?: string;
          created_by: string;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          revoked_at?: string | null;
          used_count?: number;
        };
        Update: {
          club_id?: string;
          code?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string | null;
          id?: string;
          max_uses?: number | null;
          revoked_at?: string | null;
          used_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "club_invites_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      club_layers: {
        Row: {
          club_id: string;
          id: string;
          kind: string;
          name: string;
          permissions: string[];
          rank: number;
        };
        Insert: {
          club_id: string;
          id?: string;
          kind: string;
          name: string;
          permissions?: string[];
          rank: number;
        };
        Update: {
          club_id?: string;
          id?: string;
          kind?: string;
          name?: string;
          permissions?: string[];
          rank?: number;
        };
        Relationships: [
          {
            foreignKeyName: "club_layers_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      club_members: {
        Row: {
          club_id: string;
          decided_at: string | null;
          decided_by: string | null;
          invite_id: string | null;
          joined_at: string;
          layer_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          club_id: string;
          decided_at?: string | null;
          decided_by?: string | null;
          invite_id?: string | null;
          joined_at?: string;
          layer_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          club_id?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          invite_id?: string | null;
          joined_at?: string;
          layer_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_invite_id_fkey";
            columns: ["invite_id"];
            isOneToOne: false;
            referencedRelation: "club_invites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_layer_id_fkey";
            columns: ["layer_id"];
            isOneToOne: false;
            referencedRelation: "club_layers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "club_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clubs: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          join_mode: string;
          name: string;
          slug: string;
          status: string;
          tagline: string | null;
          updated_at: string;
          visibility: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          join_mode?: string;
          name: string;
          slug: string;
          status?: string;
          tagline?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          join_mode?: string;
          name?: string;
          slug?: string;
          status?: string;
          tagline?: string | null;
          updated_at?: string;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      entitlements: {
        Row: {
          activity_id: string;
          created_at: string;
          ends_at: string | null;
          granted_by: string | null;
          id: string;
          order_id: string | null;
          revoke_reason: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          source: string;
          starts_at: string;
          status: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          created_at?: string;
          ends_at?: string | null;
          granted_by?: string | null;
          id?: string;
          order_id?: string | null;
          revoke_reason?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          source: string;
          starts_at?: string;
          status?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          created_at?: string;
          ends_at?: string | null;
          granted_by?: string | null;
          id?: string;
          order_id?: string | null;
          revoke_reason?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          source?: string;
          starts_at?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entitlements_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_revoked_by_fkey";
            columns: ["revoked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      gathering_details: {
        Row: {
          activity_id: string;
          area: string | null;
          format: string;
          hide_address_until_confirmed: boolean;
          place_name: string | null;
        };
        Insert: {
          activity_id: string;
          area?: string | null;
          format: string;
          hide_address_until_confirmed?: boolean;
          place_name?: string | null;
        };
        Update: {
          activity_id?: string;
          area?: string | null;
          format?: string;
          hide_address_until_confirmed?: boolean;
          place_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gathering_details_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: true;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      hosts: {
        Row: {
          approved_at: string;
          status: string;
          tier: string;
          user_id: string;
        };
        Insert: {
          approved_at?: string;
          status?: string;
          tier: string;
          user_id: string;
        };
        Update: {
          approved_at?: string;
          status?: string;
          tier?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hosts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      interests: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          activity_id: string;
          amount: number;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          depositor_name: string;
          due_at: string;
          fee_rate: number | null;
          id: string;
          item_snapshot: Json;
          method: string;
          order_no: string;
          payee_user_id: string | null;
          refund_policy_id: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activity_id: string;
          amount: number;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          depositor_name: string;
          due_at: string;
          fee_rate?: number | null;
          id?: string;
          item_snapshot: Json;
          method?: string;
          order_no?: string;
          payee_user_id?: string | null;
          refund_policy_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_id?: string;
          amount?: number;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          depositor_name?: string;
          due_at?: string;
          fee_rate?: number | null;
          id?: string;
          item_snapshot?: Json;
          method?: string;
          order_no?: string;
          payee_user_id?: string | null;
          refund_policy_id?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_payee_user_id_fkey";
            columns: ["payee_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_refund_policy_id_fkey";
            columns: ["refund_policy_id"];
            isOneToOne: false;
            referencedRelation: "refund_policies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      participations: {
        Row: {
          activity_id: string;
          answers: Json;
          cancel_reason: string | null;
          cancelled_by: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          entitlement_id: string | null;
          id: string;
          order_id: string | null;
          outcome: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          waitlisted_at: string | null;
        };
        Insert: {
          activity_id: string;
          answers?: Json;
          cancel_reason?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          entitlement_id?: string | null;
          id?: string;
          order_id?: string | null;
          outcome?: string | null;
          status: string;
          updated_at?: string;
          user_id: string;
          waitlisted_at?: string | null;
        };
        Update: {
          activity_id?: string;
          answers?: Json;
          cancel_reason?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          entitlement_id?: string | null;
          id?: string;
          order_id?: string | null;
          outcome?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          waitlisted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "participations_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_cancelled_by_fkey";
            columns: ["cancelled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_entitlement_id_fkey";
            columns: ["entitlement_id"];
            isOneToOne: false;
            referencedRelation: "entitlements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      platform_settings: {
        Row: {
          bank_account_note: string;
          fee_rate: number;
          id: boolean;
          order_due_hours: number;
          updated_at: string;
        };
        Insert: {
          bank_account_note: string;
          fee_rate: number;
          id?: boolean;
          order_due_hours?: number;
          updated_at?: string;
        };
        Update: {
          bank_account_note?: string;
          fee_rate?: number;
          id?: boolean;
          order_due_hours?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_staff: {
        Row: {
          granted_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          role: string;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "platform_staff_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_interests: {
        Row: {
          created_at: string;
          interest_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          interest_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          interest_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_interests_interest_id_fkey";
            columns: ["interest_id"];
            isOneToOne: false;
            referencedRelation: "interests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          id: string;
          nickname: string;
          onboarded_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          id: string;
          nickname: string;
          onboarded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          id?: string;
          nickname?: string;
          onboarded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      refund_policies: {
        Row: {
          approved_note: string | null;
          effective_from: string;
          id: string;
          rules: Json;
          target_kind: string;
          version: number;
        };
        Insert: {
          approved_note?: string | null;
          effective_from?: string;
          id?: string;
          rules: Json;
          target_kind: string;
          version: number;
        };
        Update: {
          approved_note?: string | null;
          effective_from?: string;
          id?: string;
          rules?: Json;
          target_kind?: string;
          version?: number;
        };
        Relationships: [];
      };
      refunds: {
        Row: {
          amount: number;
          id: string;
          note: string | null;
          order_id: string;
          paid_at: string | null;
          processed_at: string | null;
          processed_by: string | null;
          rate: number;
          reason: string | null;
          requested_at: string;
          requested_by: string;
          status: string;
        };
        Insert: {
          amount: number;
          id?: string;
          note?: string | null;
          order_id: string;
          paid_at?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          rate: number;
          reason?: string | null;
          requested_at?: string;
          requested_by: string;
          status?: string;
        };
        Update: {
          amount?: number;
          id?: string;
          note?: string | null;
          order_id?: string;
          paid_at?: string | null;
          processed_at?: string | null;
          processed_by?: string | null;
          rate?: number;
          reason?: string | null;
          requested_at?: string;
          requested_by?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refunds_processed_by_fkey";
            columns: ["processed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "refunds_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      settlement_items: {
        Row: {
          amount: number;
          fee_amount: number;
          id: string;
          order_id: string | null;
          refund_id: string | null;
          settlement_id: string;
        };
        Insert: {
          amount: number;
          fee_amount: number;
          id?: string;
          order_id?: string | null;
          refund_id?: string | null;
          settlement_id: string;
        };
        Update: {
          amount?: number;
          fee_amount?: number;
          id?: string;
          order_id?: string | null;
          refund_id?: string | null;
          settlement_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlement_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_items_refund_id_fkey";
            columns: ["refund_id"];
            isOneToOne: true;
            referencedRelation: "refunds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlement_items_settlement_id_fkey";
            columns: ["settlement_id"];
            isOneToOne: false;
            referencedRelation: "settlements";
            referencedColumns: ["id"];
          },
        ];
      };
      settlements: {
        Row: {
          created_at: string;
          created_by: string | null;
          fee_amount: number;
          gross_amount: number;
          id: string;
          paid_at: string | null;
          payee_user_id: string;
          payout_amount: number;
          period_end: string;
          period_start: string;
          processed_by: string | null;
          refund_amount: number;
          status: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          fee_amount: number;
          gross_amount: number;
          id?: string;
          paid_at?: string | null;
          payee_user_id: string;
          payout_amount: number;
          period_end: string;
          period_start: string;
          processed_by?: string | null;
          refund_amount: number;
          status?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          fee_amount?: number;
          gross_amount?: number;
          id?: string;
          paid_at?: string | null;
          payee_user_id?: string;
          payout_amount?: number;
          period_end?: string;
          period_start?: string;
          processed_by?: string | null;
          refund_amount?: number;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "settlements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_payee_user_id_fkey";
            columns: ["payee_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "settlements_processed_by_fkey";
            columns: ["processed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _club_admit: {
        Args: { p_club: string; p_invite?: string; p_status: string };
        Returns: string;
      };
      _club_audit: {
        Args: {
          p_action: string;
          p_club: string;
          p_detail?: Json;
          p_target: string;
        };
        Returns: undefined;
      };
      _confirm_participation: {
        Args: { p_order?: string; p_participation: string };
        Returns: undefined;
      };
      _kst_today: { Args: never; Returns: string };
      _layer_permissions: {
        Args: { p_layer: Database["public"]["Tables"]["club_layers"]["Row"] };
        Returns: string[];
      };
      _my_club_layer: {
        Args: { p_club: string };
        Returns: {
          club_id: string;
          id: string;
          kind: string;
          name: string;
          permissions: string[];
          rank: number;
        };
        SetofOptions: {
          from: "*";
          to: "club_layers";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      _promote_waitlist: { Args: { p_activity: string }; Returns: undefined };
      _release_participation: {
        Args: { p_participation: string; p_reason: string };
        Returns: undefined;
      };
      _seats_taken: { Args: { p_activity: string }; Returns: number };
      _start_payment: {
        Args: { p_depositor?: string; p_participation: string };
        Returns: string;
      };
      _write_audit: {
        Args: {
          p_action: string;
          p_activity: string;
          p_detail?: Json;
          p_order?: string;
          p_target: string;
        };
        Returns: undefined;
      };
      activity_create: { Args: { p: Json }; Returns: string };
      activity_create_options: { Args: never; Returns: Json };
      activity_publish: { Args: { p_activity: string }; Returns: string };
      activity_seat_counts: {
        Args: { p_ids: string[] };
        Returns: {
          activity_id: string;
          pending: number;
          taken: number;
          waitlisted: number;
        }[];
      };
      attendance_mark: {
        Args: { p_activity: string; p_status: string; p_user: string };
        Returns: undefined;
      };
      can_manage_activity: { Args: { p_activity: string }; Returns: boolean };
      can_read_activity: { Args: { p_activity: string }; Returns: boolean };
      certification_reject: {
        Args: { p_cert: string; p_reason: string };
        Returns: undefined;
      };
      certification_submit: {
        Args: { p_activity: string; p_body?: string; p_link?: string };
        Returns: undefined;
      };
      challenge_finalize: { Args: { p_activity: string }; Returns: number };
      challenge_progress: {
        Args: { p_activity: string };
        Returns: {
          accepted: number;
          nickname: string;
          outcome: string;
          user_id: string;
        }[];
      };
      club_assign_layer: {
        Args: { p_club: string; p_layer: string; p_user: string };
        Returns: undefined;
      };
      club_ban: { Args: { p_club: string; p_user: string }; Returns: undefined };
      club_create: {
        Args: {
          p_join_mode: string;
          p_name: string;
          p_slug: string;
          p_tagline: string;
        };
        Returns: string;
      };
      club_has_permission: {
        Args: { p_club: string; p_permission: string };
        Returns: boolean;
      };
      club_invite_create: {
        Args: { p_club: string; p_max_uses?: number };
        Returns: string;
      };
      club_invite_preview: { Args: { p_code: string }; Returns: Json };
      club_join: { Args: { p_club: string }; Returns: string };
      club_join_by_invite: { Args: { p_code: string }; Returns: string };
      club_layer_delete: {
        Args: { p_club: string; p_layer: string };
        Returns: number;
      };
      club_layer_save: {
        Args: {
          p_club: string;
          p_layer: string;
          p_name: string;
          p_permissions: string[];
          p_rank: number;
        };
        Returns: string;
      };
      club_leave: { Args: { p_club: string }; Returns: undefined };
      club_member_decide: {
        Args: { p_approve: boolean; p_club: string; p_user: string };
        Returns: undefined;
      };
      club_my_role: { Args: { p_club: string }; Returns: Json };
      get_activity_private: { Args: { p_activity: string }; Returns: Json };
      has_entitlement: {
        Args: { p_activity: string; p_user: string };
        Returns: boolean;
      };
      has_platform_permission: {
        Args: { p_permission: string };
        Returns: boolean;
      };
      is_club_member: { Args: { p_club: string }; Returns: boolean };
      is_confirmed_participant: {
        Args: { p_activity: string; p_user: string };
        Returns: boolean;
      };
      nickname_check: { Args: { p_nickname: string }; Returns: string };
      nickname_is_valid: { Args: { p_nickname: string }; Returns: boolean };
      order_confirm_payment: { Args: { p_order: string }; Returns: undefined };
      orders_expire_overdue: { Args: never; Returns: number };
      participation_apply: {
        Args: { p_activity: string; p_answers?: Json; p_depositor?: string };
        Returns: string;
      };
      participation_cancel: { Args: { p_activity: string }; Returns: undefined };
      participation_decide: {
        Args: { p_approve: boolean; p_participation: string; p_reason?: string };
        Returns: string;
      };
      profile_complete_onboarding: {
        Args: { p_interests: string[]; p_nickname: string };
        Returns: undefined;
      };
      refund_decide: {
        Args: { p_approve: boolean; p_note?: string; p_refund: string };
        Returns: undefined;
      };
      refund_mark_paid: { Args: { p_refund: string }; Returns: undefined };
      refund_quote: { Args: { p_order: string }; Returns: Json };
      refund_request: {
        Args: { p_order: string; p_reason?: string };
        Returns: number;
      };
      sandbox_reseed: { Args: never; Returns: undefined };
      series_attendance: {
        Args: { p_series: string };
        Returns: {
          attended: number;
          held: number;
          nickname: string;
          user_id: string;
        }[];
      };
      settlement_create: {
        Args: { p_end: string; p_payee: string; p_start: string };
        Returns: string;
      };
      settlement_mark_paid: {
        Args: { p_settlement: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
