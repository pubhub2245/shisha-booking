import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getMixById,
  getLikedMixIds,
  getBookmarkedMixIds,
  getMixComments,
  getRelatedMixes,
  isMixUnlocked,
  getMadeStatus,
  getSmokeStatus,
  getThemeOverview,
  getMyThemeMade,
  getOrthodoxyStatus,
  getTasteSummary,
  getMixPhotos,
  getNationalRepCategories,
  getMixNames,
  getOnsiteContext,
  getRegionRepLabel,
  getComboBySlug,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { LikeButton } from '@/components/like-button'
import { BookmarkButton } from '@/components/bookmark-button'
import { MadeButton, type MadeThemeContext } from '@/components/made-button'
import { FIRST_THEME, THEME_PATH, isThemeCombo } from '@/lib/theme'
import { rankNextCandidates, describeDiff, diffMeaning } from '@/lib/method-diff'
import { SmokedButton } from '@/components/smoked-button'
import { RecommendButton } from '@/components/recommend-button'
import { TasteSummaryView } from '@/components/taste-summary'
import { ShareBar } from '@/components/share-bar'
import { ReportButton } from '@/components/report-button'
import { VerifiedBadge } from '@/components/verified-badge'
import { HeatCurveChart } from '@/components/heat-curve-chart'
import { hmsOption, hmsBowls, charcoalLabel, windCoverLabel, bowlOption, packOption, orientationLabel } from '@/lib/heat'
import { HmsIcon } from '@/components/hms-icon'
import { BowlIcon } from '@/components/bowl-icon'
import { PackIcon } from '@/components/pack-icon'
import { Avatar } from '@/components/avatar'
import { CompletenessMeter } from '@/components/completeness'
import { relativeTime, formatJaDate } from '@/lib/time'
import { CommentForm } from '@/components/comment-form'
import { CommentThread } from '@/components/comment-thread'
import { ViewTracker } from '@/components/view-tracker'
import { LockedNote } from '@/components/locked-note'
import { MixCard } from '@/components/mix-card'
import { deleteMix } from '@/actions/mixes'
import { PinButton } from '@/components/pin-button'
import { MixNaming } from '@/components/mix-naming'
import { OnsiteRating } from '@/components/onsite-rating'
import { SectionTabs, type SectionTab } from '@/components/section-tabs'
import { unlockPassed, isActivelyLocked, isSectionLocked, LOCK_FEATURE_ENABLED } from '@/lib/lock'
import { SITE_URL, BRAND } from '@/lib/site'
import { goHref } from '@/lib/go'
import { comboKey, comboSlug } from '@/lib/combo'
import type { MixWithRelations, MixAuthor } from '@/lib/types/database'

export const dynamic = 'force-dynamic'

function authorName(author: MixAuthor | null): string {
  if (!author) return BRAND.editorial
  return author.display_name || (author.username ? `@${author.username}` : '名無し')
}

function AuthorLink({ author }: { author: MixAuthor | null }) {
  const name = authorName(author)
  const badge = author?.is_pro ? <VerifiedBadge size={14} /> : null
  if (author?.username) {
    return (
      <Link href={`/u/${author.username}`} className="inline-flex items-center gap-1 hover:underline" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
        {name}
        {badge}
      </Link>
    )
  }
  return (
    <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-ash-dim)' }}>
      {name}
      {badge}
    </span>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const mix = await getMixById(id)
  if (!mix) return { title: `ミックスが見つかりません — ${BRAND.full}` }
  const flavorLine = (mix.mix_flavors ?? []).map((f) => f.name).join(' × ')
  // 盛り方写真があればOG画像に使う。無ければブランド既定の動的OG画像（opengraph-image）へフォールバック。
  const images = mix.pack_photo_url ? [{ url: mix.pack_photo_url }] : undefined
  const heading = flavorLine || mix.title || 'ミックス'
  const desc = mix.description ?? (mix.title ? `${mix.title}｜${flavorLine}` : flavorLine) ?? 'シーシャのミックスレシピ'
  return {
    title: `${heading} — ${BRAND.full}`,
    description: desc,
    openGraph: { title: heading, description: desc, ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', title: heading, description: desc, ...(images ? { images } : {}) },
  }
}

export default async function MixDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ posted?: string }>
}) {
  const { id } = await params
  const { posted } = await searchParams
  const [mix, likedIds, bookmarkedIds, user, comments, unlocked] = await Promise.all([
    getMixById(id),
    getLikedMixIds(),
    getBookmarkedMixIds(),
    getCurrentUser(),
    getMixComments(id),
    isMixUnlocked(id),
  ])
  if (!mix) notFound()
  const [related, madeStatus, smokeStatus, orthodoxy, tasteSummary, photos, repCats, mixNames, onsite, regionRep] = await Promise.all([
    getRelatedMixes(mix as MixWithRelations),
    getMadeStatus(id),
    getSmokeStatus(id),
    getOrthodoxyStatus(mix),
    getTasteSummary(id),
    getMixPhotos(id),
    getNationalRepCategories(id),
    getMixNames(id),
    getOnsiteContext(mix),
    getRegionRepLabel(id),
  ])
  // 同じ組み合わせに何通りの作り方があるか。1件しかないのに combo へ送ると
  // combo 側が mix へ redirect して同じページに戻る（自己ループ）ため、件数で出し分ける。
  const siblingCount =
    (await getComboBySlug(comboSlug(mix.combo_key || comboKey(mix.mix_flavors ?? []))))?.methods.length ?? 1

  // ---- 第一テーマ（今月の煙道検証）の文脈 ----
  // テーマ内の作り方を開いているときだけ、「前に作った別の作り方」と「次に試すと差が分かる作り方」を用意する。
  // どちらも記録したあとに返すために使う（記録して何も返らないなら2台目は起きない）。
  const inTheme = isThemeCombo(mix.combo_key)
  const [themeOverview, myThemeMade] = inTheme
    ? await Promise.all([getThemeOverview(FIRST_THEME.comboKey), getMyThemeMade(FIRST_THEME.comboKey)])
    : [null, []]

  let themeContext: MadeThemeContext | undefined
  if (inTheme && themeOverview) {
    const label = (m: { id: string; title: string | null }) => m.title?.trim() || `作り方 ${m.id.slice(0, 4)}`
    const madeIds = new Set(myThemeMade.map((r) => r.mixId))
    // 基準点＝直近に作った「別の」作り方。これが無いうちは比較を聞かない（1台目は比較できない）
    const baselineRow = myThemeMade.find((r) => r.mixId !== mix.id)
    const baselineMix = baselineRow ? themeOverview.methods.find((m) => m.id === baselineRow.mixId) : null
    const [top] = rankNextCandidates(mix, themeOverview.methods, {
      madeIds,
      makerCount: (mixId) => themeOverview.stats.get(mixId)?.makerCount ?? 0,
    })
    themeContext = {
      baseline: baselineMix ? { mixId: baselineMix.id, label: label(baselineMix) } : null,
      next: top
        ? {
            id: top.method.id,
            label: label(top.method),
            diff: top.diffs.map(describeDiff).join('／'),
            meaning: diffMeaning(top.diffs[0]),
          }
        : null,
      themePath: THEME_PATH,
      themeTitle: '今月の煙道検証',
    }
  }
  const mixLabel = mix.title?.trim() || 'この作り方'

  const commentTotal = comments.reduce((n, c) => n + 1 + c.replies.length, 0)
  const isRep = repCats.length > 0
  const repLabel = repCats.join('・')
  // 公募ネーミングの現愛称（最多得票・1票以上）
  const nickname = mixNames.length > 0 && mixNames[0].votes > 0 ? mixNames[0].name : null

  const flavors = mix.mix_flavors ?? []
  // 配合を「60 : 40」の形に正規化（比率入力でもグラム入力でも同じ結果）
  const ratioTotal = flavors.reduce((n, f) => n + (Number(f.ratio) || 0), 0)
  const ratioLine =
    ratioTotal > 0
      ? flavors.map((f) => Math.round(((Number(f.ratio) || 0) / ratioTotal) * 100)).join(' : ')
      : ''
  // 配合は「割合(%)」として共通表示する。ratio には比率入力とg入力が混在しうるため、
  // 元値に単位(g)を付けて断定しない（合計を100に正規化すればどちらでも正しい）。
  const ratioPct = new Map<string, number>()
  if (ratioTotal > 0) {
    for (const f of flavors) {
      if (f.ratio != null) ratioPct.set(f.id, Math.round((Number(f.ratio) / ratioTotal) * 100))
    }
  }
  const isOwner = !!user && user.id === mix.author_id
  const isSample = mix.author_id === null

  // 有料ノート：閲覧権があるか（投稿者本人／管理者／解錠済み／時限公開の解禁後）
  // ロック機能を非表示にしている間は isSectionLocked / isActivelyLocked が常に false を返すので、
  // すべての項目が公開として描画される（lib/lock.ts の LOCK_FEATURE_ENABLED）。
  const timeReleased = unlockPassed(mix)
  const entitled = isOwner || !!user?.profile?.is_admin || unlocked || timeReleased
  const locked = (section: string) => isSectionLocked(mix, section, entitled)
  const activelyLocked = isActivelyLocked(mix)

  // 投稿者が「載せる項目」で非表示にしたセクション
  const hiddenSec = (s: string) => (mix.hidden_sections ?? []).includes(s)
  const hasSetup =
    !hiddenSec('setup') &&
    !!(mix.hms_type || mix.charcoal_type || mix.charcoal_count != null || mix.steep_minutes != null || mix.steep_heat != null || mix.wind_cover != null || mix.bowl_type || mix.pack_style || mix.pack_photo_url)
  const hasCurve = !hiddenSec('heat_curve') && !!((mix.heat_curve && mix.heat_curve.length >= 2) || mix.heat_events)
  const hasNotes = !hiddenSec('heat_notes') && !!(mix.heat_management || mix.placement_note)
  const hasGear =
    !hiddenSec('gear') && !!(mix.gear_stem || mix.gear_bowl_name || mix.gear_hms_name || mix.gear_charcoal || mix.base_liquid)
  const hasSecrets = !hiddenSec('secrets') && !!(mix.prep_note || mix.ratio_reason || mix.serve_note)
  const showBrew = hasSetup || hasCurve || hasNotes || hasGear || hasSecrets
  const showPhotos = !hiddenSec('photos') && photos.length > 0

  const mixUrl = `${SITE_URL}/mix/${mix.id}`
  const flavorLine = flavors.map((f) => f.name).join(' × ')
  // 表示名＝フレーバー名。title は任意の一言（あれば添える）
  const headingLine = flavorLine || mix.title || 'ミックス'
  const taglineSuffix = mix.title ? `（${mix.title}）` : ''
  // 王道に選ばれていれば、その"自慢"をシェア文面に載せる（バイラルの起点）
  const shareText = isRep
    ? `${repLabel}系で人気の作り方です！\n${headingLine}${taglineSuffix}\n#シーシャ #煙道 #王道シーシャ図鑑`
    : `${headingLine}${taglineSuffix}\n#シーシャ #煙道`

  // 構造化データ（有料・非公開の熱管理データは含めない）
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: headingLine,
    description: mix.description ?? flavorLine,
    recipeIngredient: flavors.map((f) => `${f.brand ? `${f.brand} ` : ''}${f.name}`),
    recipeCategory: 'Shisha Mix',
    keywords: ['シーシャ', '煙道', ...mix.taste_tags].join(', '),
    url: `${SITE_URL}/mix/${mix.id}`,
    ...(mix.author?.display_name || mix.author?.username
      ? { author: { '@type': 'Person', name: mix.author.display_name || `@${mix.author.username}` } }
      : {}),
  }

  return (
    <div className="wrap max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          // ユーザー入力（タイトル・説明・表示名）を含むため、</script> 脱出等の XSS を防ぐエスケープ
          __html: JSON.stringify(jsonLd)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026')
        }}
      />
      <ViewTracker mixId={mix.id} comboKey={mix.combo_key} />
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm" style={{ color: 'var(--color-ash-dim)' }}>
          ← 図鑑にもどる
        </Link>
        {isOwner && (
          <div className="flex items-center gap-2">
            <PinButton mixId={mix.id} initialPinned={user?.profile?.pinned_mix_id === mix.id} />
            <Link href={`/mix/${mix.id}/edit`} className="btn btn-ghost text-sm">編集</Link>
            <form action={deleteMix}>
              <input type="hidden" name="mix_id" value={mix.id} />
              <button type="submit" className="text-sm" style={{ color: 'var(--color-ember-deep)' }}>
                削除
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 投稿直後：図鑑に追加されたことを伝える（同じ組み合わせの別解も示す） */}
      {posted === '1' && (
        <div
          className="mt-4 rounded-xl border px-4 py-3"
          style={{ borderColor: 'var(--color-ember)', background: 'var(--accent-tint)' }}
        >
          <p className="text-sm" style={{ fontWeight: 800, color: 'var(--color-cream)' }}>
            作り方を公開しました
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-ash)' }}>
            {headingLine}
            {ratioLine ? ` ・ ${ratioLine}` : ''}
          </p>
          {siblingCount > 1 && (
            <p className="mt-1.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              この組み合わせには現在{' '}
              <Link href={`/combo/${comboSlug(mix.combo_key || comboKey(flavors))}`} style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
                {siblingCount}通りの作り方
              </Link>{' '}
              があります。
            </p>
          )}
        </div>
      )}

      {/* ---------- HEADER ---------- */}
      <header className="mt-5 fade-up">
        {/* 公募で決まった愛称（あれば最優先で大きく） */}
        {nickname && (
          <p className="mb-1 text-lg" style={{ color: 'var(--color-ember-hot)', fontWeight: 800 }}>
            「{nickname}」<span className="ml-1 text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 600 }}>みんなで名付けた愛称</span>
          </p>
        )}
        {/* 任意の一言（特徴）— 愛称が無いときのみ */}
        {!nickname && mix.title && (
          <p className="mb-1 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>{mix.title}</p>
        )}
        {/* フレーバー名＝正式名（主役） */}
        <h1 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-3xl leading-tight sm:text-4xl" style={{ fontWeight: 800 }}>
          {flavors.map((f, i) => (
            <span key={f.id} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: 'var(--color-ember)', fontWeight: 400 }}>×</span>}
              <span>{f.name}</span>
            </span>
          ))}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* 公式に認定された王道（combo_orthodoxy が source of truth）。頂点なので先頭に置く */}
          {orthodoxy.isOrthodox && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ background: 'var(--color-seal)', color: '#fff', fontWeight: 800 }}
            >
              王道
            </span>
          )}
          {/* 公式王道ではないが、運営・認証プロが推薦している作り方 */}
          {!orthodoxy.isOrthodox && orthodoxy.recommendCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ border: '1px solid var(--color-ember)', color: 'var(--color-ember-hot)', fontWeight: 700 }}
            >
              推薦 ・ まずはこの作り方
            </span>
          )}
          {isRep && (
            <Link href="/national" className="seal text-xs">
              {repLabel}系で人気
            </Link>
          )}
          {regionRep && (
            <Link
              href={`/areas#${regionRep}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 800, border: '1px solid var(--color-ember)' }}
            >
              🏅 {regionRep}で人気
            </Link>
          )}
          {/* 完全公開の充実レシピを称える（詳しい中身があり、ロックが効いていない）。
              ロック機能を非表示にしている間は全部が「フル公開」になり対比が成り立たないので出さない。 */}
          {LOCK_FEATURE_ENABLED && !isSample && !activelyLocked && showBrew && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs"
              style={{ background: 'rgb(31 138 118 / 0.12)', color: 'var(--color-coal)', fontWeight: 800, border: '1px solid rgb(31 138 118 / 0.4)' }}
            >
              🌐 フル公開レシピ
            </span>
          )}
        </div>
        {activelyLocked && (
          <div className="mt-2 inline-flex flex-wrap items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            style={{ background: 'var(--accent-tint)', color: 'var(--color-ember-hot)', fontWeight: 700 }}>
            💎 有料ノート{mix.price != null ? ` ¥${mix.price}` : ''}
            <span style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>・一部ロック中（王道の選出対象外）</span>
          </div>
        )}
        {LOCK_FEATURE_ENABLED && mix.unlock_at && !timeReleased && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            style={{ background: 'var(--color-smoke-850)', color: 'var(--color-ash)', border: '1px solid var(--line-strong)' }}>
            ⏳ {formatJaDate(mix.unlock_at)} に全公開予定
          </div>
        )}
        {LOCK_FEATURE_ENABLED && mix.premium && (mix.locked_sections ?? []).length > 0 && timeReleased && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
            style={{ background: 'rgb(31 138 118 / 0.12)', color: 'var(--color-coal)', fontWeight: 700 }}>
            🔓 時限公開で全公開済み
          </div>
        )}

        {/* 別解が無いときは出さない（1件のみだと combo→mix へ戻され自己ループになる） */}
        {siblingCount > 1 && (
          <Link
            href={`/combo/${comboSlug(mix.combo_key || comboKey(flavors))}`}
            className="mt-2 inline-block text-sm"
            style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}
          >
            ほかの作り方を見る（{siblingCount - 1}） →
          </Link>
        )}

        {isRep && isOwner && (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{ borderColor: 'rgb(178 59 46 / 0.35)', background: 'rgb(178 59 46 / 0.06)' }}
          >
            <p className="text-sm" style={{ fontWeight: 800 }}>
              🎉 あなたのミックスが <span style={{ color: '#b23b2e' }}>{repLabel}系で人気</span> の作り方になっています。
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ash)' }}>
              よく吸われている作り方です。ぜひSNSで共有しましょう。
            </p>
            <div className="mt-3">
              <ShareBar url={mixUrl} text={shareText} />
            </div>
          </div>
        )}

        {/* Primary：体験を残す（コアループ）。吸った→どうだった？→味の印象 まで一続き */}
        <div className="mt-5 flex flex-col gap-3">
          <div className="flex flex-wrap items-start gap-3">
            <SmokedButton
              mixId={mix.id}
              isAuthed={!!user}
              initialCount={smokeStatus.count}
              initialMine={smokeStatus.mine}
              initialMyId={smokeStatus.myId}
              initialVerdict={smokeStatus.myVerdict}
            />
            <MadeButton
              mixId={mix.id}
              mixLabel={mixLabel}
              initialCount={madeStatus.count}
              initialMade={madeStatus.made}
              isAuthed={!!user}
              theme={themeContext}
            />
          </div>

          {/* Tertiary：保存・いいね・共有。体験より弱く見せる（新しいUIは足さない） */}
          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ opacity: 0.85 }}>
            <BookmarkButton mixId={mix.id} initialSaved={bookmarkedIds.has(mix.id)} isAuthed={!!user} />
            <LikeButton
              mixId={mix.id}
              initialCount={mix.like_count}
              initialLiked={likedIds.has(mix.id)}
              isAuthed={!!user}
            />
            <ShareBar url={mixUrl} text={shareText} />
          </div>
        </div>

        {/* 推薦は運営・認証プロのみ。一般ユーザーの支持は 吸った/作った として蓄積する */}
        {(user?.profile?.is_admin || user?.profile?.is_pro) && (
          <div className="mt-3">
            <RecommendButton
              mixId={mix.id}
              initialRecommended={orthodoxy.myRecommended}
              initialCount={orthodoxy.recommendCount}
            />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" style={{ color: 'var(--color-ash)' }}>
          {mix.author && <Avatar name={mix.author.display_name || mix.author.username} seed={mix.author.id} size={24} />}
          <span>by <AuthorLink author={mix.author} /></span>
          <span style={{ color: 'var(--color-ash-dim)' }}>・ {relativeTime(mix.created_at)} ・ 👁 {mix.view_count}</span>
        </div>
        <div className="mt-2">
          <CompletenessMeter mix={mix} />
        </div>

        {mix.taste_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {mix.taste_tags.map((t) => (
              <Link key={t} href={`/?tag=${encodeURIComponent(t)}`} className="chip">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </header>

      {mix.description && (
        <p className="mt-6 text-[0.98rem] leading-relaxed" style={{ color: 'var(--color-cream)' }}>
          {mix.description}
        </p>
      )}

      {/* ---------- FLAVORS + AFFILIATE ---------- */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm eyebrow">Flavors — 使用フレーバー</h2>
        <div className="card divide-y" style={{ borderColor: 'var(--line)' }}>
          {flavors.map((f) => (
            <div key={f.id} className="flex items-center gap-4 p-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span style={{ fontWeight: 700 }}>{f.name}</span>
                  {ratioPct.has(f.id) && (
                    <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                      {ratioPct.get(f.id)}%
                    </span>
                  )}
                </div>
                {f.brand && (
                  <div className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    {f.brand}
                  </div>
                )}
                {f.placement && (
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-ash)' }}>
                    置き方: {f.placement}
                  </div>
                )}
              </div>
              {goHref(f.affiliate_url, { f: f.flavor_id, m: mix.id }) && (
                <a
                  href={goHref(f.affiliate_url, { f: f.flavor_id, m: mix.id })!}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="btn btn-ghost text-sm"
                >
                  購入する
                </a>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          ※ 購入リンクにはアフィリエイトを含む場合があります。
        </p>
      </section>

      {/* ---------- まずこの作り方（段階開示の"結論"。全員に見せる基本セットアップ） ---------- */}
      {!locked('setup') && (mix.bowl_type || mix.charcoal_count != null || mix.steep_minutes != null) && (
        <section className="mt-6">
          <div className="card card-wa p-5">
            <div className="flex items-center gap-2">
              {/* 王道印は combo_orthodoxy で認定された作り方だけに出す。
                  「まずこの作り方」は初心者向けの案内であって王道認定ではない。 */}
              {orthodoxy.isOrthodox && <span aria-hidden className="seal seal-stamp text-xs">王道</span>}
              <h2 className="text-sm" style={{ fontWeight: 800 }}>まずこの作り方</h2>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              配合は上の使用フレーバーのとおり。あとはこれだけで、まず一台つくれます。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {bowlOption(mix.bowl_type) && (
                <span className="chip"><b style={{ color: 'var(--color-ash)' }}>ボウル</b>&nbsp;{bowlOption(mix.bowl_type)!.l}</span>
              )}
              {mix.charcoal_count != null && (
                <span className="chip"><b style={{ color: 'var(--color-ash)' }}>炭</b>&nbsp;{mix.charcoal_count}個</span>
              )}
              {mix.steep_minutes != null && (
                <span className="chip"><b style={{ color: 'var(--color-ash)' }}>蒸らし</b>&nbsp;{mix.steep_minutes}分</span>
              )}
            </div>
            {showBrew && (hasCurve || hasGear || hasNotes || hasSecrets) && (
              <p className="mt-3 text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
                ▼ 熱管理カーブ・器具・炭移動など、<span className="brush-underline">詳しい作り方は下の「作り方ノート」</span>から。
              </p>
            )}
          </div>
        </section>
      )}

      {/* ---------- 味の印象（実際に吸った人の評価） ----------
           段階開示：王道/まずこの作り方 → 配合・セットアップ → 味の印象（言葉）→ 詳しい味覚（数値） */}
      <TasteSummaryView summary={tasteSummary} canRecord={!!user && smokeStatus.mine} />

      {/* ---------- PHOTOS（工程・追加写真） ---------- */}
      {showPhotos && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm eyebrow">Photos — 工程・写真</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={u}
                alt={`${headingLine} の写真 ${i + 1}`}
                className="aspect-square w-full rounded-xl border object-cover"
                style={{ borderColor: 'var(--line)' }}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      {/* ---------- BREW NOTES ---------- */}
      {showBrew && (
        <section className="mt-8">
          {/* 段階開示：結論（まずこの作り方）を見たあと、知りたい人だけが深く潜る。
              ユーザーの属性や設定で出し分けない——同じ一台を、知りたい深さで掘れるようにする。 */}
          <details>
            <summary className="mb-3 cursor-pointer list-none text-sm eyebrow" style={{ color: 'var(--color-ash-dim)' }}>
              How to make — 作り方ノート
              <span style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>　▼ 熱管理・器具など詳しい設定を見る</span>
            </summary>

          {hasSetup &&
            (locked('setup') ? (
              <div className="mb-4">
                <LockedNote mixId={mix.id} title="セットアップ" icon="🪨" price={mix.price} isAuthed={!!user} />
              </div>
            ) : (
            <div className="card mb-4 p-5">
              <div className="mb-3 text-sm" style={{ fontWeight: 700 }}>🪨 セットアップ</div>
              {hmsOption(mix.hms_type) && (
                <div
                  className="mb-3 flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: 'var(--line)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
                >
                  <HmsIcon type={hmsOption(mix.hms_type)!.icon} size={40} />
                  <div className="min-w-0">
                    <div className="text-sm" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
                      {mix.hms_type === 'other' && mix.hms_other ? mix.hms_other : hmsOption(mix.hms_type)!.l}
                      {mix.hms_type !== 'other' && hmsOption(mix.hms_type)!.en && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>
                          {hmsOption(mix.hms_type)!.en}
                        </span>
                      )}
                    </div>
                    {mix.hms_type !== 'other' && (
                      <div className="text-xs" style={{ color: 'var(--color-ash)' }}>{hmsOption(mix.hms_type)!.desc}</div>
                    )}
                    {hmsBowls(mix.hms_type).length > 0 && (
                      <div className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                        相性の良いボウル：{hmsBowls(mix.hms_type).map((b) => b.l).join('・')}
                      </div>
                    )}
                    {mix.hms_type !== 'other' && hmsOption(mix.hms_type) && (
                      <Link href={`/hms/${hmsOption(mix.hms_type)!.v}`} className="mt-1 inline-block text-xs underline underline-offset-2" style={{ color: 'var(--color-ember-hot)' }}>
                        {hmsOption(mix.hms_type)!.l}の実例を見る →
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {bowlOption(mix.bowl_type) && (
                <div
                  className="mb-3 flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: 'var(--line)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
                >
                  <BowlIcon type={bowlOption(mix.bowl_type)!.icon} size={38} />
                  <div className="min-w-0">
                    <div className="text-sm" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
                      ボウル：{bowlOption(mix.bowl_type)!.l}
                      {bowlOption(mix.bowl_type)!.en && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>
                          {bowlOption(mix.bowl_type)!.en}
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-ash)' }}>{bowlOption(mix.bowl_type)!.desc}</div>
                    {bowlOption(mix.bowl_type)!.v !== 'other' && (
                      <Link href={`/bowl/${bowlOption(mix.bowl_type)!.v}`} className="mt-1 inline-block text-xs underline underline-offset-2" style={{ color: 'var(--color-ember-hot)' }}>
                        {bowlOption(mix.bowl_type)!.l}の実例を見る →
                      </Link>
                    )}
                  </div>
                </div>
              )}
              {packOption(mix.pack_style) && (
                <div
                  className="mb-3 flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: 'var(--line)', background: 'var(--accent-tint)', color: 'var(--color-ember-hot)' }}
                >
                  <PackIcon type={packOption(mix.pack_style)!.icon} size={38} />
                  <div className="min-w-0">
                    <div className="text-sm" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
                      盛り方：{packOption(mix.pack_style)!.l}
                      {packOption(mix.pack_style)!.en && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--color-ash-dim)', fontWeight: 400 }}>
                          {packOption(mix.pack_style)!.en}
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-ash)' }}>{packOption(mix.pack_style)!.desc}</div>
                  </div>
                </div>
              )}
              {mix.pack_photo_url && (
                <div className="mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mix.pack_photo_url}
                    alt="盛り方の写真"
                    className="w-full rounded-xl border object-cover"
                    style={{ maxHeight: 360, borderColor: 'var(--line)' }}
                  />
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>📷 投稿者による盛り方の写真</p>
                </div>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                {[
                  { k: '炭の種類', v: charcoalLabel(mix.charcoal_type) },
                  { k: '置き方', v: orientationLabel(mix.charcoal_orientation) },
                  { k: '個数', v: mix.charcoal_count != null ? `${mix.charcoal_count}個` : null },
                  { k: '蒸らし', v: mix.steep_minutes != null ? `${mix.steep_minutes}分` : null },
                  { k: '蒸らし到達火力', v: mix.steep_heat != null ? `${mix.steep_heat}` : null },
                  { k: '風防', v: windCoverLabel(mix.wind_cover) },
                ]
                  .filter((x) => x.v)
                  .map((x) => (
                    <div key={x.k}>
                      <dt className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{x.k}</dt>
                      <dd style={{ fontWeight: 600 }}>{x.v}</dd>
                    </div>
                  ))}
              </dl>
              <p className="mt-3 text-[0.68rem]" style={{ color: 'var(--color-ash-dim)' }}>
                HMS・ボウル・盛り方の解説と参考リンクは{' '}
                <Link href="/guide#hms-bowl" className="underline underline-offset-2" style={{ color: 'var(--color-ash)' }}>
                  作り方ガイド
                </Link>
                {' '}へ
              </p>
            </div>
            ))}

          {hasCurve &&
            (locked('heat_curve') ? (
              <div className="mb-4">
                <LockedNote mixId={mix.id} title="熱管理カーブ" icon="🔥" price={mix.price} isAuthed={!!user} />
              </div>
            ) : (
            <div className="card mb-4 p-5">
              <div className="mb-1 text-sm" style={{ fontWeight: 700 }}>🔥 熱管理カーブ</div>
              <p className="mb-3 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                横軸＝経過時間（分）、縦軸＝火力（0〜100）／点線＝炭イベント
              </p>
              <HeatCurveChart points={mix.heat_curve ?? undefined} events={mix.heat_events ?? undefined} steepMinutes={mix.steep_minutes ?? undefined} steepHeat={mix.steep_heat ?? undefined} />
            </div>
            ))}

          {hasNotes &&
            (locked('heat_notes') ? (
              <LockedNote mixId={mix.id} title="熱管理の補足・置き方" icon="📝" price={mix.price} isAuthed={!!user} />
            ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {mix.heat_management && (
              <div className="card p-5">
                <div className="mb-2 text-sm" style={{ fontWeight: 700 }}>🔥 熱管理の補足</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                  {mix.heat_management}
                </p>
              </div>
            )}
            {mix.placement_note && (
              <div className="card p-5">
                <div className="mb-2 text-sm" style={{ fontWeight: 700 }}>🍃 フレーバーの置き方</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
                  {mix.placement_note}
                </p>
              </div>
            )}
          </div>
            ))}

          {/* 機材・ギア */}
          {hasGear &&
            (locked('gear') ? (
              <div className="mt-4"><LockedNote mixId={mix.id} title="機材・ギア" icon="🛠" price={mix.price} isAuthed={!!user} /></div>
            ) : (
              <div className="card mt-4 p-5">
                <div className="mb-3 text-sm" style={{ fontWeight: 700 }}>🛠 機材・ギア</div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                  {[
                    { k: '本体・パイプ', v: mix.gear_stem },
                    { k: 'ボウル', v: mix.gear_bowl_name },
                    { k: 'HMS', v: mix.gear_hms_name },
                    { k: '炭', v: mix.gear_charcoal },
                    { k: 'ベース', v: mix.base_liquid },
                  ]
                    .filter((x) => x.v)
                    .map((x) => (
                      <div key={x.k}>
                        <dt className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>{x.k}</dt>
                        <dd style={{ fontWeight: 600 }}>{x.v}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            ))}

          {/* こだわり・核心 */}
          {hasSecrets &&
            (locked('secrets') ? (
              <div className="mt-4"><LockedNote mixId={mix.id} title="こだわり・核心" icon="🔒" price={mix.price} isAuthed={!!user} /></div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { t: '下処理', v: mix.prep_note, icon: '🧪' },
                  { t: '配合の狙い', v: mix.ratio_reason, icon: '⚖️' },
                  { t: '提供・吸い方のコツ', v: mix.serve_note, icon: '💨' },
                ]
                  .filter((x) => x.v)
                  .map((x) => (
                    <div key={x.t} className="card p-5">
                      <div className="mb-2 text-sm" style={{ fontWeight: 700 }}>{x.icon} {x.t}</div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>{x.v}</p>
                    </div>
                  ))}
              </div>
            ))}
          </details>
        </section>
      )}

      {/* ---------- 評価・ネーミング・コメント（タブで集約） ---------- */}
      <SectionTabs
        initial={!isSample ? 'onsite' : 'comments'}
        tabs={[
          !isSample && {
            id: 'onsite',
            label: '📍 実地評価',
            content: <OnsiteRating mixId={mix.id} ctx={onsite} isAuthed={!!user} />,
          },
          isRep && {
            id: 'naming',
            label: '📛 公募ネーミング',
            content: (
              <MixNaming
                mixId={mix.id}
                names={mixNames}
                isAuthed={!!user}
                currentUserId={user?.id ?? null}
                isAdmin={!!user?.profile?.is_admin}
              />
            ),
          },
          {
            id: 'comments',
            label: `💬 コメント（${commentTotal}）`,
            content: (
              <div>
                <CommentThread comments={comments} mixId={mix.id} isAuthed={!!user} currentUserId={user?.id} />
                <div className="mt-4">
                  <CommentForm mixId={mix.id} isAuthed={!!user} />
                </div>
              </div>
            ),
          },
        ].filter(Boolean) as SectionTab[]}
      />

      {/* ---------- RELATED ---------- */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-sm eyebrow">Related — 似た系統のミックス</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((m) => (
              <MixCard key={m.id} mix={m} liked={likedIds.has(m.id)} isAuthed={!!user} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href={`/post?from=${mix.id}`} className="btn btn-ember">この作り方をベースに投稿</Link>
        <Link href="/post" className="btn btn-ghost">ゼロから投稿する</Link>
      </div>

      {/* ---------- この情報について（誠実さは保つが、意思決定の直下では不安を訴求しない） ---------- */}
      {isSample && (
        <section className="mt-12">
          <details className="card p-4 text-sm" style={{ color: 'var(--color-ash)' }}>
            <summary className="cursor-pointer text-sm" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
              この情報について
            </summary>
            <p className="mt-3 leading-relaxed">
              これは <b>煙道 編集部の見本</b>です。作り方は一般的な目安で、専門家の監修はされていません。
              実際の「美味しい作り方」は、これから皆さんの投稿と実際に吸った評価で育てていきます。
            </p>
          </details>
        </section>
      )}

      <div className="mt-10 flex justify-center">
        <ReportButton mixId={mix.id} isAuthed={!!user} />
      </div>
    </div>
  )
}
