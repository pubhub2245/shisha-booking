type SectionHeadProps = {
  num: string       // e.g. "ii."
  enLabel: string   // e.g. "For Whom"
  enTitle: string   // e.g. "Three quiet frustrations"
  jpTitle: string   // e.g. "経営者がひそかに抱える、三つの課題。"
  inverted?: boolean
}

export function SectionHead({ num, enLabel, enTitle, jpTitle, inverted = false }: SectionHeadProps) {
  return (
    <div
      className="flex items-start gap-[36px] mb-[72px] pb-[28px] max-[900px]:flex-col max-[900px]:gap-[18px]"
      style={{
        borderBottom: inverted
          ? '1px solid rgb(239 231 215 / 0.15)'
          : '1px solid var(--color-line-soft)',
      }}
    >
      <div className="flex-none pt-[8px]">
        <span
          className="italic text-[0.78rem] tracking-[0.22em]"
          style={{
            fontFamily: 'var(--font-serif-en)',
            color: inverted ? 'var(--color-gold-light)' : 'var(--color-gold)',
          }}
        >
          {num} ― {enLabel}
        </span>
      </div>
      <div className="flex-1">
        <h2
          className="font-light tracking-[0.06em] leading-[1.5] mt-[10px]"
          style={{
            fontFamily: 'var(--font-serif-jp)',
            fontSize: 'clamp(1.6rem, 3.4vw, 2.4rem)',
            color: inverted ? 'var(--color-paper)' : undefined,
          }}
        >
          <em
            className="not-italic block text-[0.7em] tracking-[0.02em] mb-[8px]"
            style={{
              fontFamily: 'var(--font-serif-en)',
              fontStyle: 'italic',
              fontWeight: 400,
              color: inverted ? 'var(--color-gold-light)' : 'var(--color-gold)',
            }}
          >
            {enTitle}
          </em>
          {jpTitle}
        </h2>
      </div>
    </div>
  )
}
