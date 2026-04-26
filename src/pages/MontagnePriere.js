import React, { useState, useEffect } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getAllMessages, getMessagesDuJour } from '../lib/supabase';
import './MontagnePriere.css';


export default function MontagnePriere() {
  const [messages, setMessages] = useState([]);
  const [today, setToday] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllMessages(), getMessagesDuJour()]).then(([all, t]) => {
      setMessages(all); setToday(t); setLoading(false);
    });
  }, []);

  return (
    <div>
      <SectionHeader dark label="Prière" title="Montagne de" titleEm="Prière" subtitle="Les 12 familles des fils de Jacob · Un message chaque jour" />
      <div className="mp-wrap">
        <div className="container">
          {loading && <p style={{color:'var(--texte-doux)',padding:'20px 0'}}>Chargement…</p>}

          {/* Message du jour */}
          {today && (
            <div className="mp-today">
              <p className="mp-today-eyebrow">✦ Message du jour ✦</p>
              <div className="mp-today-famille">{today.famille}</div>
              {today.verset && <p className="mp-today-verset">{today.verset}</p>}
              {today.titre && <h3 className="mp-today-titre">{today.titre}</h3>}
              <p className="mp-today-contenu">{today.contenu}</p>
            </div>
          )}
          {!loading && !today && (
            <div className="mp-today">
              <p className="mp-today-eyebrow">✦ Montagne de Prière ✦</p>
              <p className="mp-today-contenu" style={{marginTop:12}}>Le message du jour sera publié bientôt.</p>
            </div>
          )}

          {/* Grille familles */}
          {messages.length > 0 && (
            <>
              <h3 className="mp-grid-title">Les 12 <em>familles</em></h3>
              <div className="mp-grid">
                {messages.map((m, i) => (
                  <div key={m.id}
                    className={`mp-tile ${today?.id === m.id ? 'today' : ''}`}
                    onClick={() => setSelected(selected === m.id ? null : m.id)}
                  >
                    {today?.id === m.id && <div className="mp-badge-today">Aujourd'hui</div>}
                    <div className="mp-tile-initial">{m.famille[0]}</div>
                    <div className="mp-tile-nom">{m.famille}</div>
                    <div className="mp-tile-jour">{m.jour_semaine}</div>
                  </div>
                ))}
              </div>

              {selected && messages.find(m => m.id === selected) && (
                <div className="mp-expanded">
                  <p className="mp-exp-verset">{messages.find(m=>m.id===selected).verset}</p>
                  <h4 className="mp-exp-titre">{messages.find(m=>m.id===selected).titre}</h4>
                  <p className="mp-exp-contenu">{messages.find(m=>m.id===selected).contenu}</p>
                </div>
              )}
            </>
          )}

          <div className="encart-or" style={{marginTop:24}}>
            <span>✦</span>
            Les messages de prière sont préparés par le service de prédication de l'Église Temple de la Célébration.
          </div>
        </div>
      </div>
    </div>
  );
}
