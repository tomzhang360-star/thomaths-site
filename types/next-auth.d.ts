import type { Role } from "@/lib/enums";
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    phone: string;
    roles: Role[];
    campusIds: string[];
  }

  interface Session {
    user: {
      id: string;
      name: string;
      phone: string;
      roles: Role[];
      campusIds: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    phone: string;
    roles: Role[];
    campusIds: string[];
  }
}
