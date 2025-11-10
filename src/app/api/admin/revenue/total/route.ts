import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const agg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'income', status: 'completed' },
    })
    const totalRevenue = Number(agg._sum.amount || 0)
    return NextResponse.json({ totalRevenue })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch total revenue' }, { status: 500 })
  }
}
