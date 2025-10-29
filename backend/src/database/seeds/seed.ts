/**
 * ========================================
 * SCRIPT DE DATOS DE PRUEBA
 * ========================================
 * Llena la base de datos con datos realistas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos de prueba...\n');

  // ========================================
  // 1. CONDOMINIOS
  // ========================================
  console.log('📁 Creando condominios...');

  const condominio1 = await prisma.condominio.create({
    data: {
      nombre: 'Residencial Las Palmas',
      direccion: 'Av. Independencia #456, Gazcue',
      ciudad: 'Santo Domingo',
      provincia: 'Distrito Nacional',
      telefono: '8092345678',
      email: 'admin@laspalmas.com.do',
      estado: 'activo',
      totalUnidades: 120,
      slaGarantia: 24,
      slaCondominio: 72,
      fechaEntrega: new Date('2023-06-15'),
    },
  });

  const condominio2 = await prisma.condominio.create({
    data: {
      nombre: 'Torres del Caribe',
      direccion: 'Av. Winston Churchill #789, Piantini',
      ciudad: 'Santo Domingo',
      provincia: 'Distrito Nacional',
      telefono: '8093456789',
      email: 'info@torresdelcaribe.com',
      estado: 'activo',
      totalUnidades: 200,
      slaGarantia: 24,
      slaCondominio: 48,
      fechaEntrega: new Date('2024-01-10'),
    },
  });

  const condominio3 = await prisma.condominio.create({
    data: {
      nombre: 'Villa Marina',
      direccion: 'Malecón de Boca Chica, Km 3',
      ciudad: 'Boca Chica',
      provincia: 'Santo Domingo',
      telefono: '8094567890',
      email: 'contacto@villamarina.do',
      estado: 'activo',
      totalUnidades: 80,
      slaGarantia: 48,
      slaCondominio: 96,
      fechaEntrega: new Date('2022-11-20'),
    },
  });

  console.log('✅ 3 condominios creados\n');

  // ========================================
  // 2. USUARIOS
  // ========================================
  console.log('👥 Creando usuarios...');

  // Propietarios
  const propietario1 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Juan Carlos Pérez',
      telefono: '8095551234',
      email: 'juan.perez@gmail.com',
      tipoUsuario: 'propietario',
      estado: 'activo',
      condominioId: condominio1.id,
      unidad: 'Apt 402, Torre A',
      puedeVotar: true,
    },
  });

  const propietario2 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'María Fernanda González',
      telefono: '8095552345',
      email: 'maria.gonzalez@hotmail.com',
      tipoUsuario: 'propietario',
      estado: 'activo',
      condominioId: condominio1.id,
      unidad: 'Apt 305, Torre B',
      puedeVotar: true,
    },
  });

  const propietario3 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Roberto Martínez',
      telefono: '8095553456',
      email: 'rmartinez@yahoo.com',
      tipoUsuario: 'propietario',
      estado: 'activo',
      condominioId: condominio2.id,
      unidad: 'Apt 1502, Torre Norte',
      puedeVotar: true,
    },
  });

  const propietario4 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Ana Lucía Rodríguez',
      telefono: '8095554567',
      email: 'ana.rodriguez@gmail.com',
      tipoUsuario: 'propietario',
      estado: 'activo',
      condominioId: condominio2.id,
      unidad: 'Apt 801, Torre Sur',
      puedeVotar: true,
    },
  });

  const propietario5 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Pedro Luis Santana',
      telefono: '8095555678',
      email: 'pedro.santana@outlook.com',
      tipoUsuario: 'propietario',
      estado: 'activo',
      condominioId: condominio3.id,
      unidad: 'Villa 25',
      puedeVotar: true,
    },
  });

  // Técnicos
  const tecnico1 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Ing. Carlos Méndez',
      telefono: '8096661234',
      email: 'carlos.mendez@amico.com',
      tipoUsuario: 'tecnico',
      estado: 'activo',
      password: 'hashed_password_here', // En producción se hashea con bcrypt
    },
  });

  const tecnico2 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Ing. Rafael Jiménez',
      telefono: '8096662345',
      email: 'rafael.jimenez@amico.com',
      tipoUsuario: 'tecnico',
      estado: 'activo',
      password: 'hashed_password_here',
    },
  });

  const tecnico3 = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Téc. Luis Fernández',
      telefono: '8096663456',
      email: 'luis.fernandez@amico.com',
      tipoUsuario: 'tecnico',
      estado: 'activo',
      password: 'hashed_password_here',
    },
  });

  // Administradores
  const admin = await prisma.usuario.create({
    data: {
      nombreCompleto: 'Admin Sistema',
      telefono: '8097771234',
      email: 'admin@amico.com',
      tipoUsuario: 'admin',
      estado: 'activo',
      password: 'hashed_password_here',
    },
  });

  console.log('✅ 9 usuarios creados (5 propietarios, 3 técnicos, 1 admin)\n');

  // ========================================
  // 3. CASOS
  // ========================================
  console.log('📋 Creando casos...');

  // Caso 1: URGENTE - Filtración grave
  const caso1 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0001',
      usuarioId: propietario1.id,
      condominioId: condominio1.id,
      unidad: propietario1.unidad!,
      tipo: 'garantia',
      categoria: 'filtraciones_humedad',
      descripcion: 'Filtración severa en el techo del baño principal. El agua está goteando y manchando las paredes. Necesita atención urgente.',
      estado: 'asignado',
      prioridad: 'urgente',
      tecnicoAsignadoId: tecnico1.id,
      fechaAsignacion: new Date(),
    },
  });

  // Caso 2: En proceso - Problema eléctrico
  const caso2 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0002',
      usuarioId: propietario2.id,
      condominioId: condominio1.id,
      unidad: propietario2.unidad!,
      tipo: 'condominio',
      categoria: 'problemas_electricos',
      descripcion: 'Los breakers del apartamento se botan constantemente cuando enciendo el aire acondicionado de la sala.',
      estado: 'en_proceso',
      prioridad: 'alta',
      tecnicoAsignadoId: tecnico2.id,
      fechaAsignacion: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
      diagnostico: 'Sobrecarga en el circuito principal. Requiere instalación de breaker de mayor amperaje.',
      tiempoEstimado: '2-3 días hábiles',
    },
  });

  // Caso 3: Nuevo - Puerta defectuosa
  const caso3 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0003',
      usuarioId: propietario3.id,
      condominioId: condominio2.id,
      unidad: propietario3.unidad!,
      tipo: 'garantia',
      categoria: 'puertas_ventanas',
      descripcion: 'La puerta principal no cierra bien. El marco está desnivelado y hay corriente de aire.',
      estado: 'nuevo',
      prioridad: 'media',
    },
  });

  // Caso 4: Resuelto - Aire acondicionado
  const caso4 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0004',
      usuarioId: propietario4.id,
      condominioId: condominio2.id,
      unidad: propietario4.unidad!,
      tipo: 'condominio',
      categoria: 'aires_acondicionados',
      descripcion: 'El aire acondicionado del cuarto principal no enfría. Hace ruidos extraños.',
      estado: 'resuelto',
      prioridad: 'media',
      tecnicoAsignadoId: tecnico3.id,
      fechaAsignacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
      diagnostico: 'Filtro sucio y falta de gas refrigerante.',
      solucionAplicada: 'Se limpió el filtro y se recargó el gas. Sistema funcionando correctamente.',
      tiempoEstimado: '2 horas',
      fechaVisita: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
      fechaResolucion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
      satisfaccionCliente: 5,
      comentarioCliente: 'Excelente servicio. Muy profesional y rápido.',
      costoReal: 3500.00,
    },
  });

  // Caso 5: Cerrado - Plomería
  const caso5 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0005',
      usuarioId: propietario5.id,
      condominioId: condominio3.id,
      unidad: propietario5.unidad!,
      tipo: 'garantia',
      categoria: 'plomeria',
      descripcion: 'Fuga de agua en la tubería del baño de visitas. Se escucha agua corriendo dentro de la pared.',
      estado: 'cerrado',
      prioridad: 'alta',
      tecnicoAsignadoId: tecnico1.id,
      fechaAsignacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      diagnostico: 'Tubería rota por defecto de instalación. Cubierto por garantía.',
      solucionAplicada: 'Se rompió pared, se cambió tubería completa, se reparó pared y se pintó.',
      tiempoEstimado: '5-7 días',
      fechaVisita: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      fechaResolucion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      fechaCierre: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      satisfaccionCliente: 4,
      comentarioCliente: 'Buen trabajo pero tardaron un poco más de lo estimado.',
      costoEstimado: 8000.00,
      costoReal: 9500.00,
    },
  });

  // Caso 6: En visita - Grietas
  const caso6 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0006',
      usuarioId: propietario1.id,
      condominioId: condominio1.id,
      unidad: propietario1.unidad!,
      tipo: 'garantia',
      categoria: 'pisos_paredes_techo',
      descripcion: 'Grieta en la pared de la sala. Ha crecido en las últimas semanas.',
      estado: 'en_visita',
      prioridad: 'media',
      tecnicoAsignadoId: tecnico2.id,
      fechaAsignacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      fechaVisita: new Date(), // Hoy
    },
  });

  // Caso 7: Área común
  const caso7 = await prisma.caso.create({
    data: {
      numeroCaso: 'AMC-2024-0007',
      usuarioId: propietario2.id,
      condominioId: condominio1.id,
      unidad: propietario2.unidad!,
      tipo: 'condominio',
      categoria: 'areas_comunes',
      descripcion: 'La piscina está sucia desde hace una semana. Necesita mantenimiento urgente.',
      estado: 'nuevo',
      prioridad: 'alta',
    },
  });

  console.log('✅ 7 casos creados\n');

  // ========================================
  // 4. TIMELINE DE EVENTOS
  // ========================================
  console.log('📅 Creando eventos de timeline...');

  // Timeline Caso 1
  await prisma.timelineEvento.createMany({
    data: [
      {
        casoId: caso1.id,
        tipoEvento: 'creado',
        titulo: 'Caso Creado',
        descripcion: 'Caso reportado por WhatsApp',
        fecha: new Date(Date.now() - 3 * 60 * 60 * 1000), // Hace 3 horas
      },
      {
        casoId: caso1.id,
        tipoEvento: 'asignado',
        titulo: 'Caso Asignado',
        descripcion: 'Asignado al Ing. Carlos Méndez por sistema automático (caso urgente)',
        usuarioNombre: 'Sistema Automático',
        fecha: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // Hace 2.5 horas
      },
      {
        casoId: caso1.id,
        tipoEvento: 'visita_programada',
        titulo: 'Visita Programada',
        descripcion: 'Visita técnica programada para hoy a las 3:00 PM',
        usuarioNombre: 'Ing. Carlos Méndez',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000), // Hace 2 horas
      },
    ],
  });

  // Timeline Caso 2
  await prisma.timelineEvento.createMany({
    data: [
      {
        casoId: caso2.id,
        tipoEvento: 'creado',
        titulo: 'Caso Creado',
        descripcion: 'Reportado por teléfono',
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
      },
      {
        casoId: caso2.id,
        tipoEvento: 'asignado',
        titulo: 'Caso Asignado',
        descripcion: 'Asignado al Ing. Rafael Jiménez',
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
      },
      {
        casoId: caso2.id,
        tipoEvento: 'visita_completada',
        titulo: 'Visita Completada',
        descripcion: 'Inspección realizada. Diagnóstico enviado.',
        usuarioNombre: 'Ing. Rafael Jiménez',
        fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
      },
      {
        casoId: caso2.id,
        tipoEvento: 'diagnostico_enviado',
        titulo: 'Diagnóstico Enviado',
        descripcion: 'Sobrecarga en circuito. Requiere nuevo breaker.',
        usuarioNombre: 'Ing. Rafael Jiménez',
        fecha: new Date(Date.now() - 20 * 60 * 60 * 1000), // Hace 20 horas
      },
    ],
  });

  // Timeline Caso 4 (Resuelto)
  await prisma.timelineEvento.createMany({
    data: [
      {
        casoId: caso4.id,
        tipoEvento: 'creado',
        titulo: 'Caso Creado',
        descripcion: 'Caso creado',
        fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        casoId: caso4.id,
        tipoEvento: 'asignado',
        titulo: 'Caso Asignado',
        descripcion: 'Asignado al Téc. Luis Fernández',
        fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        casoId: caso4.id,
        tipoEvento: 'visita_programada',
        titulo: 'Visita Programada',
        descripcion: 'Visita programada para mañana 10:00 AM',
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        casoId: caso4.id,
        tipoEvento: 'visita_completada',
        titulo: 'Visita Completada',
        descripcion: 'Inspección realizada',
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        casoId: caso4.id,
        tipoEvento: 'reparacion_completada',
        titulo: 'Reparación Completada',
        descripcion: 'Filtro limpiado y gas recargado. Sistema operativo.',
        fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        casoId: caso4.id,
        tipoEvento: 'cerrado',
        titulo: 'Caso Cerrado',
        descripcion: 'Cliente confirmó satisfacción. Caso cerrado.',
        fecha: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Timeline de eventos creados\n');

  // ========================================
  // 5. NOTIFICACIONES
  // ========================================
  console.log('🔔 Creando notificaciones...');

  await prisma.notificacion.createMany({
    data: [
      {
        usuarioId: admin.id,
        tipo: 'caso_asignado',
        prioridad: 'critica',
        casoId: caso1.id,
        titulo: 'Nuevo caso urgente: AMC-2024-0001',
        mensaje: 'Juan Carlos Pérez reportó filtración grave en Apt 402',
        urlAccion: '/casos/' + caso1.id,
        leida: false,
      },
      {
        usuarioId: tecnico1.id,
        tipo: 'caso_asignado',
        prioridad: 'alta',
        casoId: caso1.id,
        titulo: 'Caso asignado: AMC-2024-0001',
        mensaje: 'Se te asignó un caso urgente de filtración',
        urlAccion: '/casos/' + caso1.id,
        leida: true,
        fechaLeida: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        usuarioId: admin.id,
        tipo: 'caso_actualizado',
        prioridad: 'media',
        casoId: caso4.id,
        titulo: 'Caso resuelto: AMC-2024-0004',
        mensaje: 'El caso de Ana Lucía Rodríguez fue resuelto con satisfacción de 5/5',
        urlAccion: '/casos/' + caso4.id,
        leida: false,
      },
    ],
  });

  console.log('✅ 3 notificaciones creadas\n');

  // ========================================
  // 6. KPIs
  // ========================================
  console.log('📊 Creando KPIs...');

  await prisma.kPIDiario.create({
    data: {
      fecha: new Date(),
      condominioId: condominio1.id,
      plataforma: 'whatsapp',
      casosNuevos: 3,
      casosAsignados: 2,
      casosResueltos: 1,
      casosCerrados: 1,
      mensajesEnviados: 45,
      mensajesRecibidos: 38,
      mensajesBot: 35,
      mensajesHumano: 10,
      tiempoRespuestaPromedio: 120, // 2 minutos
      satisfaccionPromedio: 4.5,
      slasCumplidos: 2,
      slasViolados: 0,
    },
  });

  console.log('✅ KPIs del día creados\n');

  // ========================================
  // RESUMEN
  // ========================================
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     SEED COMPLETADO EXITOSAMENTE         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  console.log('📊 DATOS CREADOS:');
  console.log('  ✅ 3 Condominios');
  console.log('  ✅ 9 Usuarios (5 propietarios, 3 técnicos, 1 admin)');
  console.log('  ✅ 7 Casos (1 urgente, 2 alta, 3 media, 1 baja)');
  console.log('  ✅ 13 Eventos de timeline');
  console.log('  ✅ 3 Notificaciones');
  console.log('  ✅ 1 Registro de KPIs\n');

  console.log('🎯 PRÓXIMOS PASOS:');
  console.log('  1. Abre Prisma Studio: http://localhost:5555');
  console.log('  2. Explora las tablas con datos reales');
  console.log('  3. Ve el caso urgente #AMC-2024-0001\n');

  console.log('🚀 El sistema está listo para demostración!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
