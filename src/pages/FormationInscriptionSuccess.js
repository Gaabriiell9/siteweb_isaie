import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './FormationInscriptionSuccess.css';
import Icon from '../components/Icon';

export default function FormationInscriptionSuccess() {
  const navigate = useNavigate();
  const [info, setInfo] = useState({ email: '', formule: '', prenom: '' });
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const stored = localStorage.getItem('etc_inscription_success');
    if (!stored) { navigate('/formation/inscription'); return; }
    setInfo(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); navigate('/eleve/login'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  const formuleLabel = info.formule === 'integral'
    ? 'Paiement intégral — 450 €'
    : 'Paiement échelonné — 50 €/mois';

  return (
    <div className="fis-wrap">
      <div className="fis-container">

        {/* Check animé */}
        <div className="fis-check-wrap">
          <svg className="fis-check-svg" viewBox="0 0 80 80" fill="none">
            <circle className="fis-check-circle" cx="40" cy="40" r="38" stroke="#27ae60" strokeWidth="3" fill="none" />
            <polyline className="fis-check-mark" points="20,42 34,56 60,26"
              stroke="#27ae60" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <h1 className="fis-title">
          Bienvenue dans la formation<br />
          <em>Théologie Biblique !</em>
        </h1>

        <p className="fis-subtitle">Votre compte a été créé avec succès.</p>

        {/* Récap */}
        <div className="fis-recap">
          <div className="fis-recap-row">
            <span className="fis-recap-key">Email</span>
            <span className="fis-recap-val">{info.email}</span>
          </div>
          <div className="fis-recap-row">
            <span className="fis-recap-key">Formule</span>
            <span className="fis-recap-val">{formuleLabel}</span>
          </div>
        </div>

        {/* Info paiement */}
        <div className="fis-payment-notice">
          <div className="fis-payment-icon"><Icon name="envelope" size={32} /></div>
          <div>
            <strong>Instructions de paiement</strong>
            <p>Les instructions de paiement vous seront envoyées par email sous 48h. Vérifiez votre boîte de réception (et vos spams).</p>
          </div>
        </div>

        <Link to="/eleve/login" className="fis-btn">
          Accéder à mon espace élève →
        </Link>

        <p className="fis-redirect-notice">
          Redirection automatique dans <strong>{countdown}</strong> seconde{countdown > 1 ? 's' : ''}…
        </p>

        <Link to="/formation" className="fis-link-back">
          ← Retour à la formation
        </Link>
      </div>
    </div>
  );
}
