// MixHub — DB 型定義（supabase/migrations と対応）

export type Strength = 'light' | 'medium' | 'strong'

/** 熱管理カーブの1点: t=経過分, v=火力(1-100), coals=その時点のキューブ炭の個数(任意・玄人向け) */
export type HeatPoint = { t: number; v: number; coals?: number }

/** 炭イベント: t=経過分, type=種別, note=任意メモ */
export type HeatEvent = { t: number; type: string; note?: string }

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
  shop_id: string | null
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
  added_by: string | null
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
  heat_events: HeatEvent[] | null
  hms_type: string | null
  hms_other: string | null
  charcoal_type: string | null
  charcoal_orientation: string | null
  charcoal_count: number | null
  steep_minutes: number | null
  steep_heat: number | null
  wind_cover: boolean | null
  bowl_type: string | null
  pack_style: string | null
  pack_photo_url: string | null
  placement_note: string | null
  like_count: number
  view_count: number
  combo_key: string
  premium: boolean
  price: number | null
  locked_sections: string[]
  created_at: string
}

/** ミックスの追加写真（工程写真など） */
export type MixPhoto = {
  id: number
  mix_id: string
  url: string
  position: number
  created_at: string
}

/** 「作った！」記録 */
export type MixMake = {
  mix_id: string
  user_id: string
  created_at: string
}

/** フレーバー練習ログ（「こする」＝繰り返し研究する非公開ノート） */
export type FlavorLog = {
  id: number
  user_id: string
  flavor_id: string
  logged_at: string
  hms_type: string | null
  charcoal_type: string | null
  steep_minutes: number | null
  steep_heat: number | null
  pack_style: string | null
  rating: number | null
  result_note: string | null
  change_note: string | null
  is_best: boolean
  is_public: boolean
  created_at: string
}

/** 「参考になった」記録 */
export type FlavorLogHelpful = {
  log_id: number
  user_id: string
  created_at: string
}

/** 公開研究メモの表示用（投稿者＋参考になった） */
export type FlavorLogWithAuthor = FlavorLog & {
  author: MixAuthor | null
  helpful_count: number
  my_helpful: boolean
}

/** フレーバー評価（★1-5） */
export type FlavorRating = {
  flavor_id: string
  user_id: string
  rating: number
  created_at: string
}

/** 有料ノートの解錠記録 */
export type MixUnlock = {
  mix_id: string
  user_id: string
  created_at: string
}

export type Comment = {
  id: string
  mix_id: string
  user_id: string
  body: string
  parent_id: string | null
  created_at: string
}

export type CommentLike = {
  comment_id: string
  user_id: string
  created_at: string
}

export type CommentWithAuthor = Comment & { author: MixAuthor | null }

/** 表示用：コメント＋いいね数＋自分のいいね＋返信（1段） */
export type CommentNode = CommentWithAuthor & {
  like_count: number
  my_liked: boolean
  replies: CommentNode[]
}

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

export type Shelf = {
  user_id: string
  flavor_id: string
  created_at: string
}

/** お店（独立エンティティ）。owner_id = 登録した個人アカウント */
export type Shop = {
  id: string
  name: string
  area: string | null
  url: string | null
  description: string | null
  owner_id: string
  created_at: string
}

export type ShopMemberRole = 'owner' | 'staff'
export type ShopMemberStatus = 'pending' | 'approved'

/** 個人アカウント ↔ お店 の所属（オーナー承認制） */
export type ShopMember = {
  shop_id: string
  user_id: string
  role: ShopMemberRole
  status: ShopMemberStatus
  created_at: string
}

/** 一覧表示用：店＋在庫数＋所属人数 */
export type ShopWithCounts = Shop & { flavor_count: number; member_count: number }

/** 所属メンバー（表示用にプロフィール付き） */
export type ShopMemberWithUser = ShopMember & { user: MixAuthor | null }

/** 自分のあるお店への所属状態 */
export type MyMembership = { role: ShopMemberRole; status: ShopMemberStatus } | null

/** 店舗の在庫棚（公開）。shop_id = shops.id */
export type ShopFlavor = {
  shop_id: string
  flavor_id: string
  created_at: string
}

/** 通知（いいね・コメント・フォロー） */
export type Notification = {
  id: number
  user_id: string
  actor_id: string | null
  type: 'like' | 'comment' | 'follow' | string
  mix_id: string | null
  comment_id: string | null
  read: boolean
  created_at: string
}

/** 表示用：通知＋行為者＋対象ミックス */
export type NotificationWithContext = Notification & {
  actor: MixAuthor | null
  mix: Pick<Mix, 'id' | 'title'> | null
}

/** 通報（不適切コンテンツ） */
export type Report = {
  id: number
  reporter_id: string
  mix_id: string | null
  comment_id: string | null
  reason: string | null
  created_at: string
}

/** 意見箱（改修要望） */
export type IdeaStatus = 'open' | 'considering' | 'done' | 'declined'
export type Idea = {
  id: number
  user_id: string | null
  title: string
  body: string | null
  status: string
  created_at: string
}
export type IdeaVote = {
  idea_id: number
  user_id: string
  value: number
  created_at: string
}
/** 表示用：意見＋投稿者＋投票集計 */
export type IdeaWithVotes = Idea & {
  author: MixAuthor | null
  up: number
  down: number
  myVote: number
  score: number
}

/** クリック計測（アフィリエイト等の送客ログ） */
export type LinkClick = {
  id: number
  user_id: string | null
  flavor_id: string | null
  mix_id: string | null
  shop_id: string | null
  target: string
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

/** あと1フレーバーで作れるコンボ（不足している1品を提示） */
export type NearMakeable = {
  combo: ComboSummary
  missing: { brand: string | null; name: string; flavorId: string | null }
}

// Combo（組み合わせ）= 同じフレーバー種類の作り方（Method）を束ねたもの
export type ComboSummary = {
  key: string
  slug: string
  flavorNames: string[]
  methodCount: number
  totalLikes: number
  totalViews: number
  topScore: number
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
      shelf: Tbl<Shelf>
      shops: Tbl<Shop>
      shop_members: Tbl<ShopMember>
      shop_flavors: Tbl<ShopFlavor>
      link_clicks: Tbl<LinkClick>
      mix_unlocks: Tbl<MixUnlock>
      notifications: Tbl<Notification>
      reports: Tbl<Report>
      mix_makes: Tbl<MixMake>
      flavor_ratings: Tbl<FlavorRating>
      comment_likes: Tbl<CommentLike>
      flavor_logs: Tbl<FlavorLog>
      flavor_log_helpful: Tbl<FlavorLogHelpful>
      mix_photos: Tbl<MixPhoto>
      ideas: Tbl<Idea>
      idea_votes: Tbl<IdeaVote>
    }
    Views: Record<string, never>
    Functions: {
      increment_view: { Args: { p_mix_id: string }; Returns: undefined }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      review_pro_application: { Args: { p_app_id: string; p_approve: boolean }; Returns: undefined }
      transfer_shop_ownership: { Args: { p_shop_id: string; p_new_owner: string }; Returns: undefined }
      notify: { Args: { p_recipient: string; p_type: string; p_mix?: string; p_comment?: string }; Returns: undefined }
    }
    Enums: Record<string, never>
  }
}
