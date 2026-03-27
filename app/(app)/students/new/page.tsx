"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Grade = { id: string; name: string };
type Campus = { id: string; name: string };
type User = { id: string; name: string };

export default function NewStudentPage() {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    name: "", phone: "", gradeId: "", publicSchool: "",
    salesId: "", campusId: "", leadSource: "REFERRAL",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/grades").then(r => r.json()),
      fetch("/api/admin/campuses").then(r => r.json()),
      fetch("/api/admin/users").then(r => r.ok ? r.json() : []),
    ]).then(([g, c, u]) => {
      setGrades(g); setCampuses(c);
      setSalesUsers(u.filter((x: { roles: { role: string }[] }) => x.roles.some((r: { role: string }) => r.role === "SALES" || r.role === "SUPER_ADMIN")));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/students", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const student = await res.json();
      router.push(`/students/${student.id}`);
    } else {
      const d = await res.json();
      setError(d.error);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 text-lg">←</button>
        <h1 className="text-2xl font-bold text-slate-800">添加学生</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">姓名 *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">手机号 *</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">年级 *</label>
              <select value={form.gradeId} onChange={e => setForm({...form, gradeId: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择年级</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">校区 *</label>
              <select value={form.campusId} onChange={e => setForm({...form, campusId: e.target.value})} required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择校区</option>
                {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">公立学校</label>
            <input value={form.publicSchool} onChange={e => setForm({...form, publicSchool: e.target.value})}
              placeholder="e.g. Bayview Secondary School"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">归属销售</label>
              <select value={form.salesId} onChange={e => setForm({...form, salesId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">选择销售</option>
                {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">线索来源</label>
              <select value={form.leadSource} onChange={e => setForm({...form, leadSource: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="OUTREACH">地推</option>
                <option value="REFERRAL">转介绍</option>
                <option value="AD">广告</option>
                <option value="OTHER">其他</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">保存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
