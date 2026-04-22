import { NextRequest, NextResponse } from 'next/server';

// Mock stage breakdown per course – replace with real DB query once cPanel MySQL is live
const STAGE_DATA: Record<string, { stage: string; completion: number }[]> = {
  'Analytics Bootcamp': [
    { stage: 'CP1', completion: 80 },
    { stage: 'CP2', completion: 45 },
    { stage: 'CP3', completion: 30 },
    { stage: 'CP4', completion: 10 },
  ],
  'Leadership Track': [
    { stage: 'CP1', completion: 100 },
    { stage: 'CP2', completion: 90 },
    { stage: 'CP3', completion: 72 },
    { stage: 'CP4', completion: 55 },
  ],
  'Finance Essentials': [
    { stage: 'CP1', completion: 100 },
    { stage: 'CP2', completion: 95 },
    { stage: 'CP3', completion: 88 },
    { stage: 'CP4', completion: 80 },
  ],
  'Digital Marketing': [
    { stage: 'CP1', completion: 70 },
    { stage: 'CP2', completion: 50 },
    { stage: 'CP3', completion: 20 },
    { stage: 'CP4', completion: 5 },
  ],
  'Product Strategy': [
    { stage: 'CP1', completion: 95 },
    { stage: 'CP2', completion: 80 },
    { stage: 'CP3', completion: 60 },
    { stage: 'CP4', completion: 40 },
  ],
  'Data Science Pro': [
    { stage: 'CP1', completion: 100 },
    { stage: 'CP2', completion: 92 },
    { stage: 'CP3', completion: 85 },
    { stage: 'CP4', completion: 72 },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const course = searchParams.get('course') || '';
  const data = STAGE_DATA[course] || [];
  return NextResponse.json({ success: true, data });
}
