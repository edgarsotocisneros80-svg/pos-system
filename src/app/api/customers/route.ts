import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, email: true, phone: true, status: true },
      orderBy: { id: 'asc' },
    })
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const created = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        status: body.status ?? 'active',
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
