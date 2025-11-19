import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Send, Upload, Users, Calendar, Sparkles, Save, Wand2, ChevronDown, ChevronUp, Database, FileSpreadsheet } from 'lucide-react';
import EmailEditor, { type EditorRef, type EmailEditorProps } from 'react-email-editor';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import AIImageGenerator from '@/components/AIImageGenerator';
import LeadSelector from '@/components/LeadSelector';

interface CampaignCreatorProps {
  onClose: () => void;
}

interface Recipient {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export default function CampaignCreator({ onClose }: CampaignCreatorProps) {
  const [step, setStep] = useState<'details' | 'design' | 'recipients' | 'review'>('details');
  const [campaignName, setCampaignName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [csvRecipients, setCsvRecipients] = useState<Recipient[]>([]);
  const [recipientSource, setRecipientSource] = useState<'portfolio' | 'csv'>('portfolio');
  const [scheduledDate, setScheduledDate] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [savedDesign, setSavedDesign] = useState<any>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const emailEditorRef = useRef<EditorRef>(null);

  const handleImageGenerated = (imageUrl: string) => {
    // Insert the generated image into the email editor
    if (emailEditorRef.current?.editor) {
      // You can use the unlayer editor API to insert an image
      // For now, we'll just copy to clipboard and show a message
      navigator.clipboard.writeText(imageUrl);
      alert('✅ Imagen generada y copiada al portapapeles. Arrastra un elemento "Imagen" al editor y pega la URL.');
    }
  };

  const handleSaveDesign = () => {
    if (emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.saveDesign((design: any) => {
        setSavedDesign(design);
        localStorage.setItem('email-template-design', JSON.stringify(design));
        alert('✅ Plantilla guardada correctamente. Podrás cargarla en futuras campañas.');
      });
    }
  };

  const handleLoadDesign = () => {
    const saved = localStorage.getItem('email-template-design');
    if (saved && emailEditorRef.current?.editor) {
      const design = JSON.parse(saved);
      emailEditorRef.current.editor.loadDesign(design);
    }
  };

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/email-marketing/campaigns', data);
      return response.data;
    },
  });

  const addRecipientsMutation = useMutation({
    mutationFn: async ({ campaignId, recipients }: { campaignId: string; recipients: Recipient[] }) => {
      const response = await api.post(`/email-marketing/campaigns/${campaignId}/recipients`, {
        recipients,
        source: 'IMPORTED',
      });
      return response.data;
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await api.post(`/email-marketing/campaigns/${campaignId}/send`);
      return response.data;
    },
  });

  const handleExportHtml = () => {
    if (emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.exportHtml((data) => {
        const { html } = data;
        setHtmlBody(html);
        // Extract text version (simple HTML stripping)
        const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        setTextBody(text);
        setStep('recipients');
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<any>(worksheet);

      const newRecipients: Recipient[] = json.map((row) => ({
        email: row.email || row.Email || row.EMAIL || '',
        firstName: row.firstName || row.FirstName || row.nombre || row.Nombre || '',
        lastName: row.lastName || row.LastName || row.apellido || row.Apellido || '',
        companyName: row.companyName || row.CompanyName || row.empresa || row.Empresa || '',
      })).filter((r) => r.email);

      setCsvRecipients(newRecipients);
    };
    reader.readAsBinaryString(file);
  };

  const handleSelectLeadsFromPortfolio = (leads: Recipient[]) => {
    setRecipients(leads);
  };

  // Combinar destinatarios de ambas fuentes
  const allRecipients = [...recipients, ...csvRecipients];

  const handleCreateAndSend = async () => {
    try {
      // 1. Crear campaña
      const campaign = await createCampaignMutation.mutateAsync({
        name: campaignName,
        subject,
        body: textBody,
        htmlBody,
        fromName,
        fromEmail,
        replyTo,
        scheduledAt: scheduledDate || undefined,
      });

      // 2. Agregar destinatarios (combinados de cartera + CSV)
      await addRecipientsMutation.mutateAsync({
        campaignId: campaign.id,
        recipients: allRecipients,
      });

      // 3. Enviar inmediatamente si no está programada
      if (!scheduledDate) {
        await sendCampaignMutation.mutateAsync(campaign.id);
      }

      onClose();
    } catch (error: any) {
      alert('Error al crear campaña: ' + (error.response?.data?.message || error.message));
    }
  };

  const onReady: EmailEditorProps['onReady'] = (unlayer) => {
    // Configuración inicial del editor
    unlayer.setMergeTags({
      firstName: {
        name: 'Nombre',
        value: '{{firstName}}',
      },
      lastName: {
        name: 'Apellido',
        value: '{{lastName}}',
      },
      companyName: {
        name: 'Empresa',
        value: '{{companyName}}',
      },
      email: {
        name: 'Email',
        value: '{{email}}',
      },
    });

    // Cargar diseño guardado si existe
    handleLoadDesign();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Crear Nueva Campaña</h1>
          <p className="text-slate-400">Paso {step === 'details' ? '1' : step === 'design' ? '2' : step === 'recipients' ? '3' : '4'} de 4</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {['details', 'design', 'recipients', 'review'].map((s, i) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`flex-1 h-2 rounded-full ${step === s || ['details', 'design', 'recipients', 'review'].indexOf(step) > i ? 'bg-purple-600' : 'bg-slate-700'}`} />
          </div>
        ))}
      </div>

      {/* Step 1: Campaign Details */}
      {step === 'details' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Detalles de la Campaña</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre de la Campaña <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ej: Newsletter Mayo 2024"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Asunto del Email <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej: Descubre nuestras nuevas funcionalidades"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Puedes usar variables: {'{{firstName}}'}, {'{{lastName}}'}, {'{{companyName}}'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Remitente
              </label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Tu Empresa"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email del Remitente
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@tuempresa.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reply-To (opcional)
              </label>
              <input
                type="email"
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="support@tuempresa.com"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Programar Envío (opcional)
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1">Dejar vacío para enviar inmediatamente</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep('design')}
              disabled={!campaignName || !subject}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Siguiente: Diseñar Email
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Email Design */}
      {step === 'design' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles size={20} className="text-purple-400" />
              Diseña tu Email Profesional
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDesign}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save size={18} />
                Guardar Plantilla
              </button>
              <button
                onClick={handleExportHtml}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Siguiente: Destinatarios
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-semibold text-white mb-2">💡 Funcionalidades Profesionales del Editor:</p>
            <div className="grid grid-cols-2 gap-2">
              <ul className="space-y-1">
                <li>✅ Arrastra elementos: Imágenes, Texto, Botones</li>
                <li>✅ Sube tus propias imágenes o usa URLs</li>
                <li>✅ Personaliza colores y fuentes</li>
                <li>✅ Agrega botones con enlaces</li>
              </ul>
              <ul className="space-y-1">
                <li>✅ Usa plantillas prediseñadas</li>
                <li>✅ Variables: {'{{firstName}}'}, {'{{companyName}}'}</li>
                <li>✅ Diseño responsive (móvil/desktop)</li>
                <li>✅ Guarda y reutiliza plantillas</li>
              </ul>
            </div>
          </div>

          {/* AI Image Generator Section */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-lg">
            <button
              onClick={() => setShowAIGenerator(!showAIGenerator)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-purple-900/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Wand2 size={24} className="text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Generador de Imágenes con IA</h3>
                  <p className="text-sm text-slate-300">Crea logos, banners e ilustraciones profesionales con inteligencia artificial</p>
                </div>
              </div>
              {showAIGenerator ? <ChevronUp className="text-purple-400" /> : <ChevronDown className="text-purple-400" />}
            </button>

            {showAIGenerator && (
              <div className="p-4 border-t border-purple-500/30">
                <AIImageGenerator onImageGenerated={handleImageGenerated} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg overflow-hidden" style={{ height: '700px' }}>
            <EmailEditor
              ref={emailEditorRef}
              onReady={onReady}
              options={{
                displayMode: 'email',
                locale: 'es-ES',
                projectId: 1234,
                tools: {
                  image: { enabled: true },
                  button: { enabled: true },
                  divider: { enabled: true },
                  html: { enabled: true },
                  text: { enabled: true },
                  video: { enabled: true },
                  social: { enabled: true },
                },
                features: {
                  imageEditor: true,
                  textEditor: { spellChecker: true },
                },
                appearance: {
                  theme: 'modern_light',
                  panels: { tools: { dock: 'left' } },
                },
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('details')}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Atrás
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Recipients */}
      {step === 'recipients' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users size={20} className="text-purple-400" />
            Seleccionar Destinatarios
          </h2>

          {/* Tabs for source selection */}
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setRecipientSource('portfolio')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                recipientSource === 'portfolio'
                  ? 'text-purple-400 border-purple-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              <Database size={18} />
              Desde Cartera ({recipients.length})
            </button>
            <button
              onClick={() => setRecipientSource('csv')}
              className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                recipientSource === 'csv'
                  ? 'text-purple-400 border-purple-400'
                  : 'text-slate-400 border-transparent hover:text-slate-300'
              }`}
            >
              <FileSpreadsheet size={18} />
              Desde Archivo CSV ({csvRecipients.length})
            </button>
          </div>

          {/* Portfolio Source */}
          {recipientSource === 'portfolio' && (
            <LeadSelector onSelectLeads={handleSelectLeadsFromPortfolio} selectedCount={csvRecipients.length} />
          )}

          {/* CSV Source */}
          {recipientSource === 'csv' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                <Upload size={48} className="text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Importar desde Excel/CSV</h3>
                <p className="text-slate-400 mb-4">
                  Sube un archivo Excel (.xlsx) o CSV con columnas: <strong>email, firstName, lastName, companyName</strong>
                  <br />
                  <span className="text-xs">Puedes cargar miles de contactos - sin límite</span>
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
                >
                  <Upload size={18} />
                  Seleccionar Archivo
                </label>
              </div>

              {csvRecipients.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-300">
                      ✅ {csvRecipients.length.toLocaleString()} destinatarios cargados desde archivo
                    </h3>
                    {recipients.length > 0 && (
                      <p className="text-xs text-green-400">
                        + {recipients.length} de la cartera = {allRecipients.length} total
                      </p>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto bg-slate-900 rounded-lg border border-slate-700 p-4">
                    {csvRecipients.slice(0, 10).map((r, i) => (
                      <div key={i} className="py-2 border-b border-slate-700 last:border-0">
                        <p className="text-white">{r.email}</p>
                        {(r.firstName || r.lastName) && (
                          <p className="text-sm text-slate-400">
                            {r.firstName} {r.lastName} {r.companyName && `- ${r.companyName}`}
                          </p>
                        )}
                      </div>
                    ))}
                    {csvRecipients.length > 10 && (
                      <p className="text-sm text-slate-500 mt-2">... y {(csvRecipients.length - 10).toLocaleString()} contactos más</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {allRecipients.length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-300 font-medium">
                📊 Total de destinatarios: <span className="text-white text-lg">{allRecipients.length.toLocaleString()}</span>
              </p>
              <p className="text-xs text-purple-400 mt-1">
                {recipients.length > 0 && `${recipients.length} de cartera`}
                {recipients.length > 0 && csvRecipients.length > 0 && ' + '}
                {csvRecipients.length > 0 && `${csvRecipients.length} de archivo CSV`}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('design')}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Atrás
            </button>
            <button
              onClick={() => setStep('review')}
              disabled={allRecipients.length === 0}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              Siguiente: Revisar ({allRecipients.length})
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 'review' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white">Revisar y Enviar</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Nombre de Campaña</p>
              <p className="text-white font-medium">{campaignName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Asunto</p>
              <p className="text-white font-medium">{subject}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Destinatarios</p>
              <p className="text-white font-medium">{allRecipients.length} contactos</p>
              {recipients.length > 0 && csvRecipients.length > 0 && (
                <p className="text-xs text-slate-500">
                  ({recipients.length} cartera + {csvRecipients.length} CSV)
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400">Estado</p>
              <p className="text-white font-medium">{scheduledDate ? 'Programada' : 'Envío Inmediato'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('recipients')}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Atrás
            </button>
            <button
              onClick={handleCreateAndSend}
              disabled={createCampaignMutation.isPending || addRecipientsMutation.isPending || sendCampaignMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send size={18} />
              {scheduledDate ? 'Programar Campaña' : 'Enviar Ahora'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
