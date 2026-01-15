import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const { auth, signIn, signOut, handlers } = NextAuth({
    pages: {
        signIn: '/login',
    },
    callbacks: {
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
        async jwt({ token, user, trigger }) {
            if (user) {
                token.role = user.role;
                token.avatarUrl = user.avatarUrl;
                token.isNewUser = !user.avatarUrl;
            }
            // Refresh avatar status on update
            if (trigger === 'update' && token.sub) {
                const dbUser = await db.user.findUnique({ where: { id: token.sub } });
                if (dbUser) {
                    token.avatarUrl = dbUser.avatarUrl;
                    token.isNewUser = !dbUser.avatarUrl;
                }
            }
            return token;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    try {
                        console.log('Authorizing user:', email);
                        const user = await db.user.findUnique({ where: { email } });
                        if (!user) {
                            console.log('User not found:', email);
                            return null;
                        }

                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) {
                            console.log('Password match, returning user');
                            return user as any;
                        }
                        console.log('Password mismatch');
                    } catch (error) {
                        console.error('Authorize error:', error);
                        throw error; // Rethrow to be caught by AuthError
                    }
                }

                console.log('Invalid credentials schema');
                return null;
            },
        }),
    ],
});
