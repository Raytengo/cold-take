import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h2 className="font-display text-2xl font-medium mb-4">找不到頁面</h2>
      <p className="text-muted mb-8">你要找的頁面不存在或已被移除。</p>
      <Link
        href="/"
        className="text-accent hover:underline"
      >
        返回首頁
      </Link>
    </div>
  );
}
