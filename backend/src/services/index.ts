// ========================================
// SERVICES INDEX
// Exportación centralizada de todos los servicios
// ========================================

// Proveedores
export { ProveedorService } from './proveedores/ProveedorService';
export type { CrearProveedorDTO, EvaluarProveedorDTO } from './proveedores/ProveedorService';

// Contabilidad
export { ContabilidadService } from './contabilidad/ContabilidadService';
export type {
  CrearGastoDTO,
  CrearIngresoDTO,
  CrearNCFSecuenciaDTO,
  CrearPlanCuentasDTO,
} from './contabilidad/ContabilidadService';

export { EstadosCuentaService } from './contabilidad/EstadosCuentaService';
export type {
  CrearEstadoCuentaDTO,
  RegistrarTransaccionDTO,
} from './contabilidad/EstadosCuentaService';

// Inteligencia Artificial
export { FacturaIAService } from './ai/FacturaIAService';
export type { DatosFacturaExtraidos } from './ai/FacturaIAService';

export { PrediccionIAService } from './ai/PrediccionIAService';
export type {
  DatosPrediccion,
  ResultadoPrediccion,
} from './ai/PrediccionIAService';

// Recursos Humanos
export { NominaService } from './rrhh/NominaService';
export type { CrearNominaDTO, CalculoNomina } from './rrhh/NominaService';

// Unidades
export { UnidadService } from './unidades/UnidadService';
export type {
  CrearUnidadDTO,
  CrearDependienteDTO,
  CrearVehiculoDTO,
} from './unidades/UnidadService';

// Áreas Comunes
export { AreasComunesService } from './areas/AreasComunesService';
export type {
  CrearAreaComunDTO,
  CrearReservaDTO,
} from './areas/AreasComunesService';

// Seguridad
export { VisitasService } from './seguridad/VisitasService';
export type {
  RegistrarVisitaDTO,
  RegistrarVisitaFrecuenteDTO,
} from './seguridad/VisitasService';

// Calendario
export { CalendarioService } from './calendario/CalendarioService';
export type {
  CrearEventoDTO,
  CrearRecordatorioDTO,
} from './calendario/CalendarioService';

// Documentos
export { DocumentosService } from './documentos/DocumentosService';
export type { SubirDocumentoDTO } from './documentos/DocumentosService';

// ========================================
// SINGLETON INSTANCES
// ========================================

/**
 * Obtener instancias de todos los servicios
 */
export const getServices = () => ({
  proveedor: ProveedorService.getInstance(),
  contabilidad: ContabilidadService.getInstance(),
  estadosCuenta: EstadosCuentaService.getInstance(),
  facturaIA: FacturaIAService.getInstance(),
  prediccionIA: PrediccionIAService.getInstance(),
  nomina: NominaService.getInstance(),
  unidad: UnidadService.getInstance(),
  areasComunes: AreasComunesService.getInstance(),
  visitas: VisitasService.getInstance(),
  calendario: CalendarioService.getInstance(),
  documentos: DocumentosService.getInstance(),
});

export default getServices;
