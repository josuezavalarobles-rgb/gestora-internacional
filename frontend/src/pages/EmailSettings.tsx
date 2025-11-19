import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Trash2, Edit2, CheckCircle, XCircle, Mail, Key, User, AlertCircle } from 'lucide-react';
import api from '@/services/api';

interface EmailConfig {
  id: string;
  sendgridApiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailSettings() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const [formData, setFormData] = useState({
    sendgridApiKey: '',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
  });

  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Fetch current configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ['email-config'],
    queryFn: async () => {
      const response = await api.get('/email-marketing/settings');
      return response.data as EmailConfig;
    },
  });

  // Create/Update configuration
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingId) {
        const response = await api.put(`/email-marketing/settings/${editingId}`, data);
        return response.data;
      } else {
        const response = await api.post('/email-marketing/settings', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
      setIsEditing(false);
      setEditingId(null);
      setFormData({ sendgridApiKey: '', fromEmail: '', fromName: '', replyToEmail: '' });
    },
  });

  // Delete configuration
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/email-marketing/settings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] });
    },
  });

  // Test email sending
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/email-marketing/settings/test', { email });
      return response.data;
    },
    onSuccess: () => {
      setTestStatus('success');
      setTestMessage('Email de prueba enviado correctamente. Revisa tu bandeja de entrada.');
      setTimeout(() => setTestStatus('idle'), 5000);
    },
    onError: (error: any) => {
      setTestStatus('error');
      setTestMessage(error.response?.data?.message || 'Error al enviar email de prueba');
      setTimeout(() => setTestStatus('idle'), 5000);
    },
  });

  const handleEdit = () => {
    if (config) {
      setFormData({
        sendgridApiKey: config.sendgridApiKey,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        replyToEmail: config.replyToEmail || '',
      });
      setEditingId(config.id);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(formData);
  };

  const handleDelete = async () => {
    if (config && window.confirm('¿Estás seguro de eliminar la configuración de email? Esto desactivará el envío de emails.')) {
      await deleteMutation.mutateAsync(config.id);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setTestStatus('error');
      setTestMessage('Por favor ingresa un email válido');
      return;
    }
    setTestStatus('sending');
    await testEmailMutation.mutateAsync(testEmail);
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 10) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="text-purple-400" />
            Configuración de Email
          </h1>
          <p className="text-slate-400">Administra la configuración de SendGrid y email marketing</p>
        </div>
      </div>

      {/* Current Configuration Display */}
      {config && !isEditing && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckCircle className="text-green-400" />
              Configuración Activa
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                Eliminar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Key size={16} />
                <span>API Key de SendGrid</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-sm">
                  {showApiKey ? config.sendgridApiKey : maskApiKey(config.sendgridApiKey)}
                </p>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {showApiKey ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail size={16} />
                <span>Email Remitente</span>
              </div>
              <p className="text-white">{config.fromEmail}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <User size={16} />
                <span>Nombre Remitente</span>
              </div>
              <p className="text-white">{config.fromName}</p>
            </div>

            {config.replyToEmail && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail size={16} />
                  <span>Reply-To</span>
                </div>
                <p className="text-white">{config.replyToEmail}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Última actualización: {new Date(config.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* No Configuration State */}
      {!config && !isEditing && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
          <AlertCircle size={48} className="text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay configuración de email</h3>
          <p className="text-slate-400 mb-4">
            Configura SendGrid para comenzar a enviar emails
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Configurar Ahora
          </button>
        </div>
      )}

      {/* Edit/Create Form */}
      {isEditing && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">
            {editingId ? 'Editar Configuración' : 'Nueva Configuración'}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                SendGrid API Key <span className="text-red-400">*</span>
              </label>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.sendgridApiKey}
                onChange={(e) => setFormData({ ...formData, sendgridApiKey: e.target.value })}
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Obtén tu API key desde{' '}
                <a
                  href="https://app.sendgrid.com/settings/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  SendGrid Dashboard
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Remitente <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  placeholder="noreply@gestorainternacional.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Este email debe estar verificado en SendGrid
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre Remitente <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  placeholder="Gestora Internacional SRL"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reply-To Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.replyToEmail}
                  onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                  placeholder="contacto@gestorainternacional.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                setFormData({ sendgridApiKey: '', fromEmail: '', fromName: '', replyToEmail: '' });
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.sendgridApiKey || !formData.fromEmail || !formData.fromName || saveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Save size={18} />
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      )}

      {/* Test Email Section */}
      {config && !isEditing && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="text-blue-400" />
            Probar Envío de Email
          </h2>
          <p className="text-slate-400 text-sm">
            Envía un email de prueba para verificar que la configuración funciona correctamente
          </p>

          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleTestEmail}
              disabled={testStatus === 'sending' || !testEmail}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Mail size={18} />
              {testStatus === 'sending' ? 'Enviando...' : 'Enviar Prueba'}
            </button>
          </div>

          {testStatus === 'success' && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle size={20} className="text-green-400" />
              <p className="text-green-400 text-sm">{testMessage}</p>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <XCircle size={20} className="text-red-400" />
              <p className="text-red-400 text-sm">{testMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Ayuda y Documentación</h3>
        <div className="space-y-2 text-sm text-blue-400">
          <p>
            <strong>1. Obtén tu API Key:</strong> Visita{' '}
            <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="underline">
              SendGrid API Keys
            </a>{' '}
            y crea una nueva API key con permisos de "Mail Send"
          </p>
          <p>
            <strong>2. Verifica tu dominio:</strong> Asegúrate de verificar tu dominio de email en SendGrid para mejorar la entregabilidad
          </p>
          <p>
            <strong>3. Prueba primero:</strong> Usa la función de email de prueba antes de enviar campañas masivas
          </p>
          <p>
            <strong>4. Monitorea:</strong> Revisa las estadísticas en SendGrid Dashboard y en el panel de Email Marketing
          </p>
        </div>
      </div>
    </div>
  );
}
