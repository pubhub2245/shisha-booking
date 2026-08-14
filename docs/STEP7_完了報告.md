# 煙道 ENDO — STEP 7 完了報告（作り手の実績可視化）

> 対象コミット: `9396175`（branch: `claude/shisha-app-display-bugs-flqfii`）
> 次の大規模機能へは進まず停止しています。
> 最終更新: 2026-08-14

---

## 1. STEP 6 公開平均の重み修正結果

公開味覚平均を **ユーザー単位の2段階平均** に変更しました。

1. 同一 user × 同一 mix の複数 taste_evaluation を**まず平均**
2. その**ユーザー平均どうしを平均**

```sql
with per_user as (
  select e.user_id, avg(t.sweetness) as sweetness, ... 
  from public.taste_evaluations t
  join public.mix_experiences e on e.id = t.experience_id
  where e.mix_id = p_mix
  group by e.user_id            -- ① ユーザーごとに平均
)
select round(avg(sweetness),1), count(sweetness), ..., count(*)
from per_user;                  -- ② ユーザー平均どうしの平均／母数はdistinct user
```

**実測での確認**（ユーザーA が 5,5,5 ／ ユーザーB が 2）：

| 方式 | 結果 |
|---|---|
| 修正前（experience重み） | (5+5+5+2)/4 = **4.25** |
| **修正後（user重み）** | (5+2)/2 = **3.5** ✅ |

ヘビーユーザーが繰り返し評価しても平均を過度に動かせません。

**母数**も experience 数 → **その軸を評価した distinct user 数**に変更（上記例で `2`）。
UI表示も「件」→「**人**」に統一し、**平均の母集団と表示母数を一致**させました。`rater_count` も distinct user、「3人以上で平均表示」ルールも distinct user 基準です。

**experience 履歴は削除・統合していません。** 同じユーザーが同じ method を何度吸っても、その都度 taste_evaluation を保存でき、煙道帳の本人表示は従来どおり experience 単位です。

---

## 2. 作り手実績の最終定義

| 表示 | 定義 |
|---|---|
| **作り方** | そのユーザーが author で `hidden = false` の作り方の件数 |
| **王道** | **現在**の公式王道の件数（`combo_orthodoxy` JOIN `mixes`）。過去の認定歴は加算しない |
| **吸われた** | その作り方に対する `experience_type IN ('smoked','made')` の**他者による**回数 |
| **再現された** | その作り方に対する `experience_type = 'made'` の**他者による**回数 |

内部的には**回数と人数を分離**して保持しています：

- `smoke_count`（回数） / `smoker_count`（distinct user）
- `made_count`（回数） / `maker_count`（distinct user）

UIは回数を主表示し、人数は tooltip（「◯人が吸っています」）に留めました。4数値を画面に並べていません。

---

## 3. 集計RPC / クエリ

`public.author_endo_stats(p_author uuid)` — **1 RPC で6値をまとめて取得**。
method ごとに experience を数える N+1 は発生しません。

ハードニング基準の遵守を実測確認：
`SECURITY DEFINER` ✅ ／ `search_path=public` 固定 ✅ ／ **PUBLIC EXECUTE = 0**（anon/authenticated のみ）✅ ／ 返却は6つの集計値のみで **PII・個票・user_id・日時は非返却** ✅

---

## 4. 自己体験の除外方法

RPC 内の `others` CTE で `where e.user_id <> p_author` を適用し、
**作り手本人の自己 smoked / made を公開実績から除外**しています。
`smoker_count` / `maker_count` も同じ母集団から数えるため、人数側にも本人は入りません。

**本人の煙道帳には従来どおり残ります**（体験の記録としては正しいため）。

実測：他者B の smoked×3 + made×1、作り手A本人の smoked×1 + made×1 を投入 →
`smoke_count = 4`・`made_count = 1`（本人の2件は加算されず）✅

likes / follows / comments は実績に含めていません。

---

## 5. 王道数の定義

```sql
select count(*) from public.combo_orthodoxy c
join own o on o.id = c.mix_id
```

**現在の公式王道のみ**。`combo_orthodoxy_history` からの過去認定は加算しません。
実測：3件認定 → 1件解除 → **`orthodoxy_count = 2`**（履歴に revoked は残るが加算されない）✅

> **併せて改称**：旧 `national_reps` 由来のカテゴリ表示が「◯系の**王道**」となっており、公式王道（`combo_orthodoxy`）と**同じ語で別物を指す**状態でした。「王道」の意味を1つに保つため、**「◯系で人気」へ改称**しています（機能・ロジックは維持）。対象はミックス詳細のバッジ／シェア文面／地域表示／作り手プロフィールの見出しです。

---

## 6. 作り手プロフィールUI

```
[アイコン] 山田太郎  ✓認証プロ
@yamada
自己紹介…
所属店舗（既存データがある場合のみ）

┌────────┬────────┬────────┬────────┐
│ 作り方 18│ 王道 2 │吸われた 426│再現された 87│   ← tooltipで「◯人が吸っています」
└────────┴────────┴────────┴────────┘

フォロワー / フォロー中（実績より下に配置）

その作り手の作り方一覧（既存 MixCard・王道/推薦バッジ維持）
```

**空状態**：作り方0件のときは4カードを並べず、
「まだ作り方の投稿はありません。」の1行のみ。**本人が見ているときだけ**「最初の作り方を投稿する →」を表示します。

**コピー**：`method` / `experience` / `orthodoxy` / `maker_count` 等のDB用語は一切出していません。「獲得」「スコア」「ランク」も使わず、**作り方・王道・吸われた・再現された**のみです。

---

## 7. 認証プロとの分離

既存の `profiles.is_pro`（＋ `VerifiedBadge`）をそのまま再利用し、**新しいpro判定列・ロジックは作っていません**。

- 認証プロ＝**職業・認証属性**（バッジと店舗名で表示）
- 煙道実績＝**その作り方が実際にどう使われたか**（4つの数値）

**認証プロだからといって実績値を上乗せする処理は一切ありません。** 未認証の一般ユーザーでもプロフィールと実績は同じように表示されます。

---

## 8. privacy / RLS

- 公開されるのは**集計値のみ**。他ユーザーの experience / verdict / taste evaluation を列挙する箇所はありません
- 「426回吸われた」は表示、「○○さんが8月14日に吸った」は**非公開**
- `mix_experiences` / `taste_evaluations` の RLS（本人限定）は変更していません
- 集計RPCは既存の公開集計と同じ privacy 思想（count/avg のみ・PII非返却）

---

## 9. パフォーマンス

- 作り手実績は **1 RPC**。以前の `getAuthorStats` が行っていた「mixIds を集めてから count」のような往復を増やしていません
- `own` / `others` を CTE で1回だけ組み立て、6値を同一スキャンから算出
- プロフィール表示の総クエリ数は既存＋1（実績RPC）のみ

---

## 10. テスト結果

**自動テスト**：`tsc` ✅ ／ `eslint` ✅ ／ `vitest` **38 passed** ✅ ／ `next build` ✅

**作り方**
- author A の mix 3件 → **作り方3** ✅
- 他人の mix は含まれない ✅
- 非公開(`hidden=true`)にすると **3→2** に減る ✅

**王道**
- A の method が現在王道2件 → **王道2** ✅
- 過去に認定して解除済みのものは**加算されない** ✅

**吸われた**
- 他人の smoked → 加算 ✅ ／ 他人の made → 加算 ✅
- **本人の smoked → 除外** ✅ ／ **本人の made → 除外** ✅

**再現**
- 他人の made のみ加算（他人の smoked は含まない）✅ ／ 本人 made は除外 ✅

**人数**
- 同一 user が同 method を3回 smoked → `smoke_count = 3` / `smoker_count = 1` ✅

**味覚（STEP 6 修正の検証）**
- user重み平均 3.5（experience重みなら4.25）✅ ／ 母数 = distinct user = 2 ✅

**privacy**：集計RPCは6つの数値のみ返却（username・個票なし）✅

**回帰**：王道 / 推薦 / フォロー / 投稿一覧 / mix詳細 / 煙道帳 いずれも型・lint・build 通過。

**テストデータは全削除済み**（mixes 8件のシードのみ、experiences・tastes・orthodoxy はいずれも0件）。

---

## 11. 残課題

- **「また吸いたい」率**の表示（§10 のとおり今回は未実装。将来の補助証拠）
- 現在の王道と**王道認定歴**の分離表示（V1は現在値のみ）
- 人数（smoker/maker）の tooltip は簡易実装。将来UIで正式に出すなら要デザイン
- 旧 `national_reps` 系の表示は「人気」へ改称したが、**そもそも一般UIに出すべきか**は将来判断（STEP 3の方針では運営の推薦候補発見が本来の役割）
- `ratio_percent` / `amount_g` の分離（STEP 5 からの継続課題）
- 監査Sprintの積み残し：**認証UXのA/B提案／ナビ整理案／余白の原因報告**（調査済み・報告未提出）

---

## 判断基準に対する自己評価

**「人気者に見えるプロフィールになったか」ではなく「その人が煙道にどんな作り方を残し、それが実際にどれだけ吸われ、再現されているかが静かに伝わるか」**：

- 表示は**4つの事実**のみ。総合スコアも順位も段位も作っていません
- **自己体験を除外**したので、数値は「他者に使われた」ことだけを意味します
- フォロワー数は実績の**下**に配置し、主指標にしていません
- 味覚5軸・verdict は**良し悪しの判定に使っていません**（味の特徴であり優劣ではないため）
- 実績0の作り手でも見劣りする4カードを並べず、静かな空状態にしました

次の大規模機能へは進まず停止しています。
