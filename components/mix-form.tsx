'use client'

import { useActionState, useState } from 'react'
import { createMix, updateMix, type MixFormState } from '@/actions/mixes'
import type { Flavor, HeatPoint, HeatEvent } from '@/lib/types/database'
import { HeatCurveEditor } from '@/components/heat-curve-editor'
import { CHARCOAL_OPTIONS, CHARCOAL_ORIENTATION_OPTIONS } from '@/lib/heat'
import { LOCKABLE_SECTIONS } from '@/lib/premium'
import { LOCK_FEATURE_ENABLED } from '@/lib/lock'
import { MIX_DISPLAY_SECTIONS } from '@/lib/mix-sections'
import { formatJaDate } from '@/lib/time'
import { HmsPicker } from '@/components/hms-picker'
import { BowlPicker } from '@/components/bowl-picker'
import { PackPicker } from '@/components/pack-picker'
import { PackPhotoInput } from '@/components/pack-photo-input'
import { MultiPhotoInput } from '@/components/multi-photo-input'
import { TagPicker } from '@/components/tag-picker'

export type MixFormInitial = {
  title: string | null
  description: string
  tasteTags: string[]
  heat: string
  heatCurve: HeatPoint[] | null
  heatEvents: HeatEvent[] | null
  hmsType: string
  hmsOther: string
  charcoalType: string
  charcoalOrientation: string
  charcoalCount: string
  charcoalSizeMm: string
  steepMinutes: string
  steepHeat: string
  windCover: string
  bowlType: string
  packStyle: string
  packPhotoUrl: string
  photos: string[]
  placement: string
  gearStem: string
  gearBowlName: string
  gearHmsName: string
  gearCharcoal: string
  baseLiquid: string
  prepNote: string
  ratioReason: string
  serveNote: string
  premium: boolean
  price: string
  lockedSections: string[]
  hiddenSections: string[]
  unlockAt: string | null
  flavors: { flavorId: string; name: string; brand: string; ratio: string; url: string }[]
}

const NEW = '__new__'

export function MixForm({
  mode,
  mixId,
  initial,
  flavors,
  canAddFlavor = false,
  canSell: canSellProp = false,
}: {
  mode: 'create' | 'edit'
  mixId?: string
  initial?: MixFormInitial
  flavors: Flavor[]
  /** 管理者のみ、新しいフレーバーの追加・購入リンクの設定ができる */
  canAddFlavor?: boolean
  /** プロ認証者（＋管理者）のみ、一部を有料ノートにできる */
  canSell?: boolean
}) {
  // ロック機能は一時的に非表示（lib/lock.ts）。ここを false にすると 🔒 のチップ・価格・
  // 時限公開の入力がまとめて消え、送信される premium も常に空になる。
  const canSell = LOCK_FEATURE_ENABLED && canSellProp
  const action0 = mode === 'edit' ? updateMix : createMix
  const [state, action, pending] = useActionState<MixFormState, FormData>(action0, null)
  const [charcoalType, setCharcoalType] = useState(initial?.charcoalType ?? '')

  // 「大事にするポイント」＝投稿に載せる項目。選んだ項目だけ入力＆表示され、🔒でロックできる。
  // ネーミング（特徴・ひとこと）も"大事にするポイント"の1要素として選べる（名前を大事にする人向け）。
  const LOCKABLE_KEYS = LOCKABLE_SECTIONS.map((s) => s.v) as string[]
  const ALL_SECTION_KEYS = MIX_DISPLAY_SECTIONS.map((s) => s.v)
  const chooserItems: { v: string; label: string; hint: string; lockable: boolean }[] = [
    { v: 'title', label: '🏷 ネーミング・ひとこと', hint: 'この作り方の名前・特徴を添える', lockable: false },
    ...MIX_DISPLAY_SECTIONS.map((s) => ({ v: s.v, label: s.label, hint: s.hint, lockable: canSell && LOCKABLE_KEYS.includes(s.v) })),
  ]
  const initialShown =
    initial != null
      ? [...(initial.title ? ['title'] : []), ...ALL_SECTION_KEYS.filter((k) => !(initial.hiddenSections ?? []).includes(k))]
      : ['title', ...ALL_SECTION_KEYS]
  const [shown, setShown] = useState<Set<string>>(new Set(initialShown))
  const [lockedSet, setLockedSet] = useState<Set<string>>(
    new Set(initial?.premium ? initial?.lockedSections ?? [] : [])
  )
  const premium = lockedSet.size > 0
  function toggleShown(k: string) {
    setShown((prev) => {
      const n = new Set(prev)
      if (n.has(k)) {
        n.delete(k)
        setLockedSet((l) => {
          const nl = new Set(l)
          nl.delete(k)
          return nl
        })
      } else {
        n.add(k)
      }
      return n
    })
  }
  function toggleLocked(k: string) {
    setLockedSet((prev) => {
      const n = new Set(prev)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  }

  const [steepMin, setSteepMin] = useState(initial?.steepMinutes ?? '')
  const [steepHeat, setSteepHeat] = useState(initial?.steepHeat ?? '')
  // 既存投稿の編集などで詳細が入っていれば、詳細設定を開いた状態にする
  const hasAdvanced = !!(
    initial &&
    (initial.hmsType ||
      initial.bowlType ||
      initial.charcoalType ||
      initial.packStyle ||
      initial.packPhotoUrl ||
      initial.steepMinutes ||
      initial.steepHeat ||
      initial.placement ||
      initial.heat ||
      (initial.heatCurve && initial.heatCurve.length > 0) ||
      (initial.heatEvents && initial.heatEvents.length > 0))
  )

  const masterById = new Map(flavors.map((f) => [f.id, f]))

  // ブランド一覧（重複なし・五十音/アルファベット順）と、ブランドごとの味一覧。
  const brands = Array.from(new Set(flavors.map((f) => f.brand))).sort((a, b) =>
    a.localeCompare(b, 'ja')
  )
  const flavorsByBrand = new Map<string, Flavor[]>()
  for (const f of flavors) {
    const arr = flavorsByBrand.get(f.brand) ?? []
    arr.push(f)
    flavorsByBrand.set(f.brand, arr)
  }

  // 煙道は「1つのフレーバーを、どう作るか」を扱う。配合（複数フレーバー）は持たない。
  const seedFlavor = initial?.flavors?.[0]
  const seedMaster = seedFlavor?.flavorId ? masterById.get(seedFlavor.flavorId) : undefined
  const seedKnownBrand = !!seedFlavor?.brand && brands.includes(seedFlavor.brand)
  const [brand, setBrand] = useState(
    seedMaster ? seedMaster.brand : seedKnownBrand ? seedFlavor!.brand : seedFlavor ? NEW : ''
  )
  const [flavorId, setFlavorId] = useState(seedMaster ? seedMaster.id : seedFlavor?.name ? NEW : '')
  const [newBrand, setNewBrand] = useState(seedMaster || seedKnownBrand ? '' : seedFlavor?.brand ?? '')
  const [newName, setNewName] = useState(seedMaster ? '' : seedFlavor?.name ?? '')
  const flavorUrl = seedFlavor?.url ?? ''

  const isNewBrand = brand === NEW
  const isNewName = flavorId === NEW
  const master = !isNewName && flavorId ? masterById.get(flavorId) : undefined
  const brandFlavors = !isNewBrand && brand ? flavorsByBrand.get(brand) ?? [] : []
  const submitBrand = isNewBrand ? newBrand : brand
  const submitName = master ? master.name : isNewName ? newName : ''
  const submitId = master ? master.id : ''

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      {mode === 'edit' && mixId && <input type="hidden" name="mix_id" value={mixId} />}
      {state?.error && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: 'var(--color-ember-deep)', background: 'rgb(181 80 47 / 0.10)', color: 'var(--color-ember-deep)' }}
        >
          {state.error}
        </div>
      )}

      {/* ---------- FLAVOR（1つだけ） ---------- */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>フレーバー *</label>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>1つだけ選びます</span>
        </div>

        {/* submit 用の hidden。配合は持たないので使用量は送らない */}
        <input type="hidden" name="flavor_id" value={submitId} />
        <input type="hidden" name="flavor_brand" value={submitBrand} />
        <input type="hidden" name="flavor_name" value={submitName} />
        <input type="hidden" name="flavor_url" value={flavorUrl} />

        <div className="card grid gap-3 p-4 sm:grid-cols-2">
          <div className="field">
            <label className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>メーカー</label>
            <select
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value)
                setFlavorId('')
                setNewName('')
              }}
            >
              <option value="">選択してください</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              {canAddFlavor && <option value={NEW}>リストにない（新規追加）</option>}
            </select>
          </div>

          <div className="field">
            <label className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>味</label>
            {isNewBrand ? (
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="フレーバー名（例：ダブルアップル）"
              />
            ) : (
              <select value={flavorId} disabled={!brand} onChange={(e) => { setFlavorId(e.target.value); setNewName('') }}>
                <option value="">{brand ? '選択してください' : '先にメーカーを選択'}</option>
                {brandFlavors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
                {canAddFlavor && <option value={NEW}>リストにない（新規追加）</option>}
              </select>
            )}
          </div>

          {canAddFlavor && isNewBrand && (
            <div className="field sm:col-span-2">
              <input
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="メーカー名（例：AL FAKHER）"
              />
            </div>
          )}
          {canAddFlavor && !isNewBrand && isNewName && (
            <div className="field sm:col-span-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="フレーバー名（例：ダブルアップル）"
              />
            </div>
          )}
        </div>
        {!canAddFlavor && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            見つからないフレーバーは運営までご連絡ください。
          </p>
        )}
      </div>

      <div className="field">
        <label>味わいタグ（選択式・複数可）</label>
        <TagPicker name="taste_tags" defaultValue={initial?.tasteTags ?? []} />
      </div>

      <div className="field">
        <label>説明・どんな味か</label>
        <textarea name="description" defaultValue={initial?.description} placeholder="どんな気分のときに、どう美味しいか。相性の良いドリンクなど。" maxLength={600} />
      </div>

      <div className="divider" />

      {/* 大事にするポイントの選択（載せる項目＋ロック項目） */}
      <div className="card flex flex-col gap-2 p-5">
        <div className="text-base" style={{ fontWeight: 800 }}>🎯 あなたがシーシャ作りで大事にしているポイントは？</div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          選んだ項目を投稿に載せられます（フレーバーと味わいは常に表示）。
          {canSell && <> 特に<b>こだわり／秘密</b>にしたい項目は <b>🔒</b> で<b>ロック（有料）</b>にもできます。</>}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {chooserItems.map((s) => {
            const on = shown.has(s.v)
            const lockable = s.lockable
            return (
              <span key={s.v} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => toggleShown(s.v)}
                  className={`chip ${on ? 'chip-active' : ''} ${lockable && on ? 'rounded-r-none' : ''}`}
                  title={s.hint}
                >
                  {on ? '✓ ' : ''}{s.label}
                </button>
                {lockable && on && (
                  <button
                    type="button"
                    onClick={() => toggleLocked(s.v)}
                    title={lockedSet.has(s.v) ? 'ロック中（有料）。クリックで解除' : 'クリックでロック（有料）にする'}
                    className="rounded-full rounded-l-none border border-l-0 px-2 py-1 text-xs"
                    style={
                      lockedSet.has(s.v)
                        ? { borderColor: 'var(--color-ember)', background: 'var(--color-ember)', color: '#fff', fontWeight: 700 }
                        : { borderColor: 'var(--line-strong)', color: 'var(--color-ash-dim)' }
                    }
                  >
                    {lockedSet.has(s.v) ? '🔒' : '🔓'}
                  </button>
                )}
              </span>
            )
          })}
        </div>
        {canSell && (
          <div className="mt-2 rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: 'var(--accent-tint)', color: 'var(--color-ash)' }}>
            🔒 ロックした投稿は<b>王道・地方の王道の選出対象外</b>になります（標準＝みんなの図鑑は公開レシピで作るため）。
            ロックは核心の<b>「最後のひと工夫」だけ</b>に絞るのがおすすめ。
          </div>
        )}
        {premium && canSell && (
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div className="field" style={{ maxWidth: 160 }}>
              <label>ロックの価格（円）</label>
              <input name="price" inputMode="numeric" defaultValue={initial?.price || '300'} placeholder="300" />
            </div>
            <div className="field" style={{ maxWidth: 260 }}>
              <label>⏳ 時限公開（いずれ全公開）</label>
              <select name="unlock_months" defaultValue={mode === 'edit' && initial?.unlockAt ? '' : '0'}>
                {mode === 'edit' && initial?.unlockAt && (
                  <option value="">変更しない（現在: {formatJaDate(initial.unlockAt)}）</option>
                )}
                <option value="0">自動公開しない</option>
                <option value="1">1ヶ月後に全公開</option>
                <option value="3">3ヶ月後に全公開</option>
                <option value="6">6ヶ月後に全公開</option>
              </select>
            </div>
            <p className="w-full text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              ※ 決済機能は近日対応予定（今は「ロック表示」まで有効）。時限公開にすると、先行の優位を守りつつ、いずれ図鑑（みんなの標準）に還元できます。全公開後は王道の選出対象になります。
            </p>
          </div>
        )}
        {/* 送信用の隠しフィールド（チップ選択と連動） */}
        <input type="hidden" name="section_control" value="1" />
        {[...shown].map((k) => (
          <input key={k} type="hidden" name="show_section" value={k} />
        ))}
        {[...lockedSet].map((k) => (
          <input key={`lock-${k}`} type="hidden" name="locked_sections" value={k} />
        ))}
        <input type="hidden" name="premium" value={premium ? 'on' : ''} />
      </div>

      {/* ネーミング・ひとこと（チップで選んだときだけ入力欄が出る） */}
      {shown.has('title') && (
        <div className="field">
          <label>🏷 ネーミング・ひとこと</label>
          <input name="title" defaultValue={initial?.title ?? ''} placeholder="例：王道スッキリ / しっかり冷やす版" maxLength={40} />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            正式名はフレーバー名（{'例：ダブルアップル × ミント'}）です。名前・特徴を大事にしたいときに添えてください。
          </p>
        </div>
      )}

      <details open={hasAdvanced || shown.size > 0}>
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>
            🔧 選んだ項目を入力する（任意）
          </span>
          <span className="mt-1 block text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            上で選んだポイントの中身を入力します。入力しても、上でチップを外した項目は投稿に表示されません。
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-6">
      {/* 炭・熱源セットアップ */}
      <div className="card flex flex-col gap-4 p-5">
        <div className="text-sm" style={{ fontWeight: 700 }}>炭・熱源セットアップ</div>
        <div className="field">
          <label>ヒートマネジメント（HMS）</label>
          <HmsPicker name="hms_type" defaultValue={initial?.hmsType ?? ''} otherDefault={initial?.hmsOther ?? ''} />
        </div>

        <div className="field">
          <label>ボウル</label>
          <BowlPicker name="bowl_type" defaultValue={initial?.bowlType ?? ''} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label>炭の種類</label>
            <select
              name="charcoal_type"
              value={charcoalType}
              onChange={(e) => setCharcoalType(e.target.value)}
            >
              <option value="">未設定</option>
              {CHARCOAL_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
          {/* フラット炭は縦置き/横置きで味が変わる */}
          {charcoalType === 'flat' && (
            <div className="field">
              <label>フラット炭の置き方</label>
              <select name="charcoal_orientation" defaultValue={initial?.charcoalOrientation ?? ''}>
                <option value="">未設定</option>
                {CHARCOAL_ORIENTATION_OPTIONS.map((o) => (
                  <option key={o.v} value={o.v}>{o.l}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            {/* 炭は途中で足したり抜いたりするので、通しの「個数」は意味を持たない。
                比較できるのは立ち上げ時点の数だけ。 */}
            <label>立ち上げ時の炭の個数</label>
            <input name="charcoal_count" defaultValue={initial?.charcoalCount} inputMode="numeric" placeholder="例：3" />
          </div>
          <div className="field">
            {/* 個数だけでは熱量が決まらない。26mm 3個と 22mm 3個ではまるで違う。
                キューブは一辺、フラットは長辺の目安。 */}
            <label>炭のサイズ（mm）</label>
            <input name="charcoal_size_mm" defaultValue={initial?.charcoalSizeMm} inputMode="numeric" placeholder="例：26" />
          </div>
          <div className="field">
            <label>風防を被せる</label>
            <select name="wind_cover" defaultValue={initial?.windCover ?? ''}>
              <option value="">未設定</option>
              <option value="true">被せる</option>
              <option value="false">被せない</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>🍶 フレーバーの盛り方</label>
          <PackPicker name="pack_style" defaultValue={initial?.packStyle ?? ''} />
          <div className="mt-3">
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>盛り方の写真（カバー・任意）</span>
            <div className="mt-1">
              <PackPhotoInput name="pack_photo_url" defaultValue={initial?.packPhotoUrl ?? ''} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>工程・追加写真（任意・最大8枚）</span>
            <div className="mt-1">
              <MultiPhotoInput name="mix_photo_url" defaultValue={initial?.photos ?? []} />
            </div>
          </div>
        </div>
      </div>

      {/* 蒸らし */}
      <div className="field">
        <label>♨️ 蒸らし</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>時間（分）</span>
            <input
              name="steep_minutes"
              value={steepMin}
              onChange={(e) => setSteepMin(e.target.value)}
              inputMode="decimal"
              placeholder="例：7"
              className="mt-1 w-full"
            />
          </div>
          <div>
            <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>到達火力（1〜100）</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="range" min={0} max={100}
                value={Number(steepHeat) || 0}
                onChange={(e) => setSteepHeat(e.target.value === '0' ? '' : e.target.value)}
                className="min-w-0 flex-1" style={{ accentColor: 'var(--color-ember)' }}
                aria-label="蒸らしの到達火力"
              />
              <input
                name="steep_heat"
                value={steepHeat}
                onChange={(e) => setSteepHeat(e.target.value)}
                inputMode="numeric"
                placeholder="例：70"
                className="w-16"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 熱管理カーブ */}
      <div>
        <label className="mb-2 block text-sm" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>🔥 熱管理カーブ（経過時間 × 火力 1〜100）＋ 炭イベント</label>
        <HeatCurveEditor initialCurve={initial?.heatCurve ?? undefined} initialEvents={initial?.heatEvents ?? undefined} steepMinutes={Number(steepMin) || undefined} steepHeat={Number(steepHeat) || undefined} />
      </div>

      <div className="field">
        <label>🔥 熱管理の補足メモ（任意）</label>
        <textarea name="heat_management" defaultValue={initial?.heat} placeholder="例：序盤は控えめ、中盤に立ち上げる。灰の掃除タイミングなど。" maxLength={600} />
      </div>

      <div className="field">
        <label>🍃 フレーバーの置き方</label>
        <textarea name="placement_note" defaultValue={initial?.placement} placeholder="例：ダブルアップルを底に厚め、ミントは表面に薄く散らす。" maxLength={600} />
      </div>

      {/* 機材・ギア（投稿映え） */}
      <div className="mt-2 rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}>
        <div className="text-sm" style={{ fontWeight: 700 }}>🛠 機材・ギア</div>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>書いてあるほど、他の人が同じ一台を再現できます。</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="field"><label>本体・パイプ</label><input name="gear_stem" defaultValue={initial?.gearStem} placeholder="例：Wookah / Steamulation" maxLength={120} /></div>
          <div className="field"><label>ボウルの製品名</label><input name="gear_bowl_name" defaultValue={initial?.gearBowlName} placeholder="例：Oblako Phunnel M" maxLength={120} /></div>
          <div className="field"><label>HMS/ヒートマネジメント</label><input name="gear_hms_name" defaultValue={initial?.gearHmsName} placeholder="例：Kaloud Lotus II" maxLength={120} /></div>
          <div className="field"><label>炭のブランド・サイズ</label><input name="gear_charcoal" defaultValue={initial?.gearCharcoal} placeholder="例：Coco Nara 26mm" maxLength={120} /></div>
          <div className="field sm:col-span-2"><label>ベースの液体</label><input name="base_liquid" defaultValue={initial?.baseLiquid} placeholder="例：水＋氷多め / 冷やした緑茶" maxLength={120} /></div>
        </div>
      </div>

      {/* こだわり・核心（ロック対象になりうる） */}
      <div className="mt-3 rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}>
        <div className="text-sm" style={{ fontWeight: 700 }}>💡 こだわり・核心</div>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          {canSell ? (
            <>あなたの「秘密」になる部分。上のチップの <b>🔒</b> で<b>この項目だけロック（有料）</b>にできます。</>
          ) : (
            <>なぜその作り方なのか。試した人が同じ一台を再現できるかは、ここで決まります。</>
          )}
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <div className="field"><label>下処理（タバコの手入れ・シロップ切り等）</label><textarea name="prep_note" defaultValue={initial?.prepNote} placeholder="例：開封後に軽くほぐし、余分なシロップを切る。○分置く、など。" maxLength={800} /></div>
          <div className="field"><label>この作り方の狙い（なぜこうするのか）</label><textarea name="ratio_reason" defaultValue={initial?.ratioReason} placeholder="例：シロップを飛ばしすぎないぎりぎりの熱量を狙う。炭4個だと最初の10分で香りが飛ぶ。" maxLength={800} /></div>
          <div className="field"><label>提供・吸い方のコツ</label><textarea name="serve_note" defaultValue={initial?.serveNote} placeholder="例：最初の数吸いはゆっくり。○分ごとに炭をローテ。" maxLength={800} /></div>
        </div>
      </div>
        </div>
      </details>

      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '保存中…' : mode === 'edit' ? '変更を保存する' : '作り方を登録する'}
      </button>
    </form>
  )
}
