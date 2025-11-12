/**
 * Utilidad para exportar datos a Excel con lazy loading
 * Solo carga XLSX cuando realmente se va a exportar
 *
 * @author Amico Management System
 * @version 1.0.0
 */

let xlsxModule: any = null;

/**
 * Función para cargar XLSX solo cuando se necesita
 * Implementa lazy loading para optimizar bundle size
 */
async function loadXLSX() {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}

/**
 * Exportar array de objetos a Excel
 * @param data Array de objetos a exportar
 * @param filename Nombre del archivo (default: export.xlsx)
 * @param sheetName Nombre de la hoja (default: Datos)
 * @returns Promise con resultado de la operación
 */
export async function exportToExcel(
  data: any[],
  filename: string = 'export.xlsx',
  sheetName: string = 'Datos'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data || data.length === 0) {
      return { success: false, error: 'No hay datos para exportar' };
    }

    // Cargar XLSX solo ahora (lazy loading)
    const XLSX = await loadXLSX();

    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columnas automáticamente
    const colWidths = Object.keys(data[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      ) + 2
    }));
    worksheet['!cols'] = colWidths;

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Descargar
    XLSX.writeFile(workbook, filename);

    return { success: true };
  } catch (error) {
    console.error('Error al exportar Excel:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Exportar múltiples hojas a un archivo Excel
 * @param sheets Array de {name: string, data: any[]}
 * @param filename Nombre del archivo
 * @returns Promise con resultado de la operación
 */
export async function exportMultipleSheetsToExcel(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string = 'export.xlsx'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!sheets || sheets.length === 0) {
      return { success: false, error: 'No hay hojas para exportar' };
    }

    const XLSX = await loadXLSX();

    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ name, data }) => {
      if (data && data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Ajustar anchos
        const colWidths = Object.keys(data[0]).map(key => ({
          wch: Math.max(
            key.length,
            ...data.map(row => String(row[key] || '').length)
          ) + 2
        }));
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }
    });

    XLSX.writeFile(workbook, filename);

    return { success: true };
  } catch (error) {
    console.error('Error al exportar múltiples hojas:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Exportar casos a Excel con formato específico de Amico
 * @param casos Array de casos del sistema
 * @returns Promise con resultado de la operación
 */
export async function exportarCasosAmico(casos: any[]): Promise<{ success: boolean; error?: string }> {
  try {
    const datosExportar = casos.map(caso => ({
      'Código': caso.codigoUnico || caso.numeroCaso || 'N/A',
      'Fecha Creación': caso.fechaCreacion
        ? new Date(caso.fechaCreacion).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A',
      'Cliente': caso.nombreCliente || caso.propietario?.nombreCompleto || 'N/A',
      'Teléfono': caso.telefonoCliente || caso.propietario?.telefono || 'N/A',
      'Tipo': caso.tipoCaso || 'N/A',
      'Categoría': caso.categoria || 'N/A',
      'Problema': caso.descripcionProblema || caso.descripcion || 'N/A',
      'Estado': caso.estado || 'N/A',
      'Prioridad': caso.prioridad || 'N/A',
      'Técnico Asignado': caso.tecnicoAsignado?.nombreCompleto || 'Sin asignar',
      'Fecha Asignación': caso.fechaAsignacion
        ? new Date(caso.fechaAsignacion).toLocaleDateString('es-DO')
        : 'N/A',
      'Fecha Resolución': caso.fechaResolucion
        ? new Date(caso.fechaResolucion).toLocaleDateString('es-DO')
        : 'Pendiente',
      'Satisfacción': caso.nivelSatisfaccion || caso.satisfaccion || 'N/A',
      'Comentarios Cliente': caso.comentarioCliente || 'N/A'
    }));

    const fecha = new Date().toISOString().split('T')[0];
    return exportToExcel(
      datosExportar,
      `casos-amico-${fecha}.xlsx`,
      'Casos'
    );
  } catch (error) {
    console.error('Error al exportar casos:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Exportar técnicos a Excel
 * @param tecnicos Array de técnicos del sistema
 * @returns Promise con resultado de la operación
 */
export async function exportarTecnicosAmico(tecnicos: any[]): Promise<{ success: boolean; error?: string }> {
  try {
    const datosExportar = tecnicos.map(tec => ({
      'Nombre Completo': tec.nombreCompleto || 'N/A',
      'Email': tec.email || 'N/A',
      'Teléfono': tec.telefono || 'N/A',
      'Especialidad': tec.especialidad || 'General',
      'Estado': tec.estado || tec.activo ? 'Activo' : 'Inactivo',
      'Casos Activos': tec._count?.casosAsignados || tec.casosActivos || 0,
      'Casos Completados': tec._count?.casosCompletados || tec.casosCompletados || 0,
      'Disponibilidad': tec.disponible ? 'Disponible' : 'Ocupado',
      'Fecha Registro': tec.fechaCreacion
        ? new Date(tec.fechaCreacion).toLocaleDateString('es-DO')
        : 'N/A'
    }));

    const fecha = new Date().toISOString().split('T')[0];
    return exportToExcel(
      datosExportar,
      `tecnicos-amico-${fecha}.xlsx`,
      'Técnicos'
    );
  } catch (error) {
    console.error('Error al exportar técnicos:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Exportar usuarios a Excel
 * @param usuarios Array de usuarios del sistema
 * @returns Promise con resultado de la operación
 */
export async function exportarUsuariosAmico(usuarios: any[]): Promise<{ success: boolean; error?: string }> {
  try {
    const datosExportar = usuarios.map(user => ({
      'Nombre': user.nombreCompleto || 'N/A',
      'Email': user.email || 'N/A',
      'Teléfono': user.telefono || 'N/A',
      'Rol': user.rol || 'N/A',
      'Tipo': user.tipo || 'N/A',
      'Condominio': user.condominio?.nombre || user.nombreCondominio || 'N/A',
      'Unidad': user.unidad || 'N/A',
      'Estado': user.activo ? 'Activo' : 'Inactivo',
      'Fecha Registro': user.fechaCreacion
        ? new Date(user.fechaCreacion).toLocaleDateString('es-DO')
        : 'N/A'
    }));

    const fecha = new Date().toISOString().split('T')[0];
    return exportToExcel(
      datosExportar,
      `usuarios-amico-${fecha}.xlsx`,
      'Usuarios'
    );
  } catch (error) {
    console.error('Error al exportar usuarios:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Exportar reportes del dashboard a Excel con múltiples hojas
 * @param dataDashboard Objeto con datos del dashboard
 * @returns Promise con resultado de la operación
 */
export async function exportarDashboardAmico(dataDashboard: {
  casos?: any[];
  tecnicos?: any[];
  metricas?: any;
  estadisticas?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const sheets: Array<{ name: string; data: any[] }> = [];

    // Hoja de casos
    if (dataDashboard.casos && dataDashboard.casos.length > 0) {
      const casosMapeados = dataDashboard.casos.map(caso => ({
        'Código': caso.codigoUnico || caso.numeroCaso,
        'Cliente': caso.nombreCliente,
        'Estado': caso.estado,
        'Prioridad': caso.prioridad,
        'Técnico': caso.tecnicoAsignado?.nombreCompleto || 'Sin asignar'
      }));
      sheets.push({ name: 'Casos', data: casosMapeados });
    }

    // Hoja de técnicos
    if (dataDashboard.tecnicos && dataDashboard.tecnicos.length > 0) {
      const tecnicosMapeados = dataDashboard.tecnicos.map(tec => ({
        'Nombre': tec.nombreCompleto,
        'Casos Activos': tec.casosActivos || 0,
        'Disponibilidad': tec.disponible ? 'Disponible' : 'Ocupado'
      }));
      sheets.push({ name: 'Técnicos', data: tecnicosMapeados });
    }

    // Hoja de métricas
    if (dataDashboard.metricas) {
      const metricasArray = [dataDashboard.metricas];
      sheets.push({ name: 'Métricas', data: metricasArray });
    }

    if (sheets.length === 0) {
      return { success: false, error: 'No hay datos para exportar' };
    }

    const fecha = new Date().toISOString().split('T')[0];
    return exportMultipleSheetsToExcel(
      sheets,
      `dashboard-amico-${fecha}.xlsx`
    );
  } catch (error) {
    console.error('Error al exportar dashboard:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Exportar conversaciones de WhatsApp a Excel
 * @param conversaciones Array de conversaciones
 * @returns Promise con resultado de la operación
 */
export async function exportarConversacionesWhatsApp(
  conversaciones: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const datosExportar = conversaciones.map(conv => ({
      'Teléfono': conv.telefono || 'N/A',
      'Nombre Contacto': conv.nombreContacto || 'Sin nombre',
      'Total Mensajes': conv.totalMensajes || 0,
      'Último Mensaje': conv.ultimoMensaje || 'N/A',
      'Fecha Último Mensaje': conv.fechaUltimoMensaje
        ? new Date(conv.fechaUltimoMensaje).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
        : 'N/A'
    }));

    const fecha = new Date().toISOString().split('T')[0];
    return exportToExcel(
      datosExportar,
      `conversaciones-whatsapp-${fecha}.xlsx`,
      'Conversaciones'
    );
  } catch (error) {
    console.error('Error al exportar conversaciones:', error);
    return { success: false, error: (error as Error).message };
  }
}
