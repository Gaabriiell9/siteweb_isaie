import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './FormationInscriptionSuccess.css';

export default function FormationInscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/formation/inscription');
      return;
    }

    const stored = localStorage.getItem('etc_inscription_pending');
    if (stored) {
      setInfo(JSON.parse(stored));
      localStorage.removeItem('etc_inscription_pending');
    } else {
      setInfo({ email: '', prenom: '', formule: '', formule_nom: '' });
    }
  }, [navigate, searchParams]);

  const formatEuros = (cents) => {
    if (!cents && cents !== 0) return '';
    return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' euros';
  };

  if (!info) return null;

  return (
    <div className="fis-wrap">
      <div className="fis-container">

        <div className="fis-check-wrap">
          <svg className="fis-check-svg" viewBox="0 0 80 80" fill="none">
            <circle className="fis-check-circle" cx="40" cy="40" r="38" stroke="var(--or)" strokeWidth="3" fill="none" />
            <polyline className="fis-check-mark" points="20,42 34,56 60,26"
              stroke="var(--or)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>

        <h1 className="fis-title">
          Paiement confirme !
        </h1>

        <p className="fis-subtitle">
          {info.prenom ? `Bienvenue ${info.prenom} dans la formation theologique !` : 'Bienvenue dans la formation theologique !'}
        </p>

        <div className="fis-recap">
          {info.email && (
            <div className="fis-recap-row">
              <span className="fis-recap-key">Email</span>
              <span className="fis-recap-val">{info.email}</span>
            </div>
          )}
          {info.formule_nom && (
            <div className="fis-recap-row">
              <span className="fis-recap-key">Formule</span>
              <span className="fis-recap-val">
                {info.formule_nom}
                {info.formule_prix_total_cents ? ` - ${formatEuros(info.formule_prix_total_cents)}` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="fis-info-box">
          <p><strong>Verifiez votre boite email</strong></p>
          <p>Un email vous a ete envoye pour creer votre mot de passe et acceder a votre espace eleve. Pensez a verifier vos spams si vous ne le voyez pas.</p>
        </div>

        <Link to="/" className="fis-btn">
          Retour a l'accueil
        </Link>

        <Link to="/formation" className="fis-link-back">
          Retour a la formation
        </Link>
      </div>
    </div>
  );
}
