# MixHub — シーシャ ミックス図鑑

シーシャ屋で「どのフレーバーにするか」に迷わないための、**ミックス図鑑 × SNS × フレーバー購入アフィリエイト**アプリ。
日本中の「美味しい」ミックスと、その作り方（熱管理・炭のセットアップ・フレーバーの置き方）が集まり、
誰でも投稿でき、いいねで人気が可視化される。店舗登録でお店の集客にもつながる。

> 事業の全体像は [`docs/事業計画.md`](docs/事業計画.md)、競合分析は [`docs/競合分析.md`](docs/競合分析.md) を参照。

## 主な機能

**図鑑・発見**
- 図鑑フィード (`/`) — 組み合わせ（Combo）単位で表示、新着/人気/詳しい順、気分（味わい・系統・強さ）で探す、キーワード検索
- コンボ詳細 (`/combo/[slug]`) — 同じ組み合わせの作り方を比較（熱カーブ重ね表示）
- フレーバー図鑑 (`/flavors`) — インクリメンタル検索、ブランド別 (`/brand/[brand]`)、共起「よく一緒に使う」
- ランキング (`/ranking`)

**投稿**
- 投稿/編集 (`/post`, `/mix/[id]/edit`) — メーカー×味の2段選択、熱管理カーブ（折れ線・炭イベント）、HMS選択（ロータス等・アイコン付き）、炭/風防/ボウル/盛り方、アレンジ投稿
- 作り込み度スコアで詳しい投稿が上位に表示

**SNS**
- いいね・コメント・ブックマーク・フォロー・タイムライン・公開プロフィール (`/u/[username]`)

**マイ棚（`/shelf`）**
- 持っているフレーバーを登録 → 作れるミックス表示、「あと1つで作れる」提案

**店舗（`/shops`, `/shop/[id]`）**
- お店＝独立エンティティ＋所属メンバー（オーナー承認制・権限譲渡可）
- 在庫棚・店頭QRメニュー（`/shop/[id]/manage`）、フレーバー詳細に「取り扱い店舗」

**信頼・マネタイズ**
- プロ認証（審査制・認証バッジ）／フレーバー図鑑への追加はプロ限定＋追加者記録
- アフィリンク＋クリック計測（`/go`、集計 `/admin/clicks`）
- 有料ノート（熱管理などを課金で解錠・プロ限定／決済は Stripe を env で有効化）

**認証**
- Supabase Auth（メール＋パスワード）、確認/再設定リンク着地 (`/auth/callback`)、パスワード再設定 (`/forgot`, `/reset-password`)
- `NEXT_PUBLIC_EMAIL_ENABLED` でメール導線の表示を切替（メール無し運用に対応）

## 技術スタック

- Next.js 16（App Router / Server Actions） + React 19
- Supabase（Postgres / Auth / RLS）
- Tailwind CSS v4
- Stripe（有料ノートの決済・任意）
- Vitest（`tests/`）

## セットアップ

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # 本番ビルド
npm run lint   # ESLint
npm test       # Vitest（コアロジックのユニットテスト）
```

Supabase 接続情報は `next.config.ts` に既定値あり（anon key は公開前提）。
スキーマは `supabase/migrations/` にあり、Supabase CLI で `supabase db push`、または SQL を直接実行して適用する。
その他の環境変数は [`.env.example`](.env.example) を参照（アフィリエイトタグ、Stripe、SITE_URL、EMAIL_ENABLED、特商法の事業者情報 `LEGAL_*`）。

## デプロイ

`main` ブランチへの push で Vercel が自動デプロイ。

## ディレクトリ

```
app/            画面（feed / mix / combo / flavor / brand / post / auth / mypage / shelf / shop / admin / legal）
components/     UI（site-header, mix-card, combo-card, heat-curve-*, hms-*, flavor-search, locked-note …）
actions/        Server Actions（auth, mixes, profile, pro, shop, shop-inventory, shelf, unlock）
lib/            supabase クライアント（server/client/admin）, queries, quality, heat, premium, go, affiliate, 型
supabase/       マイグレーション（スキーマ・RLS・関数・シード）
tests/          Vitest ユニットテスト
docs/           事業計画・競合分析
```
