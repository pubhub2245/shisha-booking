"use client";

import { useEffect } from "react";

/**
 * 「このページが開かれた」ことを1回だけ知らせる小さな部品。
 *
 * ■ なぜ要るのか
 *   2026-09-18 に、見る数字を「作ったページの本数」から
 *   「サイトに来た人の数（週）」に変えた。
 *   ところが、このサイトには訪問を数える仕組みがまだ無く、
 *   数字が0のまま動かせない状態だった。これはその受け口への合図。
 *
 * ■ 何をするか
 *   ページが表示されたら、数える受け口へ合図を1回送るだけ。
 *   画面には何も出さない。読み込みが終わってから送るので、表示は遅くならない。
 *
 * ■ 送らないもの
 *   IPアドレス・ブラウザの種類・お客さんを見分ける印は送らない。
 *   送るのは「サイト名・ページの場所・合言葉（utm_campaign）・来た元」だけ。
 *
 * ■ お金はかからない
 *   外部のアクセス解析サービスは使わない。すでにある倉庫に1行足すだけ。
 *
 * ■ 失敗しても何も起きない
 *   受け口が落ちていても、ページの表示はまったく変わらない。
 */

/** 数える受け口（5つのサイトでここ1か所に集める） */
export const HIT_ENDPOINT = "https://tebaya-report.vercel.app/api/hit";

/** このサイトの名前（受け口が知っている名前と一致させること） */
export const SITE_KEY = "endo";

export default function VisitBeacon() {
  useEffect(() => {
    try {
      const body = JSON.stringify({
        site: SITE_KEY,
        path: window.location.pathname,
        campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
        ref: document.referrer || null,
      });

      // 画面の表示が終わってから送る（表示を遅らせない）
      const send = () => {
        fetch(HIT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
          // 数えるだけなので、返事も入れ物（cookie）も要らない
          credentials: "omit",
          mode: "cors",
        }).catch(() => {
          /* 数えられなくても、ページには何の影響も無い */
        });
      };

      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(send, { timeout: 3000 });
      } else {
        window.setTimeout(send, 1200);
      }
    } catch {
      /* 何があってもページを壊さない */
    }
    // 1ページにつき1回だけ
  }, []);

  return null;
}
