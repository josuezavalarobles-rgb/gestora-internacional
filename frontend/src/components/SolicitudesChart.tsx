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
  consulta: '#06B6D4', // cyan
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
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl p-6 border border-slate-700">
      <h3 className="text-2xl font-bold text-white mb-6">Solicitudes por Tipo</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={110}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            stroke="#1e293b"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.tipo as keyof typeof COLORS] || '#06B6D4'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Legend
            wrapperStyle={{ color: '#fff' }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {chartData.map((item) => (
          <div key={item.tipo} className="flex items-center justify-between bg-slate-700 bg-opacity-50 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full shadow-lg"
                style={{ backgroundColor: COLORS[item.tipo as keyof typeof COLORS] || '#06B6D4' }}
              />
              <span className="text-sm text-gray-200 font-medium">
                {item.name}
              </span>
            </div>
            <span className="text-lg font-bold text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
