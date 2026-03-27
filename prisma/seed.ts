import { PrismaClient } from "@prisma/client";
import { Role, LeadSource } from "../lib/enums";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create campuses
  const campus1 = await prisma.campus.upsert({
    where: { id: "campus-main" },
    update: {},
    create: { id: "campus-main", name: "Markham Campus" },
  });
  const campus2 = await prisma.campus.upsert({
    where: { id: "campus-north" },
    update: {},
    create: { id: "campus-north", name: "Richmond Hill Campus" },
  });

  // Create grades
  const grades = ["Grade 9", "Grade 10", "Grade 11", "Grade 12", "AP Calculus", "IB Physics HL", "SAT Math"];
  for (const name of grades) {
    await prisma.grade.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create subjects
  const subjects = ["Math", "Physics", "Chemistry", "English"];
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
    create: { id: "room-101", name: "Room 101", campusId: campus1.id, capacity: 10 },
  });
  await prisma.classroom.upsert({
    where: { id: "room-102" },
    update: {},
    create: { id: "room-102", name: "Room 102", campusId: campus1.id, capacity: 4 },
  });
  await prisma.classroom.upsert({
    where: { id: "room-201" },
    update: {},
    create: { id: "room-201", name: "Room 201", campusId: campus2.id, capacity: 6 },
  });

  // Create super admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { phone: "6470000000" },
    update: {},
    create: {
      id: "user-admin",
      name: "System Admin",
      phone: "6470000000",
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
    where: { phone: "6470000001" },
    update: {},
    create: {
      id: "user-sales",
      name: "Sarah Chen",
      phone: "6470000001",
      passwordHash: salesPassword,
      roles: { create: [{ role: Role.SALES }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create sample teacher
  const teacherPassword = await bcrypt.hash("teacher123", 12);
  await prisma.user.upsert({
    where: { phone: "6470000002" },
    update: {},
    create: {
      id: "user-teacher",
      name: "Michael Wang",
      phone: "6470000002",
      passwordHash: teacherPassword,
      roles: { create: [{ role: Role.TEACHER }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create sample principal
  const principalPassword = await bcrypt.hash("principal123", 12);
  await prisma.user.upsert({
    where: { phone: "6470000003" },
    update: {},
    create: {
      id: "user-principal",
      name: "Jennifer Liu",
      phone: "6470000003",
      passwordHash: principalPassword,
      roles: { create: [{ role: Role.PRINCIPAL }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create academic admin
  const acadAdminPw = await bcrypt.hash("acad123", 12);
  await prisma.user.upsert({
    where: { phone: "6470000004" },
    update: {},
    create: {
      id: "user-acad",
      name: "David Zhang",
      phone: "6470000004",
      passwordHash: acadAdminPw,
      roles: { create: [{ role: Role.ACADEMIC_ADMIN }] },
      campuses: { create: [{ campusId: campus1.id }] },
    },
  });

  // Create finance user
  const financePw = await bcrypt.hash("finance123", 12);
  await prisma.user.upsert({
    where: { phone: "6470000005" },
    update: {},
    create: {
      id: "user-finance",
      name: "Emily Kim",
      phone: "6470000005",
      passwordHash: financePw,
      roles: { create: [{ role: Role.FINANCE }] },
      campuses: { create: [{ campusId: campus1.id }, { campusId: campus2.id }] },
    },
  });

  // Create sample grade and subject refs
  const gradeG9 = await prisma.grade.findUnique({ where: { name: "Grade 9" } });

  // Create sample lead student
  await prisma.student.upsert({
    where: { phone: "6471000001" },
    update: {},
    create: {
      id: "student-lead-1",
      name: "Alex Thompson",
      phone: "6471000001",
      gradeId: gradeG9!.id,
      publicSchool: "Bayview Secondary School",
      salesId: sales.id,
      campusId: campus1.id,
      leadInfo: { create: { source: LeadSource.REFERRAL } },
    },
  });

  console.log("✅ Seed complete");
  console.log("\n📋 Test accounts:");
  console.log("  Super Admin:     6470000000 / admin123");
  console.log("  Sales:           6470000001 / sales123");
  console.log("  Teacher:         6470000002 / teacher123");
  console.log("  Principal:       6470000003 / principal123");
  console.log("  Academic Admin:  6470000004 / acad123");
  console.log("  Finance:         6470000005 / finance123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
