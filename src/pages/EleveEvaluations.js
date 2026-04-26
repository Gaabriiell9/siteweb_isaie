import React, { useEffect, useState } from 'react';
import { useEleve } from './EleveLayout';
import { getEvaluations } from '../lib/supabase';

const TYPE_LABEL = { partiel: 'Partiel', final: 'Final', devoir: 'Devoir' };
const TYPE_CSS   = { partiel: 'eleve-badge--blue', final: 'eleve-badge--gold', devoir: 'eleve-badge--grey' };

function noteColor(note, max) {
  const pct = note / max * 20;
  if (pct >= 16) return '#27500A';
  if (pct >= 12) return 'var(--bordeaux-clair)';
  return '#791F1F';
}

export default function EleveEvaluations() {
  const { eleve } = useEleve();
  const [evals, setEvals] = useState([]);

  useEffect(() => {
    if (!eleve) return;
    getEvaluations(eleve.id).then(setEvals);
  }, [eleve]);

  const moyenne = evals.length
    ? (evals.reduce((s, e) => s + (e.note / e.note_max * 20), 0) / evals.length).toFixed(1)
    : null;

  const maxNote = 20;

  return (
    <div>
      <h1 className="eleve-page-title">Mes <em>évaluations</em></h1>
      <p className="eleve-page-sub">{evals.length} évaluation{evals.length !== 1 ? 's' : ''} enregistrée{evals.length !== 1 ? 's' : ''}</p>

      {/* ── Moyenne hero ── */}
      {moyenne && (
        <div className="eleve-moyenne-hero">
          <div className="eleve-moyenne-num">{moyenne}<small>/20</small></div>
          <div>
            <div className="eleve-moyenne-label">Note moyenne générale</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: 'var(--texte-doux)', marginTop: 4 }}>
              Sur {evals.length} évaluation{evals.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* ── Graphique barres ── */}
      {evals.length > 0 && (
        <div className="eleve-card" style={{ marginBottom: 24, padding: '24px 24px 16px' }}>
          <div className="eleve-section-titre" style={{ marginBottom: 20 }}>Progression <em>visuelle</em></div>
          <div className="eleve-chart">
            {evals.map(ev => (
              <div className="eleve-chart-col" key={ev.id}>
                <div className="eleve-chart-bar-wrap">
                  <div
                    className="eleve-chart-bar"
                    style={{ height: `${(ev.note / ev.note_max) * 100}%`, background: noteColor(ev.note, ev.note_max) === '#27500A' ? '#4a8a18' : noteColor(ev.note, ev.note_max) === '#791F1F' ? '#E24B4A' : 'var(--or)' }}
                    title={`${ev.titre} : ${ev.note}/${ev.note_max}`}
                  />
                </div>
                <div className="eleve-chart-label">{ev.note}/{ev.note_max}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tableau ── */}
      <div className="eleve-card" style={{ padding: 0 }}>
        {evals.length === 0 ? (
          <p style={{ padding: 32, fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--texte-doux)', textAlign: 'center', fontSize: 16 }}>
            Aucune évaluation pour l'instant.
          </p>
        ) : (
          <div className="eleve-table-wrap">
            <table className="eleve-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Type</th>
                  <th>Titre</th>
                  <th>Note</th>
                  <th>Date</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {evals.map(ev => (
                  <tr key={ev.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{ev.module_titre}</td>
                    <td><span className={`eleve-badge ${TYPE_CSS[ev.type] || 'eleve-badge--grey'}`}>{TYPE_LABEL[ev.type] || ev.type}</span></td>
                    <td><strong>{ev.titre}</strong></td>
                    <td style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: noteColor(ev.note, ev.note_max), whiteSpace: 'nowrap' }}>
                      {ev.note} <span style={{ fontSize: 11, color: 'var(--texte-doux)' }}>/{ev.note_max}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(ev.date_eval).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ fontStyle: 'italic', fontSize: 12, maxWidth: 200 }}>{ev.commentaire || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
