"use client";

import { useState, useEffect } from "react";

type TeacherSummary = {
  id: string; name: string;
  totalHours: number; oneOnOneHours: number; groupHours: number;
  bySubject: Record<string, number>;
};

export default function TeachersReportPage() {
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [filters, setFilters] = useState({ startDate: "", endDate: "", teacherId: "" });
  const [allTeachers, setAllTeachers] = useState<{ id: string; name: string }[]>([]);

  async function load() {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.teacherId) params.set("teacherId", filters.teacherId);
    const res = await fetch(`/api/reports/teachers?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTeachers(data.teachers);
      setTotalHours(data.totalHours);
    }
  }

  useEffect(() => {
    load();
    fetch("/api/admin/users").then(r => r.ok ? r.json() : []).then(users => {
      setAllTeachers(users.filter((u: { roles: { role: string }[] }) => u.roles.some((r: { role: string }) => r.role === "TEACHER")));
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">教师工时报表</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">老师</label>
          <select value={filters.teacherId} onChange={e => setFilters({ ...filters, teacherId: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">全部老师</option>
            {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">开始日期</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">结束日期</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">查询</button>
      </div>

      {/* Total */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
        <p className="text-sm text-purple-600">已核销课程总工时</p>
        <p className="text-3xl font-bold text-purple-800">{totalHours.toFixed(1)}h</p>
      </div>

      {/* By Teacher */}
      <div className="space-y-4">
        {teachers.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{t.name}</h2>
              <span className="text-sm font-bold text-purple-700">{t.totalHours.toFixed(1)}h 总计</span>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">1对1 课时</p>
                <p className="text-xl font-bold text-slate-800">{t.oneOnOneHours.toFixed(1)}h</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500">班课 课时</p>
                <p className="text-xl font-bold text-slate-800">{t.groupHours.toFixed(1)}h</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-2">按科目分类</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(t.bySubject).map(([subject, hours]) => (
                    <div key={subject} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-sm">
                      <span className="font-medium text-blue-700">{subject}</span>
                      <span className="text-blue-500 ml-2">{(hours as number).toFixed(1)}h</span>
                    </div>
                  ))}
                  {Object.keys(t.bySubject).length === 0 && <span className="text-slate-400 text-xs">暂无数据</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">暂无工时数据</div>
        )}
      </div>
    </div>
  );
}
