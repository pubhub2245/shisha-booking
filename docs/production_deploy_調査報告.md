# production 未反映の調査・修正報告

> 対象: `https://shisha-booking.vercel.app/`
> 実施日: 2026-08-14
> 新機能の追加は行っていません（deployment 整合性のみ）。

---

## 1. production 未反映の根本原因

**Vercel production が `main` を追跡しているが、`main` が一度も更新されていなかった。**

作業ブランチ `claude/shisha-app-display-bugs-flqfii` への push は
**すべて Preview deployment にしかなっていませんでした**。ご推察（依頼文 §6）のとおりです。

推測ではなく、GitHub の deployment metadata で確認しました：

```
env=Preview     sha=58e406b  (STEP 7 docs)
env=Preview     sha=9396175  (STEP 7)
env=Preview     sha=88bc5ee  (STEP 6)   ← 反映されるべき commit
env=Preview     sha=9c2f15b  (STEP 5)   ← 反映されるべき commit
env=Preview     sha=2532b20  (監査Sprint) ← 反映されるべき commit
...
env=Production  sha=6c0f977  ← production が配信していたのはこれ
```

直近100件の deployment のうち Preview 60 / Production 40 で、
**我々の作業コミットは1件も Production になっていませんでした。**

単一のUIバグではなく、ご指摘の全症状（MixHub・旧ファーストビュー・combo 1ホップ・
旧の吸いたい/作った・experience UI 不在・verdict 不在・味覚5軸不在・配合の `70g/30g`・
気分フィルタの旧挙動・投稿2択の不在）は、すべて `6c0f977` が配信されていたことで説明がつきます。

**build 失敗ではありません。** `6c0f977` の Production deployment は `status: success` でした。

---

## 2. production が監視していた branch

**`main`**（Vercel の Git 連携による production branch）。

- production 最新 deployment の ref = `6c0f9776bbfa698927972eddd7ec920579c9d27d`
- これは当時の `origin/main` HEAD と完全一致（PR #18 の squash commit）

`.vercel/project.json`・`vercel.json` はリポジトリに存在せず、
`.github/workflows/ci.yml` は lint/test/build のみで **deploy step を持ちません**。
つまり deploy は Vercel 側の Git 連携が担っており、その production branch が `main` でした。

---

## 3. 作業branchとの差

修正前の時点で：

- 作業ブランチは `main` より **13 commits ahead / 1 behind**
- `2532b20`（監査Sprint）・`9c2f15b`（STEP 5）・`88bc5ee`（STEP 6）は
  いずれも **`main` に含まれていない**ことを `git merge-base --is-ancestor` で確認

1 behind の正体は、PR #18 が squash merge されたことによるものです
（作業ブランチ側の元コミット `a5e68ca` と、main 側の squash commit `6c0f977`）。
両者の内容は `git diff a5e68ca origin/main` が**空**＝同一であることを確認しました。

---

## 4. production deployment の旧 commit

| 項目 | 値 |
|---|---|
| commit SHA | **`6c0f977`**（`6c0f9776bbfa698927972eddd7ec920579c9d27d`） |
| 内容 | 「段階開示：ミックス詳細に『まずこの作り方』（結論）を全員へ表示 (#18)」 |
| deployment id | 5898159216 |
| created | 2026-08-14T00:08:35Z |
| status | success |

---

## 5. 修正方法

**コードの巻き戻しは一切していません。** 最新版を `main` へ前進させただけです。

1. **rebase で squash 重複を解消**
   `git rebase --onto origin/main a5e68ca`
   → 既に merge 済みの `a5e68ca` を除いた 12 commits を `origin/main` の上に再配置。
   **コンフリクトなし。**
   安全確認として rebase 前に backup tag を作成し、
   `git diff pre-rebase-backup HEAD` が**空**（＝内容の欠落なし）であることを確認。

2. **rebase 後のツリーで再検証** — `tsc` / `eslint` / `vitest 38 passed` / `next build` すべて通過

3. **`git push --force-with-lease`**（作業ブランチのみ。main への force push はしていません）

4. **PR #19 を作成 → Vercel preview check が success を確認してから squash merge**

禁止事項（最新版の巻き戻し・migration 再実行・手当たり次第の再deploy・
原因不明のままの main force push・無関係な大規模変更）はいずれも行っていません。

---

## 6. production へ反映した最新 commit

| 項目 | 値 |
|---|---|
| merge commit | **`0f90d5f`**（`0f90d5f26414743d835665090360d9a5b3163f8d`） |
| PR | #19「監査Sprint + STEP 2〜7 を production へ反映」 |
| 含まれる commit | 監査Sprint `2532b20` / STEP 2〜7（`0f03bc2`〜`c0f294e` 相当の12件） |

**配信ツリーの同一性を検証済み**：

```
main のツリーhash    : 7b5efde50cf628029e04cde8bfaefff910326383
検証済みツリーのhash : 7b5efde50cf628029e04cde8bfaefff910326383   ← 完全一致
```

つまり production に出たツリーは、私が `tsc`/`lint`/`vitest`/`build` を通したツリーと
**バイト単位で同一**です。併せて deployed tree 上で以下を確認しました：

- `app/(auth)/login/page.tsx` の **MixHub 出現数 = 0**
- `app/page.tsx` に「今日のミックス、」「みんなでつくる。」が存在
- `components/smoked-button.tsx` / `components/taste-input.tsx` が存在

---

## 7. Vercel build / deploy 結果

| 対象 | 結果 |
|---|---|
| PR #19 の Vercel check（`c0f294e`） | **success** |
| Production deployment（`0f90d5f`） | **success** |

Production deployment の SHA が `6c0f977` → **`0f90d5f`** に切り替わったことを
deployment metadata のポーリングで確認しました。build failure はありません。

---

## 8. Supabase migration との整合性

- **migration の再適用はしていません**（二重適用なし）。DB は一切変更していません。
- 今回は「DBが新しく frontend が古い」状態を、**frontend を追いつかせて解消**したものです。
- 旧 frontend が依存していた `mix_makes` は `mix_makes_legacy` へ退避済みで、
  最新コードには参照が残っていません（STEP 2 で移行完了）。
  したがって**新 frontend は新スキーマ前提で正常に build**しています（実際に build 通過）。
- 逆に、旧 production（`6c0f977`）は `mix_makes` を参照していたため、
  legacy 退避後は「作った」系の集計が 0 になっていた可能性があります。
  今回の反映でこの不整合も解消されます。

---

## 9. production smoke test 結果

**実施できませんでした。理由を明記します。**

このサンドボックスの外向き通信はエージェントプロキシ経由で、
`shisha-booking.vercel.app:443` が**ポリシーで拒否**されています：

```
kind: connect_rejected
detail: gateway answered 403 to CONNECT (policy denial or upstream failure)
host: shisha-booking.vercel.app:443
```

HTTP 取得も実ブラウザも同じ経路を使うため、**production URL の実コンテンツ確認は不可**です。
「deploy が成功したから完了」とはしません（依頼文 §10）。

**私が確認できた範囲**：
- production deployment の commit SHA が `0f90d5f` に変わったこと（metadata）
- その deployment の status が success であること
- 配信ツリーが検証済みツリーと**ハッシュ一致**であること
- そのツリー内に新UIのソースが存在し、MixHub が消えていること

**確認できていない範囲（＝次に人／Claude in Chrome が実施すべきこと）**：
1. `/` に「今日のミックス、もう迷わない。」「日本のシーシャの『王道』を、みんなでつくる。」が出るか
2. 気分フィルタの件数が操作地点付近に出て、ヒーロー総数が動かないか
3. combo 1件 → mix 詳細へ直行 / 2件以上 → combo 比較
4. mix 詳細の配合が `%` 表示、「吸った」「作ってみた」が最新UIか
5. 認証画面が BRAND 表記（MixHub なし）か
6.〜10. ログイン後（吸った / verdict / 味覚5軸 / 煙道帳 / 投稿2択）

なお **ログイン後テストは実施していません**。安全に使えるテストアカウントを持っておらず、
他者・管理者の credential は使用しません（依頼文 §9）。

---

## 10. 未確認事項

- production URL の実描画（上記のとおりサンドボックスから到達不可）
- クライアントレンダリング部分の挙動（実ブラウザでのみ確認可能）
- Vercel ダッシュボード側の設定値（production branch 名・alias 設定）。
  Vercel CLI は**未認証**（`~/.vercel` なし・`VERCEL_*` 環境変数なし）のため直接照会できず、
  GitHub の deployment metadata から**間接的に** `main` と判定しています
- ログイン後フロー（テストアカウント不在のため）

---

## 11. 今後同じ事故を防ぐ方法

1. **作業ブランチへの push ＝ Preview どまり**であることを前提に運用する。
   production へ出すには **`main` への merge が必須**。
2. 各 STEP 完了時に、production へ出すか作業ブランチに溜めるかを明示的に決める。
   溜める場合は「production はまだ旧版」であることを合意しておく。
3. **UX監査の前に production の commit SHA を確認する**。
   確認コマンド（トークンがあれば1行）:
   ```
   curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
     "https://api.github.com/repos/pubhub2245/shisha-booking/deployments?environment=Production&per_page=1"
   ```
   これが作業中の HEAD と一致していなければ、監査しても旧版を見ることになります。
4. 監査対象URLを毎回明示する（production か preview か）。
   Preview URL で監査すれば main を待たずに最新版を検証できます。
5. 長期ブランチは定期的に `main` へ取り込み、13コミット分の乖離を作らない。

---

## 補足：ご指摘への対応

- **credential の件**（§2）：誤認との整理を了解しました。コードに credential を追加・変更していません。
- **MixHub の件**（§3）：production で見えたことを理由にコードを触っていません。
  原因は deploy 未反映で、コード側は既に修正済み（deployed tree で出現数 0 を確認）。
- **ゲスト記録等の新機能**（§11）：一切追加していません。

production 上での最終確認（§9 の1〜10）をもって完了となります。
UX改修・STEP 8 には進まず、ここで停止します。
