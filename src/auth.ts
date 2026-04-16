import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }) {
            // First run the edge-compatible jwt logic
            if (authConfig.callbacks?.jwt) {
                token = (await authConfig.callbacks.jwt({ token, user, trigger, session } as any)) || token;
            }
            // Add Node.js DB-dependent logic here
            if (trigger === 'update' && token.sub) {
                try {
                    const dbUser = await db.user.findUnique({ where: { id: token.sub } });
                    if (dbUser) {
                        token.avatarUrl = dbUser.avatarUrl;
                        token.isNewUser = !dbUser.avatarUrl;
                    }
                } catch (err) {
                    console.error("Error fetching db in jwt update", err);
                }
            }
            return token;
        }
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
