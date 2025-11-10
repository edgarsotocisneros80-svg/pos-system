import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(suppliers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      name?: string
      email?: string | null
      phone?: string | null
      address?: string | null
      tax_id?: string | null
      status?: string | null
    }
    const name = (body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const created = await prisma.supplier.create({
      data: {
        name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        tax_id: body.tax_id || null,
        status: body.status || 'active',
      },
    })
    return NextResponse.json(created)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
