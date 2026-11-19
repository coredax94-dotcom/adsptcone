import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) {
    console.log('ADMIN_EMAIL is not set; no admin account was changed.');
    return;
  }
  const account = await prisma.user.findUnique({ where: { email } });
  if (!account) {
    console.log(`No account found for ${email}. Register in the app first, then run this seed again.`);
    return;
  }
  await prisma.user.update({ where: { email }, data: { role: UserRole.ADMIN } });
  console.log(`Promoted ${email} to admin.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
