import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: { customer: { select: { name: true } } },
      orderBy: { id: 'asc' },
    })
    const serialized = orders.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount),
    }))
    return NextResponse.json(serialized)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()

  try {
    // POS payload branch
    if (Array.isArray(body.products)) {
      const { customerId, paymentMethodId, products, total, cashReceived, change } = body
      try {
        const result = await prisma.$transaction(async (tx: any) => {
          // Validate stock
          const ids = products.map((p: any) => p.id)
          const dbProducts = await tx.product.findMany({ where: { id: { in: ids } } })
          const stockById: Record<number, number> = {}
          const nameById: Record<number, string> = {}
          for (const pr of dbProducts) {
            stockById[pr.id] = pr.in_stock
            nameById[pr.id] = pr.name
          }
          for (const p of products as Array<{ id: number; quantity: number }>) {
            const available = stockById[p.id] ?? 0
            if (available < p.quantity) {
              throw new Error(`INSUFFICIENT_STOCK:${nameById[p.id] || p.id}`)
            }
          }

          const order = await tx.order.create({
            data: {
              customer_id: customerId ?? null,
              total_amount: total,
              status: 'completed',
            },
          })

          if (products.length > 0) {
            await tx.orderItem.createMany({
              data: products.map((p: { id: number; quantity: number; price: number }) => ({
                order_id: order.id,
                product_id: p.id,
                quantity: p.quantity,
                price: p.price,
              })),
            })

            // Decrement stock and create stock movements
            for (const p of products as Array<{ id: number; quantity: number; price: number }>) {
              await tx.product.update({
                where: { id: p.id },
                data: { in_stock: { decrement: p.quantity } },
              })
              try {
                await tx.stockMovement.create({
                  data: {
                    product_id: p.id,
                    quantity: -p.quantity,
                    type: 'sale',
                    order_id: order.id,
                    unit_cost: null,
                  },
                })
              } catch (e: any) {
                // Fallback: if StockMovement not available, ignore
                const msg = String(e?.message || '')
                const unknownModel = /stockmovement/i.test(msg) || /no such table/i.test(msg) || /Unknown arg/i.test(msg)
                if (!unknownModel) throw e
              }
            }
          }

          await tx.transaction.create({
            data: {
              order_id: order.id,
              payment_method_id: paymentMethodId ?? null,
              amount: total,
              status: 'completed',
              category: 'selling',
              type: 'income',
              description: `Pago del pedido #${order.id}${cashReceived != null ? ` | Efectivo: $${Number(cashReceived).toFixed(2)}` : ''}${change != null ? ` | Cambio: $${Number(change).toFixed(2)}` : ''}`,
            },
          })

          const withCustomer = await tx.order.findUnique({
            where: { id: order.id },
            include: { customer: { select: { name: true } } },
          })
          return withCustomer
        })
        return NextResponse.json({ ...result, total_amount: Number(result?.total_amount) })
      } catch (err: any) {
        const msg = String(err?.message || '')
        if (msg.startsWith('INSUFFICIENT_STOCK:')) {
          const name = msg.split(':')[1] || 'producto'
          return NextResponse.json({ error: `Stock insuficiente para ${name}` }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
      }
    }

    // Simple payload branch for Orders page
    const simple = await prisma.order.create({
      data: {
        customer_id: body.customer_id ?? null,
        total_amount: body.total_amount ?? body.total ?? 0,
        status: body.status ?? 'pending',
      },
      include: { customer: { select: { name: true } } },
    })
    return NextResponse.json({ ...simple, total_amount: Number(simple.total_amount) })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
