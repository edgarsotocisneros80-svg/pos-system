import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const payables = await prisma.payable.findMany({
      include: { 
        supplier: { select: { name: true } },
        purchase: { select: { id: true } },
        payments: true
      },
      orderBy: { created_at: 'desc' },
    })
    const serialized = payables.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      balance: Number(p.balance),
      payments: p.payments.map((pay: any) => ({
        ...pay,
        amount: Number(pay.amount),
      })),
    }))
    return NextResponse.json(serialized)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payables' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      payableId: number | string
      amount: number | string
      paymentMethodId?: number | string | null
    }
    const payableId = Number(body.payableId)
    const amount = Number(body.amount)
    const paymentMethodId = body.paymentMethodId ? Number(body.paymentMethodId) : null

    if (!Number.isFinite(payableId) || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payableId or amount' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const payable = await tx.payable.findUnique({ where: { id: payableId } })
      if (!payable) throw new Error('Payable not found')
      
      const currentBalance = Number(payable.balance)
      if (amount > currentBalance) {
        throw new Error('Payment amount exceeds balance')
      }

      const payment = await tx.payablePayment.create({
        data: {
          payable_id: payableId,
          amount: amount.toFixed(2),
        },
      })

      const newBalance = currentBalance - amount
      const newStatus = newBalance <= 0.01 ? 'paid' : 'open'

      const updatedPayable = await tx.payable.update({
        where: { id: payableId },
        data: {
          balance: newBalance.toFixed(2),
          status: newStatus,
        },
        include: {
          supplier: { select: { name: true } },
          purchase: { select: { id: true } },
          payments: true,
        },
      })

      // Create expense transaction for payment
      if (paymentMethodId) {
        await tx.transaction.create({
          data: {
            payment_method_id: paymentMethodId,
            amount: amount.toFixed(2),
            status: 'completed',
            category: 'payable_payment',
            type: 'expense',
            description: `Pago CxP #${payableId} - ${updatedPayable.supplier.name}`,
          },
        })
      }

      return { payment, payable: updatedPayable }
    })

    const serialized = {
      ...result,
      payment: { ...result.payment, amount: Number(result.payment.amount) },
      payable: {
        ...result.payable,
        amount: Number(result.payable.amount),
        balance: Number(result.payable.balance),
        payments: result.payable.payments.map((p: any) => ({
          ...p,
          amount: Number(p.amount),
        })),
      },
    }

    return NextResponse.json(serialized)
  } catch (error: any) {
    const msg = String(error?.message || '')
    if (msg === 'Payable not found') {
      return NextResponse.json({ error: 'Payable not found' }, { status: 404 })
    }
    if (msg === 'Payment amount exceeds balance') {
      return NextResponse.json({ error: 'Payment amount exceeds balance' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
