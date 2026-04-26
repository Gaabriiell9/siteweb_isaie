import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cultes from './pages/Cultes';
import MontagnePriere from './pages/MontagnePriere';
import Predication from './pages/Predication';
import Cellule from './pages/Cellule';
import Formation from './pages/Formation';
import FormationInscription from './pages/FormationInscription';
import FormationInscriptionSuccess from './pages/FormationInscriptionSuccess';
import Dons from './pages/Dons';
import Pasteur from './pages/Pasteur';
import Admin from './pages/Admin';
import EleveLogin from './pages/EleveLogin';
import EleveLayout from './pages/EleveLayout';
import EleveDashboard from './pages/EleveDashboard';
import EleveModules from './pages/EleveModules';
import EleveEvaluations from './pages/EleveEvaluations';
import ElevePaiements from './pages/ElevePaiements';
import EleveProfil from './pages/EleveProfil';
import EleveCours from './pages/EleveCours';
import EleveMessages from './pages/EleveMessages';
import FormationPaiement from './pages/FormationPaiement';
import ProtectedRoute from './components/ProtectedRoute';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.key} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/cultes" element={<Cultes />} />
        <Route path="/montagne-priere" element={<MontagnePriere />} />
        <Route path="/predication" element={<Predication />} />
        <Route path="/cellule" element={<Cellule />} />
        <Route path="/formation" element={<Formation />} />
        <Route path="/formation/inscription" element={<FormationInscription />} />
        <Route path="/formation/inscription/success" element={<FormationInscriptionSuccess />} />
        <Route path="/formation/paiement" element={<FormationPaiement />} />
        <Route path="/dons" element={<Dons />} />
        <Route path="/pasteur" element={<Pasteur />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page admin — sans navbar/footer, sans animation */}
        <Route path="/admin" element={<Admin />} />

        {/* Espace élève — sans navbar/footer public */}
        <Route path="/eleve/login" element={<EleveLogin />} />
        <Route path="/eleve" element={<ProtectedRoute><EleveLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"   element={<EleveDashboard />} />
          <Route path="modules"     element={<EleveModules />} />
          <Route path="evaluations" element={<EleveEvaluations />} />
          <Route path="paiements"   element={<ElevePaiements />} />
          <Route path="profil"      element={<EleveProfil />} />
          <Route path="cours"      element={<EleveCours />} />
          <Route path="messages"   element={<EleveMessages />} />
        </Route>

        {/* Site public */}
        <Route path="/*" element={
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
