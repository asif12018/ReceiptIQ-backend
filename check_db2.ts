import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const verifs = await prisma.verification.findMany();
  console.log("All Verifications:", verifs);
}
main().finally(() => prisma.$disconnect());
