import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get products with low stock (threshold: 10)
    const lowStockProducts = await prisma.product.findMany({
      where: { in_stock: { lte: 10 } },
      select: { id: true, name: true, in_stock: true, category: true },
      orderBy: { in_stock: 'asc' },
    })

    // Get payables due in next 7 days
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)
    
    const dueSoonPayables = await prisma.payable.findMany({
      where: { 
        status: 'open',
        balance: { gt: 0 },
        due_date: { 
          lte: dueDate,
          gte: new Date() 
        }
      },
      include: { 
        supplier: { select: { name: true } }
      },
      orderBy: { due_date: 'asc' },
    })

    // Get overdue payables
    const overduePayables = await prisma.payable.findMany({
      where: { 
        status: 'open',
        balance: { gt: 0 },
        due_date: { 
          lt: new Date() 
        }
      },
      include: { 
        supplier: { select: { name: true } }
      },
      orderBy: { due_date: 'asc' },
    })

    // Format notifications
    const notifications: any[] = []

    // Low stock notifications
    lowStockProducts.forEach((product: any) => {
      notifications.push({
        id: `stock_${product.id}`,
        type: 'low_stock',
        priority: product.in_stock === 0 ? 'high' : product.in_stock <= 3 ? 'medium' : 'low',
        title: product.in_stock === 0 ? 'Producto sin stock' : 'Stock bajo',
        message: `${product.name}: ${product.in_stock} unidades disponibles`,
        data: product,
        created_at: new Date().toISOString(),
      })
    })

    // Overdue payables notifications
    overduePayables.forEach((payable: any) => {
      notifications.push({
        id: `overdue_${payable.id}`,
        type: 'payable_overdue',
        priority: 'high',
        title: 'Cuenta por pagar vencida',
        message: `${payable.supplier.name}: ${Number(payable.balance).toFixed(2)} vencido desde ${new Date(payable.due_date!).toLocaleDateString('es-MX')}`,
        data: {
          ...payable,
          balance: Number(payable.balance),
          amount: Number(payable.amount),
        },
        created_at: new Date().toISOString(),
      })
    })

    // Due soon payables notifications
    dueSoonPayables.forEach((payable: any) => {
      const daysUntilDue = Math.ceil((new Date(payable.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      notifications.push({
        id: `due_${payable.id}`,
        type: 'payable_due_soon',
        priority: daysUntilDue <= 2 ? 'high' : 'medium',
        title: 'Cuenta por pagar próxima a vencer',
        message: `${payable.supplier.name}: ${Number(payable.balance).toFixed(2)} vence en ${daysUntilDue} días`,
        data: {
          ...payable,
          balance: Number(payable.balance),
          amount: Number(payable.amount),
          days_until_due: daysUntilDue,
        },
        created_at: new Date().toISOString(),
      })
    })

    // Sort by priority and date
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({
      notifications,
      summary: {
        low_stock_count: lowStockProducts.length,
        overdue_payables_count: overduePayables.length,
        due_soon_payables_count: dueSoonPayables.length,
        total_count: notifications.length,
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
