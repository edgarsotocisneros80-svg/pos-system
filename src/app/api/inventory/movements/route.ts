import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const productIdParam = url.searchParams.get('productId')
    const fromParam = url.searchParams.get('from')
    const toParam = url.searchParams.get('to')

    const where: any = {}
    if (productIdParam) {
      const pid = Number(productIdParam)
      if (Number.isFinite(pid)) where.product_id = pid
    }
    if (fromParam || toParam) {
      where.created_at = {}
      if (fromParam) where.created_at.gte = new Date(fromParam)
      if (toParam) where.created_at.lte = new Date(toParam)
    }

    const moves = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, barcode: true } },
        order: { select: { id: true } },
        purchase: { select: { id: true } },
        adjustment: { select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    const serialized = moves.map((m: any) => ({
      ...m,
      unit_cost: m.unit_cost != null ? Number(m.unit_cost) : null,
    }))

    return NextResponse.json(serialized)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 })
  }
}
