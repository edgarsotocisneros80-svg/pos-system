import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const txs = await prisma.transaction.findMany({
      where: { status: 'completed', type: 'income' },
      select: { amount: true, category: true },
    });
    const revenueByCategory = txs.reduce((acc: Record<string, number>, t: any) => {
      if (!t.category) return acc;
      const amt = Number(t.amount);
      acc[t.category] = (acc[t.category] || 0) + amt;
      return acc;
    }, {});
    return NextResponse.json({ revenueByCategory });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch revenue by category' }, { status: 500 });
  }
}
