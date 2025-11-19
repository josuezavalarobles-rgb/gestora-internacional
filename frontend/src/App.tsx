import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Casos from './pages/Casos';
import CasoDetalle from './pages/CasoDetalle';
import Tecnicos from './pages/Tecnicos';
import Usuarios from './pages/Usuarios';
import NuevoCaso from './pages/NuevoCaso';
import Reportes from './pages/Reportes';
import Calendario from './pages/Calendario';
import CalendarioCitas from './pages/CalendarioCitas';
import Aprobaciones from './pages/Aprobaciones';
import SolicitudesIA from './pages/SolicitudesIA';
import Propietarios from './pages/Propietarios';
import Prospecting from './pages/Prospecting';
import EmailMarketingDashboard from './pages/EmailMarketingDashboard';
import EmailSettings from './pages/EmailSettings';
import Contabilidad from './pages/Contabilidad';
import Gastos from './pages/Gastos';
import Ingresos from './pages/Ingresos';
import ProveedoresPage from './pages/ProveedoresPage';
import AreasComunes from './pages/AreasComunes';
import ControlVisitas from './pages/ControlVisitas';
import Nomina from './pages/Nomina';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/casos" element={<Casos />} />
        <Route path="/casos/:id" element={<CasoDetalle />} />
        <Route path="/tecnicos" element={<Tecnicos />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/propietarios" element={<Propietarios />} />
        <Route path="/nuevo-caso" element={<NuevoCaso />} />
        <Route path="/solicitudes-ia" element={<SolicitudesIA />} />
        <Route path="/citas" element={<CalendarioCitas />} />
        <Route path="/aprobaciones" element={<Aprobaciones />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/prospecting" element={<Prospecting />} />
        <Route path="/email-marketing" element={<EmailMarketingDashboard />} />
        <Route path="/configuracion" element={<EmailSettings />} />
        <Route path="/contabilidad" element={<Contabilidad />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/ingresos" element={<Ingresos />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="/areas-comunes" element={<AreasComunes />} />
        <Route path="/control-visitas" element={<ControlVisitas />} />
        <Route path="/nomina" element={<Nomina />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
