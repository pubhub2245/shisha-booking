// 煙道 — DB 型定義（supabase/migrations と対応）

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
  is_founder: boolean
  ui_mode: 'simple' | 'pro' | null
  shop_name: string | null
  shop_area: string | null
  shop_url: string | null
  pinned_mix_id: string | null
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
  title: string | null
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
  // 機材・ギア（投稿映え）
  gear_stem: string | null
  gear_bowl_name: string | null
  gear_hms_name: string | null
  gear_charcoal: string | null
  base_liquid: string | null
  // こだわり・核心（ロック対象になりうる）
  prep_note: string | null
  ratio_reason: string | null
  serve_note: string | null
  like_count: number
  view_count: number
  combo_key: string
  hidden: boolean
  premium: boolean
  price: number | null
  locked_sections: string[]
  hidden_sections: string[]
  unlock_at: string | null
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

/** 実体験ログ：吸った(smoked)/作ってみた(made)。同一ユーザーが同一 mix を何度でも記録可。 */
export type ExperienceType = 'smoked' | 'made'
export type VerificationType = 'self' | 'shop_qr' | 'admin'
export type Verdict = 'again' | 'good' | 'ok' | 'not_for_me'
export type MixExperience = {
  id: string
  user_id: string
  mix_id: string
  experience_type: ExperienceType
  verification_type: VerificationType
  verified_at: string | null
  shop_id: string | null
  verdict: Verdict | null
  occurred_at: string
  created_at: string
  note: string | null
}

/** 味覚5軸：実際に吸った体験に紐づく味の強度（1体験1件・上書きしない） */
export type TasteEvaluation = {
  experience_id: string
  sweetness: number | null
  coolness: number | null
  sourness: number | null
  richness: number | null
  heaviness: number | null
  created_at: string
}

/** 推薦：運営・認証プロによる「この作り方を推薦する」記録（公式王道とは別概念） */
export type MethodRecommendation = {
  id: string
  mix_id: string
  proposed_by: string
  note: string | null
  created_at: string
}

/** 公式王道：1つの combo_key につき最大1件。認定事実のみを持ち、変動値は保存しない。 */
export type ComboOrthodoxy = {
  combo_key: string
  mix_id: string
  certified_by: string
  certified_at: string
  created_at: string
  updated_at: string
}

/** 王道の変遷（監査用・V1では一般UIに出さない） */
export type ComboOrthodoxyHistory = {
  id: string
  combo_key: string
  mix_id: string
  action: 'certified' | 'replaced' | 'revoked'
  changed_by: string | null
  event_at: string
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
  shop_id: string | null
  created_at: string
}

/** 賄いシーシャの記録（店に共有された練習ログ・オーナー閲覧用） */
export type MakanaiLog = FlavorLog & {
  author: MixAuthor | null
  flavor: { brand: string; name: string } | null
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
  hidden: boolean
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
  prefecture: string | null
  lat: number | null
  lng: number | null
  geo_radius_m: number
  created_at: string
}

/** 地域別ランキングのお店1件（実地評価＋所属作り手の支持からスコア化） */
export type ShopRankItem = {
  shop: Shop
  onsite: number // このお店で記録された実地評価の総数
  supporters: number // 所属作り手のミックスのいいね＋作った（表示用）
  score: number // onsite×5 + いいね + 作った×2
  topMix: MixWithRelations | null // このお店の代表作（最高スコアのミックス）
}

/** 地域別ミックス1件（スコア付き） */
export type RegionMix = { mix: MixWithRelations; score: number; onsite: number; prefecture: string }

/** 1地方ぶんのランキング */
export type RegionRanking = {
  region: string
  emoji: string
  shops: ShopRankItem[]
  mixes: RegionMix[]
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
  category: string
  created_at: string
}
export type IdeaVote = {
  idea_id: number
  user_id: string
  value: number
  reason: string | null
  created_at: string
}
/** 意見箱の議論コメント */
export type IdeaComment = {
  id: number
  idea_id: number
  user_id: string | null
  body: string
  is_ai: boolean
  created_at: string
}
export type IdeaCommentWithAuthor = IdeaComment & { author: MixAuthor | null }

/** AI 仲裁案（落とし所） */
export type IdeaArbitration = {
  idea_id: number
  summary: string
  created_at: string
  updated_at: string
}

/** 表示用：意見＋投稿者＋投票集計（反対理由付き）＋議論＋AI仲裁 */
export type IdeaWithVotes = Idea & {
  author: MixAuthor | null
  up: number
  down: number
  myVote: number
  score: number
  downReasons: string[]
  comments: IdeaCommentWithAuthor[]
  arbitration: IdeaArbitration | null
}

/** 公募ネーミング：ミックスの愛称案 */
export type MixName = {
  id: number
  mix_id: string
  user_id: string | null
  name: string
  created_at: string
}
/** 表示用：名前案＋投票数＋自分の投票 */
export type MixNameWithVotes = MixName & {
  author: MixAuthor | null
  votes: number
  myVote: boolean
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

/** 日本代表（殿堂）：系統ごとに選出された代表ミックス */
export type NationalRep = {
  category: string // 系統（TYPE_TAG）
  mix: MixWithRelations
  score: number
  likes: number
  makes: number
  onsite: number // 実地評価（現地で実物を吸って評価した人数）
  sample: boolean // 本物レシピがまだ無く、AI生成サンプルが暫定代表か
}

/** 実地評価の表示コンテキスト（ミックス詳細で使用） */
export type OnsiteContext = {
  count: number // 確定した評価の数（採点済み）
  avg: number | null // 平均★（採点済みのみ）
  myState: 'none' | 'waiting' | 'can_rate' | 'rated' // 自分の状態
  myScore: number | null // 自分がつけた★（採点済みのとき）
  availableAt: string | null // waiting のとき、採点できるようになる時刻(ISO)
  isOwn: boolean // 自分の投稿か（自己評価は不可）
  isSample: boolean // 編集部サンプルか
  shops: { id: string; name: string; area: string | null }[] // 位置登録済みの投稿者の店
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
      mix_makes_legacy: Tbl<MixMake>
      mix_experiences: Tbl<MixExperience>
      taste_evaluations: Tbl<TasteEvaluation>
      method_recommendations: Tbl<MethodRecommendation>
      combo_orthodoxy: Tbl<ComboOrthodoxy>
      combo_orthodoxy_history: Tbl<ComboOrthodoxyHistory>
      flavor_ratings: Tbl<FlavorRating>
      comment_likes: Tbl<CommentLike>
      flavor_logs: Tbl<FlavorLog>
      flavor_log_helpful: Tbl<FlavorLogHelpful>
      mix_photos: Tbl<MixPhoto>
      ideas: Tbl<Idea>
      idea_votes: Tbl<IdeaVote>
      idea_comments: Tbl<IdeaComment>
      idea_arbitrations: Tbl<IdeaArbitration>
      mix_names: Tbl<MixName>
      mix_name_votes: Tbl<{ name_id: number; user_id: string; created_at: string }>
      mix_onsite_ratings: Tbl<{
        mix_id: string
        user_id: string
        shop_id: string | null
        created_at: string
        rated_at: string | null
        score: number | null
        comment: string | null
      }>
    }
    Views: Record<string, never>
    Functions: {
      increment_view: { Args: { p_mix_id: string }; Returns: undefined }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      review_pro_application: { Args: { p_app_id: string; p_approve: boolean }; Returns: undefined }
      transfer_shop_ownership: { Args: { p_shop_id: string; p_new_owner: string }; Returns: undefined }
      notify: { Args: { p_recipient: string; p_type: string; p_mix?: string; p_comment?: string }; Returns: undefined }
      save_arbitration: { Args: { p_idea_id: number; p_summary: string }; Returns: undefined }
      refresh_national_reps: { Args: Record<string, never>; Returns: undefined }
      mix_made_status: {
        Args: { p_mix: string }
        Returns: { made_count: number; maker_count: number; made: boolean }[]
      }
      mix_smoke_status: {
        Args: { p_mix: string }
        Returns: {
          smoke_count: number
          smoker_count: number
          mine: boolean
          my_id: string | null
          my_verdict: string | null
        }[]
      }
      mix_made_counts: { Args: Record<string, never>; Returns: { mix_id: string; maker_count: number }[] }
      author_made_total: { Args: { p_author: string }; Returns: number }
      can_recommend: { Args: Record<string, never>; Returns: boolean }
      author_endo_stats: {
        Args: { p_author: string }
        Returns: {
          method_count: number; orthodoxy_count: number
          smoke_count: number; smoker_count: number
          made_count: number; maker_count: number
        }[]
      }
      mix_taste_summary: {
        Args: { p_mix: string }
        Returns: {
          sweetness_avg: number | null; sweetness_count: number
          coolness_avg: number | null; coolness_count: number
          sourness_avg: number | null; sourness_count: number
          richness_avg: number | null; richness_count: number
          heaviness_avg: number | null; heaviness_count: number
          rater_count: number
        }[]
      }
      certify_orthodoxy: { Args: { p_mix: string; p_combo_key?: string | null }; Returns: undefined }
      revoke_orthodoxy: { Args: { p_combo_key: string }; Returns: undefined }
      onsite_checkin: {
        Args: { p_mix_id: string; p_lat: number; p_lng: number }
        Returns: Record<string, unknown>
      }
      onsite_rate: {
        Args: { p_mix_id: string; p_score: number; p_comment: string | null }
        Returns: Record<string, unknown>
      }
    }
    Enums: Record<string, never>
  }
}
