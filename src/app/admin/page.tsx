"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Kol = { id: string; name: string; twitter_handle: string };

type KolEntry = {
  id: number;
  selectedKolId: string;
  tweetsText: string;
};

let nextId = 1;

export default function AdminPage() {
  const [kols, setKols] = useState<Kol[]>([]);
  const [kolsLoading, setKolsLoading] = useState(true);
  const [kolsError, setKolsError] = useState<string | null>(null);

  const [entries, setEntries] = useState<KolEntry[]>([
    { id: nextId++, selectedKolId: "", tweetsText: "" },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    digest_id?: string;
    week_start?: string;
    kol_count?: number;
    warnings?: string[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/kols")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setKols(data.kols ?? []);
      })
      .catch((e) => setKolsError(e.message))
      .finally(() => setKolsLoading(false));
  }, []);

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      { id: nextId++, selectedKolId: "", tweetsText: "" },
    ]);
  }

  function removeEntry(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEntry(id: number, field: keyof KolEntry, value: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    // 建构每位 KOL 的推文资料
    const kolPayloads = entries
      .map((entry) => {
        const kol = kols.find((k) => k.id === entry.selectedKolId);
        if (!kol) return null;
        const tweets = entry.tweetsText
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean);
        if (tweets.length === 0) return null;
        return {
          kol_name: kol.name,
          twitter_handle: kol.twitter_handle,
          tweets,
        };
      })
      .filter(Boolean);

    if (kolPayloads.length === 0) {
      alert("请至少填写一位 KOL 及其推文内容");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/generate-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kols: kolPayloads }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: String(err) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: "0 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>管理后台 — 生成周报</h1>
      <p style={{ color: "#555", marginBottom: 32 }}>
        填入每位 KOL 的推文，按下按钮即可生成本週周报并写入数据库。
      </p>

      {kolsLoading && <p style={{ color: "#888" }}>读取 KOL 名单中…</p>}
      {kolsError && (
        <p style={{ color: "red" }}>无法读取 KOL 名单：{kolsError}</p>
      )}

      {!kolsLoading && !kolsError && (
        <form onSubmit={handleSubmit}>
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 20,
                marginBottom: 16,
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <strong>KOL #{idx + 1}</strong>
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEntry(entry.id)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#e00",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    移除
                  </button>
                )}
              </div>

              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#333" }}>
                KOL 名称
              </label>
              <select
                required
                value={entry.selectedKolId}
                onChange={(e) =>
                  updateEntry(entry.id, "selectedKolId", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  fontSize: 14,
                  marginBottom: 14,
                  background: "#fff",
                }}
              >
                <option value="">— 请选择 KOL —</option>
                {kols.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} (@{k.twitter_handle})
                  </option>
                ))}
              </select>

              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#333" }}>
                推文内容（每行一条）
              </label>
              <textarea
                required
                rows={6}
                placeholder={"在此贴上推文，每行代表一条推文…"}
                value={entry.tweetsText}
                onChange={(e) =>
                  updateEntry(entry.id, "tweetsText", e.target.value)
                }
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  fontSize: 14,
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addEntry}
            style={{
              padding: "8px 18px",
              borderRadius: 6,
              border: "1px dashed #aaa",
              background: "#fff",
              cursor: "pointer",
              fontSize: 14,
              marginBottom: 24,
              color: "#444",
            }}
          >
            + 新增 KOL
          </button>

          <div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "12px 28px",
                borderRadius: 8,
                border: "none",
                background: submitting ? "#aaa" : "#1a1a1a",
                color: "#fff",
                fontSize: 16,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "生成中，请稍候…" : "生成本週周报"}
            </button>
          </div>
        </form>
      )}

      {/* 结果区 */}
      {result && (
        <div
          style={{
            marginTop: 32,
            padding: 20,
            borderRadius: 8,
            border: `1px solid ${result.success ? "#4caf50" : "#e53935"}`,
            background: result.success ? "#f1f8f1" : "#fff3f3",
          }}
        >
          {result.success ? (
            <>
              <p style={{ fontWeight: 700, color: "#2e7d32", marginBottom: 8 }}>
                ✓ 周报生成成功！
              </p>
              <p style={{ fontSize: 14, color: "#333", marginBottom: 4 }}>
                周报日期：{result.week_start} 　涵盖 KOL：{result.kol_count} 位
              </p>
              {result.warnings && result.warnings.length > 0 && (
                <ul style={{ fontSize: 13, color: "#b26a00", marginTop: 8 }}>
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  padding: "8px 18px",
                  borderRadius: 6,
                  background: "#1a1a1a",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                前往首页查看结果 →
              </Link>
            </>
          ) : (
            <p style={{ color: "#c62828", fontWeight: 600 }}>
              ✗ 生成失败：{result.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
