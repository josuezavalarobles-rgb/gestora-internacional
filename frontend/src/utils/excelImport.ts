/**
 * Utilidad para importar datos desde Excel con lazy loading
 * Solo carga XLSX cuando realmente se va a importar
 *
 * @author Amico Management System
 * @version 1.0.0
 */

let xlsxModule: any = null;

/**
 * Cargar módulo XLSX dinámicamente
 */
async function loadXLSX() {
  if (!xlsxModule) {
    xlsxModule = await import('xlsx');
  }
  return xlsxModule;
}

/**
 * Leer archivo Excel y convertir a JSON
 * @param data Datos del archivo (binary string o ArrayBuffer)
 * @param sheetIndex Índice de la hoja a leer (default: 0)
 * @returns Array de objetos con los datos
 */
export async function readExcelFile(
  data: string | ArrayBuffer,
  sheetIndex: number = 0
): Promise<any[]> {
  try {
    const XLSX = await loadXLSX();

    // Leer el workbook
    const workbook = XLSX.read(data, { type: typeof data === 'string' ? 'binary' : 'array' });

    // Obtener la primera hoja
    const sheetName = workbook.SheetNames[sheetIndex];
    if (!sheetName) {
      throw new Error(`No se encontró la hoja en el índice ${sheetIndex}`);
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    return jsonData;
  } catch (error) {
    console.error('Error leyendo archivo Excel:', error);
    throw error;
  }
}

/**
 * Crear plantilla Excel para importación
 * @param columns Columnas de la plantilla
 * @param sampleData Datos de ejemplo (opcional)
 * @param filename Nombre del archivo
 * @returns Promise con resultado de la operación
 */
export async function createExcelTemplate(
  columns: string[],
  sampleData: any[] = [],
  filename: string = 'plantilla.xlsx'
): Promise<{ success: boolean; error?: string }> {
  try {
    const XLSX = await loadXLSX();

    // Crear objeto de plantilla
    const plantilla: any[] = sampleData.length > 0 ? sampleData : [{}];

    // Asegurar que existan todas las columnas
    plantilla.forEach(row => {
      columns.forEach(col => {
        if (!(col in row)) {
          row[col] = '';
        }
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(plantilla, { header: columns });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    XLSX.writeFile(workbook, filename);

    return { success: true };
  } catch (error) {
    console.error('Error creando plantilla:', error);
    return { success: false, error: (error as Error).message };
  }
}
