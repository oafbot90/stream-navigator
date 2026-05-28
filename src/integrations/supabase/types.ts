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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_avatars: {
        Row: {
          color: string
          created_at: string
          id: string
          is_premium: boolean
          name: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          name: string
          position?: number
          updated_at?: string
          url: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          name?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string | null
          force_update: boolean
          id: string
          latest_version: string
          min_version: string
          store_url_android: string | null
          store_url_ios: string | null
          update_message: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          force_update?: boolean
          id?: string
          latest_version?: string
          min_version?: string
          store_url_android?: string | null
          store_url_ios?: string | null
          update_message?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          force_update?: boolean
          id?: string
          latest_version?: string
          min_version?: string
          store_url_android?: string | null
          store_url_ios?: string | null
          update_message?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      app_releases: {
        Row: {
          apk_url: string
          changelog: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_android: string | null
          screenshots: Json
          size_mb: number | null
          updated_at: string
          version: string
        }
        Insert: {
          apk_url: string
          changelog?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_android?: string | null
          screenshots?: Json
          size_mb?: number | null
          updated_at?: string
          version: string
        }
        Update: {
          apk_url?: string
          changelog?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_android?: string | null
          screenshots?: Json
          size_mb?: number | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          content_id: string
          content_title: string
          content_type: string
          created_at: string
          id: string
          message: string | null
          report_type: string
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          content_title: string
          content_type: string
          created_at?: string
          id?: string
          message?: string | null
          report_type: string
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          content_title?: string
          content_type?: string
          created_at?: string
          id?: string
          message?: string | null
          report_type?: string
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_room_limits: {
        Row: {
          created_date: string
          id: string
          rooms_created: number
          user_id: string
        }
        Insert: {
          created_date?: string
          id?: string
          rooms_created?: number
          user_id: string
        }
        Update: {
          created_date?: string
          id?: string
          rooms_created?: number
          user_id?: string
        }
        Relationships: []
      }
      episode_streams: {
        Row: {
          created_at: string | null
          episode_id: string
          id: string
          last_checked_at: string | null
          quality: string | null
          status: string | null
          stream_type: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          episode_id: string
          id?: string
          last_checked_at?: string | null
          quality?: string | null
          status?: string | null
          stream_type?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          episode_id?: string
          id?: string
          last_checked_at?: string | null
          quality?: string | null
          status?: string | null
          stream_type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_streams_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "series_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          added_at: string | null
          content_id: string
          content_type: string
          id: string
          poster_path: string | null
          profile_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          content_id: string
          content_type: string
          id?: string
          poster_path?: string | null
          profile_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          content_id?: string
          content_type?: string
          id?: string
          poster_path?: string | null
          profile_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slider: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          movie_id: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          movie_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          movie_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_slider_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: true
            referencedRelation: "movies_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      livetv_categories: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      livetv_channels: {
        Row: {
          category: string
          created_at: string
          format: string | null
          id: string
          logo: string | null
          name: string
          slug: string
          status: string | null
          stream_url: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          format?: string | null
          id?: string
          logo?: string | null
          name: string
          slug: string
          status?: string | null
          stream_url: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          format?: string | null
          id?: string
          logo?: string | null
          name?: string
          slug?: string
          status?: string | null
          stream_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      marathon_items: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          marathon_id: string
          position: number
          poster_path: string | null
          title: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          marathon_id: string
          position?: number
          poster_path?: string | null
          title: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          marathon_id?: string
          position?: number
          poster_path?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "marathon_items_marathon_id_fkey"
            columns: ["marathon_id"]
            isOneToOne: false
            referencedRelation: "marathons"
            referencedColumns: ["id"]
          },
        ]
      }
      marathons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          position: number
          poster_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          poster_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          position?: number
          poster_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      movie_streams: {
        Row: {
          created_at: string | null
          id: string
          last_checked_at: string | null
          movie_id: string
          quality: string | null
          status: string | null
          stream_type: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_checked_at?: string | null
          movie_id: string
          quality?: string | null
          status?: string | null
          stream_type?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_checked_at?: string | null
          movie_id?: string
          quality?: string | null
          status?: string | null
          stream_type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_streams_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      movies_catalog: {
        Row: {
          adult: boolean | null
          available_at: string | null
          backdrop_path: string | null
          content_type: string | null
          created_at: string | null
          genres: string[] | null
          has_stream: boolean
          homepage: string | null
          id: string
          imdb_id: string | null
          original_language: string | null
          original_title: string | null
          overview: string | null
          popularity: number | null
          poster_path: string | null
          release_date: string | null
          release_year: number | null
          runtime: number | null
          source: string | null
          status: string | null
          tagline: string | null
          title: string
          tmdb_id: number | null
          updated_at: string | null
          vote_average: number | null
          vote_count: number | null
        }
        Insert: {
          adult?: boolean | null
          available_at?: string | null
          backdrop_path?: string | null
          content_type?: string | null
          created_at?: string | null
          genres?: string[] | null
          has_stream?: boolean
          homepage?: string | null
          id?: string
          imdb_id?: string | null
          original_language?: string | null
          original_title?: string | null
          overview?: string | null
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          release_year?: number | null
          runtime?: number | null
          source?: string | null
          status?: string | null
          tagline?: string | null
          title: string
          tmdb_id?: number | null
          updated_at?: string | null
          vote_average?: number | null
          vote_count?: number | null
        }
        Update: {
          adult?: boolean | null
          available_at?: string | null
          backdrop_path?: string | null
          content_type?: string | null
          created_at?: string | null
          genres?: string[] | null
          has_stream?: boolean
          homepage?: string | null
          id?: string
          imdb_id?: string | null
          original_language?: string | null
          original_title?: string | null
          overview?: string | null
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          release_year?: number | null
          runtime?: number | null
          source?: string | null
          status?: string | null
          tagline?: string | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string | null
          vote_average?: number | null
          vote_count?: number | null
        }
        Relationships: []
      }
      payments_logs: {
        Row: {
          created_at: string
          data: string
          id: string
          link_pagamento: string | null
          payment_id: string | null
          status_pagamento: string
          subscription_id: string | null
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          link_pagamento?: string | null
          payment_id?: string | null
          status_pagamento?: string
          subscription_id?: string | null
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          link_pagamento?: string | null
          payment_id?: string | null
          status_pagamento?: string
          subscription_id?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_keys: {
        Row: {
          created_at: string
          created_by: string | null
          duration_days: number
          id: string
          is_used: boolean
          key_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_days?: number
          id?: string
          is_used?: boolean
          key_code: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_days?: number
          id?: string
          is_used?: boolean
          key_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      profile_backgrounds: {
        Row: {
          created_at: string
          id: string
          is_premium: boolean
          name: string
          orientation: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_premium?: boolean
          name: string
          orientation?: string
          position?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_premium?: boolean
          name?: string
          orientation?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      profile_banners: {
        Row: {
          created_at: string
          id: string
          is_animated: boolean
          is_premium: boolean
          name: string
          position: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_animated?: boolean
          is_premium?: boolean
          name: string
          position?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_animated?: boolean
          is_premium?: boolean
          name?: string
          position?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      profile_decorations: {
        Row: {
          created_at: string
          id: string
          is_animated: boolean
          is_premium: boolean
          name: string
          position: number
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_animated?: boolean
          is_premium?: boolean
          name: string
          position?: number
          type?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_animated?: boolean
          is_premium?: boolean
          name?: string
          position?: number
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      release_calendar: {
        Row: {
          backdrop_url: string | null
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          episode_number: number | null
          id: string
          poster_url: string | null
          release_date: string
          season_number: number | null
          title: string
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          episode_number?: number | null
          id?: string
          poster_url?: string | null
          release_date: string
          season_number?: number | null
          title: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          episode_number?: number | null
          id?: string
          poster_url?: string | null
          release_date?: string
          season_number?: number | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      series_catalog: {
        Row: {
          available_at: string | null
          backdrop_path: string | null
          content_type: string | null
          created_at: string | null
          genres: string[] | null
          id: string
          imdb_id: string | null
          original_language: string | null
          original_title: string | null
          overview: string | null
          popularity: number | null
          poster_path: string | null
          release_date: string | null
          release_year: number | null
          title: string
          tmdb_id: number | null
          updated_at: string | null
          vote_average: number | null
          vote_count: number | null
        }
        Insert: {
          available_at?: string | null
          backdrop_path?: string | null
          content_type?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          imdb_id?: string | null
          original_language?: string | null
          original_title?: string | null
          overview?: string | null
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          release_year?: number | null
          title: string
          tmdb_id?: number | null
          updated_at?: string | null
          vote_average?: number | null
          vote_count?: number | null
        }
        Update: {
          available_at?: string | null
          backdrop_path?: string | null
          content_type?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          imdb_id?: string | null
          original_language?: string | null
          original_title?: string | null
          overview?: string | null
          popularity?: number | null
          poster_path?: string | null
          release_date?: string | null
          release_year?: number | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string | null
          vote_average?: number | null
          vote_count?: number | null
        }
        Relationships: []
      }
      series_episodes: {
        Row: {
          air_date: string | null
          created_at: string | null
          episode_number: number
          has_stream: boolean
          id: string
          season_number: number
          series_id: string
          still_path: string | null
          stream_count: number
          title: string
          updated_at: string | null
        }
        Insert: {
          air_date?: string | null
          created_at?: string | null
          episode_number: number
          has_stream?: boolean
          id?: string
          season_number: number
          series_id: string
          still_path?: string | null
          stream_count?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          air_date?: string | null
          created_at?: string | null
          episode_number?: number
          has_stream?: boolean
          id?: string
          season_number?: number
          series_id?: string
          still_path?: string | null
          stream_count?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_check_cursor: {
        Row: {
          current_offset: number
          table_name: string
          total_rows: number
          updated_at: string | null
        }
        Insert: {
          current_offset?: number
          table_name: string
          total_rows?: number
          updated_at?: string | null
        }
        Update: {
          current_offset?: number
          table_name?: string
          total_rows?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          access_token: string | null
          created_at: string
          data_inicio: string | null
          data_vencimento: string | null
          id: string
          pagamento_link: string | null
          plano: string
          purchase_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          data_inicio?: string | null
          data_vencimento?: string | null
          id?: string
          pagamento_link?: string | null
          plano: string
          purchase_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          data_inicio?: string | null
          data_vencimento?: string | null
          id?: string
          pagamento_link?: string | null
          plano?: string
          purchase_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          conteudo_assistido: Json | null
          generos_preferidos: Json | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo_assistido?: Json | null
          generos_preferidos?: Json | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo_assistido?: Json | null
          generos_preferidos?: Json | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          background_url: string | null
          banner_id: string | null
          banner_url: string | null
          created_at: string
          decoration_id: string | null
          decoration_url: string | null
          id: string
          is_kids_profile: boolean | null
          name: string
          pin: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          background_url?: string | null
          banner_id?: string | null
          banner_url?: string | null
          created_at?: string
          decoration_id?: string | null
          decoration_url?: string | null
          id?: string
          is_kids_profile?: boolean | null
          name: string
          pin?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          background_url?: string | null
          banner_id?: string | null
          banner_url?: string | null
          created_at?: string
          decoration_id?: string | null
          decoration_url?: string | null
          id?: string
          is_kids_profile?: boolean | null
          name?: string
          pin?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "profile_banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_decoration_id_fkey"
            columns: ["decoration_id"]
            isOneToOne: false
            referencedRelation: "profile_decorations"
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
      watch_history: {
        Row: {
          episode_id: string
          id: string
          profile_id: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          episode_id: string
          id?: string
          profile_id: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          episode_id?: string
          id?: string
          profile_id?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watched_content: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          episode: number | null
          id: string
          last_position: number | null
          poster_path: string | null
          profile_id: string | null
          progress_percent: number | null
          season: number | null
          title: string
          updated_at: string | null
          user_id: string
          watched_at: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          episode?: number | null
          id?: string
          last_position?: number | null
          poster_path?: string | null
          profile_id?: string | null
          progress_percent?: number | null
          season?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          watched_at?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          episode?: number | null
          id?: string
          last_position?: number | null
          poster_path?: string | null
          profile_id?: string | null
          progress_percent?: number | null
          season?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watched_content_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      items_without_streams: {
        Row: {
          edit_link: string | null
          id: string | null
          poster_path: string | null
          status: string | null
          title: string | null
          type: string | null
        }
        Relationships: []
      }
      stream_status_view: {
        Row: {
          id: string | null
          poster_path: string | null
          status: string | null
          title: string | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_stream_check: {
        Args: { p_limit?: number; p_table: string }
        Returns: undefined
      }
      f_unaccent: { Args: { "": string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_movies_unaccent: {
        Args: { lim?: number; q: string }
        Returns: {
          adult: boolean | null
          available_at: string | null
          backdrop_path: string | null
          content_type: string | null
          created_at: string | null
          genres: string[] | null
          has_stream: boolean
          homepage: string | null
          id: string
          imdb_id: string | null
          original_language: string | null
          original_title: string | null
          overview: string | null
          popularity: number | null
          poster_path: string | null
          release_date: string | null
          release_year: number | null
          runtime: number | null
          source: string | null
          status: string | null
          tagline: string | null
          title: string
          tmdb_id: number | null
          updated_at: string | null
          vote_average: number | null
          vote_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "movies_catalog"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_series_unaccent: {
        Args: { lim?: number; q: string }
        Returns: {
          available_at: string | null
          backdrop_path: string | null
          content_type: string | null
          created_at: string | null
          genres: string[] | null
          id: string
          imdb_id: string | null
          original_language: string | null
          original_title: string | null
          overview: string | null
          popularity: number | null
          poster_path: string | null
          release_date: string | null
          release_year: number | null
          title: string
          tmdb_id: number | null
          updated_at: string | null
          vote_average: number | null
          vote_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "series_catalog"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
