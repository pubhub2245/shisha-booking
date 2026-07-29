# MixHub — シーシャ ミックス図鑑

シーシャ屋で「どのフレーバーにするか」に迷わないための、**ミックス図鑑 × SNS × フレーバー購入アフィリエイト**アプリ。
日本中の「美味しい」ミックスと、その作り方（熱帯・炭の管理、フレーバーの置き方）が集まり、
誰でも投稿でき、いいねで人気が可視化される。店舗登録でお店の集客にもつながる。

> 事業の全体像は [`docs/事業計画.md`](docs/事業計画.md) を参照。

## 機能（MVP）

- **図鑑フィード** (`/`) — 新着・人気順、味わいタグ・キーワード検索
- **ミックス詳細** (`/mix/[id]`) — 使用フレーバー＋購入（アフィリエイト）リンク、作り方ノート
- **投稿** (`/post`) — 複数フレーバー・味わいタグ・作り方ノートを登録
- **いいね** — 楽観的 UI、`like_count` は DB トリガで同期
- **認証** (`/login`, `/signup`) — Supabase Auth（メール＋パスワード）
- **マイページ** (`/mypage`) — プロフィール編集・店舗登録・自分の投稿
- **店舗の方へ** (`/for-shops`)

## 技術スタック

- Next.js 16（App Router / Server Actions） + React 19
- Supabase（Postgres / Auth / RLS）
- Tailwind CSS v4

## セットアップ

```bash
npm install
npm run dev   # http://localhost:3000
```

Supabase 接続情報は `next.config.ts` に定義（anon key は公開前提）。
スキーマは `supabase/migrations/` に含まれる。新しい Supabase プロジェクトに適用するには
Supabase CLI で `supabase db push`、または SQL を直接実行する。

## ディレクトリ

```
app/            画面（feed / mix / post / auth / mypage / for-shops）
components/     UI（site-header, mix-card, like-button, strength-meter …）
actions/        Server Actions（auth, mixes, profile）
lib/            supabase クライアント, queries, auth ヘルパ, 型
supabase/       マイグレーション（スキーマ・RLS・シード）
```
