"use client";

import { useState, useEffect } from "react";

type Campus = { id: string; name: string };
type Classroom = {
  id: string; name: string; campusId: string; capacity: number | null;
  notes: string | null; isActive: boolean;
  campus: { id: string; name: string };
};

const empty = { name: "", campusId: "", capacity: "", notes: "" };

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [campuses,   setCampuses]   = useState<Campus[]>([]);
  const [form,       setForm]       = useState(empty);
  const [editId,     setEditId]     = useState<string | null>(null);
  const [editForm,   setEditForm]   = useState(empty);
  const [error,      setError]      = useState("");

  async function load() {
    const [cr, ca] = await Promise.all([
      fetch("/api/admin/classrooms").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/campuses").then(r => r.ok ? r.json() : []),
    ]);
    setClassrooms(cr); setCampuses(ca);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/admin/classrooms", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, capacity: form.capacity ? Number(form.capacity) : null }),
    });
    if (res.ok) { setForm(empty); load(); }
    else { const d = await res.json(); setError(d.error); }
  }

  async function handleUpdate(id: string) {
    const res = await fetch(`/api/admin/classrooms/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, capacity: editForm.capacity ? Number(editForm.capacity) : null }),
    });
    if (res.ok) { setEditId(null); load(); }
  }

  async function toggleActive(classroom: Classroom) {
    await fetch(`/api/admin/classrooms/${classroom.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !classroom.isActive }),
    });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该教室？")) return;
    await fetch(`/api/admin/classrooms/${id}`, { method: "DELETE" });
    load();
  }

  const grouped = campuses.map(c => ({
    campus: c,
    rooms: classrooms.filter(r => r.campusId === c.id),
  })).filter(g => g.rooms.length > 0 || true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">教室管理</h1>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4">添加教室</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select value={form.campusId} onChange={e => setForm({ ...form, campusId: e.target.value })} required
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">选择校区 *</option>
            {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="教室名称 *" required
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
            placeholder="座位数（可选）"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="备注（可选）"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              添加教室
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["校区", "教室名称", "座位数", "备注", "状态", "操作"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classrooms.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">暂无教室</td></tr>
            )}
            {classrooms.map(room => (
              <tr key={room.id} className={`hover:bg-slate-50 ${!room.isActive ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 text-slate-500 text-xs">{room.campus.name}</td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {editId === room.id ? (
                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="px-2 py-1 border border-blue-400 rounded text-sm w-32" />
                  ) : room.name}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {editId === room.id ? (
                    <input type="number" min="1" value={editForm.capacity}
                      onChange={e => setEditForm({ ...editForm, capacity: e.target.value })}
                      className="px-2 py-1 border border-blue-400 rounded text-sm w-20" placeholder="座位数" />
                  ) : room.capacity ? (
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">{room.capacity}</span>
                      <span className="text-xs text-slate-400">座</span>
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-xs">
                  {editId === room.id ? (
                    <input value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                      className="px-2 py-1 border border-blue-400 rounded text-sm w-40" placeholder="备注" />
                  ) : <span className="truncate block max-w-xs">{room.notes || <span className="text-slate-300">—</span>}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${room.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                    {room.isActive ? "启用" : "停用"}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                  {editId === room.id ? (
                    <>
                      <button onClick={() => handleUpdate(room.id)} className="text-blue-600 text-xs hover:underline">保存</button>
                      <button onClick={() => setEditId(null)} className="text-slate-400 text-xs hover:underline">取消</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => {
                        setEditId(room.id);
                        setEditForm({ name: room.name, campusId: room.campusId, capacity: room.capacity?.toString() ?? "", notes: room.notes ?? "" });
                      }} className="text-blue-600 text-xs hover:underline">编辑</button>
                      <button onClick={() => toggleActive(room)}
                        className="text-amber-500 text-xs hover:underline">
                        {room.isActive ? "停用" : "启用"}
                      </button>
                      <button onClick={() => handleDelete(room.id)} className="text-red-500 text-xs hover:underline">删除</button>
                    </>
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
