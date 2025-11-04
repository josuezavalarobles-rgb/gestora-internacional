import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SolicitudesChartProps {
  data: Array<{ tipo: string; cantidad: number }>;
}

const COLORS = {
  mantenimiento: '#3B82F6', // blue
  pago: '#10B981', // green
  reserva: '#F59E0B', // amber
  acceso: '#8B5CF6', // purple
  emergencia: '#EF4444', // red
  consulta: '#6B7280', // gray
};

const LABELS = {
  mantenimiento: 'Mantenimiento',
  pago: 'Pagos',
  reserva: 'Reservas',
  acceso: 'Accesos',
  emergencia: 'Emergencias',
  consulta: 'Consultas',
};

export default function SolicitudesChart({ data }: SolicitudesChartProps) {
  const chartData = data.map(item => ({
    name: LABELS[item.tipo as keyof typeof LABELS] || item.tipo,
    value: item.cantidad,
    tipo: item.tipo,
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Solicitudes por Tipo</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.tipo as keyof typeof COLORS] || '#6B7280'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div key={item.tipo} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[item.tipo as keyof typeof COLORS] || '#6B7280' }}
            />
            <span className="text-sm text-gray-600">
              {item.name}: <span className="font-medium text-gray-900">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
