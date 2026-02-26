import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export const revalidate = 3600; // ISR — 快取一小時

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  return `${fmt(start)} — ${fmt(end)}`;
}

export default async function ArchivePage() {
  const supabase = createClient();

  const { data: digests } = await supabase
    .from("digests")
    .select("id, week_start, content")
    .order("week_start", { ascending: false });

  const list = digests ?? [];

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-16 pb-20">
      {/* Page header */}
      <div className="mb-12 text-center">
        <h1 className="font-display text-[40px] text-[var(--text-primary)] mb-3">
          歷史週報
        </h1>
        <p className="font-body text-[15px] text-[var(--text-secondary)]">
          每一期觀點，都值得回顧
        </p>
      </div>

      {list.length === 0 ? (
        <p className="font-body text-[var(--text-secondary)] text-center py-16">
          目前尚無歷史週報
        </p>
      ) : (
        <div className="space-y-5">
          {list.map((digest) => {
            const excerpt = digest.content
              ? digest.content.replace(/#+\s*/g, "").slice(0, 100).trimEnd() + "…"
              : "";
            return (
              <Link
                key={digest.id}
                href={`/archive/${digest.id}`}
                className="block group"
              >
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-300">
                  <div className="mb-3">
                    <span className="inline-block border border-[var(--accent)] text-[var(--accent)] text-[12px] font-body px-3 py-1 rounded-full tracking-wide">
                      {formatWeekRange(digest.week_start)}
                    </span>
                  </div>
                  {excerpt && (
                    <p className="font-body text-[15px] leading-[1.75] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-200">
                      {excerpt}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
