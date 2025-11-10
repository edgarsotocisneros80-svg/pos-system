import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    const id = Number(params.transactionId)
    const body = await request.json()
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        description: body.description ?? null,
        category: body.category ?? null,
        type: body.type,
        amount: body.amount,
        status: body.status ?? 'completed',
      },
    })
    return NextResponse.json({ ...updated, amount: Number(updated.amount) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    const id = Number(params.transactionId)
    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ message: 'Transaction deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
