import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Eye, MousePointer, XCircle, CheckCircle, Clock, Users, TrendingUp } from 'lucide-react';
import api from '@/services/api';

interface CampaignStatsProps {
  campaignId: string;
  onBack: () => void;
}

interface Stats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  byStatus: Record<string, number>;
}

export default function CampaignStats({ campaignId, onBack }: CampaignStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['campaign-stats', campaignId],
    queryFn: async () => {
      const response = await api.get(`/email-marketing/campaigns/${campaignId}/stats`);
      return response.data as Stats;
    },
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Estadísticas de Campaña</h1>
          <p className="text-slate-400">Análisis en tiempo real del rendimiento</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Users size={20} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Destinatarios</p>
              <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg border border-blue-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Mail size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Enviados</p>
              <p className="text-2xl font-bold text-white">{stats.sent.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0}% del total
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-green-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Entregados</p>
              <p className="text-2xl font-bold text-white">{stats.delivered.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0}% de enviados
          </p>
        </div>

        <div className="bg-slate-800 rounded-lg border border-red-500/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Rebotados</p>
              <p className="text-2xl font-bold text-white">{stats.bounced.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">{stats.bounceRate.toFixed(1)}% tasa de rebote</p>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-lg border border-green-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Eye size={24} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tasa de Apertura</p>
                <p className="text-3xl font-bold text-white">{stats.openRate.toFixed(1)}%</p>
              </div>
            </div>
            <TrendingUp size={32} className="text-green-400/20" />
          </div>
          <p className="text-sm text-slate-400">{stats.opened.toLocaleString()} emails abiertos</p>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(stats.openRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-lg border border-blue-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <MousePointer size={24} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tasa de Clicks</p>
                <p className="text-3xl font-bold text-white">{stats.clickRate.toFixed(1)}%</p>
              </div>
            </div>
            <MousePointer size={32} className="text-blue-400/20" />
          </div>
          <p className="text-sm text-slate-400">{stats.clicked.toLocaleString()} clicks registrados</p>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(stats.clickRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-lg border border-orange-500/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Clock size={24} className="text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Cancelaciones</p>
                <p className="text-3xl font-bold text-white">{stats.unsubscribed.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {stats.sent > 0 ? ((stats.unsubscribed / stats.sent) * 100).toFixed(2) : 0}% de enviados
          </p>
          <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${stats.sent > 0 ? Math.min((stats.unsubscribed / stats.sent) * 100, 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Desglose por Estado</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="bg-slate-900 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">{status}</p>
              <p className="text-xl font-bold text-white">{count.toLocaleString()}</p>
              <p className="text-xs text-slate-500">
                {stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">Análisis de Rendimiento</h3>
        <div className="space-y-2 text-sm text-blue-400">
          {stats.openRate > 20 && (
            <p>✅ Excelente tasa de apertura ({stats.openRate.toFixed(1)}%). Tu asunto es efectivo.</p>
          )}
          {stats.openRate < 15 && (
            <p>💡 La tasa de apertura está por debajo del promedio. Considera mejorar el asunto del email.</p>
          )}
          {stats.clickRate > 3 && (
            <p>✅ Gran tasa de clicks ({stats.clickRate.toFixed(1)}%). Tu contenido es atractivo.</p>
          )}
          {stats.bounceRate > 5 && (
            <p>⚠️ Alta tasa de rebote ({stats.bounceRate.toFixed(1)}%). Revisa la calidad de tu lista de contactos.</p>
          )}
          {stats.bounceRate < 2 && (
            <p>✅ Excelente calidad de lista. Baja tasa de rebote ({stats.bounceRate.toFixed(1)}%).</p>
          )}
        </div>
      </div>
    </div>
  );
}
