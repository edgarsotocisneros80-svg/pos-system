import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = Number(params.productId)
    const body = await request.json()
    const priceNum = typeof body.price === 'number' ? body.price : Number(body.price)
    const stockNumRaw = typeof body.in_stock === 'number' ? body.in_stock : Number(body.in_stock)
    const stockInt = Number.isFinite(stockNumRaw) ? Math.round(stockNumRaw) : NaN
    if (!Number.isFinite(priceNum) || !Number.isFinite(stockInt)) {
      return NextResponse.json({ error: 'Invalid price or in_stock' }, { status: 400 })
    }
    // Resolve category from catalog if provided
    let categoryIdVal: number | null = null
    try {
      if (typeof body.categoryId === 'number') {
        categoryIdVal = body.categoryId
      } else if (typeof body.categoryId === 'string' && body.categoryId.trim() !== '') {
        const parsed = Number(body.categoryId)
        if (Number.isFinite(parsed)) categoryIdVal = parsed
      } else if (typeof body.categoryName === 'string' && body.categoryName.trim() !== '') {
        const name = body.categoryName.trim()
        const exists = await prisma.category.findUnique({ where: { name } })
        if (exists) categoryIdVal = exists.id
        else {
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          const createdCat = await prisma.category.create({ data: { name, slug } })
          categoryIdVal = createdCat.id
        }
      }
    } catch (catErr) {
      categoryIdVal = null
    }

    const data: any = {
      name: body.name,
      description: body.description ? body.description : null,
      price: Number.isFinite(priceNum) ? priceNum.toFixed(2) : '0.00',
      in_stock: stockInt,
      category: body.category ? body.category : (typeof body.categoryName === 'string' && body.categoryName.trim() ? body.categoryName.trim() : null),
      category_id: categoryIdVal,
    }
    const hasBarcodeProp = typeof body.barcode !== 'undefined'
    if (hasBarcodeProp) {
      const normalized = typeof body.barcode === 'string' ? body.barcode.trim() : body.barcode
      data.barcode = normalized ? normalized : null
    }

    let updated
    try {
      updated = await prisma.product.update({ where: { id: productId }, data })
    } catch (e: any) {
      const msg = String(e?.message || '')
      const missingCol = e?.code === 'P2022' || /no such column/i.test(msg) || /unknown column/i.test(msg)
      const unknownArgBarcode = e?.code === 'P2009' || /Unknown arg `barcode`/i.test(msg)
      const unknownArgCategoryId = e?.code === 'P2009' || /Unknown arg `category_id`/i.test(msg)
      let retried = false
      if ((missingCol || unknownArgBarcode) && 'barcode' in data) {
        delete data.barcode
        retried = true
      }
      if ((missingCol || unknownArgCategoryId) && 'category_id' in data) {
        delete data.category_id
        retried = true
      }
      if (retried) {
        updated = await prisma.product.update({ where: { id: productId }, data })
      } else {
        throw e
      }
    }
    return NextResponse.json({ ...updated, price: Number(updated.price) })
  } catch (error: any) {
    console.error('PUT /api/products/:id error', { code: error?.code, message: error?.message, meta: error?.meta })
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 })
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = Number(params.productId)
    await prisma.orderItem.deleteMany({ where: { product_id: productId } })
    await prisma.product.delete({ where: { id: productId } })
    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
