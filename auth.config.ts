// auth.config.ts  ✅ EDGE-SAFE
import type { NextAuthConfig } from "next-auth";

/**
 * A session's real, cryptographically-enforced expiry comes from the `jwt.encode`
 * override in auth.ts, which sizes it per sign-in from "Remember me" — NOT from
 * this file. This config's own `session.maxAge` only sets the ceiling on how
 * long the browser cookie itself is allowed to physically stick around —
 * Auth.js resets the cookie's Max-Age to this value on every session refresh
 * regardless of the token's own real expiry, so it has to be at least as long
 * as the longest session we ever issue (a remembered login), or the cookie
 * would be deleted by the browser before an otherwise-still-valid token
 * expires.
 */
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
export const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24; // 24h

const config = {
  providers: [],
  // Only things the middleware needs: jwt/session shaping.
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_ME_MAX_AGE,
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
      // This edge instance (see proxy.ts) only ever decodes an
      // already-issued, already-signed token to populate `req.auth` for route
      // guards — it has no credentials provider and never re-encodes or
      // rewrites the session cookie, so there is nothing to size an expiry
      // for here. That happens once, at sign-in, in the node config below.
      if (account && user) {
        token.sub = user.id as string;
        token.email = user.email as string;
        // if you store role on the user object during sign-in,
        // it'll flow into token.role via the Node config (below).
        // Keep this minimal here.
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub as string;
      if (token.role && session.user) session.user.role = token.role as string;
      if (token.role) (session as any).role = token.role as string;
      if (token.mustChangePassword) {
        (session as any).mustChangePassword = true;
        if (session.user) (session.user as any).mustChangePassword = true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default config;
