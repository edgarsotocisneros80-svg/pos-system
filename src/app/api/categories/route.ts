import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function slugify(input: string) {
  return input
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function generateUniqueSlug(base: string) {
  let slug = slugify(base)
  if (!slug) slug = 'categoria'
  let i = 1
  // Ensure slug uniqueness
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.category.findUnique({ where: { slug } })
    if (!exists) return slug
    i += 1
    slug = `${slugify(base)}-${i}`
  }
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(categories)
  } catch (error: any) {
    const msg = String(error?.message || '')
    if (/no such table/i.test(msg)) {
      return NextResponse.json({ error: 'Categories schema not applied. Run: npx prisma db push' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      description?: string
      code?: string | null
      parentId?: number | string | null
      isActive?: boolean
      sortOrder?: number | string
    }
    const name = (body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    let parent_id: number | null = null
    if (typeof body.parentId === 'number') parent_id = body.parentId
    else if (typeof body.parentId === 'string' && body.parentId.trim() !== '') {
      const parsed = Number(body.parentId)
      if (Number.isFinite(parsed)) parent_id = parsed
    }

    let sort_order = 0
    if (typeof body.sortOrder === 'number') sort_order = Math.round(body.sortOrder)
    else if (typeof body.sortOrder === 'string' && body.sortOrder.trim() !== '') {
      const parsed = Number(body.sortOrder)
      if (Number.isFinite(parsed)) sort_order = Math.round(parsed)
    }

    const slug = await generateUniqueSlug(name)
    const code = body.code ? body.code.trim() : null

    const created = await prisma.category.create({
      data: {
        name,
        slug,
        code,
        description: body.description ? body.description : null,
        parent_id,
        is_active: typeof body.isActive === 'boolean' ? body.isActive : true,
        sort_order,
      },
    })
    return NextResponse.json(created)
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }
    const msg = String(error?.message || '')
    if (/no such table/i.test(msg)) {
      return NextResponse.json({ error: 'Categories schema not applied. Run: npx prisma db push' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
