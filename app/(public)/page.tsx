import Link from "next/link";

const STATS = [
  { number: "500+", label: "在读学生" },
  { number: "4",    label: "GTA 校区" },
  { number: "95%",  label: "成绩提升率" },
  { number: "8年",  label: "办学经验" },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: "1 对 1 深度辅导",
    desc: "老师根据学生的知识漏洞定制教学计划，课后跟踪作业完成情况，确保每节课都有实质提升。",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
    title: "小班互动课",
    desc: "4–6 人精品小班，通过同伴学习加深理解，价格更亲民，适合打基础和冲刺考试。",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "数据化学习追踪",
    desc: "每节课记录学习状态与知识点掌握情况，生成学习报告，家长随时了解进展。",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "全体系课程覆盖",
    desc: "涵盖 G9–G12 数学物理、AP Calculus/Physics、IB、SAT/ACT 数学，一站式解决。",
    color: "bg-amber-50 text-amber-600",
  },
];

const TESTIMONIALS = [
  {
    quote: "孩子数学从 65 分提升到 91 分，只用了一个学期。老师非常有耐心，每次课都会针对弱点专项训练。",
    author: "Alex 的家长",
    tag: "Grade 11 数学",
    avatar: "A",
    avatarColor: "bg-blue-500",
  },
  {
    quote: "AP Calculus BC 从零基础到最终考了 5 分，太感谢了！课程安排合理，老师讲解清晰。",
    author: "Chloe 的家长",
    tag: "AP Calculus BC",
    avatar: "C",
    avatarColor: "bg-violet-500",
  },
  {
    quote: "物理一直是软肋，上了几节课之后概念清晰多了，期末考试发挥超出预期。",
    author: "Ethan 的家长",
    tag: "Grade 12 物理",
    avatar: "E",
    avatarColor: "bg-emerald-500",
  },
];

const SUBJECTS = [
  { label: "G9–G12 数学", badge: "热门" },
  { label: "G9–G12 物理", badge: "" },
  { label: "AP Calculus AB/BC", badge: "热门" },
  { label: "AP Physics 1/2/C", badge: "" },
  { label: "IB Math AA/AI", badge: "" },
  { label: "SAT / ACT 数学", badge: "热门" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 right-1/3 w-72 h-72 rounded-full bg-indigo-800/40" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-100 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            GTA 4 大校区 · 现正招生
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-5">
            G9–G12 数学 · 物理
            <br />
            <span className="text-blue-200">系统提升</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            专业团队、因材施教，帮助 GTA 学生在数理科目上实现突破，
            覆盖 Ontario 课程、AP、IB、SAT 全体系
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact"
              className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-full hover:bg-blue-50 transition shadow-lg text-sm sm:text-base">
              预约 20 分钟免费评估 →
            </Link>
            <Link href="/courses"
              className="border border-white/40 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/20 transition text-sm sm:text-base">
              查看课程体系
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-blue-800/30">
          <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold text-white">{s.number}</div>
                <div className="text-xs text-blue-200 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">为什么选择 VEA</h2>
          <p className="text-slate-500 max-w-xl mx-auto">每位学生都有不同的学习节奏，我们提供个性化解决方案</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map(f => (
            <div key={f.title}
              className="flex gap-5 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects ── */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">课程覆盖</h2>
            <p className="text-slate-500">Ontario 课程 · AP · IB · 标准化考试 全覆盖</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SUBJECTS.map(s => (
              <div key={s.label}
                className="bg-white rounded-xl px-5 py-4 border border-slate-200 flex items-center justify-between shadow-sm hover:border-blue-300 hover:shadow-md transition">
                <span className="font-medium text-slate-700 text-sm">{s.label}</span>
                {s.badge && (
                  <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                    {s.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/courses"
              className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
              查看完整课程介绍 →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">家长与学生反馈</h2>
          <p className="text-slate-500">真实案例，真实提升</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.author} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
              {/* Stars */}
              <div className="flex gap-0.5 text-amber-400 text-sm">
                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                <div className={`w-8 h-8 rounded-full ${t.avatarColor} text-white flex items-center justify-center text-xs font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">{t.author}</div>
                  <div className="text-xs text-slate-400">{t.tag}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16 px-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-3">准备好提升成绩了吗？</h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">
          现在预约免费 20 分钟学情评估，了解孩子的知识薄弱点和提升方向
        </p>
        <Link href="/contact"
          className="inline-block bg-white text-blue-700 font-bold px-10 py-3.5 rounded-full hover:bg-blue-50 transition shadow-lg">
          立即预约免费评估 →
        </Link>
      </section>
    </>
  );
}
