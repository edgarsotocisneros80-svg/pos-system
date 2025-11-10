import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const data = await prisma.transaction.findMany({ orderBy: { id: 'asc' } })
    const serialized = data.map((t: any) => ({ ...t, amount: Number(t.amount) }))
    return NextResponse.json(serialized)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await prisma.transaction.create({
      data: {
        description: body.description ?? null,
        category: body.category ?? null,
        type: body.type,
        amount: body.amount,
        status: body.status ?? 'completed',
      },
    })
    return NextResponse.json({ ...created, amount: Number(created.amount) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
