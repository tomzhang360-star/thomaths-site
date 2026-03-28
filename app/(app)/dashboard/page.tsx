import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/enums";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userRoles = (session?.user as { roles: Role[] })?.roles ?? [];
  const campusIds = (session?.user as { campusIds: string[] })?.campusIds ?? [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN" as Role);

  const campusFilter = isSuperAdmin ? {} : { campusId: { in: campusIds } };

  const [totalStudents, activePackages, todayLessons, pendingLogs] = await Promise.all([
    prisma.student.count({ where: campusFilter }),
    prisma.coursePackage.count({ where: { ...campusFilter, status: "ACTIVE" } }),
    prisma.scheduledLesson.count({
      where: {
        ...(isSuperAdmin ? {} : { student: campusFilter }),
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.lessonLog.count({
      where: { confirmedAt: null },
    }),
  ]);

  const recentStudents = await prisma.student.findMany({
    where: campusFilter,
    include: { grade: true, campus: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    { label: "学生总数", value: totalStudents, icon: "👨‍🎓", href: "/students", color: "bg-blue-50 text-blue-700" },
    { label: "有效课包", value: activePackages, icon: "📦", href: "/packages", color: "bg-green-50 text-green-700" },
    { label: "今日课程", value: todayLessons, icon: "📅", href: "/schedule", color: "bg-purple-50 text-purple-700" },
    { label: "待核销日志", value: pendingLogs, icon: "⏳", href: "/lessons", color: "bg-yellow-50 text-yellow-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">仪表盘</h1>
        <p className="text-slate-500 text-sm mt-1">欢迎回来，{session?.user?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{s.label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{s.value}</p>
                </div>
                <span className={`text-3xl p-2 rounded-lg ${s.color}`}>{s.icon}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">最近添加的学生</h2>
          <Link href="/students/new" className="text-sm text-blue-600 hover:underline">+ 添加学生</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentStudents.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">暂无学生数据</div>
          )}
          {recentStudents.map((s) => (
            <Link key={s.id} href={`/students/${s.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
              <div>
                <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                <p className="text-xs text-slate-400">{s.grade.name} · {s.campus.name}</p>
              </div>
              <span className="text-xs text-slate-400">{s.createdAt.toLocaleDateString("zh-CN")}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
