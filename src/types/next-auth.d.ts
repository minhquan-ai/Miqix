import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            role: "teacher" | "student"
            id: string
            avatarUrl: string | null
            isNewUser: boolean
        } & DefaultSession["user"]
    }

    interface User {
        role: "teacher" | "student"
        avatarUrl: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "teacher" | "student"
        avatarUrl?: string | null
        isNewUser?: boolean
    }
}
