import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let data = await prisma.paymentMethod.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    // If empty, seed default methods and refetch
    if (!data || data.length === 0) {
      const defaults = ["Efectivo", "Crédito"];
      await prisma.$transaction(
        defaults.map((name) =>
          prisma.paymentMethod.upsert({
            where: { name },
            update: {},
            create: { name },
          })
        )
      );
      data = await prisma.paymentMethod.findMany({
        select: { id: true, name: true },
        orderBy: { id: 'asc' },
      });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
  }
}
