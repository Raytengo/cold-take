export default function AboutPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 pt-16 pb-20">
      {/* Page header */}
      <div className="mb-14 text-center">
        <h1 className="font-display text-[40px] text-[var(--text-primary)] mb-3">
          關於本站
        </h1>
        <p className="font-body text-[15px] text-[var(--text-secondary)]">
          觀點聚合
        </p>
      </div>

      {/* Content sections */}
      <div className="space-y-10">
        {/* Intro */}
        <section className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
          <div className="flex gap-5">
            <div className="w-[3px] flex-shrink-0 rounded-full bg-[var(--accent)]" />
            <div className="font-body text-[15px] leading-[1.8] text-[var(--text-primary)]">
              <p className="mb-4">
                <strong className="text-[var(--text-primary)]">週報</strong>
                是一個每週自動聚合科技圈頭部 KOL（Twitter/X）發文的網頁應用，透過 AI
                將他們的觀點整理成繁體中文摘要簡報。
              </p>
              <p>
                我們的核心定位是<strong className="text-[var(--text-primary)]">觀點聚合，不是新聞整理</strong>。
                重點在於這些聰明人「怎麼看」，而非單純的事件紀錄。
              </p>
            </div>
          </div>
        </section>

        {/* KOL 篩選邏輯 */}
        <section>
          <h2 className="font-display text-[24px] text-[var(--text-primary)] mb-5">
            KOL 篩選邏輯
          </h2>
          <p className="font-body text-[15px] leading-[1.8] text-[var(--text-primary)] mb-5">
            目前追蹤的 KOL 以科技圈具有影響力的創辦人、投資人、研究者為主，包括：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "AI 領域", names: "Sam Altman、Andrej Karpathy、Yann LeCun、Demis Hassabis" },
              { label: "創投領域", names: "Marc Andreessen、Ben Horowitz、Paul Graham" },
              { label: "科技思想家", names: "Naval Ravikant、Balaji Srinivasan" },
              { label: "硬體與晶片", names: "Jensen Huang" },
            ].map((group) => (
              <div
                key={group.label}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5"
              >
                <h3 className="font-display text-[16px] text-[var(--accent)] mb-2">
                  {group.label}
                </h3>
                <p className="font-body text-[14px] leading-[1.7] text-[var(--text-secondary)]">
                  {group.names}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 運作方式 */}
        <section>
          <h2 className="font-display text-[24px] text-[var(--text-primary)] mb-5">
            運作方式
          </h2>
          <p className="font-body text-[15px] leading-[1.8] text-[var(--text-primary)]">
            每週一上午，系統自動抓取上述 KOL 過去七天的 Twitter/X
            發文，透過 AI 生成摘要，彙整成一份完整的觀點週報。
          </p>
        </section>

        {/* 技術棧 */}
        <section>
          <h2 className="font-display text-[24px] text-[var(--text-primary)] mb-5">
            技術棧
          </h2>
          <p className="font-body text-[15px] leading-[1.8] text-[var(--text-primary)]">
            本站使用 Next.js 14 建構，資料存儲於 Supabase，推文抓取使用 Apify，
            AI 摘要由 OpenAI GPT-4o-mini 生成，託管於 Vercel。
          </p>
        </section>
      </div>
    </div>
  );
}
