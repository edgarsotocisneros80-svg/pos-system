import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const methods = ["Credit Card", "Debit Card", "Cash"];
  for (const name of methods) {
    await prisma.paymentMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Seed completed: payment_methods");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
