'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { redirect } from 'next/navigation';

// Password validation: 8+ chars, uppercase, lowercase, number
const passwordSchema = z.string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .regex(/[A-Z]/, { message: "Mật khẩu phải có ít nhất 1 chữ hoa" })
    .regex(/[a-z]/, { message: "Mật khẩu phải có ít nhất 1 chữ thường" })
    .regex(/[0-9]/, { message: "Mật khẩu phải có ít nhất 1 số" });

const RegisterSchema = z.object({
    email: z.string().email({ message: "Email không hợp lệ" }),
    password: passwordSchema,
    name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
    role: z.enum(["student", "teacher"]),
});

export async function register(prevState: string | undefined, formData: FormData) {
    const rawFormData = Object.fromEntries(formData.entries());

    const validatedFields = RegisterSchema.safeParse({
        email: rawFormData.email,
        password: rawFormData.password,
        name: rawFormData.name,
        role: rawFormData.role,
    });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        return errors.email?.[0]
            || errors.password?.[0]
            || errors.name?.[0]
            || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
    }

    const { email, password, name, role } = validatedFields.data;

    try {
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            return 'Email đã được sử dụng. Vui lòng chọn email khác.';
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                // No avatar yet - will be set in onboarding
            },
        });

    } catch (error) {
        console.error('Registration Error:', error);
        return 'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.';
    }

    // Redirect to login with success message
    redirect('/login?registered=true');
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Thông tin đăng nhập không chính xác.';
                case 'CallbackRouteError':
                    return `Lỗi kết nối hoặc xử lý: ${error.cause?.err?.message || error.message}`;
                default:
                    return `Lỗi (${error.type}): ${error.message}`;
            }
        }
        throw error;
    }
}

export async function logout() {
    await signOut({ redirectTo: '/login' });
}
