"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Campus  = { id: string; name: string };
type Grade   = { id: string; name: string };
type Subject = { id: string; name: string };
type Teacher = { id: string; name: string };

type ClassGroup = {
  id: string; name: string; status: string; maxStudents: number; notes: string | null;
  campus:  { id: string; name: string };
  subject: { id: string; name: string };
  grade:   { id: string; name: string };
  teacher: { id: string; name: string };
  enrollments: { id: string; package: { student: { id: string; name: string } } }[];
};

const STATUS_LABELS: Record<string, string> = {
  RECRUITING: "招生中",
  ACTIVE:     "开课中",
  CLOSED:     "已结班",
};
const STATUS_COLORS: Record<string, string> = {
  RECRUITING: "bg-blue-100 text-blue-700",
  ACTIVE:     "bg-green-100 text-green-700",
  CLOSED:     "bg-slate-100 text-slate-500",
};

const emptyForm = { name: "", campusId: "", subjectId: "", gradeId: "", teacherId: "", maxStudents: "6", notes: "" };

export default function ClassGroupsPage() {
  const [groups,   setGroups]   = useState<ClassGroup[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [grades,   setGrades]   = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [error,    setError]    = useState("");

  async function load() {
    const [g, ca, gr, su, us] = await Promise.all([
      fetch("/api/class-groups").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/campuses").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/grades").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/subjects").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/users").then(r => r.ok ? r.json() : []),
    ]);
    setGroups(g); setCampuses(ca); setGrades(gr); setSubjects(su);
    setTeachers(us.filter((u: { roles: { role: string }[] }) => u.roles.some((r: { role: string }) => r.role === "TEACHER")));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/class-groups", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxStudents: Number(form.maxStudents) }),
    });
    if (res.ok) { setForm(emptyForm); setShowForm(false); load(); }
    else { const d = await res.json(); setError(d.error); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">班课管理</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + 新建班级
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-700 mb-4">新建班级</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">班级名称 *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                placeholder="e.g. 周二四 Grade 11 数学班"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">校区 *</label>
              <select value={form.campusId} onChange={e => setForm({ ...form, campusId: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择校区</option>
                {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">授课老师 *</label>
              <select value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择老师</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">科目 *</label>
              <select value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择科目</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">年级 *</label>
              <select value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择年级</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">最大人数</label>
              <input type="number" min="1" max="30" value={form.maxStudents}
                onChange={e => setForm({ ...form, maxStudents: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">备注</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="如：周二 16:00–18:00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="sm:col-span-2 text-red-600 text-sm">{error}</p>}
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setError(""); }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">取消</button>
              <button type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">创建班级</button>
            </div>
          </form>
        </div>
      )}

      {/* Group cards */}
      {groups.length === 0 ? (
        <div className="text-center text-slate-400 py-16">暂无班级，点击「新建班级」开始</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map(g => (
            <Link key={g.id} href={`/class-groups/${g.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{g.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{g.campus.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[g.status] ?? "bg-slate-100 text-slate-500"}`}>
                  {STATUS_LABELS[g.status] ?? g.status}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex gap-4">
                  <span>📚 {g.subject.name}</span>
                  <span>🎓 {g.grade.name}</span>
                </div>
                <div>👨‍🏫 {g.teacher.name}</div>
                {g.notes && <div className="text-slate-400 truncate">📝 {g.notes}</div>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  已报名 <span className="font-bold text-slate-700">{g.enrollments.length}</span> / {g.maxStudents} 人
                </span>
                <div className="w-24 bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (g.enrollments.length / g.maxStudents) * 100)}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
