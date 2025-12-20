import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { avatarUrl, phoneNumber, bio } = body;

        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: {
                ...(avatarUrl && { avatarUrl }),
                ...(phoneNumber !== undefined && { phoneNumber }),
                ...(bio !== undefined && { bio }),
            },
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Failed to update profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
