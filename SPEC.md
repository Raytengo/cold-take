# SPEC.md — 科技圈观点周报 App

## 产品简介

一个每周自动聚合科技圈头部 KOL（Twitter/X）发文的网页应用，透过 AI 将他们的观点整理成繁体中文摘要简报，帮助用户不需要逐一追踪每个人，也能掌握聪明人这周在想什么。

**核心定位：观点聚合，不是新闻整理。**

---

## 技术栈

| 层级 | 工具 |
|------|------|
| 前端 / 后端 | Next.js 14 (App Router) |
| 数据库 / 认证 | Supabase |
| 推文抓取 | Apify（Twitter/X Scraper） |
| AI 摘要 | OpenAI API（gpt-4o-mini） |
| 排程 | Vercel Cron Jobs |
| 部署 | Vercel |

---

## 数据库结构（Supabase）

### `kols` 表
```
id           uuid primary key
name         text              -- KOL 显示名称
twitter_handle text            -- Twitter 用户名（不含 @）
category     text              -- 分类，预设 "科技圈"
is_default   boolean           -- 是否为免费用户预设名单
created_at   timestamp
```

### `digests` 表
```
id           uuid primary key
week_start   date              -- 该期简报的起始日期（周一）
content      text              -- AI 生成的完整中文摘要内容（Markdown 格式）
created_at   timestamp
```

### `digest_kol_entries` 表
```
id           uuid primary key
digest_id    uuid references digests(id)
kol_id       uuid references kols(id)
raw_tweets   jsonb             -- 该 KOL 本期的原始推文数据
summary      text              -- 该 KOL 的个人摘要段落
```

---

## 页面结构

### `/`（首页）
- 展示最新一期周报
- 简报以 Markdown 渲染，分段呈现每位 KOL 的观点摘要
- 页面底部显示本期涵盖的 KOL 名单

### `/archive`（历史简报）
- 列出所有过去的周报，按时间倒序排列
- 点击进入该期简报详情页

### `/about`（关于）
- 产品说明、KOL 筛选逻辑说明

---

## 自动化流程（每周一 09:00 UTC+8 触发）

1. Vercel Cron Job 触发 `/api/generate-digest` endpoint
2. 从 `kols` 表读取所有 `is_default = true` 的 KOL
3. 用 Apify 抓取每位 KOL 过去 7 天的推文
4. 将推文内容送给 OpenAI，生成该 KOL 的中文观点摘要
5. 汇整所有 KOL 摘要，生成本期完整周报
6. 将结果写入 `digests` 和 `digest_kol_entries` 表
7. 首页自动显示最新一期

---

## AI Prompt 设计（摘要生成）

**单一 KOL 摘要 prompt：**
```
以下是 {KOL名称}（{Twitter handle}）这周在 Twitter 上发布的内容：

{推文列表}

请用繁体中文，以 150-200 字摘要这位 KOL 这周分享的主要观点和看法。
重点放在他们表达的意见、预测或独到见解，不要只描述事件本身。
语气专业但易读，适合科技从业者阅读。
```

**汇整周报 prompt：**
```
以下是本周多位科技圈 KOL 的观点摘要：

{各 KOL 摘要}

请用繁体中文撰写一份完整的「科技圈观点周报」，格式如下：
1. 开头用 2-3 句话点出本周的整体主题或焦点
2. 逐一呈现每位 KOL 的观点段落，并标注人名
3. 结尾可选择性点出本周观点中有趣的对比或张力

总字数约 800-1200 字。
```

---

## MVP 范围（第一版只做这些）

- [x] 首页展示最新周报
- [x] 历史简报列表
- [x] 后台 API：抓取推文 + 生成摘要 + 写入数据库
- [x] Vercel Cron Job 每周自动触发
- [x] 预设 KOL 名单（10-15 位科技圈人士）

## 暂不做（之后再加）

- 用户注册 / 登入
- 免费 / 付费分层
- 自订 KOL 名单
- Podcast 来源
- 视觉化简报
- 推送通知

---

## 预设 KOL 名单（初版，可调整）

| 名称 | Twitter Handle |
|------|---------------|
| Marc Andreessen | pmarca |
| Ben Horowitz | bhorowitz |
| Sam Altman | sama |
| Paul Graham | paulg |
| Naval Ravikant | naval |
| Andrej Karpathy | karpathy |
| Yann LeCun | ylecun |
| Demis Hassabis | demishassabis |
| Jensen Huang | jensenhuang |
| Balaji Srinivasan | balajis |

---

## 环境变量

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
APIFY_API_TOKEN=
CRON_SECRET=   # 用来验证 cron job 请求的 secret
```
