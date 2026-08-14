import { TASTE_AXES, tasteWords, tasteStage, MIN_RATERS_FOR_AVERAGE, type TasteSummary } from '@/lib/taste'

/**
 * 味の印象（実際に吸った人の評価の集計）。段階開示：
 *   まず言葉（甘め・爽快・軽め）→「詳しい味覚を見る」で軸ごとの数値。
 * 母数が少ないうちは平均値を断定表示しない。レーダーチャートは使わない。
 */
export function TasteSummaryView({ summary, canRecord = false }: { summary: TasteSummary; canRecord?: boolean }) {
  const stage = tasteStage(summary)

  // 0件でも「味を記録できる機能がある」ことは伝える。ただし大きな空カードは作らない。
  // 未ログインの人に登録CTAは押し付けない（canRecord のときだけ導線を出す）。
  if (stage === 'none') {
    return (
      <section className="mt-6">
        <h2 className="text-sm eyebrow">味の印象</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-ash)' }}>
          味の印象は、まだ集まっていません。
          <br />
          この一台を吸ったら、感じた味を残せます。
        </p>
        {canRecord && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
            上の「吸った」から、味の印象を残せます。
          </p>
        )}
      </section>
    )
  }

  if (stage === 'collecting') {
    return (
      <section className="mt-6">
        <h2 className="text-sm eyebrow">味の印象</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-ash)' }}>
          データ収集中（{summary.raterCount}人が評価）。
          <span style={{ color: 'var(--color-ash-dim)' }}>
            {' '}あと{MIN_RATERS_FOR_AVERAGE - summary.raterCount}人の評価で傾向が見えてきます。
          </span>
        </p>
      </section>
    )
  }

  const words = tasteWords(summary)

  return (
    <section className="mt-6">
      <h2 className="text-sm eyebrow">味の印象</h2>

      {/* 結論：初心者はここだけ読めばよい */}
      {words.length > 0 && (
        <p className="mt-2 text-lg" style={{ fontWeight: 800 }}>
          {words.join('・')}
        </p>
      )}
      <p className="mt-1 text-xs" style={{ color: 'var(--color-ash-dim)' }}>
        実際に吸った{summary.raterCount}人の評価より
      </p>

      {/* 詳細：数値は開いた人にだけ見せる */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm" style={{ color: 'var(--color-ember-hot)', fontWeight: 600 }}>
          詳しい味覚を見る
        </summary>
        <div className="mt-3 flex flex-col gap-2.5">
          {TASTE_AXES.map((axis) => {
            const a = summary[axis.key]
            if (a.avg == null || a.count === 0) return null
            const pct = Math.max(0, Math.min(100, ((a.avg - 1) / 4) * 100))
            return (
              <div key={axis.key}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span style={{ fontWeight: 600 }}>{axis.label}</span>
                  <span style={{ color: 'var(--color-ash-dim)' }}>
                    <b style={{ color: 'var(--color-cream)' }}>{a.avg.toFixed(1)}</b> / 5
                    <span className="ml-1 text-xs">（{a.count}人）</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--color-ember)' }} />
                </div>
              </div>
            )
          })}
          <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-ash-dim)' }}>
            ※ 各項目は任意入力のため、項目ごとに評価した人数が異なります。
          </p>
        </div>
      </details>
    </section>
  )
}
