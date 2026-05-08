const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    const result = await prisma.user.updateMany({
      where: { role: 'customer' },
      data: { role: 'user' }
    });
    
    console.log(`✅ Updated ${result.count} user(s) from role 'customer' to 'user'`);
  } catch (error) {
    console.error('❌ Error updating user roles:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();
