import Link from "next/link";

const COURSES = [
  { title: "G9 数学系统课", desc: "代数、几何基础巩固，建立数学逻辑思维体系。", badge: "G9" },
  { title: "G10 物理提升班", desc: "力学、运动学核心概念讲解，实验方法训练。", badge: "G10" },
  { title: "AP Calculus AB", desc: "微积分核心内容，冲刺 AP 5 分目标。", badge: "AP" },
  { title: "IB Physics HL", desc: "涵盖 IB HL 全部考纲，内部评估辅导。", badge: "IB" },
  { title: "SAT Math 冲刺", desc: "题型精讲 + 限时练习，目标满分 800。", badge: "SAT" },
  { title: "G12 化学高分班", desc: "有机/无机化学系统梳理，冲刺期末高分。", badge: "G12" },
];

export default function CoursesPage() {
  return (
    <div className="py-16 px-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">我们的课程</h1>
      <p className="text-slate-500 text-center mb-12">覆盖 G9–G12、AP、IB、SAT 全体系</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURSES.map((c) => (
          <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded mb-3">
              {c.badge}
            </span>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{c.title}</h3>
            <p className="text-slate-500 text-sm mb-4">{c.desc}</p>
            <Link
              href="/contact"
              className="block text-center border border-blue-500 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
            >
              咨询课程
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
