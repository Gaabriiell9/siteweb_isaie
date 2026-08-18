import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getPaiements, getFormulePaiementById } from '../lib/supabase';

const STATUT_CSS = {
  reussi:      'eleve-badge--green',
  en_attente:  'eleve-badge--orange',
  echec:       'eleve-badge--red',
  rembourse:   'eleve-badge--grey',
};
const STATUT_LABEL = {
  reussi:     'Réussi',
  en_attente: 'En attente',
  echec:      'Échec',
  rembourse:  'Remboursé',
};
const TYPE_LABEL = {
  integral:    'Paiement intégral',
  mensualite:  'Mensualité',
  remboursement: 'Remboursement',
};

const formatEuros = (cents) => {
  if (!cents && cents !== 0) return '—';
  return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
};

export default function ElevePaiements() {
  const { eleve } = useEleve();
  const [paiements, setPaiements] = useState([]);
  const [formuleData, setFormuleData] = useState(null);

  useEffect(() => {
    if (!eleve) return;
    getPaiements(eleve.id).then(setPaiements);
    if (eleve.formule_id) {
      getFormulePaiementById(eleve.formule_id).then(setFormuleData);
    }
  }, [eleve]);

  const totalPaye = paiements.filter(p => p.statut === 'reussi').reduce((s, p) => s + Number(p.montant), 0);
  const totalFormuleCents = formuleData?.prix_total || (eleve?.formule === 'integral' ? 45000 : 50000);
  const totalFormule = totalFormuleCents / 100;
  const montantEcheance = formuleData?.montant_echeance ? formuleData.montant_echeance / 100 : 50;
  const nombreEcheances = formuleData?.nombre_echeances || 10;

  const isEchelonne = formuleData?.type === 'echelonne' || eleve?.formule === 'echelonne';

  // Planning des mensualités pour formule échelonnée
  const planning = isEchelonne
    ? (() => {
        const dateDebut = eleve?.date_inscription ? new Date(eleve.date_inscription) : new Date();
        return Array.from({ length: nombreEcheances }, (_, i) => {
          const date = new Date(dateDebut);
          date.setMonth(date.getMonth() + i);
          const paiementExistant = paiements.find(p => {
            const dp = new Date(p.date_paiement);
            return dp.getMonth() === date.getMonth() && dp.getFullYear() === date.getFullYear();
          });
          return {
            num: i + 1,
            date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            montant: montantEcheance,
            statut: paiementExistant ? (paiementExistant.statut === 'reussi' ? 'reussi' : 'en_attente') : 'en_attente',
          };
        });
      })()
    : [];

  const getFormuleLabel = () => {
    if (formuleData) {
      if (formuleData.type === 'echelonne') {
        return `${formuleData.nom} · ${formatEuros(formuleData.montant_echeance)}/mois × ${formuleData.nombre_echeances}`;
      }
      return `${formuleData.nom} · ${formatEuros(formuleData.prix_total)}`;
    }
    return isEchelonne ? `Formule échelonnée · ${montantEcheance} €/mois × ${nombreEcheances}` : `Formule intégrale · ${totalFormule} €`;
  };

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>paiements</em></h1>
      <p className="eleve-page-sub">{getFormuleLabel()}</p>

      {/* ── Résumé ── */}
      <div className="eleve-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Total réglé</div>
          <div className="eleve-stat-value">{totalPaye}<span className="eleve-stat-unit"> €</span></div>
        </div>
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Restant dû</div>
          <div className="eleve-stat-value">{Math.max(0, totalFormule - totalPaye)}<span className="eleve-stat-unit"> €</span></div>
        </div>
        <div className="eleve-stat-card">
          <div className="eleve-stat-label">Versements</div>
          <div className="eleve-stat-value">{paiements.filter(p => p.statut === 'reussi').length}<span className="eleve-stat-unit"> / {isEchelonne ? nombreEcheances : 1}</span></div>
        </div>
      </div>

      {/* ── Historique ── */}
      <div className="eleve-section-titre" style={{ marginBottom: 12 }}>Historique <em>des versements</em></div>
      <div className="eleve-card" style={{ padding: 0, marginBottom: 28 }}>
        {paiements.length === 0 ? (
          <p style={{ padding: 32, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--texte-doux)', textAlign: 'center', fontSize: 16 }}>
            Aucun paiement enregistré.
          </p>
        ) : (
          <div className="eleve-table-wrap">
            <table className="eleve-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Méthode</th>
                  <th>Référence</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map(p => (
                  <tr key={p.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(p.date_paiement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td><strong>{p.montant} {p.devise}</strong></td>
                    <td>{TYPE_LABEL[p.type_paiement] || p.type_paiement}</td>
                    <td>{p.methode || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--or)' }}>{p.reference || '—'}</td>
                    <td><span className={`eleve-badge ${STATUT_CSS[p.statut] || 'eleve-badge--grey'}`}>{STATUT_LABEL[p.statut] || p.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Planning (échelonné) ── */}
      {isEchelonne && (
        <div className="eleve-paiement-planning">
          <div className="eleve-planning-titre">Planning des {nombreEcheances} mensualités</div>
          {planning.map(item => (
            <div className="eleve-planning-row" key={item.num}>
              <span className="eleve-planning-num">{String(item.num).padStart(2, '0')}</span>
              <span className="eleve-planning-date">{item.date}</span>
              <span className="eleve-planning-amount">{item.montant} €</span>
              <span className={`eleve-badge ${STATUT_CSS[item.statut] || 'eleve-badge--grey'}`} style={{ marginLeft: 8 }}>
                {STATUT_LABEL[item.statut] || item.statut}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
