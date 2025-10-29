import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { casosApi, usuariosApi } from '../services/api';
import type { CrearCasoData, Usuario } from '../types';
import { CATEGORIAS } from '../types';

export default function NuevoCaso() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CrearCasoData>();

  const usuarioSeleccionado = watch('usuarioId');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [usuariosData, tecnicosData] = await Promise.all([
        usuariosApi.getPropietarios(),
        usuariosApi.obtenerTecnicos(),
      ]);
      setUsuarios(usuariosData as Usuario[]);
      setTecnicos(tecnicosData as Usuario[]);
    } catch (error) {
      setErrorMessage('Error al cargar datos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CrearCasoData) => {
    try {
      setSubmitting(true);
      const usuario = usuarios.find(u => u.id === data.usuarioId);

      const casoData = {
        usuarioId: data.usuarioId,
        condominioId: usuario?.condominio?.id || data.condominioId,
        unidad: usuario?.unidad || data.unidad,
        tipo: data.tipo,
        categoria: data.categoria,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        tecnicoAsignadoId: data.tecnicoAsignadoId || undefined,
      };

      const nuevoCaso = await casosApi.create(casoData);
      setSuccessMessage('Caso creado exitosamente!');

      setTimeout(() => {
        navigate(`/casos/${nuevoCaso.id}`);
      }, 1500);
    } catch (error) {
      setErrorMessage('Error al crear el caso. Por favor intenta nuevamente.');
      console.error('Error:', error);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plus className="text-blue-600" />
            Crear Nuevo Caso
          </h1>
          <p className="text-gray-600 mt-1">
            Registra un nuevo caso de garantia o condominio
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={20} />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Seccion 1: Informacion del Usuario */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion del Usuario</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar Usuario *
              </label>
              <select
                {...register('usuarioId', { required: 'Debes seleccionar un usuario' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Buscar y seleccionar usuario...</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombreCompleto} - {usuario.condominio?.nombre} - {usuario.unidad}
                  </option>
                ))}
              </select>
              {errors.usuarioId && (
                <p className="text-red-600 text-sm mt-1">{errors.usuarioId.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Busca por nombre, condominio o unidad
              </p>
            </div>

            {usuarioSeleccionado && usuarios.find(u => u.id === usuarioSeleccionado) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Usuario seleccionado:</strong> {usuarios.find(u => u.id === usuarioSeleccionado)?.nombreCompleto}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Condominio:</strong> {usuarios.find(u => u.id === usuarioSeleccionado)?.condominio?.nombre}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Unidad:</strong> {usuarios.find(u => u.id === usuarioSeleccionado)?.unidad}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Seccion 2: Tipo de Caso */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Caso</h2>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="garantia"
                {...register('tipo', { required: 'Debes seleccionar un tipo' })}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Garantia</p>
                <p className="text-sm text-gray-600">Problemas cubiertos por la garantia del inmueble</p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                value="condominio"
                {...register('tipo', { required: 'Debes seleccionar un tipo' })}
                className="w-4 h-4 text-blue-600"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Condominio</p>
                <p className="text-sm text-gray-600">Solicitudes de mantenimiento del condominio</p>
              </div>
            </label>
          </div>
          {errors.tipo && (
            <p className="text-red-600 text-sm mt-2">{errors.tipo.message}</p>
          )}
        </div>

        {/* Seccion 3: Detalles del Caso */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles del Caso</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  {...register('categoria', { required: 'La categoria es requerida' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar categoria...</option>
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="text-red-600 text-sm mt-1">{errors.categoria.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad *
                </label>
                <select
                  {...register('prioridad', { required: 'La prioridad es requerida' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar prioridad...</option>
                  <option value="baja">Baja - Puede esperar</option>
                  <option value="media">Media - Atencion normal</option>
                  <option value="alta">Alta - Requiere atencion pronto</option>
                  <option value="urgente">Urgente - Atencion inmediata</option>
                </select>
                {errors.prioridad && (
                  <p className="text-red-600 text-sm mt-1">{errors.prioridad.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripcion del Problema *
              </label>
              <textarea
                {...register('descripcion', {
                  required: 'La descripcion es requerida',
                  minLength: { value: 10, message: 'Minimo 10 caracteres' }
                })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe el problema con el mayor detalle posible..."
              />
              {errors.descripcion && (
                <p className="text-red-600 text-sm mt-1">{errors.descripcion.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Incluye detalles como: que ocurre, cuando empezo, area afectada, etc.
              </p>
            </div>
          </div>
        </div>

        {/* Seccion 4: Asignacion (Opcional) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Asignacion de Tecnico (Opcional)</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tecnico Asignado
            </label>
            <select
              {...register('tecnicoAsignadoId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Asignar mas tarde...</option>
              {tecnicos.map(tecnico => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombreCompleto} - {tecnico.telefono}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Puedes asignar un tecnico ahora o hacerlo mas tarde desde el detalle del caso
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creando caso...
              </span>
            ) : (
              'Crear Caso'
            )}
          </button>
        </div>
      </form>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Informacion Importante</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>El usuario seleccionado recibira una notificacion automatica</li>
          <li>El caso quedara en estado "Nuevo" hasta que sea asignado</li>
          <li>Puedes agregar fotos y mas detalles desde el detalle del caso</li>
          <li>Los casos urgentes seran priorizados automaticamente</li>
        </ul>
      </div>
    </div>
  );
}
