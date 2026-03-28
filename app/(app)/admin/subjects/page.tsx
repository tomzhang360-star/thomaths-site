"use client";

import { useState, useEffect } from "react";

type Subject = { id: string; name: string };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const res = await fetch("/api/admin/subjects");
    if (res.ok) setSubjects(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); load();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该科目？")) return;
    await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">科目管理</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <form onSubmit={handleCreate} className="flex gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="科目名称（如 数学）"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">添加</button>
        </form>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">科目名称</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-sm text-slate-800">{s.name}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 text-sm hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
