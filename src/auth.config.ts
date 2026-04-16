import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl));
                return true;
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                session.user.role = token.role as "teacher" | "student";
            }
            if (session.user) {
                session.user.avatarUrl = token.avatarUrl as string | null;
                session.user.isNewUser = token.isNewUser as boolean;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.avatarUrl = user.avatarUrl;
                token.isNewUser = !user.avatarUrl;
            }
            
            // Handle profile updates manually via token modification without querying DB on edge
            if (trigger === 'update' && session?.avatarUrl !== undefined) {
                 token.avatarUrl = session.avatarUrl;
                 token.isNewUser = !session.avatarUrl;
            }
            
            return token;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
