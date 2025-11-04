// Poblar Railway con datos de prueba
const axios = require('axios');

const API_URL = 'https://amico-management-production.up.railway.app/api/v1';

async function poblarRailway() {
    console.log('🌱 Poblando Railway con datos de prueba...\n');

    try {
        // 1. CREAR CONDOMINIOS
        console.log('📁 Creando condominios...');

        const condominios = [
            {
                nombre: 'Residencial Las Palmas',
                direccion: 'Av. Independencia #456, Gazcue',
                ciudad: 'Santo Domingo',
                provincia: 'Distrito Nacional',
                telefono: '8092345678',
                email: 'admin@laspalmas.com.do',
                estado: 'activo',
                totalUnidades: 120
            },
            {
                nombre: 'Torres del Caribe',
                direccion: 'Av. Winston Churchill #789, Piantini',
                ciudad: 'Santo Domingo',
                provincia: 'Distrito Nacional',
                telefono: '8093456789',
                email: 'info@torresdelcaribe.com',
                estado: 'activo',
                totalUnidades: 200
            },
            {
                nombre: 'Villa Marina',
                direccion: 'Malecón de Boca Chica, Km 3',
                ciudad: 'Boca Chica',
                provincia: 'Santo Domingo',
                telefono: '8094567890',
                email: 'contacto@villamarina.do',
                estado: 'activo',
                totalUnidades: 80
            }
        ];

        for (const condo of condominios) {
            try {
                await axios.post(`${API_URL}/condominios`, condo);
                console.log(`  ✅ ${condo.nombre}`);
            } catch (e) {
                console.log(`  ⚠️  ${condo.nombre} (puede ya existir)`);
            }
        }

        // 2. CREAR TÉCNICOS
        console.log('\n👷 Creando técnicos...');

        const tecnicos = [
            {
                nombreCompleto: 'Ing. Carlos Méndez',
                telefono: '8096661234',
                email: 'carlos.mendez@amico.com',
                tipoUsuario: 'tecnico',
                estado: 'activo'
            },
            {
                nombreCompleto: 'Ing. Rafael Jiménez',
                telefono: '8096662345',
                email: 'rafael.jimenez@amico.com',
                tipoUsuario: 'tecnico',
                estado: 'activo'
            },
            {
                nombreCompleto: 'Téc. Luis Fernández',
                telefono: '8096663456',
                email: 'luis.fernandez@amico.com',
                tipoUsuario: 'tecnico',
                estado: 'activo'
            },
            {
                nombreCompleto: 'Ing. María Rodríguez',
                telefono: '8096664567',
                email: 'maria.rodriguez@amico.com',
                tipoUsuario: 'tecnico',
                estado: 'activo'
            }
        ];

        for (const tec of tecnicos) {
            try {
                await axios.post(`${API_URL}/usuarios`, tec);
                console.log(`  ✅ ${tec.nombreCompleto}`);
            } catch (e) {
                console.log(`  ⚠️  ${tec.nombreCompleto} (puede ya existir)`);
            }
        }

        // 3. CREAR PROPIETARIOS DE PRUEBA
        console.log('\n👥 Creando propietarios...');

        const propietarios = [
            {
                nombreCompleto: 'Juan Carlos Pérez',
                telefono: '8095551234',
                email: 'juan.perez@gmail.com',
                tipoUsuario: 'propietario',
                estado: 'activo',
                unidad: 'Apt 402, Torre A'
            },
            {
                nombreCompleto: 'María Fernanda González',
                telefono: '8095552345',
                email: 'maria.gonzalez@hotmail.com',
                tipoUsuario: 'propietario',
                estado: 'activo',
                unidad: 'Apt 305, Torre B'
            }
        ];

        for (const prop of propietarios) {
            try {
                await axios.post(`${API_URL}/usuarios`, prop);
                console.log(`  ✅ ${prop.nombreCompleto}`);
            } catch (e) {
                console.log(`  ⚠️  ${prop.nombreCompleto} (puede ya existir)`);
            }
        }

        console.log('\n╔══════════════════════════════════════════╗');
        console.log('║   RAILWAY POBLADO EXITOSAMENTE           ║');
        console.log('╚══════════════════════════════════════════╝\n');

        console.log('✅ 3 Condominios');
        console.log('✅ 4 Técnicos');
        console.log('✅ 2 Propietarios\n');

        console.log('🎯 Ahora puedes:');
        console.log('1. Ver técnicos en el panel web');
        console.log('2. Probar asignación automática');
        console.log('3. El bot podrá asignar técnicos automáticamente\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

poblarRailway();
