import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { email: 'asif.sheik.555@gmail.com' } });
  console.log("Users:", users);
}
main().finally(() => prisma.$disconnect());
