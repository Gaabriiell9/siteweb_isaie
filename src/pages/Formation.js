import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import './Formation.css';

const FAQ = [
  {
    q: 'Comment se passe l\'inscription ?',
    a: 'Remplissez le formulaire en ligne, choisissez votre formule de paiement, puis notre équipe vous contacte sous 48 h pour confirmer votre place et vous donner accès à l\'espace de formation.',
  },
  {
    q: 'Puis-je changer de formule en cours de route ?',
    a: 'Oui. Si vous avez opté pour le paiement échelonné, vous pouvez à tout moment régler le solde restant pour basculer sur la formule intégrale et accéder immédiatement à tous les modules.',
  },
  {
    q: 'Que se passe-t-il si j\'arrête en cours de formation ?',
    a: 'En cas d\'arrêt, les mensualités déjà réglées ne sont pas remboursées. Les modules débloqués restent accessibles. Notre équipe pastorale reste disponible pour vous accompagner.',
  },
  {
    q: 'Recevrai-je un certificat à la fin ?',
    a: 'Oui. Un certificat de formation en Théologie Biblique délivré par l\'Église Temple de la Célébration est remis à tout étudiant ayant complété les 6 modules.',
  },
];

const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function Formation() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div>
      <SectionHeader
        dark
        label="Formation"
        title="Théologie"
        titleEm="Biblique"
        subtitle="12 mois · 6 modules · Certificat final"
        actions={<>
          <Link to="/eleve/login" className="fsh-btn fsh-btn--outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Espace élève
          </Link>
          <Link to="/formation/inscription" className="fsh-btn fsh-btn--primary">
            S'inscrire
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </>}
      />

      <div className="form-wrap">
        <div className="container">

          {/* ── Présentation ── */}
          <section className="form-section">
            <h2 className="form-section-titre">La <em>formation</em></h2>
            <div className="form-pres-texte">
              <p className="form-pres-p">
                Le programme de Formation en Théologie Biblique de l'Église Temple de la Célébration est conçu pour équiper chaque croyant dans sa compréhension des Écritures et son service au sein du Corps de Christ. Fondé sur la rigueur académique et la profondeur spirituelle, il accompagne l'étudiant sur un parcours de 12 mois.
              </p>
              <p className="form-pres-p">
                La formation se déroule en 6 modules progressifs, allant des fondements de l'Écriture jusqu'à la théologie pratique et le ministère. Chaque module est conçu pour être étudié à votre rythme, avec l'accompagnement pastoral de notre équipe.
              </p>
              <p className="form-pres-p">
                À l'issue du programme, chaque étudiant reçoit un <strong>certificat de formation en Théologie Biblique</strong>, attestant de son engagement et de sa progression dans la connaissance de la Parole.
              </p>
            </div>
          </section>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── FAQ ── */}
          <section className="form-section form-section--last">
            <h2 className="form-section-titre">Questions <em>fréquentes</em></h2>
            <div className="form-faq">
              {FAQ.map((item, i) => (
                <div className={`form-faq-item${openFaq === i ? ' open' : ''}`} key={i}>
                  <button className="form-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.q}</span>
                    <IconChevron open={openFaq === i} />
                  </button>
                  {openFaq === i && <div className="form-faq-a">{item.a}</div>}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
