"use client";

import { useState, useEffect, useCallback } from "react";

const TEACHERS_PER_PAGE = 5;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Teacher = {
  id: string;
  name: string;
  roles: { role: string }[];
  campuses: { campus: { id: string; name: string } }[];
};

type Lesson = {
  id: string;
  start: string;
  end: string;
  extendedProps: {
    teacherId: string;
    teacherName: string;
    studentId: string;
    studentName: string;
    subjectName: string;
    classroomName: string;
    packageId: string;
    lessonType: string;
    hasLog: boolean;
    isConfirmed: boolean;
  };
};

type Student = { id: string; name: string };
type Package = { id: string; grade: { name: string }; subject: { name: string }; remainingHours: string };
type Classroom = { id: string; name: string };

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmt(d: Date) {
  return d.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function SchedulePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherPage, setTeacherPage] = useState(0);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [modalTeacherId, setModalTeacherId] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalStart, setModalStart] = useState("16:00");
  const [modalEnd, setModalEnd] = useState("18:00");
  const [modalData, setModalData] = useState({ studentId: "", packageId: "", classroomId: "", lessonType: "ONE_ON_ONE" });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPackages, setStudentPackages] = useState<Package[]>([]);
  const [modalError, setModalError] = useState("");

  // Detail popup
  const [detail, setDetail] = useState<Lesson | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const visibleTeachers = teachers.slice(
    teacherPage * TEACHERS_PER_PAGE,
    (teacherPage + 1) * TEACHERS_PER_PAGE
  );
  const totalPages = Math.ceil(teachers.length / TEACHERS_PER_PAGE);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.ok ? r.json() : [])
      .then((users: Teacher[]) => setTeachers(users.filter(u => u.roles.some(r => r.role === "TEACHER"))));
    fetch("/api/schedule/classrooms")
      .then(r => r.ok ? r.json() : [])
      .then(setClassrooms);
  }, []);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    const res = await fetch(`/api/schedule?start=${weekStart.toISOString()}&end=${end.toISOString()}`);
    if (res.ok) setLessons(await res.json());
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }

  function openModal(teacherId: string, day: Date) {
    setModalTeacherId(teacherId);
    setModalDate(day.toISOString().slice(0, 10));
    setModalStart("16:00");
    setModalEnd("18:00");
    setModalData({ studentId: "", packageId: "", classroomId: "", lessonType: "ONE_ON_ONE" });
    setStudentSearch(""); setStudentResults([]); setSelectedStudent(null); setStudentPackages([]);
    setModalError("");
    setShowModal(true);
  }

  async function searchStudents(q: string) {
    if (q.length < 2) { setStudentResults([]); return; }
    const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&status=enrolled`);
    if (res.ok) setStudentResults(await res.json());
  }

  async function loadStudentPackages(studentId: string) {
    const res = await fetch(`/api/packages?studentId=${studentId}&status=ACTIVE`);
    if (res.ok) setStudentPackages(await res.json());
  }

  async function handleSave() {
    if (!modalTeacherId || !modalData.studentId || !modalData.packageId || !modalData.classroomId) {
      setModalError("请填写所有必填字段"); return;
    }
    const startTime = new Date(`${modalDate}T${modalStart}:00`);
    const endTime   = new Date(`${modalDate}T${modalEnd}:00`);
    if (endTime <= startTime) { setModalError("结束时间须晚于开始时间"); return; }
    setModalError("");
    const res = await fetch("/api/schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teacherId: modalTeacherId, ...modalData,
        startTime: startTime.toISOString(), endTime: endTime.toISOString(),
      }),
    });
    if (res.ok) { setShowModal(false); loadLessons(); }
    else { const d = await res.json(); setModalError(d.error); }
  }

  function cellLessons(teacherId: string, day: Date) {
    return lessons.filter(l => l.extendedProps.teacherId === teacherId && isSameDay(new Date(l.start), day));
  }

  const today = new Date();
  const weekLabel = `${weekDays[0].toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">排课日历</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-3 text-xs text-slate-500 mr-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" />已排课</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />待核销</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />已核销</span>
          </div>
          <button onClick={prevWeek} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">←</button>
          <span className="text-sm font-medium text-slate-700 min-w-48 text-center">{weekLabel}</span>
          <button onClick={nextWeek} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">→</button>
          <button onClick={() => setWeekStart(getMonday(new Date()))} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 text-blue-600">本周</button>
        </div>
      </div>

      {/* Teacher pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">
            老师 {teacherPage * TEACHERS_PER_PAGE + 1}–{Math.min((teacherPage + 1) * TEACHERS_PER_PAGE, teachers.length)} / {teachers.length} 人
          </span>
          <button disabled={teacherPage === 0} onClick={() => setTeacherPage(p => p - 1)}
            className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">← 上页</button>
          <button disabled={teacherPage >= totalPages - 1} onClick={() => setTeacherPage(p => p + 1)}
            className="px-3 py-1 border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">下页 →</button>
        </div>
      )}

      {/* Schedule grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-36 bg-slate-50 border-b border-r border-slate-200 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                老师
              </th>
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, today);
                return (
                  <th key={i} className={`min-w-32 border-b border-r border-slate-200 px-2 py-2 text-center text-xs font-semibold last:border-r-0 ${isToday ? "bg-blue-50" : "bg-slate-50"}`}>
                    <div className={isToday ? "text-blue-500" : "text-slate-400"}>{DAY_NAMES[i]}</div>
                    <div className={`text-lg font-bold mt-0.5 ${isToday ? "text-blue-600" : "text-slate-700"}`}>{day.getDate()}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center text-slate-400 py-16 text-sm">加载中...</td></tr>
            )}
            {!loading && visibleTeachers.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-400 py-16 text-sm">暂无老师数据</td></tr>
            )}
            {!loading && visibleTeachers.map((teacher, ti) => (
              <tr key={teacher.id} className={ti % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                {/* Teacher label */}
                <td className="border-b border-r border-slate-200 px-3 py-3 align-top bg-slate-50">
                  <div className="font-semibold text-slate-800 text-sm">{teacher.name}</div>
                  {teacher.campuses[0] && (
                    <div className="text-xs text-slate-400 mt-0.5 truncate">{teacher.campuses[0].campus.name}</div>
                  )}
                </td>
                {/* Day cells */}
                {weekDays.map((day, di) => {
                  const isToday = isSameDay(day, today);
                  const cls = cellLessons(teacher.id, day);
                  return (
                    <td
                      key={di}
                      className={`border-b border-r border-slate-200 px-1.5 py-1.5 align-top last:border-r-0 cursor-pointer transition-colors
                        ${isToday ? "bg-blue-50/40" : ""}
                        hover:bg-blue-50`}
                      style={{ minHeight: 72 }}
                      onClick={() => openModal(teacher.id, day)}
                    >
                      <div className="space-y-1 min-h-14">
                        {cls.map(lesson => {
                          const ep = lesson.extendedProps;
                          const color = ep.isConfirmed
                            ? "bg-green-100 border-green-300 text-green-900"
                            : ep.hasLog
                            ? "bg-amber-100 border-amber-300 text-amber-900"
                            : "bg-blue-100 border-blue-300 text-blue-900";
                          return (
                            <div
                              key={lesson.id}
                              onClick={e => { e.stopPropagation(); setDetail(lesson); }}
                              className={`rounded border px-1.5 py-1 text-xs cursor-pointer hover:opacity-75 transition-opacity ${color}`}
                            >
                              <div className="font-semibold truncate">{ep.studentName}</div>
                              <div className="opacity-75 truncate">{ep.subjectName}</div>
                              <div className="opacity-70">{fmt(new Date(lesson.start))}–{fmt(new Date(lesson.end))}</div>
                            </div>
                          );
                        })}
                        {cls.length === 0 && (
                          <div className="min-h-14 flex items-center justify-center text-slate-200 text-lg select-none">+</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create lesson modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 text-lg mb-1">新建排课</h2>
            <p className="text-xs text-slate-500 mb-4">
              {teachers.find(t => t.id === modalTeacherId)?.name} · {modalDate}
            </p>
            <div className="space-y-3">
              {/* Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">开始时间 *</label>
                  <input type="time" value={modalStart} onChange={e => setModalStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">结束时间 *</label>
                  <input type="time" value={modalEnd} onChange={e => setModalEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {/* Student search */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">学生 * (在读)</label>
                <div className="relative">
                  <input value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value); }}
                    placeholder="输入姓名搜索..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {studentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1 max-h-36 overflow-y-auto">
                      {studentResults.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => {
                            setSelectedStudent(s); setStudentSearch(s.name); setStudentResults([]);
                            setModalData(m => ({ ...m, studentId: s.id, packageId: "" }));
                            loadStudentPackages(s.id);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Package */}
              {selectedStudent && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">课包 *</label>
                  <select value={modalData.packageId} onChange={e => setModalData(m => ({ ...m, packageId: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">选择课包</option>
                    {studentPackages.map(p => (
                      <option key={p.id} value={p.id}>{p.grade?.name} · {p.subject.name} — 剩余 {Number(p.remainingHours).toFixed(1)}h</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Classroom */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">教室 *</label>
                <select value={modalData.classroomId} onChange={e => setModalData(m => ({ ...m, classroomId: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">选择教室</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {/* Lesson type */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">课程类型</label>
                <select value={modalData.lessonType} onChange={e => setModalData(m => ({ ...m, lessonType: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ONE_ON_ONE">1 对 1</option>
                  <option value="GROUP">班课</option>
                </select>
              </div>
              {modalError && <p className="text-red-600 text-sm">{modalError}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50">取消</button>
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">保存排课</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson detail popup */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-800">课程详情</h2>
              <button onClick={() => setDetail(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["学生", detail.extendedProps.studentName],
                ["老师", detail.extendedProps.teacherName],
                ["科目", detail.extendedProps.subjectName],
                ["教室", detail.extendedProps.classroomName],
                ["时间", `${fmt(new Date(detail.start))} – ${fmt(new Date(detail.end))}`],
                ["类型", detail.extendedProps.lessonType === "ONE_ON_ONE" ? "1 对 1" : "班课"],
                ["状态", detail.extendedProps.isConfirmed ? "✅ 已核销" : detail.extendedProps.hasLog ? "⏳ 待确认" : "📅 已排课"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
