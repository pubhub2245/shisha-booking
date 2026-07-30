// MixHub — DB 型定義（supabase/migrations と対応）

export type Strength = 'light' | 'medium' | 'strong'

/** 熱管理カーブの1点: t=経過分, v=火力(1-5) */
export type HeatPoint = { t: number; v: number }

// interface ではなく type で宣言する（Record<string, unknown> への代入性のため。
// supabase-js の GenericSchema 制約を満たすのに必要）。
export type Profile = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_shop: boolean
  is_pro: boolean
  is_admin: boolean
  shop_name: string | null
  shop_area: string | null
  shop_url: string | null
  created_at: string
}

export type ProApplicationStatus = 'pending' | 'approved' | 'rejected'

export type ProApplication = {
  id: string
  user_id: string
  sns_type: 'x' | 'instagram'
  sns_handle: string
  shop_name: string
  message: string | null
  status: ProApplicationStatus
  created_at: string
  reviewed_at: string | null
}

export type ProApplicationWithUser = ProApplication & { user: MixAuthor | null }

export type Flavor = {
  id: string
  brand: string
  name: string
  affiliate_url: string | null
  image_url: string | null
  created_at: string
}

export type Mix = {
  id: string
  author_id: string | null
  title: string
  description: string | null
  taste_tags: string[]
  strength: Strength | null
  heat_management: string | null
  heat_curve: HeatPoint[] | null
  placement_note: string | null
  like_count: number
  view_count: number
  combo_key: string
  created_at: string
}

export type Comment = {
  id: string
  mix_id: string
  user_id: string
  body: string
  created_at: string
}

export type CommentWithAuthor = Comment & { author: MixAuthor | null }

export type Bookmark = {
  mix_id: string
  user_id: string
  created_at: string
}

export type Follow = {
  follower_id: string
  following_id: string
  created_at: string
}

export type MixFlavor = {
  id: string
  mix_id: string
  flavor_id: string | null
  position: number
  brand: string | null
  name: string
  ratio: number | null
  placement: string | null
  affiliate_url: string | null
  created_at: string
}

export type Like = {
  mix_id: string
  user_id: string
  created_at: string
}

// join した表示用
export type MixAuthor = Pick<
  Profile,
  'id' | 'username' | 'display_name' | 'is_shop' | 'is_pro' | 'shop_name'
>

export type MixWithRelations = Mix & {
  author: MixAuthor | null
  mix_flavors: MixFlavor[]
}

// Combo（組み合わせ）= 同じフレーバー種類の作り方（Method）を束ねたもの
export type ComboSummary = {
  key: string
  slug: string
  flavorNames: string[]
  methodCount: number
  totalLikes: number
  tags: string[]
  top: MixWithRelations
  latest: string
}

// Supabase Database 型（最小限 / 手書き）
// Insert/Update はゆるめ（Record）にしておく — supabase-js のジェネリクスと相性が良い。
type Tbl<R> = {
  Row: R
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: Tbl<Profile>
      flavors: Tbl<Flavor>
      mixes: Tbl<Mix>
      mix_flavors: Tbl<MixFlavor>
      likes: Tbl<Like>
      comments: Tbl<Comment>
      bookmarks: Tbl<Bookmark>
      follows: Tbl<Follow>
      pro_applications: Tbl<ProApplication>
    }
    Views: Record<string, never>
    Functions: {
      increment_view: { Args: { p_mix_id: string }; Returns: undefined }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      review_pro_application: { Args: { p_app_id: string; p_approve: boolean }; Returns: undefined }
    }
    Enums: Record<string, never>
  }
}
