import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected!', 
      userCount 
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed', 
      error: String(error) 
    }, { status: 500 });
  }
}
