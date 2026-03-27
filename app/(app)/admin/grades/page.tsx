"use client";

import { useState, useEffect } from "react";

type Grade = { id: string; name: string };

export default function GradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const res = await fetch("/api/admin/grades");
    if (res.ok) setGrades(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/grades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName(""); load();
  }

  async function handleUpdate(id: string) {
    await fetch(`/api/admin/grades/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName }) });
    setEditId(null); load();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该年级？")) return;
    await fetch(`/api/admin/grades/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">年级管理</h1>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4">添加年级</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="年级名称（如 G9）"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">添加</button>
        </form>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">年级名称</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grades.map(g => (
              <tr key={g.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-sm">
                  {editId === g.id ? <input value={editName} onChange={e => setEditName(e.target.value)} className="px-2 py-1 border border-blue-400 rounded text-sm w-32" /> : g.name}
                </td>
                <td className="px-6 py-3 text-right space-x-2">
                  {editId === g.id ? (
                    <><button onClick={() => handleUpdate(g.id)} className="text-blue-600 text-sm hover:underline">保存</button>
                    <button onClick={() => setEditId(null)} className="text-slate-400 text-sm hover:underline">取消</button></>
                  ) : (
                    <><button onClick={() => { setEditId(g.id); setEditName(g.name); }} className="text-blue-600 text-sm hover:underline">编辑</button>
                    <button onClick={() => handleDelete(g.id)} className="text-red-500 text-sm hover:underline ml-2">删除</button></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
