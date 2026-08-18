import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FormationPaiement.css';
import Icon from '../components/Icon';
import { getModulesCount } from '../lib/supabase';

export default function FormationPaiement() {
  const [modulesCount, setModulesCount] = useState(null);

  useEffect(() => {
    getModulesCount().then(setModulesCount);
  }, []);

  const successData = JSON.parse(localStorage.getItem('etc_inscription_success') || '{}');
  const draft = JSON.parse(localStorage.getItem('etc_inscription_draft') || '{}');
  const formuleData = JSON.parse(localStorage.getItem('etc_formule_selectionnee') || '{}');

  const nomComplet = [draft.prenom, draft.nom].filter(Boolean).join(' ') || successData.prenom || 'Futur étudiant';
  const isEchelonne = formuleData.type === 'echelonne';

  const formatEuros = (cents) => {
    if (!cents && cents !== 0) return '—';
    return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
  };

  const getMontantTotal = () => {
    if (!formuleData.prix_total) return '—';
    if (isEchelonne) {
      return `${formatEuros(formuleData.montant_echeance)} / mois × ${formuleData.nombre_echeances || 10} mois`;
    }
    return formatEuros(formuleData.prix_total);
  };

  const getMontantAujourdhui = () => {
    if (isEchelonne) {
      return formatEuros(formuleData.montant_echeance);
    }
    return formatEuros(formuleData.prix_total);
  };

  const handleStripeClick = () => {
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
              <span className="fp-recap-val">{nomComplet}</span>
            </div>
            <div className="fp-recap-row">
              <span className="fp-recap-key">Formation</span>
              <span className="fp-recap-val">
                Théologie Biblique — {modulesCount !== null ? `${modulesCount} modules` : '…'}
              </span>
            </div>
            <div className="fp-recap-row">
              <span className="fp-recap-key">Formule</span>
              <span className="fp-recap-val">{formuleData.nom || (isEchelonne ? 'Paiement échelonné' : 'Paiement intégral')}</span>
            </div>
            <div className="fp-recap-row">
              <span className="fp-recap-key">Total</span>
              <span className="fp-recap-val fp-recap-total">{getMontantTotal()}</span>
            </div>
            {isEchelonne && (
              <div className="fp-recap-row">
                <span className="fp-recap-key">Aujourd'hui</span>
                <span className="fp-recap-val">{getMontantAujourdhui()}</span>
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
