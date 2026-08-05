'use client'

import { useActionState, useState } from 'react'
import { createMix, updateMix, type MixFormState } from '@/actions/mixes'
import type { Flavor, HeatPoint, HeatEvent } from '@/lib/types/database'
import { HeatCurveEditor } from '@/components/heat-curve-editor'
import { CHARCOAL_OPTIONS, CHARCOAL_ORIENTATION_OPTIONS, PACK_OPTIONS } from '@/lib/heat'
import { LOCKABLE_SECTIONS } from '@/lib/premium'
import { HmsPicker } from '@/components/hms-picker'
import { BowlPicker } from '@/components/bowl-picker'
import { TagPicker } from '@/components/tag-picker'

export type MixFormInitial = {
  title: string
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
  windCover: string
  bowlType: string
  packStyle: string
  placement: string
  premium: boolean
  price: string
  lockedSections: string[]
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
  const [premium, setPremium] = useState(initial?.premium ?? false)
  const [charcoalType, setCharcoalType] = useState(initial?.charcoalType ?? '')

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

      <div className="field">
        <label>タイトル *</label>
        <input name="title" required defaultValue={initial?.title} placeholder="例：王道スッキリ｜ダブルアップル × ミント" maxLength={80} />
      </div>

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
      </div>

      <div className="field">
        <label>味わいタグ（選択式・複数可）</label>
        <TagPicker name="taste_tags" defaultValue={initial?.tasteTags ?? []} />
      </div>

      <div className="field">
        <label>説明・どんな味か</label>
        <textarea name="description" defaultValue={initial?.description} placeholder="どんな気分のときに、どう美味しいか。おすすめの飲み物など。" maxLength={600} />
      </div>

      <div className="divider" />
      <p className="text-sm" style={{ color: 'var(--color-ash)' }}>
        作り方ノート（任意）— シーシャは作り方で味が変わります。ノウハウを共有しましょう。
      </p>

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
          <div className="field">
            <label>盛り方</label>
            <select name="pack_style" defaultValue={initial?.packStyle ?? ''}>
              <option value="">未設定</option>
              {PACK_OPTIONS.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 熱管理カーブ */}
      <div>
        <label className="mb-2 block text-sm" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>🔥 熱管理カーブ（経過時間 × 火力 1〜100）＋ 炭イベント</label>
        <HeatCurveEditor initialCurve={initial?.heatCurve ?? undefined} initialEvents={initial?.heatEvents ?? undefined} />
      </div>

      <div className="field">
        <label>🔥 熱管理の補足メモ（任意）</label>
        <textarea name="heat_management" defaultValue={initial?.heat} placeholder="例：序盤は控えめ、中盤に立ち上げる。灰の掃除タイミングなど。" maxLength={600} />
      </div>

      <div className="field">
        <label>🍃 フレーバーの置き方</label>
        <textarea name="placement_note" defaultValue={initial?.placement} placeholder="例：ダブルアップルを底に厚め、ミントは表面に薄く散らす。" maxLength={600} />
      </div>

      {/* 有料ノート（プロ認証者のみ） */}
      {canSell && (
        <>
          <div className="divider" />
          <div className="card flex flex-col gap-3 p-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" name="premium" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
              <span style={{ fontWeight: 700 }}>💎 一部を有料ノートにする</span>
            </label>
            <p className="text-xs" style={{ color: 'var(--color-ash-dim)' }}>
              こだわりの熱管理などを、購入した人だけが見られるようにできます（プロ認証者のみ）。
            </p>
            {premium && (
              <div className="flex flex-col gap-3">
                <div className="field" style={{ maxWidth: 200 }}>
                  <label>価格（円）</label>
                  <input
                    name="price"
                    inputMode="numeric"
                    defaultValue={initial?.price || '300'}
                    placeholder="300"
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs" style={{ color: 'var(--color-ash)', fontWeight: 600 }}>有料にするパーツ</div>
                  <div className="flex flex-col gap-1.5">
                    {LOCKABLE_SECTIONS.map((s) => (
                      <label key={s.v} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="locked_sections"
                          value={s.v}
                          defaultChecked={(initial?.lockedSections ?? ['heat_curve']).includes(s.v)}
                        />
                        <span>{s.icon} {s.l}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
                    ※ 決済機能は近日対応予定。今は「ロック表示」までが有効になります。
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <button type="submit" disabled={pending} className="btn btn-ember self-start">
        {pending ? '保存中…' : mode === 'edit' ? '変更を保存する' : 'ミックスを投稿する'}
      </button>
    </form>
  )
}
