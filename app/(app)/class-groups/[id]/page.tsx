"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Package = {
  id: string; remainingHours: number;
  student: { id: string; name: string; phone: string };
  grade: { name: string }; subject: { name: string };
};
type Enrollment = { id: string; package: Package };
type ClassGroup = {
  id: string; name: string; status: string; maxStudents: number; notes: string | null;
  campus: { name: string }; subject: { name: string }; grade: { name: string };
  teacher: { name: string };
  enrollments: Enrollment[];
};

const STATUS_LABELS: Record<string, string> = { RECRUITING: "招生中", ACTIVE: "开课中", CLOSED: "已结班" };
const STATUS_COLORS: Record<string, string> = {
  RECRUITING: "bg-blue-100 text-blue-700",
  ACTIVE:     "bg-green-100 text-green-700",
  CLOSED:     "bg-slate-100 text-slate-500",
};

export default function ClassGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<ClassGroup | null>(null);

  // Enroll: search for a student package
  const [pkgSearch, setPkgSearch]   = useState("");
  const [pkgResults, setPkgResults] = useState<Package[]>([]);
  const [enrollError, setEnrollError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/class-groups/${id}`);
    if (res.ok) setGroup(await res.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function searchPackages(q: string) {
    setPkgSearch(q);
    if (q.length < 2) { setPkgResults([]); return; }
    const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&status=enrolled`);
    if (!res.ok) return;
    const students = await res.json();
    const pkgFetches = students.map((s: { id: string }) =>
      fetch(`/api/packages?studentId=${s.id}&status=ACTIVE`).then(r => r.ok ? r.json() : [])
    );
    const all = (await Promise.all(pkgFetches)).flat();
    // Filter to same subject as class group
    setPkgResults(all.filter((p: Package) => p.subject?.name === group?.subject.name));
  }

  async function enroll(packageId: string) {
    setEnrollError("");
    const res = await fetch(`/api/class-groups/${id}/enroll`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    if (res.ok) { setPkgSearch(""); setPkgResults([]); load(); }
    else { const d = await res.json(); setEnrollError(d.error); }
  }

  async function unenroll(packageId: string) {
    if (!confirm("确定移除该学生？")) return;
    await fetch(`/api/class-groups/${id}/enroll`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId }),
    });
    load();
  }

  async function updateStatus(status: string) {
    await fetch(`/api/class-groups/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  if (!group) return <div className="text-slate-400 py-10 text-center">加载中...</div>;

  const isFull = group.enrollments.length >= group.maxStudents;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 text-lg">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>
          <p className="text-sm text-slate-400">{group.campus.name} · {group.subject.name} · {group.grade.name}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[group.status] ?? ""}`}>
          {STATUS_LABELS[group.status] ?? group.status}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 grid grid-cols-2 gap-4 text-sm">
        {[
          ["授课老师", group.teacher.name],
          ["科目", group.subject.name],
          ["年级", group.grade.name],
          ["最大人数", `${group.maxStudents} 人`],
          ["当前人数", `${group.enrollments.length} 人${isFull ? "（已满）" : ""}`],
          ["备注", group.notes || "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="font-medium text-slate-700 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Status change */}
      <div className="flex gap-2 flex-wrap">
        {["RECRUITING", "ACTIVE", "CLOSED"].map(s => (
          <button key={s} disabled={group.status === s}
            onClick={() => updateStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition
              ${group.status === s
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-default"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Enrolled students */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">已报名学生（{group.enrollments.length}/{group.maxStudents}）</h2>
          <div className="w-32 bg-slate-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (group.enrollments.length / group.maxStudents) * 100)}%` }} />
          </div>
        </div>
        {group.enrollments.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">暂无学生，请在下方搜索报名</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {group.enrollments.map(e => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-800 text-sm">{e.package.student.name}</div>
                  <div className="text-xs text-slate-400">{e.package.student.phone} · 剩余 {Number(e.package.remainingHours).toFixed(1)}h</div>
                </div>
                <button onClick={() => unenroll(e.package.id)}
                  className="text-red-500 text-xs hover:underline">移除</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enroll new student */}
      {group.status !== "CLOSED" && !isFull && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-3">添加学生</h2>
          <div className="relative">
            <input value={pkgSearch} onChange={e => searchPackages(e.target.value)}
              placeholder="输入学生姓名搜索（科目需匹配）..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {pkgResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                {pkgResults.map(p => (
                  <button key={p.id} type="button" onClick={() => enroll(p.id)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0">
                    <span className="font-medium">{p.student.name}</span>
                    <span className="text-slate-400 ml-2">· {p.grade.name} {p.subject.name} · 剩余 {Number(p.remainingHours).toFixed(1)}h</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {enrollError && <p className="text-red-600 text-sm mt-2">{enrollError}</p>}
        </div>
      )}

      {isFull && <p className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg py-3">班级已满员，如需扩班请修改最大人数</p>}
    </div>
  );
}
