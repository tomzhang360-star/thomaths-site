import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import type { Role } from "@prisma/client";
import { SessionProvider } from "next-auth/react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRoles = (session.user as { roles: Role[] }).roles ?? [];
  const userName = session.user.name ?? "";

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar userRoles={userRoles} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top header */}
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
            <div />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                👤 {userName}
              </span>
              <div className="flex gap-1">
                {userRoles.map((r) => (
                  <span key={r} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[r] ?? r}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "超管",
  HR: "HR",
  SALES: "销售",
  TEACHER: "老师",
  ACADEMIC_ADMIN: "教务",
  PRINCIPAL: "校长",
  FINANCE: "财务",
};
