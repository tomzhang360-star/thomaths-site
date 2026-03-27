"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import("@fullcalendar/react").then(m => m.default), { ssr: false });

import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";

type Teacher = { id: string; name: string };
type Student = { id: string; name: string };
type Package = { id: string; grade: { name: string }; subject: { name: string }; remainingHours: string };
type Classroom = { id: string; name: string };
type CalendarEvent = { id: string; title: string; start: string; end: string; backgroundColor: string; extendedProps: Record<string, unknown> };

export default function SchedulePage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewDimension, setViewDimension] = useState<"teacher" | "classroom">("teacher");
  const [filterTeacherId, setFilterTeacherId] = useState("");
  const [filterClassroomId, setFilterClassroomId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [modalData, setModalData] = useState({
    teacherId: "", studentId: "", packageId: "", classroomId: "", lessonType: "ONE_ON_ONE",
  });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentPackages, setStudentPackages] = useState<Package[]>([]);
  const [error, setError] = useState("");
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then(r => r.ok ? r.json() : []),
      fetch("/api/admin/campuses").then(r => r.ok ? r.json() : []),
    ]).then(([users, _campuses]) => {
      const teacherUsers = users.filter((u: { roles: { role: string }[] }) => u.roles.some((r: { role: string }) => r.role === "TEACHER" || r.role === "SUPER_ADMIN"));
      setTeachers(teacherUsers);
      fetch("/api/schedule/classrooms").then(r => r.ok ? r.json() : []).then(setClassrooms);
    });
  }, []);

  const loadEvents = useCallback(async (start: string, end: string) => {
    const params = new URLSearchParams({ start, end });
    if (filterTeacherId) params.set("teacherId", filterTeacherId);
    if (filterClassroomId) params.set("classroomId", filterClassroomId);
    const res = await fetch(`/api/schedule?${params}`);
    if (res.ok) setEvents(await res.json());
  }, [filterTeacherId, filterClassroomId]);

  useEffect(() => {
    if (currentRange) loadEvents(currentRange.start, currentRange.end);
  }, [filterTeacherId, filterClassroomId, currentRange, loadEvents]);

  async function searchStudents(q: string) {
    if (q.length < 2) { setStudentResults([]); return; }
    const res = await fetch(`/api/students?search=${encodeURIComponent(q)}&status=enrolled`);
    if (res.ok) setStudentResults(await res.json());
  }

  async function loadStudentPackages(studentId: string) {
    const res = await fetch(`/api/packages?studentId=${studentId}&status=ACTIVE`);
    if (res.ok) setStudentPackages(await res.json());
  }

  function handleDateSelect(arg: { startStr: string; endStr: string }) {
    setSelectedSlot({ start: arg.startStr, end: arg.endStr });
    setShowModal(true);
    setError("");
    setStudentSearch(""); setStudentResults([]); setSelectedStudent(null); setStudentPackages([]);
    setModalData({ teacherId: "", studentId: "", packageId: "", classroomId: "", lessonType: "ONE_ON_ONE" });
  }

  async function handleSaveLesson() {
    if (!selectedSlot || !modalData.teacherId || !modalData.studentId || !modalData.packageId || !modalData.classroomId) {
      setError("请填写所有必填字段"); return;
    }
    setError("");
    const res = await fetch("/api/schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...modalData, startTime: selectedSlot.start, endTime: selectedSlot.end }),
    });
    if (res.ok) {
      setShowModal(false);
      if (currentRange) loadEvents(currentRange.start, currentRange.end);
    } else {
      const d = await res.json();
      setError(d.error);
    }
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">排课日历</h1>
        <div className="flex gap-3 items-center">
          {/* Dimension toggle */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setViewDimension("teacher")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${viewDimension === "teacher" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}>
              👨‍🏫 老师视图
            </button>
            <button onClick={() => setViewDimension("classroom")}
              className={`px-3 py-1 rounded text-sm font-medium transition ${viewDimension === "classroom" ? "bg-white shadow-sm text-slate-800" : "text-slate-500"}`}>
              🏫 教室视图
            </button>
          </div>

          {viewDimension === "teacher" ? (
            <select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
              <option value="">全部老师</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : (
            <select value={filterClassroomId} onChange={e => setFilterClassroomId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">
              <option value="">全部教室</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 已排课</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> 待核销</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> 已核销</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 min-h-0">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
          locale="zh-cn"
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          events={events}
          height="100%"
          datesSet={(arg) => {
            const start = arg.startStr;
            const end = arg.endStr;
            setCurrentRange({ start, end });
            loadEvents(start, end);
          }}
          eventClick={(arg) => {
            const ep = arg.event.extendedProps;
            alert(`学生: ${ep.studentName}\n老师: ${ep.teacherName}\n教室: ${ep.classroomName}\n科目: ${ep.subjectName}`);
          }}
        />
      </div>

      {/* Create Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-semibold text-slate-800 text-lg mb-1">新建课程</h2>
            {selectedSlot && (
              <p className="text-xs text-slate-500 mb-4">
                {new Date(selectedSlot.start).toLocaleString("zh-CN")} → {new Date(selectedSlot.end).toLocaleString("zh-CN")}
              </p>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">老师 *</label>
                <select value={modalData.teacherId} onChange={e => setModalData({ ...modalData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">选择老师</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">学生 *（仅在读学生）</label>
                <div className="relative">
                  <input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value); }}
                    placeholder="输入姓名搜索在读学生..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  {studentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1 max-h-36 overflow-y-auto">
                      {studentResults.map(s => (
                        <button key={s.id} type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setStudentSearch(s.name);
                            setStudentResults([]);
                            setModalData(m => ({ ...m, studentId: s.id }));
                            loadStudentPackages(s.id);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{s.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {selectedStudent && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Active 课包 *</label>
                  <select value={modalData.packageId} onChange={e => setModalData({ ...modalData, packageId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="">选择课包</option>
                    {studentPackages.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.grade?.name} · {p.subject.name} — 剩余 {Number(p.remainingHours).toFixed(1)}h
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">教室 *</label>
                <select value={modalData.classroomId} onChange={e => setModalData({ ...modalData, classroomId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="">选择教室</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">课程类型</label>
                <select value={modalData.lessonType} onChange={e => setModalData({ ...modalData, lessonType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                  <option value="ONE_ON_ONE">1对1</option>
                  <option value="GROUP">班课</option>
                </select>
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">取消</button>
                <button type="button" onClick={handleSaveLesson} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">保存排课</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
