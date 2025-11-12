import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface UrgenciaChartProps {
  data: Array<{ urgencia: string; cantidad: number }>;
}

const COLORS = {
  critica: '#DC2626', // red-600
  alta: '#EA580C', // orange-600
  media: '#F59E0B', // amber-500
  baja: '#3B82F6', // blue-500
};

const GRADIENTS = {
  critica: 'url(#gradientCritica)',
  alta: 'url(#gradientAlta)',
  media: 'url(#gradientMedia)',
  baja: 'url(#gradientBaja)',
};

const LABELS = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export default function UrgenciaChart({ data }: UrgenciaChartProps) {
  const chartData = data.map(item => ({
    name: LABELS[item.urgencia as keyof typeof LABELS] || item.urgencia,
    value: item.cantidad,
    urgencia: item.urgencia,
  }));

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700">
      <h3 className="text-2xl font-bold text-white mb-6">Solicitudes por Urgencia</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <defs>
            <linearGradient id="gradientCritica" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={1}/>
              <stop offset="100%" stopColor="#991B1B" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="gradientAlta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity={1}/>
              <stop offset="100%" stopColor="#C2410C" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="gradientMedia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity={1}/>
              <stop offset="100%" stopColor="#D97706" stopOpacity={1}/>
            </linearGradient>
            <linearGradient id="gradientBaja" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            style={{ fontSize: '14px', fontWeight: 500 }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: '14px', fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Bar dataKey="value" radius={[12, 12, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={GRADIENTS[entry.urgencia as keyof typeof GRADIENTS] || '#3B82F6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div key={item.urgencia} className="flex items-center justify-between bg-slate-700 bg-opacity-50 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: COLORS[item.urgencia as keyof typeof COLORS] || '#3B82F6' }}
              />
              <span className="text-sm text-gray-200 font-medium">{item.name}</span>
            </div>
            <span className="text-lg font-bold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
