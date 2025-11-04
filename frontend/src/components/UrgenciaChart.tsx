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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes por Urgencia</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.urgencia as keyof typeof COLORS] || '#6B7280'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div key={item.urgencia} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.urgencia as keyof typeof COLORS] || '#6B7280' }}
              />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
