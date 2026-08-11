// ミックスの表示名ヘルパー
// 方針：フレーバー名の組み合わせが「正式名」。title は任意の短い一言（特徴）。

export function flavorLine(flavors: { name: string }[] | null | undefined): string {
  return (flavors ?? []).map((f) => f.name).join(' × ')
}

/** 表示用の主タイトル（フレーバー名。無ければ title、それも無ければ既定）。 */
export function mixHeading(mix: {
  title: string | null
  mix_flavors?: { name: string }[] | null
}): string {
  return flavorLine(mix.mix_flavors) || mix.title || 'ミックス'
}
