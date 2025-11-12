/**
 * ========================================
 * SEED DE DATOS DE PRUEBA
 * Gestora Internacional SRL
 * ========================================
 *
 * Carga datos de prueba para demostración
 * IMPORTANTE: Solo para desarrollo y demos
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  // ===================================
  // 1. USUARIO ADMIN
  // ===================================
  console.log('👤 Creando usuario admin...');

  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@gestorainternacional.com' },
    update: {},
    create: {
      email: 'admin@gestorainternacional.com',
      password: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '8095551234',
      rol: 'admin',
      activo: true,
    },
  });

  console.log('✅ Admin creado: admin@gestorainternacional.com / admin123\n');

  // ===================================
  // 2. ORGANIZACIÓN DE PRUEBA
  // ===================================
  console.log('🏢 Creando organización de prueba...');

  const organizacion = await prisma.organizacion.upsert({
    where: { id: 'org-demo-001' },
    update: {},
    create: {
      id: 'org-demo-001',
      nombre: 'Gestora Demo',
      direccion: 'Ave. Winston Churchill #123, Santo Domingo',
      telefono: '8095551234',
      email: 'demo@gestorainternacional.com',
      rnc: '131234567',
      activo: true,
    },
  });

  console.log(`✅ Organización creada: ${organizacion.nombre}\n`);

  // ===================================
  // 3. CONDOMINIO DE PRUEBA
  // ===================================
  console.log('🏘️  Creando condominio de prueba...');

  const condominio = await prisma.condominio.create({
    data: {
      nombre: 'Residencial Las Palmas',
      direccion: 'Ave. Sarasota #456, Bella Vista',
      ciudad: 'Santo Domingo',
      provincia: 'Distrito Nacional',
      telefono: '8095559876',
      email: 'laspalmas@gestorainternacional.com',
      totalUnidades: 20,
      organizacionId: organizacion.id,
      configuracion: {
        cuotaMantenimiento: 8500,
        diaVencimientoCuota: 5,
        morasPorcentaje: 2,
        monedaDefecto: 'DOP',
      },
    },
  });

  console.log(`✅ Condominio creado: ${condominio.nombre}\n`);

  // ===================================
  // 4. UNIDADES (20 apartamentos)
  // ===================================
  console.log('🏠 Creando 20 unidades...');

  const unidades = [];
  const alicuotas = [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05,
                     0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05];

  for (let i = 1; i <= 20; i++) {
    const piso = Math.ceil(i / 4);
    const numero = ((i - 1) % 4) + 1;
    const numeroCompleto = `${piso}0${numero}`;

    const unidad = await prisma.unidad.create({
      data: {
        numero: numeroCompleto,
        piso: piso.toString(),
        alicuota: alicuotas[i - 1],
        metrosCuadrados: 85 + (i * 2),
        habitaciones: i % 2 === 0 ? 3 : 2,
        banos: 2,
        estacionamientos: i % 3 === 0 ? 2 : 1,
        condominioId: condominio.id,
      },
    });

    unidades.push(unidad);
  }

  console.log(`✅ ${unidades.length} unidades creadas\n`);

  // ===================================
  // 5. PROPIETARIOS
  // ===================================
  console.log('👥 Creando propietarios...');

  const propietarios = [
    { nombre: 'Juan', apellido: 'Pérez', email: 'juan.perez@email.com', telefono: '8091234567', cedula: '00112345678' },
    { nombre: 'María', apellido: 'González', email: 'maria.gonzalez@email.com', telefono: '8092345678', cedula: '00123456789' },
    { nombre: 'Pedro', apellido: 'Martínez', email: 'pedro.martinez@email.com', telefono: '8093456789', cedula: '00134567890' },
    { nombre: 'Ana', apellido: 'Rodríguez', email: 'ana.rodriguez@email.com', telefono: '8094567890', cedula: '00145678901' },
    { nombre: 'Luis', apellido: 'Fernández', email: 'luis.fernandez@email.com', telefono: '8095678901', cedula: '00156789012' },
  ];

  const propietariosCreados = [];

  for (let i = 0; i < propietarios.length; i++) {
    const prop = propietarios[i];
    const password = await bcrypt.hash('propietario123', 10);

    const propietario = await prisma.usuario.create({
      data: {
        ...prop,
        password,
        rol: 'propietario',
        activo: true,
        organizacionId: organizacion.id,
      },
    });

    // Asignar a unidades (cada propietario tiene 4 unidades)
    for (let j = 0; j < 4; j++) {
      const unidadIndex = (i * 4) + j;
      if (unidadIndex < unidades.length) {
        await prisma.unidad.update({
          where: { id: unidades[unidadIndex].id },
          data: { propietarioId: propietario.id },
        });
      }
    }

    propietariosCreados.push(propietario);
  }

  console.log(`✅ ${propietariosCreados.length} propietarios creados\n`);

  // ===================================
  // 6. PROVEEDORES
  // ===================================
  console.log('🏪 Creando proveedores...');

  const proveedoresData = [
    {
      nombre: 'Pinturas Express SRL',
      nombreComercial: 'Pinturas Express',
      rnc: '131234567',
      tipo: 'pintura',
      telefono: '8095551111',
      email: 'info@pinturasexpress.com',
      direccion: 'Ave. Churchill #100',
      personaContacto: 'Carlos Pintor',
      telefonoContacto: '8095551112',
      banco: 'Banco Popular',
      numeroCuenta: '123456789',
      tipoCuenta: 'corriente',
    },
    {
      nombre: 'Plomería Rápida SRL',
      nombreComercial: 'Plomería Rápida',
      rnc: '132345678',
      tipo: 'plomeria',
      telefono: '8095552222',
      email: 'contacto@plomeriara.com',
      direccion: 'Calle 27 de Febrero #200',
      personaContacto: 'José Fontanero',
      telefonoContacto: '8095552223',
      banco: 'Banreservas',
      numeroCuenta: '234567890',
      tipoCuenta: 'ahorro',
    },
    {
      nombre: 'Electricidad Total SRL',
      nombreComercial: 'Electricidad Total',
      rnc: '133456789',
      tipo: 'electricidad',
      telefono: '8095553333',
      email: 'servicio@electotal.com',
      direccion: 'Ave. Independencia #300',
      personaContacto: 'Miguel Eléctrico',
      telefonoContacto: '8095553334',
      banco: 'Banco BHD',
      numeroCuenta: '345678901',
      tipoCuenta: 'corriente',
    },
    {
      nombre: 'Limpieza Profesional SRL',
      nombreComercial: 'LimpiaPro',
      rnc: '134567890',
      tipo: 'limpieza',
      telefono: '8095554444',
      email: 'info@limpiapro.com',
      direccion: 'Ave. Lope de Vega #400',
      personaContacto: 'Laura Limpieza',
      telefonoContacto: '8095554445',
      banco: 'Banco Popular',
      numeroCuenta: '456789012',
      tipoCuenta: 'ahorro',
    },
  ];

  const proveedoresCreados = [];

  for (const prov of proveedoresData) {
    const proveedor = await prisma.proveedor.create({
      data: {
        ...prov,
        organizacionId: organizacion.id,
      },
    });
    proveedoresCreados.push(proveedor);
  }

  console.log(`✅ ${proveedoresCreados.length} proveedores creados\n`);

  // ===================================
  // 7. PLAN DE CUENTAS
  // ===================================
  console.log('📊 Creando plan de cuentas...');

  const cuentas = [
    // ACTIVOS
    { codigo: '1', nombre: 'ACTIVOS', tipo: 'activo', padre: null },
    { codigo: '1.1', nombre: 'Activo Corriente', tipo: 'activo', padre: '1' },
    { codigo: '1.1.01', nombre: 'Caja General', tipo: 'activo', padre: '1.1' },
    { codigo: '1.1.02', nombre: 'Banco - Operaciones', tipo: 'activo', padre: '1.1' },

    // PASIVOS
    { codigo: '2', nombre: 'PASIVOS', tipo: 'pasivo', padre: null },
    { codigo: '2.1', nombre: 'Pasivo Corriente', tipo: 'pasivo', padre: '2' },
    { codigo: '2.1.01', nombre: 'Cuentas por Pagar', tipo: 'pasivo', padre: '2.1' },

    // INGRESOS
    { codigo: '4', nombre: 'INGRESOS', tipo: 'ingreso', padre: null },
    { codigo: '4.1', nombre: 'Ingresos Operacionales', tipo: 'ingreso', padre: '4' },
    { codigo: '4.1.01', nombre: 'Cuotas de Mantenimiento', tipo: 'ingreso', padre: '4.1' },
    { codigo: '4.1.02', nombre: 'Reservas de Áreas Comunes', tipo: 'ingreso', padre: '4.1' },

    // GASTOS
    { codigo: '5', nombre: 'GASTOS', tipo: 'gasto', padre: null },
    { codigo: '5.1', nombre: 'Gastos de Mantenimiento', tipo: 'gasto', padre: '5' },
    { codigo: '5.1.01', nombre: 'Pintura y Acabados', tipo: 'gasto', padre: '5.1' },
    { codigo: '5.1.02', nombre: 'Plomería', tipo: 'gasto', padre: '5.1' },
    { codigo: '5.1.03', nombre: 'Electricidad', tipo: 'gasto', padre: '5.1' },
    { codigo: '5.2', nombre: 'Gastos de Limpieza', tipo: 'gasto', padre: '5' },
    { codigo: '5.2.01', nombre: 'Servicios de Limpieza', tipo: 'gasto', padre: '5.2' },
    { codigo: '5.3', nombre: 'Gastos Administrativos', tipo: 'gasto', padre: '5' },
    { codigo: '5.3.01', nombre: 'Papelería y Útiles', tipo: 'gasto', padre: '5.3' },
  ];

  const cuentasCreadas = [];

  for (const cuenta of cuentas) {
    const cuentaCreada = await prisma.cuentaContable.create({
      data: {
        ...cuenta,
        organizacionId: organizacion.id,
      },
    });
    cuentasCreadas.push(cuentaCreada);
  }

  console.log(`✅ ${cuentasCreadas.length} cuentas contables creadas\n`);

  // ===================================
  // 8. SECUENCIA NCF
  // ===================================
  console.log('📄 Creando secuencias de NCF...');

  const fechaVencimiento = new Date();
  fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 6);

  const secuenciasNCF = [
    { tipo: 'B01', serie: 'B01', secuenciaInicio: 1, secuenciaFin: 1000 },
    { tipo: 'B02', serie: 'B02', secuenciaInicio: 1, secuenciaFin: 1000 },
    { tipo: 'B14', serie: 'B14', secuenciaInicio: 1, secuenciaFin: 500 },
    { tipo: 'B15', serie: 'B15', secuenciaInicio: 1, secuenciaFin: 500 },
  ];

  for (const sec of secuenciasNCF) {
    await prisma.secuenciaNCF.create({
      data: {
        ...sec,
        secuenciaActual: sec.secuenciaInicio,
        fechaVencimiento,
        organizacionId: organizacion.id,
        activo: true,
      },
    });
  }

  console.log('✅ 4 secuencias de NCF creadas\n');

  // ===================================
  // 9. GASTOS DE EJEMPLO
  // ===================================
  console.log('💰 Creando gastos de ejemplo...');

  const cuentaPintura = cuentasCreadas.find(c => c.codigo === '5.1.01');
  const cuentaLimpieza = cuentasCreadas.find(c => c.codigo === '5.2.01');

  const gastosData = [
    {
      concepto: 'Pintura de áreas comunes - Lobby',
      descripcion: 'Pintura completa del lobby principal y escaleras',
      subtotal: 45000,
      proveedorId: proveedoresCreados[0].id,
      cuentaContableId: cuentaPintura?.id,
      tipoNCF: 'B01',
    },
    {
      concepto: 'Servicio de limpieza - Diciembre 2024',
      descripcion: 'Limpieza quincenal de áreas comunes',
      subtotal: 25000,
      proveedorId: proveedoresCreados[3].id,
      cuentaContableId: cuentaLimpieza?.id,
      tipoNCF: 'B01',
    },
  ];

  const gastosCreados = [];

  for (const gasto of gastosData) {
    const itbis = gasto.subtotal * 0.18;
    const total = gasto.subtotal + itbis;

    // Obtener NCF
    const secuencia = await prisma.secuenciaNCF.findFirst({
      where: {
        tipo: gasto.tipoNCF,
        organizacionId: organizacion.id,
        activo: true,
      },
    });

    if (secuencia) {
      const ncf = `${secuencia.serie}${String(secuencia.secuenciaActual).padStart(8, '0')}`;

      const gastoCreado = await prisma.gasto.create({
        data: {
          ...gasto,
          itbis,
          total,
          ncf,
          fechaEmision: new Date(),
          fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          formaPago: 'transferencia',
          distribuirUnidades: true,
          condominioId: condominio.id,
          organizacionId: organizacion.id,
        },
      });

      // Actualizar secuencia
      await prisma.secuenciaNCF.update({
        where: { id: secuencia.id },
        data: { secuenciaActual: secuencia.secuenciaActual + 1 },
      });

      gastosCreados.push(gastoCreado);
    }
  }

  console.log(`✅ ${gastosCreados.length} gastos creados con NCF\n`);

  // ===================================
  // RESUMEN
  // ===================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 RESUMEN DE DATOS CREADOS:');
  console.log(`   • 1 Organización: ${organizacion.nombre}`);
  console.log(`   • 1 Condominio: ${condominio.nombre}`);
  console.log(`   • 20 Unidades`);
  console.log(`   • 5 Propietarios`);
  console.log(`   • 4 Proveedores`);
  console.log(`   • ${cuentasCreadas.length} Cuentas contables`);
  console.log(`   • 4 Secuencias de NCF`);
  console.log(`   • ${gastosCreados.length} Gastos de ejemplo\n`);

  console.log('👤 CREDENCIALES DE ACCESO:');
  console.log('   Email:    admin@gestorainternacional.com');
  console.log('   Password: admin123\n');

  console.log('🌐 URL DEL API:');
  console.log('   https://gestora-internacional-production.up.railway.app\n');

  console.log('⚠️  IMPORTANTE:');
  console.log('   Estos son datos de PRUEBA para demostración.');
  console.log('   Usa el endpoint DELETE /api/v1/admin/limpiar-datos-prueba');
  console.log('   para eliminar todos los datos cuando vayas a producción.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
