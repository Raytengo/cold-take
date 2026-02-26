import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { setGlobalDispatcher, ProxyAgent } from "undici";

// 让 Node.js 原生 fetch 走系统代理（本地开发需要）
if (process.env.HTTPS_PROXY) {
  setGlobalDispatcher(new ProxyAgent(process.env.HTTPS_PROXY));
}

const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY!);

/** 取得当周周一的日期字串，格式 YYYY-MM-DD */
function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

type KolInput = {
  kol_name: string;
  twitter_handle: string;
  tweets: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kols } = body as { kols: KolInput[] };

    if (!kols || !Array.isArray(kols) || kols.length === 0) {
      return NextResponse.json({ error: "kols 不能为空" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // ── Step 1: 为每位 KOL 生成个人摘要 ─────────────────────────────────────
    const kolSummaries: Array<KolInput & { summary: string }> = [];

    for (const kol of kols) {
      const tweetList = kol.tweets.map((t, i) => `${i + 1}. ${t}`).join("\n");
      const prompt = `以下是 ${kol.kol_name}（@${kol.twitter_handle}）这週在 Twitter 上发布的内容：
${tweetList}
请用繁体中文摘要这位 KOL 这週分享的主要观点，字数控制在 10 字左右。
要求：
1. 不要逐条转述，而是提炼出这些推文背后的整体思维或核心论点
2. 语气像是一位科技媒体编辑在为读者解读，而不是翻译原文
3. 开头直接进入重点，不要用套话开场`;

      const result = await model.generateContent(prompt);
      kolSummaries.push({ ...kol, summary: result.response.text() });
    }

    // ── Step 2: 生成汇整周报 ──────────────────────────────────────────────────
    const summariesBlock = kolSummaries
      .map((k) => `【${k.kol_name} @${k.twitter_handle}】\n${k.summary}`)
      .join("\n\n");

    const digestPrompt = `以下是本周多位科技圈 KOL 的观点摘要：

${summariesBlock}

请用繁体中文撰写一份完整的「科技圈观点周报」，格式如下：
1. 开头用 2-3 句话点出本周的整体主题或焦点
2. 结尾可选择性点出本周观点中有趣的对比或张力

总字数约 10-20 字。`;

    const digestResult = await model.generateContent(digestPrompt);
    const digestContent = digestResult.response.text();

    // ── Step 3: 写入 Supabase ─────────────────────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const weekStart = getMonday(new Date());

    // 写入 digests 表（同一周再次执行时更新内容）
    const { data: digestData, error: digestError } = await supabase
      .from("digests")
      .upsert({ week_start: weekStart, content: digestContent }, { onConflict: "week_start" })
      .select("id")
      .single();

    if (digestError) {
      console.error("[generate-digest] digest insert error:", digestError);
      return NextResponse.json(
        { error: "写入 digest 失败", detail: digestError.message },
        { status: 500 }
      );
    }

    const digestId = digestData.id;

    // 先删除该期已有的 KOL 条目，避免重复执行时产生重复记录
    await supabase.from("digest_kol_entries").delete().eq("digest_id", digestId);

    // 写入 digest_kol_entries 表（每位 KOL 一笔）
    const entryErrors: string[] = [];
    for (const kolSummary of kolSummaries) {
      // 从 kols 表查出 kol_id
      const { data: kolData, error: kolLookupError } = await supabase
        .from("kols")
        .select("id")
        .eq("twitter_handle", kolSummary.twitter_handle)
        .single();

      if (kolLookupError || !kolData) {
        const msg = `KOL 未找到：${kolSummary.twitter_handle}`;
        console.warn(`[generate-digest] ${msg}`);
        entryErrors.push(msg);
        continue;
      }

      const { error: entryError } = await supabase
        .from("digest_kol_entries")
        .insert({
          digest_id: digestId,
          kol_id: kolData.id,
          summary: kolSummary.summary,
          raw_tweets: kolSummary.tweets,
        });

      if (entryError) {
        const msg = `写入 entry 失败（${kolSummary.twitter_handle}）：${entryError.message}`;
        console.error(`[generate-digest] ${msg}`);
        entryErrors.push(msg);
      }
    }

    return NextResponse.json({
      success: true,
      digest_id: digestId,
      week_start: weekStart,
      kol_count: kolSummaries.length,
      ...(entryErrors.length > 0 && { warnings: entryErrors }),
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[generate-digest] message :", error.message);
      console.error("[generate-digest] stack   :", error.stack);
      const anyErr = error as unknown as Record<string, unknown>;
      if (anyErr.status) console.error("[generate-digest] status     :", anyErr.status);
      if (anyErr.statusText) console.error("[generate-digest] statusText :", anyErr.statusText);
      if (anyErr.errorDetails)
        console.error(
          "[generate-digest] details   :",
          JSON.stringify(anyErr.errorDetails, null, 2)
        );
    } else {
      console.error("[generate-digest] unknown error:", error);
    }
    return NextResponse.json({ error: "摘要生成失败" }, { status: 500 });
  }
}
