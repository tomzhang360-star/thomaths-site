import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-blue-700">VEA 教育</Link>
        <div className="flex gap-6 text-sm text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition">首页</Link>
          <Link href="/courses" className="hover:text-blue-600 transition">课程</Link>
          <Link href="/contact" className="hover:text-blue-600 transition">联系我们</Link>
          <Link href="/login" className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition">管理系统</Link>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
      <footer className="bg-slate-800 text-slate-300 text-center text-sm py-6">
        © 2025 VEA 教育 · 专注 G9–G12 提升
      </footer>
    </div>
  );
}
