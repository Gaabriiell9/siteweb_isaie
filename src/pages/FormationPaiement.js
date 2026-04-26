import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './FormationPaiement.css';
import Icon from '../components/Icon';

export default function FormationPaiement() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Lire les données depuis localStorage (enregistrées après inscription)
    const raw = localStorage.getItem('etc_inscription_success');
    if (raw) {
      try { setData(JSON.parse(raw)); } catch {}
    }
  }, []);

  const successData = JSON.parse(localStorage.getItem('etc_inscription_success') || '{}');
  const draft = JSON.parse(localStorage.getItem('etc_inscription_draft') || '{}');
  const nomComplet = [draft.prenom, draft.nom].filter(Boolean).join(' ') || successData.prenom || 'Futur étudiant';
  const nom = nomComplet;
  const formule = data?.formule || 'integral';
  const isEchelonne = formule === 'echelonne';

  const montantTotal = isEchelonne ? '50 € / mois × 10 mois' : '450 €';
  const montantAujourdhui = isEchelonne ? '50 €' : '450 €';

  const handleStripeClick = () => {
    // TODO: appeler createCheckoutSession puis rediriger vers Stripe
    alert('Le paiement Stripe sera activé très prochainement.\nVous recevrez un email avec les instructions de paiement.');
  };

  return (
    <div className="fp-wrap">
      <div className="fp-container">

        {/* Bandeau SSL */}
        <div className="fp-stripe-banner">
          <span className="fp-stripe-icon"><Icon name="lock" size={18} /></span>
          <span>Paiement sécurisé 100 % SSL — Propulsé par Stripe</span>
          <span className="fp-stripe-lock">stripe.com</span>
        </div>

        <div className="fp-card">
          <div className="fp-eyebrow">Formation Théologie Biblique</div>
          <h1 className="fp-title">Finaliser <br />votre inscription</h1>

          {/* Récapitulatif */}
          <div className="fp-recap">
            <div className="fp-recap-row">
              <span className="fp-recap-key">Étudiant</span>
              <span className="fp-recap-val">{nom}</span>
            </div>
            <div className="fp-recap-row">
              <span className="fp-recap-key">Formation</span>
              <span className="fp-recap-val">Théologie Biblique — 6 modules</span>
            </div>
            <div className="fp-recap-row">
              <span className="fp-recap-key">Formule</span>
              <span className="fp-recap-val">{isEchelonne ? 'Paiement échelonné' : 'Paiement intégral'}</span>
            </div>
            <div className="fp-recap-row">
              <span className="fp-recap-key">Total</span>
              <span className="fp-recap-val fp-recap-total">{montantTotal}</span>
            </div>
            {isEchelonne && (
              <div className="fp-recap-row">
                <span className="fp-recap-key">Aujourd'hui</span>
                <span className="fp-recap-val">{montantAujourdhui}</span>
              </div>
            )}
          </div>

          {/* Notice */}
          <div className="fp-notice">
            <span className="fp-notice-icon"><Icon name="hourglass" size={20} /></span>
            <div>
              <strong>Paiement Stripe — Bientôt disponible</strong>
              <p>
                Le système de paiement automatisé via Stripe sera activé prochainement.
                En attendant, vous recevrez un email avec les coordonnées bancaires pour
                finaliser votre paiement. Votre espace élève est déjà accessible.
              </p>
            </div>
          </div>

          {/* Bouton Stripe (désactivé pour l'instant) */}
          <button className="fp-btn-stripe" onClick={handleStripeClick} disabled>
            <span><Icon name="credit-card" size={18} /></span>
            <span>Procéder au paiement sécurisé</span>
          </button>

          <div className="fp-divider">ou</div>

          {/* Accès dashboard */}
          <Link to="/eleve/dashboard" className="fp-btn-dashboard">
            Accéder à mon espace élève →
          </Link>

          <p className="fp-fine-print">
            Votre compte est créé. Vous pouvez commencer à explorer votre espace
            en attendant la confirmation de paiement.
          </p>
        </div>
      </div>
    </div>
  );
}
