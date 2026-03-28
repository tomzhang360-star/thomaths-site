import Link from "next/link";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-blue-700 text-white py-20 px-6 text-center">
        <h1 className="text-4xl font-bold mb-4">G9–G12 数学·物理系统提升</h1>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">专业团队、因材施教，帮助学生在数理科目上实现突破</p>
        <div className="flex gap-4 justify-center">
          <Link href="/contact" className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition">
            预约 20 分钟免费评估
          </Link>
          <Link href="/courses" className="border border-white text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition">
            查看课程
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "🎯", title: "双轨教学", desc: "1对1 深度辅导 + 小班互动课，满足不同学习需求" },
            { icon: "📚", title: "课程覆盖", desc: "涵盖 G9–G12、AP、IB、SAT 全体系课程" },
            { icon: "📱", title: "家校沟通", desc: "定期学习报告，家长随时了解学习进展" },
          ].map(f => (
            <div key={f.title} className="text-center p-6 bg-white rounded-xl border border-slate-100 shadow-sm">
              <span className="text-4xl mb-4 block">{f.icon}</span>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-10">家长反馈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { quote: "孩子数学从 65 分提升到 88 分，老师耐心细致，非常感谢！", author: "王同学家长" },
              { quote: "AP Calculus 从零基础到 5 分，强烈推荐！", author: "李同学家长" },
            ].map(t => (
              <div key={t.author} className="bg-white rounded-xl p-6 border border-slate-200">
                <p className="text-slate-600 italic mb-4">"{t.quote}"</p>
                <p className="text-sm font-medium text-slate-500">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
