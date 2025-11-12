import { useState, useEffect, useRef } from 'react';
import { Users, Plus, Upload, Trash2, Edit2, CheckCircle, XCircle, Download, FileSpreadsheet, Building2 } from 'lucide-react';
import { usuariosApi } from '../services/api';
import Papa from 'papaparse';
import { readExcelFile, createExcelTemplate } from '../utils/excelImport';
import { exportToExcel } from '../utils/excelExport';

interface Propietario {
  id?: string;
  nombreCompleto: string;
  unidad: string;
  telefono: string;
  condominioId?: string;
  estado?: string;
}

interface Condominio {
  id: string;
  nombre: string;
}

export default function Propietarios() {
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del formulario
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Propietario>({
    nombreCompleto: '',
    unidad: '',
    telefono: '',
    condominioId: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    await Promise.all([cargarPropietarios(), cargarCondominios()]);
  };

  const cargarPropietarios = async () => {
    try {
      setLoading(true);
      const usuarios = await usuariosApi.getAll();
      // Filtrar solo propietarios
      const props = usuarios.filter((u: any) => u.tipoUsuario === 'propietario');
      setPropietarios(props);
    } catch (error) {
      console.error('Error cargando propietarios:', error);
      mostrarMensaje('error', 'Error al cargar propietarios');
    } finally {
      setLoading(false);
    }
  };

  const cargarCondominios = async () => {
    try {
      // Simulamos condominios por ahora - puedes conectar con API real
      setCondominios([
        { id: '1', nombre: 'Condominio Las Palmas' },
        { id: '2', nombre: 'Residencial El Paraíso' },
        { id: '3', nombre: 'Torres del Este' },
        { id: '4', nombre: 'Villa Marina' }
      ]);
    } catch (error) {
      console.error('Error cargando condominios:', error);
    }
  };

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación
    if (!formData.nombreCompleto || !formData.unidad || !formData.telefono) {
      mostrarMensaje('error', 'Todos los campos son obligatorios');
      return;
    }

    // Validar teléfono (solo números, mínimo 10 dígitos)
    const telefonoLimpio = formData.telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) {
      mostrarMensaje('error', 'El teléfono debe tener al menos 10 dígitos');
      return;
    }

    try {
      setLoading(true);

      const propietarioData = {
        nombreCompleto: formData.nombreCompleto,
        telefono: telefonoLimpio,
        unidad: formData.unidad,
        condominioId: formData.condominioId || undefined,
        tipoUsuario: 'propietario',
        estado: 'activo',
        puedeVotar: true
      };

      if (editingId) {
        // Actualizar
        await usuariosApi.update(editingId, propietarioData);
        mostrarMensaje('success', 'Propietario actualizado exitosamente');
      } else {
        // Crear
        await usuariosApi.create(propietarioData);
        mostrarMensaje('success', 'Propietario agregado exitosamente');
      }

      // Limpiar formulario
      setFormData({
        nombreCompleto: '',
        unidad: '',
        telefono: '',
        condominioId: ''
      });

      setShowForm(false);
      setEditingId(null);

      // Recargar lista
      await cargarPropietarios();

    } catch (error: any) {
      console.error('Error guardando propietario:', error);
      if (error.response?.data?.message?.includes('telefono')) {
        mostrarMensaje('error', 'Este número de teléfono ya está registrado');
      } else {
        mostrarMensaje('error', 'Error al guardar propietario');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (propietario: Propietario) => {
    setEditingId(propietario.id || null);
    setFormData({
      nombreCompleto: propietario.nombreCompleto,
      unidad: propietario.unidad,
      telefono: propietario.telefono,
      condominioId: propietario.condominioId || ''
    });
    setShowForm(true);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este propietario?')) return;

    try {
      setLoading(true);
      await usuariosApi.delete(id);
      mostrarMensaje('success', 'Propietario eliminado');
      await cargarPropietarios();
    } catch (error) {
      console.error('Error eliminando propietario:', error);
      mostrarMensaje('error', 'Error al eliminar propietario');
    } finally {
      setLoading(false);
    }
  };

  // IMPORTACIÓN CSV/EXCEL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        setLoading(true);
        const data = event.target?.result;

        let propietariosImportados: any[] = [];

        // Determinar tipo de archivo
        if (file.name.endsWith('.csv')) {
          // Procesar CSV
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              propietariosImportados = results.data;
              await procesarImportacion(propietariosImportados);
            },
            error: (error: any) => {
              console.error('Error parseando CSV:', error);
              mostrarMensaje('error', 'Error al leer archivo CSV');
              setLoading(false);
            }
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Procesar Excel con lazy loading
          propietariosImportados = await readExcelFile(data as string);
          await procesarImportacion(propietariosImportados);
        } else {
          mostrarMensaje('error', 'Formato de archivo no soportado. Use CSV o Excel');
          setLoading(false);
        }

      } catch (error) {
        console.error('Error procesando archivo:', error);
        mostrarMensaje('error', 'Error al procesar archivo');
        setLoading(false);
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }

    // Limpiar input
    e.target.value = '';
  };

  const procesarImportacion = async (datos: any[]) => {
    try {
      let exitosos = 0;
      let errores = 0;

      for (const fila of datos) {
        try {
          // Mapear campos (flexible para diferentes nombres de columnas)
          const nombre = fila.nombre || fila.Nombre || fila.nombreCompleto || fila['Nombre Completo'] || '';
          const unidad = fila.unidad || fila.Unidad || fila.apartamento || fila.Apartamento || '';
          const telefono = fila.telefono || fila.Telefono || fila.teléfono || fila.Teléfono || fila.celular || fila.Celular || '';
          const condominio = fila.condominio || fila.Condominio || fila.condominioId || '';

          if (!nombre || !unidad || !telefono) {
            console.warn('Fila inválida, faltan campos:', fila);
            errores++;
            continue;
          }

          const telefonoLimpio = telefono.toString().replace(/\D/g, '');

          if (telefonoLimpio.length < 10) {
            console.warn('Teléfono inválido:', telefono);
            errores++;
            continue;
          }

          // Buscar condominio si se proporcionó nombre
          let condominioId = condominio;
          if (condominio && !condominio.includes('-')) {
            const condominioEncontrado = condominios.find(c =>
              c.nombre.toLowerCase().includes(condominio.toLowerCase())
            );
            condominioId = condominioEncontrado?.id || '';
          }

          await usuariosApi.create({
            nombreCompleto: nombre,
            telefono: telefonoLimpio,
            unidad: unidad,
            condominioId: condominioId || undefined,
            tipoUsuario: 'propietario',
            estado: 'activo',
            puedeVotar: true
          });

          exitosos++;

        } catch (error: any) {
          if (error.response?.data?.message?.includes('telefono')) {
            console.warn('Teléfono duplicado:', fila.telefono);
          }
          errores++;
        }
      }

      mostrarMensaje('success', `Importación completada: ${exitosos} exitosos, ${errores} con errores`);
      await cargarPropietarios();

    } catch (error) {
      console.error('Error en importación masiva:', error);
      mostrarMensaje('error', 'Error en la importación masiva');
    } finally {
      setLoading(false);
    }
  };

  // EXPORTACIÓN A EXCEL con lazy loading
  const handleExportar = async () => {
    try {
      // Preparar datos para exportar
      const datosExportar = propietarios.map(p => ({
        'Nombre Completo': p.nombreCompleto,
        'Unidad/Apartamento': p.unidad,
        'Teléfono': p.telefono,
        'Estado': p.estado || 'activo',
        'Condominio': condominios.find(c => c.id === p.condominioId)?.nombre || 'Sin asignar'
      }));

      // Exportar con lazy loading
      const fecha = new Date().toISOString().split('T')[0];
      const resultado = await exportToExcel(
        datosExportar,
        `propietarios_${fecha}.xlsx`,
        'Propietarios'
      );

      if (resultado.success) {
        mostrarMensaje('success', 'Lista exportada exitosamente');
      } else {
        mostrarMensaje('error', `Error al exportar: ${resultado.error}`);
      }

    } catch (error) {
      console.error('Error exportando:', error);
      mostrarMensaje('error', 'Error al exportar lista');
    }
  };

  // DESCARGAR PLANTILLA Excel con lazy loading
  const descargarPlantilla = async () => {
    const plantilla = [
      { nombre: 'Juan Pérez', unidad: 'Apt 402', telefono: '8095551234', condominio: 'Condominio Las Palmas' },
      { nombre: 'María García', unidad: 'Torre A-301', telefono: '8095555678', condominio: 'Residencial El Paraíso' },
      { nombre: 'Pedro Martínez', unidad: 'Casa 12', telefono: '8095559012', condominio: 'Torres del Este' }
    ];

    const resultado = await createExcelTemplate(
      ['nombre', 'unidad', 'telefono', 'condominio'],
      plantilla,
      'plantilla_propietarios.xlsx'
    );

    if (resultado.success) {
      mostrarMensaje('success', 'Plantilla descargada. Complétala y súbela usando "Importar CSV/Excel"');
    } else {
      mostrarMensaje('error', `Error al descargar plantilla: ${resultado.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="text-blue-400" size={40} />
              Base de Datos de Propietarios
            </h1>
            <p className="text-gray-400 text-lg">
              Carga manual o masiva de propietarios del condominio
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={descargarPlantilla}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all glow-purple"
            >
              <FileSpreadsheet size={20} />
              Descargar Plantilla
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all glow-green disabled:opacity-50"
            >
              <Upload size={20} />
              Importar CSV/Excel
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleExportar}
              disabled={propietarios.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg hover:from-cyan-700 hover:to-cyan-800 shadow-lg hover:shadow-xl transition-all glow-cyan disabled:opacity-50"
            >
              <Download size={20} />
              Exportar Excel
            </button>

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nombreCompleto: '', unidad: '', telefono: '', condominioId: '' });
                setShowForm(!showForm);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all glow-blue"
            >
              <Plus size={20} />
              Agregar Propietario
            </button>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          mensaje.tipo === 'success'
            ? 'bg-green-900 bg-opacity-20 border border-green-500 text-green-400'
            : 'bg-red-900 bg-opacity-20 border border-red-500 text-red-400'
        }`}>
          {mensaje.tipo === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          {mensaje.texto}
        </div>
      )}

      {/* Formulario de Agregar/Editar Propietario */}
      {showForm && (
        <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            {editingId ? 'Editar Propietario' : 'Nuevo Propietario'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Nombre Completo */}
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                  Nombre del Propietario *
                </label>
                <input
                  type="text"
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Unidad/Apartamento */}
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                  Unidad o Apartamento *
                </label>
                <input
                  type="text"
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  placeholder="Ej: Apt 402, Casa 12, Torre A-301"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                  Número Telefónico *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej: 8095551234 o 18095551234"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Solo números, sin guiones ni espacios</p>
              </div>

              {/* Condominio */}
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2 uppercase tracking-wide">
                  Condominio (Opcional)
                </label>
                <select
                  value={formData.condominioId}
                  onChange={(e) => setFormData({ ...formData, condominioId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {condominios.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-green"
              >
                {loading ? 'Guardando...' : (editingId ? 'Actualizar Propietario' : 'Guardar Propietario')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nombreCompleto: '', unidad: '', telefono: '', condominioId: '' });
                }}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-6 glow-blue">
          <div className="text-blue-200 text-sm font-bold uppercase mb-2">Total Propietarios</div>
          <div className="text-6xl font-bold text-white">{propietarios.length}</div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl shadow-2xl p-6 glow-green">
          <div className="text-green-200 text-sm font-bold uppercase mb-2">Activos</div>
          <div className="text-6xl font-bold text-white">
            {propietarios.filter(p => p.estado === 'activo').length}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-2xl p-6 glow-purple">
          <div className="text-purple-200 text-sm font-bold uppercase mb-2">Pendientes</div>
          <div className="text-6xl font-bold text-white">
            {propietarios.filter(p => p.estado === 'pendiente').length}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl shadow-2xl p-6 glow-orange">
          <div className="text-orange-200 text-sm font-bold uppercase mb-2">Con Condominio</div>
          <div className="text-6xl font-bold text-white">
            {propietarios.filter(p => p.condominioId).length}
          </div>
        </div>
      </div>

      {/* Tabla de Propietarios */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Lista de Propietarios ({propietarios.length})</h2>
        </div>

        {loading && propietarios.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-300 mt-4">Cargando propietarios...</p>
          </div>
        ) : propietarios.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No hay propietarios registrados</p>
            <p className="text-gray-500 text-sm mb-4">
              Agrega propietarios manualmente o importa un archivo CSV/Excel
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar Manualmente
              </button>
              <button
                onClick={descargarPlantilla}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Descargar Plantilla
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 bg-opacity-50">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-400 font-bold uppercase text-sm">Nombre</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-bold uppercase text-sm">Unidad</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-bold uppercase text-sm">Teléfono</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-bold uppercase text-sm">Condominio</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-bold uppercase text-sm">Estado</th>
                  <th className="text-left py-4 px-6 text-gray-400 font-bold uppercase text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {propietarios.map((propietario) => (
                  <tr
                    key={propietario.id}
                    className="hover:bg-slate-700 hover:bg-opacity-30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {propietario.nombreCompleto.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{propietario.nombreCompleto}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300">{propietario.unidad}</td>
                    <td className="py-4 px-6 text-gray-300 font-mono">{propietario.telefono}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Building2 size={16} className="text-purple-400" />
                        {condominios.find(c => c.id === propietario.condominioId)?.nombre || 'Sin asignar'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        propietario.estado === 'activo'
                          ? 'bg-green-600 text-white'
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {propietario.estado || 'activo'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditar(propietario)}
                          className="p-2 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-blue-400 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminar(propietario.id!)}
                          className="p-2 bg-red-600 bg-opacity-20 hover:bg-opacity-30 text-red-400 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instrucciones de uso */}
      <div className="mt-8 bg-gradient-to-br from-blue-900 to-blue-950 bg-opacity-20 border border-blue-500 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
          <FileSpreadsheet size={20} />
          Instrucciones para Importación Masiva
        </h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p><strong>1.</strong> Haz clic en "Descargar Plantilla" para obtener un archivo de ejemplo</p>
          <p><strong>2.</strong> Completa el archivo con tus propietarios (columnas: nombre, unidad, telefono, condominio)</p>
          <p><strong>3.</strong> Guarda como .CSV o .XLSX</p>
          <p><strong>4.</strong> Haz clic en "Importar CSV/Excel" y selecciona tu archivo</p>
          <p><strong>5.</strong> El sistema importará automáticamente todos los propietarios válidos</p>
          <p className="text-yellow-400"><strong>Nota:</strong> Los teléfonos duplicados serán omitidos automáticamente</p>
        </div>
      </div>
    </div>
  );
}
