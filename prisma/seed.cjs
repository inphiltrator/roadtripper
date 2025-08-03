const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'user@roadtripper.dev';
  const name = 'Permanent Roadtripper';

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User "${name}" with email "${email}" already exists.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name,
        password: '' // Not needed
      },
    });
    console.log(`Created user "${name}" with email "${email}".`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

