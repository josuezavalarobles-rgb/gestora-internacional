# Amico Management - Frontend Setup

## Archivos Creados

### Componentes Principales
- **src/App.tsx**: Componente principal con React Router configurado
- **src/main.tsx**: Punto de entrada de la aplicación (ya existía)

### Pages
- **src/pages/Dashboard.tsx**: Dashboard con estadísticas, casos urgentes y listado completo
- **src/pages/CasoDetalle.tsx**: Vista detallada de un caso individual

### Componentes Reutilizables
- **src/components/Layout.tsx**: Layout con navbar superior
- **src/components/StatsCard.tsx**: Componente para cards de estadísticas

### Configuración
- **src/vite-env.d.ts**: Tipos TypeScript para variables de entorno de Vite
- **src/index.css**: Estilos globales con Tailwind CSS

## Cómo usar

### 1. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

### 2. Compilar para producción:
```bash
npm run build
```

### 3. Vista previa de la compilación:
```bash
npm run preview
```

## Características Implementadas

- Dashboard con 4 cards de estadísticas (Casos Nuevos, En Proceso, Resueltos, Satisfacción)
- Sección de casos urgentes filtrados por prioridad
- Tabla completa de todos los casos
- Vista detallada de cada caso con:
  - Información del cliente
  - Descripción del problema
  - Timeline de eventos
  - Estado actual
  - Técnico asignado
  - Satisfacción del cliente
- Diseño responsive con Tailwind CSS
- Conexión con API del backend
- TypeScript con tipado completo
- Navegación con React Router

## API Endpoints Utilizados

- `GET /api/v1/casos` - Obtener todos los casos
- `GET /api/v1/casos/:id` - Obtener un caso específico
- `GET /api/v1/kpis/dashboard` - Obtener estadísticas del dashboard

## Notas

- El backend debe estar corriendo en http://localhost:3000
- Las variables de entorno se configuran en el archivo .env
- Los iconos utilizan la librería lucide-react
