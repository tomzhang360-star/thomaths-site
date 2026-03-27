import { PrismaClient, Role, LeadSource } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create campuses
  const campus1 = await prisma.campus.upsert({
    where: { id: "campus-main" },
    update: {},
    create: { id: "campus-main", name: "总部校区" },
  });
  const campus2 = await prisma.campus.upsert({
    where: { id: "campus-north" },
    update: {},
    create: { id: "campus-north", name: "北区校区" },
  });

  // Create grades
  const grades = ["G9", "G10", "G11", "G12", "AP Calculus", "IB Physics HL", "SAT Math"];
  for (const name of grades) {
    await prisma.grade.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create subjects
  const subjects = ["数学", "物理", "化学", "英语"];
  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create classrooms
  await prisma.classroom.upsert({
    where: { id: "room-101" },
    update: {},
    create: { id: "room-101", name: "教室 101", campusId: campus1.id, capacity: 10 },
  });
  await prisma.classroom.upsert({
    where: { id: "room-102" },
    update: {},
    create: { id: "room-102", name: "教室 102", campusId: campus1.id, capacity: 4 },
  });
  await prisma.classroom.upsert({
    where: { id: "room-201" },
    update: {},
    create: { id: "room-201", name: "教室 201", campusId: campus2.id, capacity: 6 },
  });

  // Create super admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { phone: "13000000000" },
    update: {},
    create: {
      id: "user-admin",
      name: "超级管理员",
      phone: "13000000000",
      passwordHash: adminPassword,
      roles: { create: [{ role: Role.SUPER_ADMIN }] },
      campuses: {
        create: [{ campusId: campus1.id }, { campusId: campus2.id }],
      },
    },
  });

  // Create sample sales user
  const salesPassword = await bcrypt.hash("sales123", 12);
  const sales = await prisma.user.upsert({
    where: { phone: "13100000001" },
    update: {},
    create: {
      id: "user-sales",
      name: "张销售",
      phone: "13100000001",
      passwordHash: salesPassword,
      roles: { create: [{ role: Role.SALES }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create sample teacher
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  const teacher = await prisma.user.upsert({
    where: { phone: "13100000002" },
    update: {},
    create: {
      id: "user-teacher",
      name: "李老师",
      phone: "13100000002",
      passwordHash: teacherPassword,
      roles: { create: [{ role: Role.TEACHER }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create sample principal
  const principalPassword = await bcrypt.hash("principal123", 12);
  const principal = await prisma.user.upsert({
    where: { phone: "13100000003" },
    update: {},
    create: {
      id: "user-principal",
      name: "王校长",
      phone: "13100000003",
      passwordHash: principalPassword,
      roles: { create: [{ role: Role.PRINCIPAL }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create academic admin
  const acadAdminPw = await bcrypt.hash("acad123", 12);
  await prisma.user.upsert({
    where: { phone: "13100000004" },
    update: {},
    create: {
      id: "user-acad",
      name: "赵教务",
      phone: "13100000004",
      passwordHash: acadAdminPw,
      roles: { create: [{ role: Role.ACADEMIC_ADMIN }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create finance user
  const financePw = await bcrypt.hash("finance123", 12);
  await prisma.user.upsert({
    where: { phone: "13100000005" },
    update: {},
    create: {
      id: "user-finance",
      name: "钱财务",
      phone: "13100000005",
      passwordHash: financePw,
      roles: { create: [{ role: Role.FINANCE }] },
      campuses: { create: [{ campusId: campus1.id }, { campusId: campus2.id }] },
    },
  });

  // Create sample grade and subject refs
  const gradeG9 = await prisma.grade.findUnique({ where: { name: "G9" } });
  const subjectMath = await prisma.subject.findUnique({ where: { name: "数学" } });

  // Create sample lead student
  const lead = await prisma.student.upsert({
    where: { phone: "13200000001" },
    update: {},
    create: {
      id: "student-lead-1",
      name: "小明",
      phone: "13200000001",
      gradeId: gradeG9!.id,
      publicSchool: "第一中学",
      salesId: sales.id,
      campusId: campus1.id,
      leadInfo: { create: { source: LeadSource.REFERRAL } },
    },
  });

  console.log("✅ Seed complete");
  console.log("\n📋 Test accounts:");
  console.log("  超级管理员: 13000000000 / admin123");
  console.log("  销售:       13100000001 / sales123");
  console.log("  老师:       13100000002 / teacher123");
  console.log("  校长:       13100000003 / principal123");
  console.log("  教务:       13100000004 / acad123");
  console.log("  财务:       13100000005 / finance123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
