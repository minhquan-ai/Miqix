import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  let status = 'MISSING';
  let preview = 'N/A';
  
  if (dbUrl) {
    status = 'PRESENT';
    // Show protocol and first few chars to debug format issues
    preview = dbUrl.substring(0, 20) + '...'; 
  }

  return NextResponse.json({
    env_check: {
      DATABASE_URL_STATUS: status,
      DATABASE_URL_PREVIEW: preview,
      NODE_ENV: process.env.NODE_ENV
    }
  });
}
