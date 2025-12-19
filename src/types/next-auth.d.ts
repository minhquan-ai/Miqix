import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's role. */
            role: "teacher" | "student"
            id: string
        } & DefaultSession["user"]
    }

    interface User {
        role: "teacher" | "student"
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "teacher" | "student"
    }
}
