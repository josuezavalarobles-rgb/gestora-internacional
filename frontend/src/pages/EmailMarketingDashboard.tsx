import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Plus, Send, Users, TrendingUp, BarChart3, Eye, MousePointer, XCircle, Clock } from 'lucide-react';
import api from '@/services/api';
import CampaignCreator from './CampaignCreator';
import CampaignStats from './CampaignStats';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELED';
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
}

const STATUS_CONFIG = {
  DRAFT: { label: 'Borrador', color: 'gray', bgClass: 'bg-gray-500/10', textClass: 'text-gray-400', borderClass: 'border-gray-500/30' },
  SCHEDULED: { label: 'Programada', color: 'blue', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400', borderClass: 'border-blue-500/30' },
  SENDING: { label: 'Enviando', color: 'yellow', bgClass: 'bg-yellow-500/10', textClass: 'text-yellow-400', borderClass: 'border-yellow-500/30' },
  SENT: { label: 'Enviada', color: 'green', bgClass: 'bg-green-500/10', textClass: 'text-green-400', borderClass: 'border-green-500/30' },
  PAUSED: { label: 'Pausada', color: 'orange', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400', borderClass: 'border-orange-500/30' },
  CANCELED: { label: 'Cancelada', color: 'red', bgClass: 'bg-red-500/10', textClass: 'text-red-400', borderClass: 'border-red-500/30' },
};

export default function EmailMarketingDashboard() {
  const [showCreator, setShowCreator] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const { data: campaigns, isLoading, refetch } = useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const response = await api.get('/email-marketing/campaigns');
      return response.data as Campaign[];
    },
  });

  const totalSent = campaigns?.reduce((sum, c) => sum + c.sentCount, 0) || 0;
  const totalOpened = campaigns?.reduce((sum, c) => sum + c.openedCount, 0) || 0;
  const totalClicked = campaigns?.reduce((sum, c) => sum + c.clickedCount, 0) || 0;
  const totalBounced = campaigns?.reduce((sum, c) => sum + c.bouncedCount, 0) || 0;

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : '0';

  if (selectedCampaign) {
    return <CampaignStats campaignId={selectedCampaign} onBack={() => setSelectedCampaign(null)} />;
  }

  if (showCreator) {
    return (
      <CampaignCreator
        onClose={() => {
          setShowCreator(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail className="text-purple-400" />
            Email Marketing
          </h1>
          <p className="text-slate-400">Crea y gestiona campañas de email masivo profesionales</p>
        </div>
        <button
          onClick={() => setShowCreator(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus size={18} />
          Nueva Campaña
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Send size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Enviados</p>
              <p className="text-2xl font-bold text-white">{totalSent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-green-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Eye size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Tasa de Apertura</p>
              <p className="text-2xl font-bold text-white">{openRate}%</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{totalOpened.toLocaleString()} aperturas</p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-blue-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <MousePointer size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Tasa de Clicks</p>
              <p className="text-2xl font-bold text-white">{clickRate}%</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{totalClicked.toLocaleString()} clicks</p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-red-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Tasa de Rebote</p>
              <p className="text-2xl font-bold text-white">{bounceRate}%</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{totalBounced.toLocaleString()} rebotes</p>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 size={20} />
            Campañas Recientes
          </h2>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Cargando campañas...</p>
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="divide-y divide-slate-700">
            {campaigns.map((campaign) => {
              const config = STATUS_CONFIG[campaign.status];
              const campaignOpenRate = campaign.sentCount > 0 ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1) : '0';
              const campaignClickRate = campaign.sentCount > 0 ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1) : '0';

              return (
                <div
                  key={campaign.id}
                  className="p-6 hover:bg-slate-750 transition-colors cursor-pointer"
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                        <span className={`px-3 py-1 ${config.bgClass} ${config.textClass} border ${config.borderClass} rounded-full text-xs font-semibold`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{campaign.subject}</p>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-slate-500" />
                          <span className="text-slate-300">{campaign.totalRecipients.toLocaleString()} destinatarios</span>
                        </div>
                        {campaign.sentCount > 0 && (
                          <>
                            <div className="flex items-center gap-2">
                              <Send size={16} className="text-slate-500" />
                              <span className="text-slate-300">{campaign.sentCount.toLocaleString()} enviados</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye size={16} className="text-green-400" />
                              <span className="text-slate-300">{campaignOpenRate}% abiertos</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MousePointer size={16} className="text-blue-400" />
                              <span className="text-slate-300">{campaignClickRate}% clicks</span>
                            </div>
                          </>
                        )}
                        {campaign.scheduledAt && (
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-blue-400" />
                            <span className="text-slate-300">
                              Programada: {new Date(campaign.scheduledAt).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-sm text-slate-400">
                      <p>Creada</p>
                      <p className="text-white">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                      {campaign.sentAt && (
                        <>
                          <p className="mt-2">Enviada</p>
                          <p className="text-white">{new Date(campaign.sentAt).toLocaleDateString()}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Mail size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No hay campañas todavía</h3>
            <p className="text-slate-400 mb-4">Crea tu primera campaña de email marketing</p>
            <button
              onClick={() => setShowCreator(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Crear Primera Campaña
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
