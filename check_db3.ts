import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const email = "asif.sheik.555@gmail.com";
  const otp = "839507";
  const verification = await prisma.verification.findFirst({
    where: { 
      identifier: { endsWith: email },
      value: { startsWith: otp }
    }
  });
  console.log("Found:", verification);
}
main().finally(() => prisma.$disconnect());
