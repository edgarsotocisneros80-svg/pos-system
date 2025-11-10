import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const txs = await prisma.transaction.findMany({
      where: { status: 'completed', type: 'expense' },
      select: { amount: true, category: true },
    });
    const expensesByCategory = txs.reduce((acc: Record<string, number>, t: any) => {
      if (!t.category) return acc;
      const amt = Number(t.amount);
      acc[t.category] = (acc[t.category] || 0) + amt;
      return acc;
    }, {});
    return NextResponse.json({ expensesByCategory });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses by category' }, { status: 500 });
  }
}
