'use client'

import { useActionState, useState } from 'react'
import { createMix, updateMix, type MixFormState } from '@/actions/mixes'
import type { Flavor, HeatPoint, HeatEvent } from '@/lib/types/database'
import { HeatCurveEditor } from '@/components/heat-curve-editor'
import { CHARCOAL_OPTIONS, CHARCOAL_ORIENTATION_OPTIONS } from '@/lib/heat'
import { LOCKABLE_SECTIONS } from '@/lib/premium'
import { MIX_DISPLAY_SECTIONS } from '@/lib/mix-sections'
import { formatJaDate } from '@/lib/time'
import { HmsPicker } from '@/components/hms-picker'
import { BowlPicker } from '@/components/bowl-picker'
import { PackPicker } from '@/components/pack-picker'
import { PackPhotoInput } from '@/components/pack-photo-input'
import { MultiPhotoInput } from '@/components/multi-photo-input'
import { SourceLine } from '@/components/source-line'
import { STEEP_SOURCES } from '@/lib/sources'
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

type Row = {
  id: number
  brand: string // 選択中のブランド（NEW=新しいブランド）
  flavorId: string // 選択中の味（マスタのid、NEW=新しい味、''=未選択）
  newBrand: string
  newName: string
  ratio: string
  url: string
}

const NEW = '__new__'

export function MixForm({
  mode,
  mixId,
  initial,
  flavors,
  canAddFlavor = false,
  canSell = false,
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
  const action0 = mode === 'edit' ? updateMix : createMix
  const [state, action, pending] = useActionState<MixFormState, FormData>(action0, null)
  const [charcoalType, setCharcoalType] = useState(initial?.charcoalType ?? '')

  // 「大事にするポイント」＝投稿に載せる項目。選んだ項目だけ入力＆表示され、🔒でロックできる。
  // ネーミング（特徴・ひとこと）も"大事にするポイント"の1要素として選べる（名前を大事にする人向け）。
  const LOCKABLE_KEYS = LOCKABLE_SECTIONS.map((s) => s.v) as string[]
  const ALL_SECTION_KEYS = MIX_DISPLAY_SECTIONS.map((s) => s.v)
  const chooserItems: { v: string; label: string; hint: string; lockable: boolean }[] = [
    { v: 'title', label: '🏷 ネーミング・ひとこと', hint: 'このミックスの名前・特徴を添える', lockable: false },
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

  const emptyRow = (id: number): Row => ({
    id,
    brand: '',
    flavorId: '',
    newBrand: '',
    newName: '',
    ratio: '',
    url: '',
  })

  const seed: Row[] =
    initial && initial.flavors.length > 0
      ? initial.flavors.map((f, i) => {
          const master = f.flavorId ? masterById.get(f.flavorId) : undefined
          if (master) {
            return { id: i + 1, brand: master.brand, flavorId: f.flavorId, newBrand: '', newName: '', ratio: f.ratio, url: f.url }
          }
          // マスタに無い（旧データ・自由入力）。既知ブランドなら味だけ新規、未知ならブランドも新規。
          const knownBrand = f.brand && brands.includes(f.brand)
          return {
            id: i + 1,
            brand: knownBrand ? f.brand : f.brand || f.name ? NEW : '',
            flavorId: f.name ? NEW : '',
            newBrand: knownBrand ? '' : f.brand,
            newName: f.name,
            ratio: f.ratio,
            url: f.url,
          }
        })
      : [emptyRow(1), emptyRow(2)]
  const [rows, setRows] = useState<Row[]>(seed)
  const [nextId, setNextId] = useState(seed.length + 1)

  function addRow() {
    setRows((r) => [...r, emptyRow(nextId)])
    setNextId((n) => n + 1)
  }
  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : r))
  }
  function update(id: number, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

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

      {/* ---------- FLAVORS (選択式) ---------- */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>使用フレーバー *</label>
          <span className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            {canAddFlavor ? '一覧から選択（無ければ新規追加）' : '一覧から選択'}
          </span>
        </div>
        {!canAddFlavor && (
          <p className="mb-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            💡 一覧から選択してください。新しいフレーバーの追加は運営（管理者）のみが行えます。見つからないフレーバーは運営までご連絡ください。
          </p>
        )}
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => {
            const isNewBrand = row.brand === NEW
            const isNewName = row.flavorId === NEW
            const master = !isNewName && row.flavorId ? masterById.get(row.flavorId) : undefined
            const brandFlavors = !isNewBrand && row.brand ? flavorsByBrand.get(row.brand) ?? [] : []
            // submit する実際の値（ブランド／味／マスタid）を決める。
            const submitBrand = isNewBrand ? row.newBrand : row.brand
            const submitName = master ? master.name : isNewName ? row.newName : ''
            const submitId = master ? master.id : ''
            return (
              <div key={row.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--color-ember-hot)', fontWeight: 700 }}>フレーバー {i + 1}</span>
                  <button type="button" onClick={() => removeRow(row.id)} className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>削除</button>
                </div>

                {/* submit 用の hidden（メーカー＋味の選択、または新規入力を反映） */}
                <input type="hidden" name="flavor_id" value={submitId} />
                <input type="hidden" name="flavor_brand" value={submitBrand} />
                <input type="hidden" name="flavor_name" value={submitName} />

                {/* メーカー（ブランド）を先に選ぶ → 味が絞り込まれる（プルダウンが長くなりすぎない） */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="field">
                    <label className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>メーカー</label>
                    <select
                      value={row.brand}
                      onChange={(e) =>
                        // ブランドを変えたら、味の選択はリセットする。
                        update(row.id, { brand: e.target.value, flavorId: '', newName: '' })
                      }
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
                        value={row.newName}
                        onChange={(e) => update(row.id, { newName: e.target.value })}
                        placeholder="フレーバー名（例：ダブルアップル）"
                      />
                    ) : (
                      <select
                        value={row.flavorId}
                        disabled={!row.brand}
                        onChange={(e) => update(row.id, { flavorId: e.target.value, newName: '' })}
                      >
                        <option value="">{row.brand ? '選択してください' : '先にメーカーを選択'}</option>
                        {brandFlavors.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                        {canAddFlavor && <option value={NEW}>リストにない（新規追加）</option>}
                      </select>
                    )}
                  </div>
                </div>

                {/* 新規追加の入力欄（管理者のみ） */}
                {canAddFlavor && isNewBrand && (
                  <div className="mt-3 field">
                    <input
                      value={row.newBrand}
                      onChange={(e) => update(row.id, { newBrand: e.target.value })}
                      placeholder="メーカー名（例：AL FAKHER）"
                    />
                  </div>
                )}
                {canAddFlavor && !isNewBrand && isNewName && (
                  <div className="mt-3 field">
                    <input
                      value={row.newName}
                      onChange={(e) => update(row.id, { newName: e.target.value })}
                      placeholder="フレーバー名（例：ダブルアップル）"
                    />
                  </div>
                )}

                <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr]">
                  <div className="field flex items-center gap-1" title="このフレーバーの使用量（グラム）">
                    <input name="flavor_ratio" defaultValue={row.ratio} inputMode="decimal" placeholder="使用量" className="min-w-0 flex-1" />
                    <span className="shrink-0 text-sm" style={{ color: 'var(--color-ash-dim)' }}>g</span>
                  </div>
                  {/* 購入リンクは管理者のみ設定可。非管理者は既存値をそのまま保持（編集不可）。 */}
                  {canAddFlavor ? (
                    <div className="field">
                      <input name="flavor_url" defaultValue={row.url} placeholder="購入リンク（任意 / アフィリエイトURL）" />
                    </div>
                  ) : (
                    <input type="hidden" name="flavor_url" value={row.url} />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <button type="button" onClick={addRow} className="btn btn-ghost mt-3 text-sm">＋ フレーバーを追加</button>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
          💡 量はグラム推奨ですが、スケールがなければ目安でOK（ボウル1杯 ≒ 15〜20g、ひとつまみ ≒ 2〜3g）。
          比率が伝わればOKなので、迷ったら「多め／少なめ」を説明欄に添えてください。
        </p>
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
            <label>炭の個数</label>
            <input name="charcoal_count" defaultValue={initial?.charcoalCount} inputMode="numeric" placeholder="例：3" />
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
        <p className="mt-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          蒸らし＝炭を置いてから吸い始めるまで、フタをして熱を通す工程。時間の目安は3〜7分（短いと煙・香りが弱く、長いと焦げやすい）。到達火力は「蒸らし終わりにどこまで火を入れるか」の目安です。
        </p>
        <SourceLine sources={STEEP_SOURCES} className="mt-1" />
      </div>

      {/* 熱管理カーブ */}
      <div>
        <label className="mb-2 block text-sm" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>🔥 熱管理カーブ（経過時間 × 火力 1〜100）＋ 炭イベント</label>
        <p className="mb-2 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          最初の緩やかな立ち上がりが「蒸らし」の区間です。
        </p>
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
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>使っている機材を書くほど再現しやすく、投稿の説得力も増します。</p>
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
        <div className="text-sm" style={{ fontWeight: 700 }}>🔒 こだわり・核心</div>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
          あなたの「秘密」になる部分。上のチップの <b>🔒</b> で<b>この項目だけロック（有料）</b>にできます。
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <div className="field"><label>下処理（タバコの手入れ・シロップ切り等）</label><textarea name="prep_note" defaultValue={initial?.prepNote} placeholder="例：開封後に軽くほぐし、余分なシロップを切る。○分置く、など。" maxLength={800} /></div>
          <div className="field"><label>配合の狙い（なぜこの比率か）</label><textarea name="ratio_reason" defaultValue={initial?.ratioReason} placeholder="例：ミントを1割に抑えて甘さを主役に。冷涼感は氷で補う。" maxLength={800} /></div>
          <div className="field"><label>提供・吸い方のコツ</label><textarea name="serve_note" defaultValue={initial?.serveNote} placeholder="例：最初の数吸いはゆっくり。○分ごとに炭をローテ。" maxLength={800} /></div>
        </div>
      </div>
        </div>
      </details>

      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '保存中…' : mode === 'edit' ? '変更を保存する' : 'ミックスを投稿する'}
      </button>
    </form>
  )
}
