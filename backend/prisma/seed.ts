/**
 * SEED DE DATOS INICIALES - Gestora Internacional SRL
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // 1. CONDOMINIOS
  console.log('🏢 Creando condominios...');
  const condo1 = await prisma.condominio.upsert({
    where: { id: 'condo-1' },
    update: {},
    create: {
      id: 'condo-1',
      nombre: 'Condominio Las Palmas',
      direccion: 'Calle Principal #45, Los Jardines',
      ciudad: 'Santo Domingo',
      provincia: 'Distrito Nacional',
      codigoPostal: '10001',
      telefono: '+1809555020',
      estado: 'activo',
      totalUnidades: 120,
    },
  });
  console.log(`✅ ${condo1.nombre}`);

  // 2. SUPER ADMIN
  console.log('\n👤 Creando super admin...');
  const hashedPass = await bcrypt.hash('Admin123!', 10);
  const superAdmin = await prisma.usuario.upsert({
    where: { telefono: '+18095550001' },
    update: {},
    create: {
      nombreCompleto: 'Administrador Sistema',
      telefono: '+18095550001',
      email: 'admin@gestorainternacional.com',
      password: hashedPass,
      tipoUsuario: 'super_admin',
      estado: 'activo',
      puedeVotar: false,
    },
  });
  console.log(`✅ ${superAdmin.nombreCompleto}`);

  // 3. TÉCNICO
  console.log('\n🔧 Creando técnico...');
  const tecPassword = await bcrypt.hash('Tecnico123!', 10);
  const tecnico = await prisma.usuario.upsert({
    where: { telefono: '+18095550201' },
    update: {},
    create: {
      nombreCompleto: 'Juan Pérez',
      telefono: '+18095550201',
      email: 'juan.perez@gestorainternacional.com',
      password: tecPassword,
      tipoUsuario: 'tecnico',
      estado: 'activo',
      condominioId: condo1.id,
      puedeVotar: false,
    },
  });
  console.log(`✅ ${tecnico.nombreCompleto}`);

  // 4. PROPIETARIO
  console.log('\n🏠 Creando propietario...');
  const propietario = await prisma.usuario.upsert({
    where: { telefono: '+18095551001' },
    update: {},
    create: {
      nombreCompleto: 'Ana Jiménez',
      telefono: '+18095551001',
      email: 'ana.jimenez@email.com',
      tipoUsuario: 'propietario',
      estado: 'activo',
      condominioId: condo1.id,
      unidad: 'Apt 402',
      puedeVotar: true,
    },
  });
  console.log(`✅ ${propietario.nombreCompleto} - ${propietario.unidad}`);

  // 5. CASO DE PRUEBA
  console.log('\n📝 Creando caso...');
  const caso = await prisma.caso.create({
    data: {
      numeroCaso: 'GES-2024-0001',
      usuarioId: propietario.id,
      condominioId: condo1.id,
      unidad: 'Apt 402',
      tipo: 'garantia',
      categoria: 'filtraciones_humedad',
      subcategoria: 'Filtración en techo',
      descripcion: 'Filtración de agua en el techo del baño principal.',
      estado: 'nuevo',
      prioridad: 'alta',
    },
  });
  console.log(`✅ Caso ${caso.numeroCaso}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ SEED COMPLETADO');
  console.log('='.repeat(60));
  console.log('\n📋 CREDENCIALES:\n');
  console.log('🔐 SUPER ADMIN:');
  console.log('   Teléfono: +18095550001');
  console.log('   Password: Admin123!\n');
  console.log('🔧 TÉCNICO:');
  console.log('   Teléfono: +18095550201');
  console.log('   Password: Tecnico123!\n');
  console.log('🏠 PROPIETARIO:');
  console.log('   Teléfono: +18095551001 (sin password)\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
