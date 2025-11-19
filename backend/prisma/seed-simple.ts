/**
 * SEED SIMPLE - Solo usuario admin
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando usuario admin...\n');

  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { telefono: '8095551234' },
    update: {},
    create: {
      email: 'admin@gestorainternacional.com',
      password: adminPassword,
      nombreCompleto: 'Administrador Sistema',
      telefono: '8095551234',
      tipoUsuario: 'admin',
      estado: 'activo',
      puedeVotar: false,
    },
  });

  console.log('✅ Usuario admin creado exitosamente!');
  console.log('');
  console.log('📧 Email: admin@gestorainternacional.com');
  console.log('🔑 Password: admin123');
  console.log('📱 Teléfono: 8095551234');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
