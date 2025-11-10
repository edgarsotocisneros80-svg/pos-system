import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: { select: { name: true } } },
      orderBy: { id: 'asc' },
    })
    const serialized = purchases.map((p: any) => ({
      ...p,
      total_amount: Number(p.total_amount),
    }))
    return NextResponse.json(serialized)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as any
    const supplierId = Number(body.supplierId)
    const items = Array.isArray(body.items) ? body.items : []
    const paymentMethodId = body.paymentMethodId ? Number(body.paymentMethodId) : null
    const paymentTerm = (body.paymentTerm || 'cash') as 'cash' | 'credit'
    const dueDate = body.dueDate ? new Date(body.dueDate) : null

    if (!Number.isFinite(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplierId' }, { status: 400 })
    }
    if (items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const normItems: Array<{ product_id: number; quantity: number; price: number }> = items.map((it: any) => ({
      product_id: Number(it.productId ?? it.id),
      quantity: Math.round(Number(it.quantity)),
      price: Number(it.price),
    }))
    for (const it of normItems) {
      if (!Number.isFinite(it.product_id) || !Number.isFinite(it.quantity) || it.quantity <= 0 || !Number.isFinite(it.price)) {
        return NextResponse.json({ error: 'Invalid item values' }, { status: 400 })
      }
    }
    const total = normItems.reduce((s: number, it: { quantity: number; price: number }) => s + it.quantity * it.price, 0)

    const result = await prisma.$transaction(async (tx: any) => {
      const purchase = await tx.purchase.create({
        data: {
          supplier_id: supplierId,
          total_amount: total.toFixed(2),
          status: 'completed',
          payment_term: paymentTerm,
          due_date: dueDate,
        },
      })

      await tx.purchaseItem.createMany({
        data: normItems.map((it: { product_id: number; quantity: number; price: number }) => ({
          purchase_id: purchase.id,
          product_id: it.product_id,
          quantity: it.quantity,
          price: it.price,
        })),
      })

      // Update stock and create stock movements
      for (const it of normItems) {
        await tx.product.update({ where: { id: it.product_id }, data: { in_stock: { increment: it.quantity } } })
        try {
          await tx.stockMovement.create({
            data: {
              product_id: it.product_id,
              quantity: it.quantity,
              type: 'purchase',
              purchase_id: purchase.id,
              unit_cost: it.price,
            },
          })
        } catch (e: any) {
          const msg = String(e?.message || '')
          const unknownModel = /stockmovement/i.test(msg) || /no such table/i.test(msg) || /Unknown arg/i.test(msg)
          if (!unknownModel) throw e
        }
      }

      // Payment handling
      if (paymentTerm === 'cash') {
        await tx.transaction.create({
          data: {
            purchase_id: purchase.id,
            payment_method_id: paymentMethodId,
            amount: total.toFixed(2),
            status: 'completed',
            category: 'purchase',
            type: 'expense',
            description: `Compra #${purchase.id}`,
          },
        })
      } else {
        // Create payable
        await tx.payable.create({
          data: {
            supplier_id: supplierId,
            purchase_id: purchase.id,
            amount: total.toFixed(2),
            balance: total.toFixed(2),
            status: 'open',
            due_date: dueDate,
          },
        })
      }

      const withSupplier = await tx.purchase.findUnique({
        where: { id: purchase.id },
        include: { supplier: { select: { name: true } }, items: true },
      })
      return withSupplier
    })

    return NextResponse.json({ ...result, total_amount: Number((result as any)?.total_amount) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}
