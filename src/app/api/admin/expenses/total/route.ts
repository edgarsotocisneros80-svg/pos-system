import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const agg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'expense', status: 'completed' },
    })
    const totalExpenses = Number(agg._sum.amount || 0)
    return NextResponse.json({ totalExpenses })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch total expenses' }, { status: 500 })
  }
}
