import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const adjustments = await prisma.inventoryAdjustment.findMany({
      include: { items: true },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(adjustments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reason?: string | null
      items: Array<{ productId: number | string; quantity: number; note?: string | null }>
    }
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) return NextResponse.json({ error: 'No items provided' }, { status: 400 })

    const normItems = items.map((it) => ({
      product_id: Number(it.productId),
      quantity: Math.round(Number(it.quantity)),
      note: it.note || null,
    }))
    for (const it of normItems) {
      if (!Number.isFinite(it.product_id) || !Number.isFinite(it.quantity) || it.quantity === 0) {
        return NextResponse.json({ error: 'Invalid item values' }, { status: 400 })
      }
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const adj = await tx.inventoryAdjustment.create({
        data: {
          reason: body.reason || null,
        },
      })

      for (const it of normItems) {
        await tx.inventoryAdjustmentItem.create({
          data: {
            adjustment_id: adj.id,
            product_id: it.product_id,
            quantity: it.quantity,
            note: it.note,
          },
        })
        await tx.product.update({
          where: { id: it.product_id },
          data: { in_stock: { increment: it.quantity } },
        })
        try {
          await tx.stockMovement.create({
            data: {
              product_id: it.product_id,
              quantity: it.quantity,
              type: 'adjustment',
              adjustment_id: adj.id,
              unit_cost: null,
            },
          })
        } catch (e: any) {
          const msg = String(e?.message || '')
          const unknownModel = /stockmovement/i.test(msg) || /no such table/i.test(msg) || /Unknown arg/i.test(msg)
          if (!unknownModel) throw e
        }
      }

      const withItems = await tx.inventoryAdjustment.findUnique({
        where: { id: adj.id },
        include: { items: true },
      })
      return withItems
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create adjustment' }, { status: 500 })
  }
}
