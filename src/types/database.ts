export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'admin' | 'user'
export type AssessmentStatus = 'draft' | 'submitted' | 'revision_requested' | 'approved'
export type PeriodStatus = 'open' | 'closed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nama: string
          no_hp: string | null
          foto_url: string | null
          role: UserRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nama: string
          no_hp?: string | null
          foto_url?: string | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nama?: string
          no_hp?: string | null
          foto_url?: string | null
          role?: UserRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          nama: string
          kode: string
          ketua_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nama: string
          kode: string
          ketua_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nama?: string
          kode?: string
          ketua_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_ketua_id_fkey"
            columns: ["ketua_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      members: {
        Row: {
          id: string
          department_id: string
          nama: string
          nip: string | null
          jabatan: string
          no_hp: string | null
          is_active: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department_id: string
          nama: string
          nip?: string | null
          jabatan: string
          no_hp?: string | null
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department_id?: string
          nama?: string
          nip?: string | null
          jabatan?: string
          no_hp?: string | null
          is_active?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      assessment_aspects: {
        Row: {
          id: string
          nama: string
          deskripsi: string | null
          urutan: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nama: string
          deskripsi?: string | null
          urutan?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nama?: string
          deskripsi?: string | null
          urutan?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_periods: {
        Row: {
          id: string
          nama: string
          tanggal_mulai: string
          tanggal_akhir: string
          status: PeriodStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nama: string
          tanggal_mulai: string
          tanggal_akhir: string
          status?: PeriodStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nama?: string
          tanggal_mulai?: string
          tanggal_akhir?: string
          status?: PeriodStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          id: string
          period_id: string
          member_id: string
          department_id: string
          evaluator_id: string
          status: AssessmentStatus
          catatan: string | null
          skor_rata: number | null
          submitted_at: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          period_id: string
          member_id: string
          department_id: string
          evaluator_id: string
          status?: AssessmentStatus
          catatan?: string | null
          skor_rata?: number | null
          submitted_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          period_id?: string
          member_id?: string
          department_id?: string
          evaluator_id?: string
          status?: AssessmentStatus
          catatan?: string | null
          skor_rata?: number | null
          submitted_at?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "assessment_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      assessment_scores: {
        Row: {
          id: string
          assessment_id: string
          aspect_id: string
          nilai: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          aspect_id: string
          nilai: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          aspect_id?: string
          nilai?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_scores_aspect_id_fkey"
            columns: ["aspect_id"]
            isOneToOne: false
            referencedRelation: "assessment_aspects"
            referencedColumns: ["id"]
          }
        ]
      }
      assessment_comments: {
        Row: {
          id: string
          assessment_id: string
          author_id: string
          parent_id: string | null
          isi: string
          dibaca_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          author_id: string
          parent_id?: string | null
          isi: string
          dibaca_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          author_id?: string
          parent_id?: string | null
          isi?: string
          dibaca_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_comments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "assessment_comments"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          aktor_id: string | null
          aksi: string
          tabel: string
          record_id: string | null
          data_lama: Json | null
          data_baru: Json | null
          waktu: string
        }
        Insert: {
          id?: string
          aktor_id?: string | null
          aksi: string
          tabel: string
          record_id?: string | null
          data_lama?: Json | null
          data_baru?: Json | null
          waktu?: string
        }
        Update: {
          id?: string
          aktor_id?: string | null
          aksi?: string
          tabel?: string
          record_id?: string | null
          data_lama?: Json | null
          data_baru?: Json | null
          waktu?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_aktor_id_fkey"
            columns: ["aktor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      current_department_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: UserRole
      assessment_status: AssessmentStatus
      period_status: PeriodStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Department = Database["public"]["Tables"]["departments"]["Row"]
export type Member = Database["public"]["Tables"]["members"]["Row"]
export type AssessmentAspect = Database["public"]["Tables"]["assessment_aspects"]["Row"]
export type AssessmentPeriod = Database["public"]["Tables"]["assessment_periods"]["Row"]
export type Assessment = Database["public"]["Tables"]["assessments"]["Row"]
export type AssessmentScore = Database["public"]["Tables"]["assessment_scores"]["Row"]
export type AssessmentComment = Database["public"]["Tables"]["assessment_comments"]["Row"]
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"]
