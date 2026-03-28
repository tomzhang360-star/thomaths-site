"use client";

import Link from "next/link";
import { useState } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="font-bold text-lg text-slate-800">VEA 教育</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition font-medium">首页</Link>
            <Link href="/courses" className="hover:text-blue-600 transition font-medium">课程体系</Link>
            <Link href="/contact" className="hover:text-blue-600 transition font-medium">联系我们</Link>
            <Link href="/contact"
              className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
              免费评估
            </Link>
            <Link href="/login" className="text-slate-400 hover:text-slate-600 transition text-xs">管理系统</Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(o => !o)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition">
            <div className="space-y-1.5">
              <span className={`block w-5 h-0.5 bg-current transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-current transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-100 space-y-1">
            {[["首页", "/"], ["课程体系", "/courses"], ["联系我们", "/contact"]].map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium">
                {label}
              </Link>
            ))}
            <div className="pt-2 px-4 flex flex-col gap-2">
              <Link href="/contact" onClick={() => setMenuOpen(false)}
                className="block text-center bg-blue-600 text-white py-2.5 rounded-full text-sm font-semibold">
                免费评估
              </Link>
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="block text-center text-slate-400 text-xs py-1">
                管理系统登录
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">V</span>
              <span className="font-bold text-white text-sm">VEA 教育</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              专注 GTA 地区 G9–G12<br />数学 · 物理系统提升
            </p>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">快捷导航</h4>
            <div className="space-y-2 text-xs">
              {[["首页", "/"], ["课程体系", "/courses"], ["联系我们", "/contact"]].map(([l, h]) => (
                <Link key={h} href={h} className="block hover:text-white transition">{l}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold mb-3">校区</h4>
            <div className="space-y-1.5 text-xs text-slate-500">
              <p>Markham · Richmond Hill</p>
              <p>Scarborough · Mississauga</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-800 text-center text-xs text-slate-600">
          © 2026 VEA 教育 · 专注 GTA G9–G12 数理提升
        </div>
      </footer>
    </div>
  );
}
