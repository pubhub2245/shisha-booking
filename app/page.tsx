import { Header } from '@/components/alpha/Header'
import { Footer } from '@/components/alpha/Footer'
import { Button } from '@/components/alpha/Button'
import { SectionHead } from '@/components/alpha/SectionHead'
import { RevealOnScroll } from '@/components/alpha/RevealOnScroll'
import { ApplyForm } from '@/components/alpha/ApplyForm'

export default function Home() {
  return (
    <>
      <Header />

      {/* ========== HERO ========== */}
      <section className="min-h-screen flex items-center relative overflow-hidden" style={{ padding: '180px 0 120px' }} id="top">
        {/* Glow orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-20%', right: '-10%',
            width: '70vw', height: '70vw', maxWidth: '900px', maxHeight: '900px',
            background: 'radial-gradient(circle at 50% 50%, rgb(201 166 90 / 0.22) 0%, rgb(201 166 90 / 0.10) 28%, rgb(201 166 90 / 0) 62%)',
            filter: 'blur(14px)',
            animation: 'breathe 11s ease-in-out infinite',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-30%', left: '-15%',
            width: '60vw', height: '60vw', maxWidth: '800px', maxHeight: '800px',
            background: 'radial-gradient(circle at 50% 50%, rgb(126 101 40 / 0.13) 0%, rgb(126 101 40 / 0) 65%)',
            filter: 'blur(20px)',
            animation: 'breathe 14s ease-in-out infinite reverse',
          }}
        />

        <div className="wrap grid gap-[56px]">
          {/* Eyebrow */}
          <div className="flex items-center gap-[22px]" style={{ opacity: 0, animation: 'fadeUp .9s .1s forwards' }}>
            <span className="eyebrow">{'\u03B2'} Membership Open ― Miyazaki, Japan</span>
            <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} aria-hidden="true" />
            <span className="kicker">二〇二六</span>
          </div>

          {/* Title */}
          <h1
            className="font-light leading-[1.34] tracking-[0.02em]"
            style={{
              fontFamily: 'var(--font-serif-jp)',
              fontSize: 'clamp(2.1rem, 6vw, 4.6rem)',
              opacity: 0, animation: 'fadeUp 1.1s .25s forwards',
            }}
          >
            <span className="block">経営者の場を、</span>
            <span className="block">
              静かに
              <em className="not-italic italic tracking-[0]" style={{ fontFamily: 'var(--font-serif-en)', fontStyle: 'italic', fontWeight: 400, color: 'var(--color-gold)' }}>
                格上げする。
              </em>
            </span>
          </h1>

          {/* Sub */}
          <p
            className="text-[1rem] max-w-[520px] tracking-[0.04em] leading-[2]"
            style={{ color: 'var(--ink-75)', opacity: 0, animation: 'fadeUp 1.1s .5s forwards' }}
          >
            煙ではなく、場の密度を設計する。<br />
            経営者のための、厳選された提携会場でのみ届けられる、<br />
            限られたラウンジ体験 ― それが Alpha Lounge です。
          </p>

          {/* Meta strip */}
          <div
            className="grid grid-cols-3 max-[900px]:grid-cols-1"
            style={{
              borderTop: '1px solid var(--color-line)',
              borderBottom: '1px solid var(--color-line)',
              opacity: 0, animation: 'fadeUp 1.1s .75s forwards',
            }}
          >
            <HeroMeta k="Price" v={<>&#165;5,500<span className="block text-[0.78rem] mt-[4px]" style={{ color: 'var(--ink-75)' }}>{'\u03B2'}会員 ・ 3ヶ月</span></>} borderRight />
            <HeroMeta k="Seats" v={<>10社限定<span className="block text-[0.78rem] mt-[4px]" style={{ color: 'var(--ink-75)' }}>Founding Members Only</span></>} borderRight />
            <HeroMeta k="Area" v={<>宮崎 ・ 都城<span className="block text-[0.78rem] mt-[4px]" style={{ color: 'var(--ink-75)' }}>提携会場にて</span></>} />
          </div>

          {/* CTA */}
          <div
            className="flex flex-wrap gap-[18px] items-center"
            style={{ opacity: 0, animation: 'fadeUp 1.1s .95s forwards' }}
          >
            <Button href="#apply" variant="gold">
              {'\u03B2'}会員に申し込む <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
            </Button>
            <span className="eyebrow text-[0.78rem] tracking-[0.12em]">※ 審査制 ・ 経営者 / 個人事業主</span>
          </div>
        </div>
      </section>

      {/* ========== CONCEPT ========== */}
      <section className="relative overflow-hidden" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)', padding: 'clamp(110px, 14vw, 180px) 0' }}>
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%', left: '50%', width: '900px', height: '900px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgb(201 166 90 / 0.10) 0%, rgb(201 166 90 / 0) 55%)',
          }}
        />
        <RevealOnScroll>
          <div className="wrap max-w-[880px] mx-auto relative z-2" style={{ paddingLeft: 'clamp(20px, 4vw, 48px)', paddingRight: 'clamp(20px, 4vw, 48px)' }}>
            <span className="eyebrow" style={{ color: 'var(--color-gold-light)' }}>i. ― Concept</span>
            <blockquote
              className="relative font-light leading-[2.1] tracking-[0.08em] my-[42px] mb-[38px]"
              style={{ fontFamily: 'var(--font-serif-jp)', fontSize: 'clamp(1.4rem, 2.8vw, 2.05rem)' }}
            >
              <span
                className="absolute opacity-35"
                style={{ fontFamily: 'var(--font-serif-en)', fontSize: '7rem', lineHeight: '0.6', color: 'var(--color-gold)', left: '-0.15em', top: '-0.08em' }}
                aria-hidden="true"
              >
                {'\u201C'}
              </span>
              我々が売るのは、<em className="not-italic" style={{ fontFamily: 'var(--font-serif-en)', fontStyle: 'italic', color: 'var(--color-gold-light)', letterSpacing: '0.02em' }}>煙ではない。</em><br />
              経営者がその手に取る、<br />
              場を、<em className="not-italic" style={{ fontFamily: 'var(--font-serif-en)', fontStyle: 'italic', color: 'var(--color-gold-light)', letterSpacing: '0.02em' }}>ひとつ上へ運ぶ装置。</em>
            </blockquote>
            <p className="italic tracking-[0.14em] text-[0.88rem]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold-light)' }}>
              ― Alpha Lounge Manifesto
            </p>
          </div>
        </RevealOnScroll>
      </section>

      {/* ========== FOR WHOM ========== */}
      <section className="relative z-2" style={{ padding: 'clamp(90px, 12vw, 160px) 0' }} id="whom">
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="ii." enLabel="For Whom" enTitle="Three quiet frustrations" jpTitle="経営者がひそかに抱える、三つの課題。" />
            <div className="grid">
              <WhomItem roman="i." title="接待の&ldquo;格&rdquo;が、毎回ばらつく。" desc="同じ店、同じ料理、同じ話題。大事な相手ほど、差がつく演出が欲しい。しかし自分の手で毎回組み立てるには、経営者の時間はあまりに希少です。" markEn="Hospitality" />
              <WhomItem roman="ii." title="交流会や祝いの席が、&ldquo;ただの飲み&rdquo;で終わる。" desc="印象に残らない二時間を、何度繰り返しただろう。ひと味違う&ldquo;場の記憶&rdquo;を残せる手段が、いま、あなたのツールボックスには足りていません。" markEn="Atmosphere" />
              <WhomItem roman="iii." title="自分の店・自分のイベントに、もう一段の深みを。" desc="飲食店、美容、ホテル、サロン ― 顧客単価を&ldquo;体験&rdquo;で押し上げたい経営者にとって、静謐な演出装置は、最も投資対効果の高い差別化手段です。" markEn="Differentiation" />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <div className="wrap"><div className="hr-rule" aria-hidden="true" /></div>

      {/* ========== FOUR VIRTUES ========== */}
      <section className="relative z-2" style={{ padding: 'clamp(90px, 12vw, 160px) 0' }}>
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="iii." enLabel="Four Virtues" enTitle="The four tenets" jpTitle="我々が、妥協しない四つのこと。" />
            <div className="grid grid-cols-2 gap-px max-[900px]:grid-cols-1" style={{ background: 'var(--color-line-soft)', border: '1px solid var(--color-line-soft)' }}>
              <VirtueCard no="No. 01" sym={'\u2160'} enTitle="Non-Nicotine" jpTitle="ノンニコチン ・ ハーブシーシャ" desc="ニコチンを含まないハーブ原料のみを使用。禁煙中の方、女性、健康に配慮する経営者の方にも、安心して同席いただけます。" tag="― Herbal. Clean. Inclusive." />
              <VirtueCard no="No. 02" sym={'\u2161'} enTitle="Electric Heat" jpTitle="電熱式 ・ 炭火を使わない" desc="熾した炭を扱わないため、火の粉・灰・臭いの心配がありません。ホテルやカフェ等、火気制限のある上質な会場にも静かに馴染みます。" tag="― Silent. Safe. Refined." />
              <VirtueCard no="No. 03" sym={'\u2162'} enTitle="Master Operators" jpTitle="提携バーのプロ施工者" desc="現場に立つのは、実店舗で日々経営者客を見てきた熟練のシーシャ職人。一吸いの香り設計から立ち居振る舞いまで、会場の格を崩しません。" tag="― Crafted. Discreet. Trained." />
              <VirtueCard no="No. 04" sym={'\u2163'} enTitle="Curated Venues" jpTitle="事前提携会場のみでの提供" desc="Alphaが事前に話を通し、承諾を得た厳選会場でのみお届けします。&ldquo;どこでも&rdquo;ではなく、&ldquo;相応しい場所で&rdquo;。会員様にも会場にも、静かな安心を。" tag="― Only in places that deserve it." />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ========== VENUES ========== */}
      <section
        className="relative"
        id="venues"
        style={{
          background: 'var(--color-paper-warm)',
          padding: 'clamp(110px, 14vw, 170px) 0',
          borderTop: '1px solid var(--color-line)',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <RevealOnScroll>
          <div className="wrap">
            <span className="section-num">iv. ― Venues</span>
            <div className="max-w-[780px] mb-[60px] mt-[18px]">
              <h2
                className="font-light tracking-[0.05em] leading-[1.6] mb-[28px]"
                style={{ fontFamily: 'var(--font-serif-jp)', fontSize: 'clamp(1.7rem, 3.6vw, 2.6rem)' }}
              >
                {'\u201C'}どこでも{'\u201D'}ではなく、<br />
                <em className="not-italic" style={{ fontFamily: 'var(--font-serif-en)', fontStyle: 'italic', color: 'var(--color-gold)', fontWeight: 400, letterSpacing: '0.01em' }}>選ばれた会場でのみ、</em>お届けします。
              </h2>
              <p className="leading-[2.1] max-w-[680px] tracking-[0.04em]" style={{ color: 'var(--ink-75)' }}>
                Alpha Lounge は、場所を限定しています。<br />
                我々がお届けするのは、経営者の時間に相応しいと判断した、提携済みの会場のみ。
                審査を経て結ばれた、バー・カフェ・ホテル・会員制サロン ― それぞれの空気を読み、
                静かに溶け込ませる。限定性こそ、格を担保する唯一の方法だと、我々は考えます。
              </p>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-4 gap-[16px] my-[48px] mb-[64px] max-[900px]:grid-cols-2 max-[560px]:grid-cols-2">
              <Badge ico="i." jp="提携バー" en="Partner Bars" />
              <Badge ico="ii." jp="提携カフェ" en="Curated Caf&eacute;s" />
              <Badge ico="iii." jp="提携ホテル" en="Select Hotels" />
              <Badge ico="iv." jp="提携会員制会場" en="Private Venues" />
            </div>

            {/* Partner pitch */}
            <div className="grid grid-cols-[1fr_1.4fr] max-[900px]:grid-cols-1 overflow-hidden" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
              <div className="flex flex-col justify-between gap-[40px] max-[900px]:border-b max-[900px]:border-r-0" style={{ padding: 'clamp(40px, 5vw, 64px)', borderRight: '1px solid rgb(239 231 215 / 0.14)' }}>
                <div>
                  <span className="eyebrow" style={{ color: 'var(--color-gold-light)' }}>― For Venue Owners</span>
                  <h3 className="font-light tracking-[0.06em] leading-[1.7] mt-[18px]" style={{ fontFamily: 'var(--font-serif-jp)', fontSize: 'clamp(1.3rem, 2.4vw, 1.8rem)' }}>
                    会場オーナー様へ。
                  </h3>
                </div>
                <p className="italic text-[0.92rem] tracking-[0.08em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold-light)' }}>
                  — A new channel of clientele, carefully curated.
                </p>
              </div>
              <div className="flex flex-col gap-[24px]" style={{ padding: 'clamp(40px, 5vw, 64px)' }}>
                <ul className="grid gap-[18px]">
                  <PartnerItem ri="i." text={<>
                    <strong style={{ color: 'var(--color-gold-light)', fontWeight: 400 }}>経営者層の集客チャネル</strong>を、Alphaが届けます。会員様は、売上見込みのある経営者・個人事業主に限定されており、一般集客では届きにくい層に、継続的に接点を持てます。
                  </>} />
                  <PartnerItem ri="ii." text={<>
                    <strong style={{ color: 'var(--color-gold-light)', fontWeight: 400 }}>会場の空気を壊さず、むしろ深める</strong>演出装置として、Alpha の施工者が静かに溶け込みます。ノンニコチン×電熱式で、火の粉・煙・臭いの管理も最小限です。
                  </>} />
                  <PartnerItem ri="iii." text={<>
                    <strong style={{ color: 'var(--color-gold-light)', fontWeight: 400 }}>提携会場としての {'\u201C'}格{'\u201D'}</strong> を、Alpha Lounge 側からも発信。選ばれた店舗であることが、御店舗の新しい価値になります。
                  </>} last />
                </ul>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ========== PRICING ========== */}
      <section className="relative z-2" style={{ padding: 'clamp(90px, 12vw, 160px) 0' }} id="pricing">
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="v." enLabel="Membership" enTitle="Founding membership" jpTitle={'\u03B2会員 ・ 十社限定。'} />
            <div className="grid grid-cols-[1.1fr_1fr] max-[900px]:grid-cols-1 overflow-hidden" style={{ border: '1px solid var(--color-line)', background: 'var(--color-paper)' }}>
              {/* Summary */}
              <div
                className="flex flex-col gap-[28px] max-[900px]:border-b max-[900px]:border-r-0"
                style={{
                  padding: 'clamp(44px, 5vw, 68px)',
                  borderRight: '1px solid var(--color-line)',
                  background: 'radial-gradient(circle at 100% 0%, rgb(201 166 90 / 0.08), transparent 60%), var(--color-paper)',
                }}
              >
                <span className="self-start inline-flex items-center gap-[10px] px-[16px] py-[8px] italic text-[0.8rem] tracking-[0.2em]" style={{ border: '1px solid var(--color-gold)', color: 'var(--color-gold)', fontFamily: 'var(--font-serif-en)' }}>
                  {'\u03B2'} &middot; Founding
                </span>
                <h3 className="font-light tracking-[0.05em] leading-[1.55]" style={{ fontFamily: 'var(--font-serif-jp)', fontSize: 'clamp(1.4rem, 2.8vw, 2rem)' }}>
                  Alpha Lounge<br />{'\u03B2'} Membership
                </h3>
                <div className="flex items-baseline gap-[18px] flex-wrap py-[22px]" style={{ borderTop: '1px solid var(--color-line-soft)', borderBottom: '1px solid var(--color-line-soft)' }}>
                  <span className="line-through text-[1.15rem] tracking-[0.02em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-45)' }}>&#165;33,000 / 年</span>
                  <span className="font-light leading-none" style={{ fontFamily: 'var(--font-serif-en)', fontSize: 'clamp(2.2rem, 4vw, 3rem)', color: 'var(--color-ink)', letterSpacing: '-0.01em' }}>
                    <span className="text-[0.55em] align-[0.25em] mr-[0.08em]" style={{ color: 'var(--color-gold)' }}>&#165;</span>5,500
                  </span>
                  <span className="italic text-[0.9rem] tracking-[0.1em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-75)' }}>/ 3ヶ月</span>
                </div>
                <p className="text-[0.88rem] leading-[2] tracking-[0.04em]" style={{ color: 'var(--ink-75)' }}>
                  正式リリース時の年会費 &#165;33,000（法人会員 &#165;55,000）を、<br />
                  {'\u03B2'}期間の三ヶ月に限り、<strong className="font-normal italic tracking-[0.06em]" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-serif-en)' }}>Founding Price</strong> にてご案内いたします。<br />
                  募集枠は <strong className="font-normal italic tracking-[0.06em]" style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-serif-en)' }}>全国・全業種あわせて 10社限定</strong>。
                </p>
                <Button href="#apply" variant="gold">
                  {'\u03B2'}会員に申し込む <span className="italic" style={{ fontFamily: 'var(--font-serif-en)' }}>→</span>
                </Button>
              </div>

              {/* Perks */}
              <div className="flex flex-col" style={{ padding: 'clamp(44px, 5vw, 68px)' }}>
                <span className="eyebrow mb-[26px]">― Five privileges</span>
                <ol className="grid">
                  <PerkItem no="i." title="提携会場での利用権" desc="Alpha が厳選した提携バー・カフェ・ホテルにて、会員価格で施工をご依頼いただけます。" />
                  <PerkItem no="ii." title="優先予約 ・ 即日相談窓口" desc="施工者の稼働調整、会場確認を、会員様の予定から逆算して優先的に押さえます。" />
                  <PerkItem no="iii." title={'\u03B2会員価格の継続保証'} desc="正式版リリース後も、¥5,500/3ヶ月のレートを、Founding Members に限り継続適用いたします。" />
                  <PerkItem no="iv." title="経営者会員同士のクローズド紹介" desc="Alpha 会員にふさわしい経営者間の、静かな引き合わせ。公の交流会とは別の導線です。" />
                  <PerkItem no="v." title="演出コンサルテーション" desc="接待・周年・商談・祝い ― &ldquo;場の設計図&rdquo;を、事前に30分ご相談いただけます。" last />
                </ol>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ========== SCENES ========== */}
      <section className="relative z-2" style={{ paddingBottom: 'clamp(90px, 12vw, 160px)' }} id="scenes">
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="vi." enLabel="Scenes" enTitle="Five quiet occasions" jpTitle="静かに活きる、五つの場面。" />
            <div className="grid grid-cols-3 gap-px max-[900px]:grid-cols-1" style={{ background: 'var(--color-line-soft)', borderTop: '1px solid var(--color-line-soft)', borderBottom: '1px solid var(--color-line-soft)' }}>
              <SceneCard ri="i." title="接待" en="Hospitality" desc="重要な商談、大切な来客。料理が終わった後の一時間が、勝負を決めます。" />
              <SceneCard ri="ii." title="経営者交流会" en="Executive Circle" desc="十数名の密度ある場に、共通の手触りを。会話の余白を設計します。" />
              <SceneCard ri="iii." title="祝いの席" en="Celebration" desc="周年・受賞・就任。派手さではなく、&ldquo;記憶に残る余韻&rdquo;で彩る祝い。" />
              <SceneCard ri="iv." title="社員の集い" en="Internal Gathering" desc="年に数回、幹部や部門で集まる夜に。ノンニコチンだから全員で囲めます。" />
              <SceneCard ri="v." title="自店の演出" en="Your Own Stage" desc="あなたの店舗・サロン・ホテルに、体験単価を押し上げる演出装置を。" />
            </div>
            <p className="text-center mt-[40px] italic text-[0.9rem] tracking-[0.1em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-75)' }}>
              ― その他のシーンも、まずは{' '}
              <a href="#apply" className="pb-[2px] transition-colors" style={{ color: 'var(--color-gold)', borderBottom: '1px solid var(--color-gold)' }}>
                個別にご相談ください
              </a>
              。
            </p>
          </div>
        </RevealOnScroll>
      </section>

      <div className="wrap"><div className="hr-rule" aria-hidden="true" /></div>

      {/* ========== STEPS ========== */}
      <section className="relative z-2" style={{ padding: 'clamp(90px, 12vw, 160px) 0' }}>
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="vii." enLabel="Steps" enTitle="Three quiet steps" jpTitle="お申し込みから、入会まで。" />
            <div className="grid grid-cols-3 gap-[40px] relative max-[900px]:grid-cols-1 max-[900px]:gap-[50px]">
              {/* Connecting line */}
              <div
                className="absolute h-px max-[900px]:hidden"
                style={{
                  top: '28px', left: '8%', right: '8%',
                  background: 'linear-gradient(to right, transparent, var(--color-gold) 20%, var(--color-gold) 80%, transparent)',
                  opacity: 0.45,
                }}
                aria-hidden="true"
              />
              <StepCard ri="i." enTitle="Apply" jpTitle="申込フォーム送信" desc="ページ下部のフォームより、お名前・会社名・利用シーン等をお送りください。審査の基礎情報となります。" time="― 所要 約3分" />
              <StepCard ri="ii." enTitle="Interview" jpTitle="15分 オンライン面談" desc="貴方の事業、使いたい場面、会場の希望をお伺いします。提携会場とのマッチングを同時に検討します。" time="― 所要 15分" />
              <StepCard ri="iii." enTitle="Admission" jpTitle="入会 ・ 利用開始" desc="審査を経てご案内書を送付。¥5,500のご入会手続き後、提携会場のご利用が可能になります。" time="― 最短 当日" />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ========== FAQ ========== */}
      <section className="relative z-2" style={{ paddingBottom: 'clamp(90px, 12vw, 160px)' }} id="faq">
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="viii." enLabel="F.A.Q." enTitle="Frequently, quietly asked" jpTitle="よくいただくご質問。" />
            <div className="max-w-[820px] mx-auto">
              <FaqItem no="i." q="どこで利用できますか?" a={<><strong className="font-normal" style={{ color: 'var(--color-ink)' }}>Alpha が事前に提携している会場でのみ</strong>ご利用いただけます。提携先は、経営者のご利用に相応しい厳選バー・カフェ・ホテル・会員制サロンに限っており、提携外の場所（自宅・オフィス・一般店舗等）へのご対応はいたしておりません。これは施工品質・会場様との信頼関係・安全管理を担保するための、Alpha Lounge の根幹となる仕組みです。現在のエリアは宮崎・都城が中心で、順次拡大予定です。</>} />
              <FaqItem no="ii." q="ニコチンは本当に入っていませんか?" a={<>はい。Alpha Lounge で使用するのは<strong className="font-normal" style={{ color: 'var(--color-ink)' }}>ノンニコチンのハーブシーシャ</strong>のみです。タバコ葉を含まない設計のため、禁煙中の方、女性、健康に配慮される経営者の方にも安心して同席いただけます。</>} />
              <FaqItem no="iii." q="火の粉や臭いで、会場を汚すことはありませんか?" a={<><strong className="font-normal" style={{ color: 'var(--color-ink)' }}>電熱式の機材</strong>を採用しているため、炭を熾す必要がありません。灰・火の粉・焦げ臭さの心配が極めて少なく、ホテルや落ち着いたカフェの空間でも、静かに馴染みます。会場確認は提携施工者側が事前に行います。</>} />
              <FaqItem no="iv." q={'\u03B2会員とはなんですか?正式版とどう違いますか?'} a={<>{'\u03B2'}会員は、正式版リリースに先立つ<strong className="font-normal" style={{ color: 'var(--color-ink)' }}>3ヶ月間の限定募集枠</strong>で、先着10社に限りご案内しています。会費は &#165;5,500/3ヶ月（正式版は年会費 &#165;33,000、法人 &#165;55,000）。Founding Members として、正式版移行後も{'\u03B2'}会員価格を継続適用いたします。</>} />
              <FaqItem no="v." q="審査制とありますが、誰でも申し込めますか?" a={<>申込自体はどなたでも可能ですが、<strong className="font-normal" style={{ color: 'var(--color-ink)' }}>経営者・個人事業主の方</strong>を対象として審査を行わせていただきます。会員様同士の空気を守るための、静かな配慮です。15分の面談を経て、正式にご案内いたします。</>} />
              <FaqItem no="vi." q="自分の店舗を、提携会場として登録したいのですが。" a={<>経営者層のお客様を定常的に迎えたい会場様からのお問い合わせを歓迎しております。フォームの「利用シーン」欄に<strong className="font-normal" style={{ color: 'var(--color-ink)' }}>「会場提携の相談」</strong>とご記入のうえ送信ください。会場の雰囲気、運営形態、Alpha Lounge との相性を個別にご相談させていただきます。</>} />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ========== APPLY FORM ========== */}
      <section
        className="relative overflow-hidden"
        id="apply"
        style={{ background: 'var(--color-ink)', color: 'var(--color-paper)', padding: 'clamp(110px, 14vw, 170px) 0' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-20%', right: '-10%', width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgb(201 166 90 / 0.18) 0%, rgb(201 166 90 / 0) 65%)',
            filter: 'blur(20px)',
          }}
        />
        <RevealOnScroll>
          <div className="wrap">
            <SectionHead num="ix." enLabel="Apply" enTitle="Join as a Founding Member" jpTitle={'\u03B2会員 ・ 申込フォーム'} inverted />
            <ApplyForm />
          </div>
        </RevealOnScroll>
      </section>

      <Footer />
    </>
  )
}

/* ========== Sub-components ========== */

function HeroMeta({ k, v, borderRight }: { k: string; v: React.ReactNode; borderRight?: boolean }) {
  return (
    <div
      className="flex flex-col gap-[10px] px-[22px] py-[26px] max-[900px]:border-r-0 max-[900px]:border-b"
      style={{
        borderRight: borderRight ? '1px solid var(--color-line)' : undefined,
        borderColor: 'var(--color-line)',
      }}
    >
      <span className="italic text-[0.78rem] tracking-[0.18em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{k}</span>
      <span className="font-light text-[1.05rem] tracking-[0.04em]" style={{ fontFamily: 'var(--font-serif-jp)' }}>{v}</span>
    </div>
  )
}

function WhomItem({ roman, title, desc, markEn }: { roman: string; title: string; desc: string; markEn: string }) {
  return (
    <div
      className="grid grid-cols-[80px_1fr_auto] gap-[40px] items-start py-[42px] transition-colors duration-500 hover:bg-[rgb(168_133_58_/_0.03)] max-[900px]:grid-cols-[56px_1fr] max-[900px]:gap-[22px]"
      style={{ borderTop: '1px solid var(--color-line-soft)' }}
    >
      <div className="italic text-[1.1rem] tracking-[0.1em] pt-[6px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{roman}</div>
      <div>
        <h3 className="font-normal text-[1.3rem] tracking-[0.06em] mb-[14px] leading-[1.6]" style={{ fontFamily: 'var(--font-serif-jp)' }} dangerouslySetInnerHTML={{ __html: title }} />
        <p className="text-[0.96rem] leading-[2] max-w-[620px]" style={{ color: 'var(--ink-75)' }} dangerouslySetInnerHTML={{ __html: desc }} />
      </div>
      <div className="italic text-[0.82rem] tracking-[0.14em] whitespace-nowrap pt-[10px] max-[900px]:hidden" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-45)' }}>{markEn}</div>
    </div>
  )
}

function VirtueCard({ no, sym, enTitle, jpTitle, desc, tag }: { no: string; sym: string; enTitle: string; jpTitle: string; desc: string; tag: string }) {
  return (
    <div className="flex flex-col gap-[20px] min-h-[300px] transition-colors duration-500 hover:bg-[var(--color-paper-warm)]" style={{ background: 'var(--color-paper)', padding: 'clamp(36px, 5vw, 60px)' }}>
      <span className="italic text-[0.82rem] tracking-[0.22em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{no}</span>
      <div className="font-light text-[2.2rem] leading-none my-[6px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-ink)' }}>{sym}</div>
      <h3 className="font-normal text-[1.2rem] tracking-[0.1em] leading-[1.6]" style={{ fontFamily: 'var(--font-serif-jp)' }}>
        <span className="block italic text-[0.82rem] tracking-[0.12em] mb-[6px]" style={{ fontFamily: 'var(--font-serif-en)', fontWeight: 400, color: 'var(--color-gold)' }}>{enTitle}</span>
        {jpTitle}
      </h3>
      <p className="text-[0.92rem] leading-[2] tracking-[0.03em]" style={{ color: 'var(--ink-75)' }} dangerouslySetInnerHTML={{ __html: desc }} />
      <span className="italic text-[0.76rem] tracking-[0.14em] mt-auto pt-[14px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)', borderTop: '1px solid var(--color-line)' }}>{tag}</span>
    </div>
  )
}

function Badge({ ico, jp, en }: { ico: string; jp: string; en: string }) {
  return (
    <div
      className="badge-venue flex flex-col items-center gap-[12px] text-center py-[38px] px-[22px] transition-all duration-500 hover:translate-y-[-2px]"
    >
      <span className="italic text-[1.6rem] leading-none" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{ico}</span>
      <span className="font-normal text-[1rem] tracking-[0.1em]" style={{ fontFamily: 'var(--font-serif-jp)' }}>{jp}</span>
      <span className="italic text-[0.76rem] tracking-[0.16em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-45)' }} dangerouslySetInnerHTML={{ __html: en }} />
    </div>
  )
}

function PartnerItem({ ri, text, last }: { ri: string; text: React.ReactNode; last?: boolean }) {
  return (
    <li
      className="grid grid-cols-[32px_1fr] gap-[16px]"
      style={{ paddingBottom: last ? 0 : '18px', borderBottom: last ? 'none' : '1px solid rgb(239 231 215 / 0.1)' }}
    >
      <span className="italic text-[0.88rem] tracking-[0.1em] pt-[3px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold-light)' }}>{ri}</span>
      <p className="font-light leading-[1.9] text-[0.95rem]" style={{ fontFamily: 'var(--font-serif-jp)', color: 'var(--color-paper)' }}>{text}</p>
    </li>
  )
}

function PerkItem({ no, title, desc, last }: { no: string; title: string; desc: string; last?: boolean }) {
  return (
    <li
      className="grid grid-cols-[40px_1fr] gap-[20px] items-start py-[20px]"
      style={{ borderBottom: last ? 'none' : '1px solid var(--color-line-soft)' }}
    >
      <span className="italic text-[0.9rem] tracking-[0.1em] pt-[3px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{no}</span>
      <div>
        <h4 className="font-normal text-[1.02rem] tracking-[0.04em] mb-[4px]" style={{ fontFamily: 'var(--font-serif-jp)' }}>{title}</h4>
        <p className="text-[0.86rem] leading-[1.9]" style={{ color: 'var(--ink-75)' }} dangerouslySetInnerHTML={{ __html: desc }} />
      </div>
    </li>
  )
}

function SceneCard({ ri, title, en, desc }: { ri: string; title: string; en: string; desc: string }) {
  return (
    <div
      className="flex flex-col gap-[16px] min-h-[220px] transition-colors duration-[400ms] hover:bg-[var(--color-paper-warm)]"
      style={{ background: 'var(--color-paper)', padding: 'clamp(30px, 4vw, 48px) clamp(24px, 3vw, 34px)' }}
    >
      <span className="italic text-[0.78rem] tracking-[0.18em]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{ri}</span>
      <h3 className="font-normal text-[1.12rem] tracking-[0.08em] leading-[1.6]" style={{ fontFamily: 'var(--font-serif-jp)' }}>
        {title}
        <span className="block italic text-[0.78rem] tracking-[0.12em] mt-[4px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-45)' }}>{en}</span>
      </h3>
      <p className="text-[0.9rem] leading-[1.95] mt-auto" style={{ color: 'var(--ink-75)' }} dangerouslySetInnerHTML={{ __html: desc }} />
    </div>
  )
}

function StepCard({ ri, enTitle, jpTitle, desc, time }: { ri: string; enTitle: string; jpTitle: string; desc: string; time: string }) {
  return (
    <div className="flex flex-col gap-[18px] relative">
      <div
        className="w-[56px] h-[56px] rounded-full flex items-center justify-center italic text-[1rem] tracking-[0.08em] relative z-2 max-[900px]:mb-[6px]"
        style={{ border: '1px solid var(--color-gold)', background: 'var(--color-paper)', fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}
      >
        {ri}
      </div>
      <h3 className="font-normal text-[1.2rem] tracking-[0.08em] mt-[14px]" style={{ fontFamily: 'var(--font-serif-jp)' }}>
        <span className="block italic text-[0.82rem] tracking-[0.12em] mb-[6px] font-normal" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{enTitle}</span>
        {jpTitle}
      </h3>
      <p className="text-[0.93rem] leading-[2]" style={{ color: 'var(--ink-75)' }}>{desc}</p>
      <span className="italic text-[0.78rem] tracking-[0.14em] mt-[6px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--ink-45)' }}>{time}</span>
    </div>
  )
}

function FaqItem({ no, q, a }: { no: string; q: string; a: React.ReactNode }) {
  return (
    <details className="group" style={{ borderBottom: '1px solid var(--color-line-soft)' }}>
      <summary className="list-none cursor-pointer grid grid-cols-[40px_1fr_auto] gap-[20px] items-start py-[30px] pr-[20px] transition-colors [&::-webkit-details-marker]:hidden">
        <span className="italic text-[0.85rem] tracking-[0.12em] pt-[3px]" style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}>{no}</span>
        <span className="font-normal text-[1.02rem] tracking-[0.06em] leading-[1.7] group-hover:text-[var(--color-gold-dim)]" style={{ fontFamily: 'var(--font-serif-jp)' }}>{q}</span>
        <span
          className="italic text-[1.3rem] leading-none pt-[4px] w-[20px] text-center transition-transform duration-[400ms] group-open:rotate-45"
          style={{ fontFamily: 'var(--font-serif-en)', color: 'var(--color-gold)' }}
        >
          +
        </span>
      </summary>
      <div className="pb-[36px] pl-[60px] pr-[20px] text-[0.95rem] leading-[2.05] tracking-[0.04em]" style={{ color: 'var(--ink-75)' }}>
        {a}
      </div>
    </details>
  )
}
