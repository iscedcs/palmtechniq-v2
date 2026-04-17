import "next-auth";
import "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    id?: string;
    role?: string;
    email?: string;
    exp?: number;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth" {
  interface User {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    image?: string | null;
    avatar?: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: User;
    role?: string;
    mustChangePassword?: boolean;
    token?: {
      role: string;
    };
  }
}
