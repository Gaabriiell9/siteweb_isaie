import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getPaiements } from '../lib/supabase';

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

export default function ElevePaiements() {
  const { eleve } = useEleve();
  const [paiements, setPaiements] = useState([]);

  useEffect(() => {
    if (!eleve) return;
    getPaiements(eleve.id).then(setPaiements);
  }, [eleve]);

  const totalPaye = paiements.filter(p => p.statut === 'reussi').reduce((s, p) => s + Number(p.montant), 0);
  const totalFormule = eleve?.formule === 'integral' ? 450 : 500;

  // Planning 10 mensualités pour formule échelonnée
  const planning = eleve?.formule === 'echelonne'
    ? (() => {
        const dateDebut = eleve?.date_inscription ? new Date(eleve.date_inscription) : new Date();
        return Array.from({ length: 10 }, (_, i) => {
          const date = new Date(dateDebut);
          date.setMonth(date.getMonth() + i);
          const paiementExistant = paiements.find(p => {
            const dp = new Date(p.date_paiement);
            return dp.getMonth() === date.getMonth() && dp.getFullYear() === date.getFullYear();
          });
          return {
            num: i + 1,
            date: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            montant: 50,
            statut: paiementExistant ? (paiementExistant.statut === 'reussi' ? 'reussi' : 'en_attente') : (date < new Date() ? 'en_attente' : 'en_attente'),
          };
        });
      })()
    : [];

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>paiements</em></h1>
      <p className="eleve-page-sub">{eleve?.formule === 'integral' ? 'Formule intégrale · 450 €' : 'Formule échelonnée · 50 €/mois × 10'}</p>

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
          <div className="eleve-stat-value">{paiements.filter(p => p.statut === 'reussi').length}<span className="eleve-stat-unit"> / {eleve?.formule === 'integral' ? 1 : 10}</span></div>
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
      {eleve?.formule === 'echelonne' && (
        <div className="eleve-paiement-planning">
          <div className="eleve-planning-titre">Planning des 10 mensualités</div>
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
