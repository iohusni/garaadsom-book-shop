const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrator',
      email: 'admin@garaadsom.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('Admin user created:', adminUser.username);

  // Create a sample book
  const sampleBook = await prisma.book.create({
    data: {
      title: 'Week 1 of July - July - 2025',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-07-07'),
      durationDays: 7,
      status: 'ACTIVE',
      createdBy: adminUser.id,
    },
  });

  console.log('Sample book created:', sampleBook.title);

  // Create action log for book creation
  await prisma.actionLog.create({
    data: {
      actorId: adminUser.id,
      actionType: 'BOOK_CREATED',
      targetType: 'BOOK',
      targetId: sampleBook.id,
      details: `Created sample book: ${sampleBook.title}`,
    },
  });

  console.log('Database setup completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Username: admin');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('Error setting up database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 