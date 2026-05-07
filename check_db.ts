import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const verifs = await prisma.verification.findMany({
    where: { identifier: "asif.sheik.555@gmail.com" }
  });
  console.log("Verifications:", verifs);
}
main().finally(() => prisma.$disconnect());
