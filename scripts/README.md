# フレーバー自動取得（fetch-flavors.mjs）

ネットの信頼できるシーシャ通販（Shopify製）から、フレーバー名を半自動で集めて
図鑑に登録するためのスクリプトです。**ネットワーク制限のないPC**で実行します。

## 何をするか
1. 通販サイトの公開JSON（`/collections.json`, `/collections/<brand>/products.json`）から
   ブランドと商品名（＝フレーバー名）を取得。
2. 「50g」やブランド名などのノイズを除去し、**「ブランド, 名前」の行**として出力。
3. その出力を、アプリの **`/flavors/new`「まとめて追加」** に貼り付けて登録（人の目で確認してから）。

> ⚠️ 出力はそのまま鵜呑みにせず、必ず一度目を通してから貼り付けてください（誤情報防止）。

## 手順

### 0. 準備
- Node.js 18 以上（`node -v` で確認）。
- このリポジトリを PC に clone / pull しておく。

### 1. 取得元を決める（任意で編集）
`scripts/fetch-flavors.mjs` の先頭 `SHOPS` に、取得したい通販のドメインを入れます。
既定で 1 店入っています。増やしたい場合は Shopify 製のシーシャ通販ドメインを追加。

```js
const SHOPS = [
  'https://shisha-oroshi.myshopify.com',
  // 'https://別の店.myshopify.com',
  // 'https://独自ドメインの店.jp',   // Shopify製ならOK
]
```

- ドメインだけ入れれば、その店の**全ブランドを自動発見**して取得します。
- うまく取れないブランドだけ個別指定したい時は `SOURCES` にコレクションの
  `products.json` URL を入れてください（コレクションのページURL末尾に
  `/products.json` を付けると中身を確認できます）。

### 2. 実行してファイルに出力
```bash
node scripts/fetch-flavors.mjs > flavors.txt
```
- 進捗は画面（標準エラー）に出ます。`flavors.txt` に「ブランド, 名前」が並びます。

### 3. 中身を確認・修正
`flavors.txt` を開いて、明らかにおかしい行（商品名でない・容量だけ 等）を削除・修正。

### 4. アプリに登録
1. アプリで **`/flavors/new`** を開く（あなたは管理者なのでアクセス可）。
2. **「まとめて追加」** の欄に `flavors.txt` の中身を貼り付け → 追加。
   - 既に登録済みのフレーバーは自動でスキップされます。

## トラブル時
- `collections.json 取得失敗` … その店がShopifyでない／URL違い。別の店を試すか、
  `SOURCES` に直接 `products.json` を指定。
- ブランド名がおかしい（例: セール等が混ざる）… `SKIP_HANDLES` に handle を追加。
- 名前にゴミが残る … `NOISE` の除去パターンを追記。
