# 煙道 ENDO — STEP 6 完了報告（味覚5軸）

> 対象コミット: `88bc5ee`（branch: `claude/shisha-app-display-bugs-flqfii`）
> STEP 7 には進んでいません。
> 最終更新: 2026-08-14

---

## 1. STEP 5 最終調整結果

### 0-1 `{ratio}g` の断定表示をやめました

**調査結果**：既存 `mix_flavors` 15行はすべて `ratio` あり、値は **30〜100（平均53.3）**。
**15行中12行が30超**で、1ボウルの実量としては不自然 ⇒ **実態はほぼ「比率」**でした。
つまり `{ratio}g` は**大半の行で誤表示**しており、ご指摘のとおり修正が必要な状態でした。

**対応**：詳細画面のフレーバー行を、合計100へ正規化した **`%` 表示**に変更（`60%` / `40%`）。元値に単位gを付けて断定しません。
%は尺度に依存しないため、比率入力(40/60)でもg入力(3g/7g)でも正しく `40% / 60%`・`30% / 70%` になります（実DB確認済み）。

**g入力の実利用度と将来の分離について**：
現状 g として意味を持つ値は最大3行（≤30）で、**実量データとしての利用実績はほぼ皆無**でした。
`ratio_percent` / `amount_g` の分離は、**こだわり投稿でg入力が実際に使われ始めてから**で間に合うと判断し、今回は列を追加していません（残課題に記載）。

### 0-2 かんたん投稿の最低限再現性

| フレーバー数 | 仕様 |
|---|---|
| 1つ | **100% として自動確定**（入力欄は無効化し「100%」と表示） |
| 2つ以上 | **配合入力を必須**。未入力なら送信ボタンを無効化＋理由を表示 |

合計100は強制していません（`6 / 4`・`3 / 7`・`60 / 40` いずれも可。表示側で100%に正規化）。
サーバー側 `createMix` にも同じ検証を入れましたが、**`form_kind=simple` のときだけ**適用し、こだわり投稿の任意性は維持しています。

---

## 2. taste_evaluations 最終スキーマ

```sql
create table public.taste_evaluations (
  experience_id uuid primary key references public.mix_experiences(id) on delete cascade,
  sweetness smallint check (sweetness between 1 and 5),  -- 甘さ
  coolness  smallint check (coolness  between 1 and 5),  -- 爽快感
  sourness  smallint check (sourness  between 1 and 5),  -- 酸味
  richness  smallint check (richness  between 1 and 5),  -- 濃厚さ
  heaviness smallint check (heaviness between 1 and 5),  -- 重さ
  created_at timestamptz not null default now(),
  constraint taste_evaluations_not_empty
    check (num_nonnulls(sweetness, coolness, sourness, richness, heaviness) > 0)
);
```

- **`experience_id` が PK** ＝ 1体験につき最大1評価。別日に吸えば別 experience なので**上書きされず履歴として蓄積**。
- **`mix_id` / `user_id` は冗長保持せず**、`mix_experiences` から JOIN。
- 各軸 nullable ＝ **1軸だけの評価も可**。未入力は 0 等で補完しません。
- 軸はV1確定（追加・削除なし）。

---

## 3. RLS

4ポリシー（SELECT / INSERT / UPDATE / DELETE）すべてで、
**「その experience_id が本人所有であること」を EXISTS で検証**しています。

```sql
using (exists (select 1 from public.mix_experiences e
                where e.id = experience_id and e.user_id = (select auth.uid())))
```

⇒ 他人の experience にぶら下げて評価を作ることはできません（実測で `insufficient_privilege` を確認）。
個票は本人のみ閲覧可。公開側には集計RPCしか露出していません。

---

## 4. 集計RPC

`public.mix_taste_summary(p_mix uuid)` — **mix(method)単位**で以下を返します：

- 軸ごとの `*_avg`（小数1桁）と `*_count`
- `rater_count`（distinct ユーザー数）

**ハードニング基準（STEP 2 準拠）を実測で確認**：
`SECURITY DEFINER` ✅ ／ `search_path=public` 固定 ✅ ／ **PUBLIC EXECUTE = 0**（revoke済・anon/authenticated のみ）✅ ／ 返却は平均と件数のみで **PII・個票・user_id は非返却** ✅

**combo単位では集計していません**（同じ組み合わせでも作り方で味が変わるため）。将来の combo 比較には `combo_key` で JOIN すれば拡張できます。

---

## 5. 入力UX

最小フローは**重くしていません**：

```
吸った → どうだった？（また吸いたい / おいしかった / ふつう / 好みではなかった）
        └ 「味の印象も残す（任意）」  ← 押した人だけ5軸が開く
```

- 5軸は**必須ではなく**、分かる軸だけ選べば保存可能
- 各軸は**タップ式の5段階**（`min-h-11` でスマホでも押しやすい大きさを確保）。スライダーは使用せず
- 各軸に短い補助説明（例：甘さ「控えめ ← → しっかり甘い」）。説明で画面を埋めない
- 同じ数字を再タップで**選択解除**（未入力に戻せる）
- 後から煙道帳で追加・編集も可能

---

## 6. 平均表示ルール

| 評価者数 | 表示 |
|---|---|
| 0人 | **セクションごと非表示**（無理に枠を作らない） |
| 1〜2人 | 「**データ収集中**（N人が評価）」。平均値は出さない |
| 3人以上 | 平均を表示。**必ず母数を併記** |

**軸ごとに母数が異なる**設計です（各軸が任意入力のため）。例：

```
甘さ    4.2 / 5 （8件）
爽快感  4.5 / 5 （6件）
```

平均は SQL の `avg()` で **NULL を自動除外**、`count(軸)` も NULL を数えないため、軸別母数が自然に得られます。閾値は `MIN_RATERS_FOR_AVERAGE = 3` として定数化。

---

## 7. 自然言語タグ

`lib/taste.ts` の `TASTE_TAG_RULES` に**閾値を定数化**（将来調整可能）：

| 条件 | 言葉 |
|---|---|
| sweetness ≥ 4 / ≤ 2 | 甘め / 甘さ控えめ |
| coolness ≥ 4 | 爽快 |
| sourness ≥ 4 | 酸味しっかり |
| richness ≥ 4 | 濃厚 |
| heaviness ≤ 2 / ≥ 4 | 軽め / 重め |

複雑な分類ロジックは作っていません（各軸を単独で見るだけ）。
**母数が3人未満のときはタグを出しません**（少数の評価で断定しない）。未評価の軸も対象外。

---

## 8. mix詳細の表示

既存の段階開示を**壊さずに1段追加**しました：

```
王道 / 推薦バッジ
  ↓
フレーバー（配合 %）
  ↓
まずこの作り方（ボウル・炭・蒸らし）
  ↓
味の印象   ← 今回追加
   「甘め・爽快・軽め」
   実際に吸った8人の評価より
   ▸ 詳しい味覚を見る → 軸別バー＋各軸の件数
  ↓
写真 / 詳しい作り方（熱管理カーブ等）
```

- 初心者向け主表示は**言葉のみ**。数値は `<details>` を開いた人だけ
- **レーダーチャートは使っていません**（バー表示）
- データ不足時はセクションを出しません

---

## 9. 煙道帳への表示

タイムラインの各記録に、自分が付けた味覚を控えめに表示：

```
8月14日  Mango × Mint
         吸った ・ また吸いたい ・ 3回目
         甘さ 4 / 爽快感 5     [編集] [味覚を削除]
```

- 未評価の記録には「**味の印象を残す**」導線（後から追加可能）
- 編集・削除は**本人のみ**（体験そのものは残したまま味覚だけ削除できます）
- 取得は experience 一覧に対する**1クエリ**を追加しただけで、N+1 は作っていません

---

## 10. 既存 taste_tags との役割分担

| | 誰が | 何を |
|---|---|---|
| `mixes.taste_tags` | **投稿者** | 味の**系統**（トロピカル・清涼系 等） |
| `taste_evaluations` | **実際に吸った人** | 味の**強度**（甘さ4・爽快5 …） |

`taste_tags` は削除も変更もしていません。両者は別セクションで表示され、混在しません。

---

## 11. DB変更

- 🆕 `taste_evaluations` テーブル（＋4 RLSポリシー）
- 🆕 `mix_taste_summary()` RPC
- 既存テーブルへの列追加・変更は**なし**
- migration: `supabase/migrations/20260814000006_taste_evaluations.sql`

---

## 12. テスト結果

**自動テスト**：`tsc` ✅ ／ `eslint` ✅ ／ `vitest` **38 passed**（+6件） ✅ ／ `next build` ✅

**保存（実DB）**
- 5軸すべて入力 ✅ ／ 1軸のみ入力 ✅
- **全NULL → CHECK で拒否** ✅
- **0 / 6 → CHECK で拒否** ✅
- **同 experience に2件目 → PK で拒否** ✅
- 同じmixを別experienceで評価 → **両方保存** ✅

**RLS（実DB）**
- 自分の experience へ保存 ✅
- **他人の experience へ保存 → `insufficient_privilege` で拒否** ✅
- 他人の個票 SELECT → **不可**（全3件中 自分の2件のみ可視）✅
- 公開集計 → 平均・件数のみ（PUBLIC EXECUTE = 0）✅

**集計（実DB）**
- NULL除外 ✅
- **軸ごとに母数が異なる**（甘さ2件 / 爽快3件 / 酸味1件）✅
- 1〜2件 → データ収集中 ／ 3件以上 → 平均表示（単体テストで検証）✅
- **同comboの mix A と mix B が混ざらない**（甘さ 3.0 vs 1.0）✅

**UI**：verdictだけで完了可能 ✅ ／ taste入力をスキップ可能 ✅ ／ 後から追加可能 ✅ ／ 煙道帳で確認 ✅ ／ 詳細で言葉→数値の段階開示 ✅

**回帰**：smoked / made / 王道 / 投稿 / 煙道帳 いずれも build・型・lint 通過。王道の source of truth は `combo_orthodoxy` のままで、味覚データは接続していません。

**テストデータは全削除済み**（`taste_evaluations` 0件・`mix_experiences` 0件・seed mix 8件）。

---

## 13. 残課題

- **`ratio_percent` / `amount_g` の分離**：現状 g の実利用がほぼ無いため未実施。こだわり投稿でg入力が実際に増えたら再検討
- 味覚データの**王道・作り手スコアへの接続**は STEP 7 以降（方針どおり未接続）
- combo単位の味覚比較（構造は用意済み・UIは未実装）
- 自然言語タグの閾値は暫定値。データが貯まったら調整
- 監査Sprintの積み残し：**認証UXのA/B提案／ナビ整理案／余白の原因報告**（調査済み・報告未提出）

---

## 判断基準に対する自己評価

**「5つの数字を入力できるようになったか」ではなく「吸った人の感覚が無理なく蓄積され、次の人がその一台の味を想像しやすくなったか」**：

- **蓄積側**：最小フロー（吸った→4択）は一切重くしていません。5軸は任意の追加導線で、分かる軸だけ・後からでも入力可。同じ一台を何度吸っても上書きされず溜まります
- **想像側**：次の人が最初に見るのは数字ではなく「**甘め・爽快・軽め**」という言葉。数値は開いた人だけが見ます
- **誠実さ**：3人未満では平均を出さず「データ収集中」。数値には必ず母数を併記し、軸ごとの件数差も明示

STEP 7 には進まず停止しています。
