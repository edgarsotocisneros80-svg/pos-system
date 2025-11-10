import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'completed' },
      select: { amount: true, type: true, category: true, created_at: true },
      orderBy: { created_at: 'asc' },
    })
    if (!transactions) {
      return NextResponse.json({ error: 'No transactions found' }, { status: 404 })
    }

    const profitMargin = calculateProfitMarginSeries(transactions)
    return NextResponse.json({ profitMargin })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

function calculateProfitMarginSeries(transactions: any[]) {
  const dailyData: { [key: string]: { selling: number; expense: number } } = {}

  transactions.forEach((t) => {
    const date = new Date(t.created_at).toISOString().split('T')[0]
    if (!dailyData[date]) {
      dailyData[date] = { selling: 0, expense: 0 }
    }
    if (t.category === 'selling') {
      dailyData[date].selling += Number(t.amount)
    } else if (t.type === 'expense') {
      dailyData[date].expense += Number(t.amount)
    }
  })

  const profitMarginSeries = Object.entries(dailyData).map(([date, data]) => {
    const { selling, expense } = data
    const profit = selling - expense
    const margin = selling > 0 ? (profit / selling) * 100 : 0
    return { date, margin: parseFloat(margin.toFixed(2)) }
  })

  return profitMarginSeries
}
