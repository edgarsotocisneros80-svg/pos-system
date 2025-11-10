import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const txs = await prisma.transaction.findMany({
      where: { status: 'completed' },
      orderBy: { created_at: 'asc' },
      select: { amount: true, created_at: true },
    });
    const cashFlow = txs.reduce((acc: Record<string, number>, t: any) => {
      const date = new Date(t.created_at).toISOString().split('T')[0];
      const amt = Number(t.amount);
      acc[date] = (acc[date] || 0) + amt;
      return acc;
    }, {});
    return NextResponse.json({ cashFlow });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cash flow data' }, { status: 500 });
  }
}
