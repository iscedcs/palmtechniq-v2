export const runtime = "nodejs";

import NextAuth, { type NextAuthConfig } from "next-auth";
import baseConfig from "./auth.config";

import { db } from "./lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";

import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import getUserByEmail, { getUserById } from "./data/user";
import { verifyPassword } from "./lib/password";
import { loginSchema } from "./schemas";

const nodeConfig: NextAuthConfig = {
  ...baseConfig, // start from the edge-safe base

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const ok = await verifyPassword(password, user.password);
        return ok ? user : null;
      },
    }),
  ],

  adapter: PrismaAdapter(db),

  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    ...baseConfig.callbacks, // keep the edge-safe bits

    // Node-only signIn logic (can hit DB and send mail)
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") {
        const existingUser = await getUserByEmail(user.email!);
        if (!existingUser) {
          const { onBoardingMail } = await import("./lib/mail");
          await onBoardingMail(user.email!, user.name || "");
        }
        return true;
      }

      const existingUser = await getUserById(user.id!);
      if (!existingUser?.emailVerified) return false;
      return true;
    },

    // Node-only JWT enrichment (DB reads allowed here)
    async jwt({ token, user, account, trigger }) {
      if (account && user) {
        token.sub = user.id as string;
        token.email = user.email as string;
        token.role = (user as any).role;
      }

      if (token.sub) {
        try {
          const userActive = await db.user.findUnique({
            where: { id: token.sub as string },
            select: { role: true, name: true },
          });
          if (userActive?.role && token.role !== userActive.role) {
            token.role = userActive.role;
          }
          if (userActive?.role === "ADMIN") {
            const existingName = userActive.name || "";
            const pattern = /^PTQ-ADMIN-[A-Z0-9]{6}$/;
            const isGeneric =
              !existingName ||
              /^admin/i.test(existingName) ||
              /^administrator/i.test(existingName);
            if (isGeneric && !pattern.test(existingName)) {
              const suffix = String(token.sub).slice(-6).toUpperCase();
              const newName = `PTQ-ADMIN-${suffix}`;
              await db.user.update({
                where: { id: token.sub as string },
                data: { name: newName },
              });
            }
          }
        } catch (error) {
          console.warn("Failed to refresh user role", error);
        }
      }

      // refresh exp
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 86400;
      if (!token.exp || token.exp < now) token.exp = now + maxAge;

      return token;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(nodeConfig);
