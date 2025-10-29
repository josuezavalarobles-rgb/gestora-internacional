import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CasoDetalle from './pages/CasoDetalle';
import Tecnicos from './pages/Tecnicos';
import Usuarios from './pages/Usuarios';
import NuevoCaso from './pages/NuevoCaso';
import Reportes from './pages/Reportes';
import Calendario from './pages/Calendario';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/casos/:id" element={<CasoDetalle />} />
          <Route path="/tecnicos" element={<Tecnicos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/nuevo-caso" element={<NuevoCaso />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/calendario" element={<Calendario />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
