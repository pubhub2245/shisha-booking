-- 人気シーシャブランドの定番フレーバーを追加（メーカー×味で選べるように拡充）。
-- unique(brand,name) のため重複は無視。ブランド名は英大文字、味は日本語カタカナで統一。
insert into public.flavors (brand, name) values
-- AL FAKHER
('AL FAKHER','グレープ'),('AL FAKHER','グレープミント'),('AL FAKHER','ウォーターメロン'),
('AL FAKHER','ウォーターメロンミント'),('AL FAKHER','ピーチ'),('AL FAKHER','ミックスフルーツ'),
('AL FAKHER','ブルーベリー'),('AL FAKHER','オレンジ'),('AL FAKHER','ストロベリー'),
('AL FAKHER','ローズ'),('AL FAKHER','ガムミント'),('AL FAKHER','カプチーノ'),
('AL FAKHER','チェリー'),('AL FAKHER','ココナッツ'),('AL FAKHER','キウイ'),
('AL FAKHER','レモン'),('AL FAKHER','パイナップル'),('AL FAKHER','ライチ'),
('AL FAKHER','ミルクセーキ'),('AL FAKHER','ミント'),
-- ADALYA
('ADALYA','ラブ88'),('ADALYA','レディキラー'),('ADALYA','ブルーベリームース'),
('ADALYA','アイスミント'),('ADALYA','ミント'),('ADALYA','グレープ'),
('ADALYA','ハプニング'),('ADALYA','ウォーターメロンミント'),('ADALYA','ピンクドリーム'),
('ADALYA','クレイジーメロン'),('ADALYA','アップルミント'),('ADALYA','レモンミント'),
-- AZURE
('AZURE','ホワイトナイト'),('AZURE','ゴールデンティー'),('AZURE','レモンチェロ'),
('AZURE','ブラックライム'),('AZURE','オーシャンブリーズ'),
-- FUMARI
('FUMARI','レモンミント'),('FUMARI','ブルーベリーマフィン'),('FUMARI','スペアミント'),
('FUMARI','レッドグミベア'),('FUMARI','オレンジクリームサイクル'),('FUMARI','シトラスミント'),
-- STARBUZZ
('STARBUZZ','ピンクスター'),('STARBUZZ','セックスオンザビーチ'),('STARBUZZ','サンタナ'),
('STARBUZZ','トロピカルパンチ'),('STARBUZZ','ホワイトミント'),('STARBUZZ','シトラスミスト'),
-- TANGIERS
('TANGIERS','ケインミント'),('TANGIERS','カシミアピーチ'),('TANGIERS','オレンジソーダ'),
('TANGIERS','ブルーベリー'),('TANGIERS','ミント'),
-- SOCIAL SMOKE
('SOCIAL SMOKE','アブソルートゼロ'),('SOCIAL SMOKE','ダブルアップル'),('SOCIAL SMOKE','ピーチ'),
('SOCIAL SMOKE','ホワイトグレープ'),('SOCIAL SMOKE','ミント'),
-- NAKHLA
('NAKHLA','ダブルアップル'),('NAKHLA','ミント'),('NAKHLA','グレープ'),
('NAKHLA','ストロベリー'),('NAKHLA','ローズ'),('NAKHLA','ピーチ'),
-- SERBETLI
('SERBETLI','アイスシルバー'),('SERBETLI','アイスメロン'),('SERBETLI','ラブミックス'),
('SERBETLI','ロシアンクリーム'),('SERBETLI','アイスサンディ'),
-- AL WAHA
('AL WAHA','トゥーアップル'),('AL WAHA','ミント'),('AL WAHA','グレープミント'),
('AL WAHA','レモンミント'),('AL WAHA','ピーチ')
on conflict (brand, name) do nothing;
