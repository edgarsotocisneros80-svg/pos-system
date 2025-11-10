import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [sellingAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'completed', category: 'selling' },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'completed', type: 'expense' },
      }),
    ])
    const totalSelling = Number(sellingAgg._sum.amount || 0)
    const totalExpenses = Number(expenseAgg._sum.amount || 0)
    const totalProfit = totalSelling - totalExpenses
    return NextResponse.json({ totalProfit })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate profit' }, { status: 500 });
  }
}
