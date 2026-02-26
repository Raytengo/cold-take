import { createClient } from "@/utils/supabase/server";
import ReactMarkdown from "react-markdown";

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  return `${fmt(start)}  ${fmt(end)}`;
}

export const revalidate = 3600; // ISR — revalidate every hour

export default async function HomePage() {
  const supabase = createClient();

  /* 1. 讀取最新一期週報 */
  const { data: digest } = await supabase
    .from("digests")
    .select("id, week_start, content, created_at")
    .order("week_start", { ascending: false })
    .limit(1)
    .single();

  /* ---------- 空狀態 ---------- */
  if (!digest) {
    return (
      <div className="text-center py-32 px-6">
        <h1 className="font-display text-[40px] leading-[1.2] text-[var(--text-primary)] mb-4">
          目前還沒有週報
        </h1>
        <p className="font-body text-[16px] text-[var(--text-secondary)] mb-8">
          我們正在準備第一期，敬請期待 ✨
        </p>
        <span className="inline-block border border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-body px-5 py-2 rounded-full">
          每週一自動發刊
        </span>
      </div>
    );
  }

  /* 2. 讀取該期各 KOL 條目（JOIN kols 表取得名稱與 handle） */
  const { data: entries } = await supabase
    .from("digest_kol_entries")
    .select("id, summary, kols(name, twitter_handle)")
    .eq("digest_id", digest.id);

  /* 整理成扁平結構方便渲染
     Supabase 對 many-to-one FK join 回傳的是 object 而非 array
     使用 entry.id 作為 key，確保幾筆資料就顯示幾張卡片 */
  type KolRow = { name: string; twitter_handle: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kolEntries = (entries ?? []).map((e: any) => {
    const kol: KolRow = e.kols ?? null;
    return {
      id: e.id as string,
      name: kol?.name ?? "Unknown",
      handle: kol?.twitter_handle ?? "",
      summary: e.summary ?? "",
      sourceUrl: `https://x.com/${kol?.twitter_handle ?? ""}`,
    };
  });

  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-display text-[56px] leading-[1.1] text-[var(--text-primary)] mb-6">
            本週
            <br />
            什麼
          </h1>
          <p className="font-body text-[16px] text-[var(--text-secondary)] leading-relaxed mb-8 max-w-[520px] mx-auto">
            摘要
          </p>
          <span className="inline-block border border-[var(--accent)] text-[var(--accent)] text-[12px] font-body px-4 py-1.5 rounded-full tracking-wide">
            {formatWeekRange(digest.week_start)}
          </span>
        </div>
      </section>

      {/* Overview — 顯示本期完整總覽內容 */}
      {digest.content && (
        <section className="max-w-[800px] mx-auto px-6 mb-14">
          <div className="flex gap-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <div className="w-[3px] flex-shrink-0 rounded-full bg-[var(--accent)]" />
            <div className="font-body text-[16px] leading-[1.8] text-[var(--text-primary)] prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)]">
              <ReactMarkdown>{digest.content}</ReactMarkdown>
            </div>
          </div>
        </section>
      )}

      {/* KOL Cards Grid */}
      {kolEntries.length > 0 && (
        <section className="max-w-[800px] mx-auto px-6 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {kolEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-[18px] text-[var(--text-primary)]">
                      {entry.name}
                    </h3>
                    <span className="font-body text-[13px] text-[var(--text-secondary)]">
                      @{entry.handle}
                    </span>
                  </div>
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
                    title="查看原始貼文"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                </div>
                <p className="font-body text-[15px] leading-[1.75] text-[var(--text-primary)]">
                  {entry.summary}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KOL Badges */}
      {kolEntries.length > 0 && (
        <section className="max-w-[800px] mx-auto px-6 pb-16">
          <div className="border-t border-[var(--border)] pt-10">
            <h4 className="font-body text-[13px] text-[var(--text-secondary)] tracking-wide uppercase mb-4">
              本期涵蓋
            </h4>
            <div className="flex flex-wrap gap-2">
              {kolEntries.map((entry) => (
                <span
                  key={entry.id}
                  className="font-body text-[13px] text-[var(--text-secondary)] border border-[var(--border)] px-3.5 py-1.5 rounded-full transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-default"
                >
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
