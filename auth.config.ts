// auth.config.ts  ✅ EDGE-SAFE
import type { NextAuthConfig } from "next-auth";

const config = {
  providers: [],
  // Only things the middleware needs: jwt/session shaping.
  session: {
    strategy: "jwt",
    maxAge: 86400, // 24h
    updateAge: 300,
  },

  pages: {
    signIn: "/login",
    error: "/error",
  },

  // Keep cookies as you had them
  cookies: {
    sessionToken: {
      name: "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // domain: process.env.NODE_ENV === "production" ? ".www.palmtechniq.com" : undefined,
      },
    },
  },

  // Edge-safe callbacks only — no DB or Node APIs here
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.sub = user.id as string;
        token.email = user.email as string;
        // if you store role on the user object during sign-in,
        // it'll flow into token.role via the Node config (below).
        // Keep this minimal here.
      }

      // keep token exp fresh
      const now = Math.floor(Date.now() / 1000);
      const maxAge = 86400;
      if (!token.exp || token.exp < now) token.exp = now + maxAge;

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub as string;
      if (token.role && session.user) session.user.role = token.role as string;
      if (token.role) (session as any).role = token.role as string;
      return session;
    },
  },
} satisfies NextAuthConfig;

export default config;
