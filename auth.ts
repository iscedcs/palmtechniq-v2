export const runtime = "nodejs";

import NextAuth, { type NextAuthConfig } from "next-auth";
import { encode as defaultEncodeJwt } from "next-auth/jwt";
import baseConfig, { DEFAULT_SESSION_MAX_AGE, REMEMBER_ME_MAX_AGE } from "./auth.config";

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
      allowDangerousEmailAccountLinking: true,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await getUserByEmail(email);
        if (!user || !user.password) return null;

        const ok = await verifyPassword(password, user.password);
        if (!ok) return null;

        // Carried through to the jwt callback below via `user`, so it can size
        // the token's lifetime by whether "Remember me" was checked. signIn()
        // serializes credentials through URLSearchParams, so this arrives as
        // the string "true", never a real boolean.
        return { ...user, rememberMe: credentials?.rememberMe === "true" };
      },
    }),
  ],

  adapter: PrismaAdapter(db as any) as any,

  events: {
    async linkAccount({ user }) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      } catch (error) {
        console.error("Error linking account:", error);
      }
    },
  },

  callbacks: {
    ...baseConfig.callbacks, // keep the edge-safe bits

    // Node-only signIn logic (can hit DB and send mail)
    async signIn({ user, account, profile }) {
      // For OAuth providers, link accounts by email
      if (account?.provider !== "credentials") {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email! },
          });

          // If user doesn't exist, create them
          if (!existingUser) {
            const { onBoardingMail } = await import("./lib/mail");
            await onBoardingMail(user.email!, user.name || "");
          } else {
            // If user exists, link the OAuth account by updating the account
            await db.account.updateMany({
              where: {
                userId: existingUser.id!,
                provider: account?.provider,
              },
              data: {
                access_token: account?.access_token,
                refresh_token: account?.refresh_token,
                expires_at: account?.expires_at,
              },
            });
          }
          return true;
        } catch (error) {
          console.error(`Error during ${account?.provider} sign-in:`, error);
          return true; // Still allow sign-in, let adapter handle the rest
        }
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
        token.rememberMe = Boolean(user.rememberMe);
      }

      if (token.sub) {
        try {
          const userActive = await db.user.findUnique({
            where: { id: token.sub as string },
            select: { role: true, name: true, mustChangePassword: true },
          });
          if (userActive?.role && token.role !== userActive.role) {
            token.role = userActive.role;
          }
          token.mustChangePassword = userActive?.mustChangePassword ?? false;
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

      return token;
    },
  },

  // The JWT's real, cryptographically-enforced expiry is set here, not by any
  // `exp` field returned from the `jwt` callback above — Auth.js's default
  // encode() always stamps `exp` itself from a fixed maxAge, ignoring
  // whatever the callback's token object contains. This override reads
  // `token.rememberMe` (set above) to size that maxAge per sign-in: 30 days
  // when "Remember me" was checked, the usual 24h otherwise. The physical
  // cookie's own ceiling (session.maxAge, in auth.config.ts) stays fixed at
  // 30 days regardless, so it never truncates a remembered token early — an
  // unremembered token still self-expires at 24h on decode either way.
  jwt: {
    async encode(params) {
      const maxAge = params.token?.rememberMe
        ? REMEMBER_ME_MAX_AGE
        : DEFAULT_SESSION_MAX_AGE;
      return defaultEncodeJwt({ ...params, maxAge });
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(nodeConfig);
