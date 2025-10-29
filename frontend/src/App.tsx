import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CasoDetalle from './pages/CasoDetalle';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/casos/:id" element={<CasoDetalle />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
