import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const Cultes = lazy(() => import('./pages/Cultes'));
const MontagnePriere = lazy(() => import('./pages/MontagnePriere'));
const Predication = lazy(() => import('./pages/Predication'));
const Cellule = lazy(() => import('./pages/Cellule'));
const Formation = lazy(() => import('./pages/Formation'));
const FormationInscription = lazy(() => import('./pages/FormationInscription'));
const FormationInscriptionSuccess = lazy(() => import('./pages/FormationInscriptionSuccess'));
const FormationPaiement = lazy(() => import('./pages/FormationPaiement'));
const Dons = lazy(() => import('./pages/Dons'));
const Pasteur = lazy(() => import('./pages/Pasteur'));
const Admin = lazy(() => import('./pages/Admin'));
const EleveLogin = lazy(() => import('./pages/EleveLogin'));
const EleveLayout = lazy(() => import('./pages/EleveLayout'));
const EleveDashboard = lazy(() => import('./pages/EleveDashboard'));
const EleveModules = lazy(() => import('./pages/EleveModules'));
const EleveEvaluations = lazy(() => import('./pages/EleveEvaluations'));
const ElevePaiements = lazy(() => import('./pages/ElevePaiements'));
const EleveProfil = lazy(() => import('./pages/EleveProfil'));
const EleveCours = lazy(() => import('./pages/EleveCours'));
const EleveMessages = lazy(() => import('./pages/EleveMessages'));

const fallback = (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--or)' }}>
    Chargement...
  </div>
);

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
      <Suspense fallback={fallback}>
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
      </Suspense>
    </BrowserRouter>
  );
}
