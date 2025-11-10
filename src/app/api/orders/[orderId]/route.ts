import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const id = Number(params.orderId)
    const body = await request.json()
    const updated = await prisma.order.update({
      where: { id },
      data: {
        total_amount: body.total_amount ?? undefined,
        status: body.status ?? undefined,
      },
      include: { customer: { select: { name: true } } },
    })
    return NextResponse.json({ ...updated, total_amount: Number(updated.total_amount) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const id = Number(params.orderId)
    await prisma.orderItem.deleteMany({ where: { order_id: id } })
    await prisma.order.delete({ where: { id } })
    return NextResponse.json({ message: 'Order and related items deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
