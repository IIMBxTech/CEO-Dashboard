import { NextResponse } from 'next/server';

// Mock course data – replace with real DB query once cPanel MySQL is live
const COURSE_DATA = [
  { name: 'Analytics Bootcamp', value: 65, color: '#ef4444' },
  { name: 'Leadership Track',   value: 82, color: '#3b82f6' },
  { name: 'Finance Essentials', value: 91, color: '#10b981' },
  { name: 'Digital Marketing',  value: 47, color: '#f59e0b' },
  { name: 'Product Strategy',   value: 73, color: '#8b5cf6' },
  { name: 'Data Science Pro',   value: 88, color: '#06b6d4' },
];

export async function GET() {
  return NextResponse.json({ success: true, data: COURSE_DATA });
}
