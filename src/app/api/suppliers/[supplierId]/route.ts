import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { supplierId: string } }
) {
  try {
    const supplierId = Number(params.supplierId)
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

    const updated = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        tax_id: body.tax_id || null,
        status: body.status || 'active',
      },
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { supplierId: string } }
) {
  try {
    const supplierId = Number(params.supplierId)
    await prisma.supplier.delete({ where: { id: supplierId } })
    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
