import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import { getModulesCount } from '../lib/public';
import couplePng from '../assets/photo-couple.png';
import {
  drAsaEsaie,
  vision,
  parcours,
  rythmes,
  exigences,
  objectifs,
  cloture,
  meta,
} from '../config/formation';
import './Formation.css';

const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease', flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const IconBible = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="12" y1="6" x2="12" y2="13" /><line x1="9" y1="9" x2="15" y2="9" />
  </svg>
);

const IconLightbulb = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" /><path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
  </svg>
);

const IconMission = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

const IconPeople = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconChurch = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" /><path d="M10 4h4" /><path d="M12 6v2" />
    <path d="M6 22V10l6-4 6 4v12" /><path d="M6 22h12" /><path d="M10 22v-6h4v6" />
  </svg>
);

const iconsMap = {
  bible: IconBible,
  lightbulb: IconLightbulb,
  mission: IconMission,
  people: IconPeople,
  church: IconChurch,
};

function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.15, ...options });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

function FadeSection({ children, className = '' }) {
  const [ref, isVisible] = useInView();
  return (
    <section ref={ref} className={`form-section form-fade ${isVisible ? 'form-fade--visible' : ''} ${className}`}>
      {children}
    </section>
  );
}

export default function Formation() {
  const [openFaq, setOpenFaq] = useState(null);
  const [openExigence, setOpenExigence] = useState(null);
  const [modulesCount, setModulesCount] = useState(null);

  useEffect(() => {
    getModulesCount().then(setModulesCount);
  }, []);

  const n = modulesCount !== null ? modulesCount : 0;
  const modulesLabel = n <= 1 ? 'module' : 'modules';

  const FAQ = [
    {
      q: "Comment se passe l'inscription ?",
      a: "Remplissez le formulaire en ligne, choisissez votre formule de paiement, puis notre equipe vous contacte sous 48 h pour confirmer votre place et vous donner acces a l'espace de formation.",
    },
    {
      q: 'Puis-je changer de formule en cours de route ?',
      a: "Oui. Si vous avez opte pour le paiement echelonne, vous pouvez a tout moment regler le solde restant pour basculer sur la formule integrale et acceder immediatement a tous les modules.",
    },
    {
      q: "Que se passe-t-il si j'arrete en cours de formation ?",
      a: "En cas d'arret, les mensualites deja reglees ne sont pas remboursees. Les modules debloques restent accessibles. Notre equipe pastorale reste disponible pour vous accompagner.",
    },
    {
      q: 'Recevrai-je un certificat a la fin ?',
      a: `Oui. Un certificat de formation en Théologie Biblique délivré par l'Église Temple de la Célébration est remis à tout étudiant ayant complété les ${n} ${modulesLabel}.`,
    },
  ];

  useEffect(() => {
    document.title = meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', meta.description);
  }, []);

  return (
    <div>
      <SectionHeader
        dark
        label="Formation"
        title="Theologie"
        titleEm="Biblique"
        subtitle={`3 ans · ${n} ${modulesLabel} · Certificat final`}
        actions={<>
          <Link to="/eleve/login" className="fsh-btn fsh-btn--outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Espace eleve
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

          {/* ── Section Dr. Asa Esaie ── */}
          <FadeSection>
            <div className="form-dr">
              <div className="form-dr-photo">
                {/* TODO: remplacer par un portrait solo du Dr */}
                <img
                  src={couplePng}
                  alt={drAsaEsaie.nom}
                  className="form-dr-img"
                />
              </div>
              <div className="form-dr-texte">
                <h2 className="form-dr-nom">{drAsaEsaie.nom}</h2>
                <p className="form-dr-titre">{drAsaEsaie.titre}</p>
                <p className="form-dr-institut">{drAsaEsaie.institut}</p>
                <Link to="/pasteur" className="form-dr-link">
                  Decouvrir le couple pastoral
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          </FadeSection>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── Notre vision ── */}
          <FadeSection>
            <h2 className="form-section-titre">Notre <em>vision</em></h2>
            <div className="form-vision">
              <p className="form-pres-p">{vision.mission}</p>
              <blockquote className="form-verset">
                <span className="form-verset-ref">{vision.verset}</span>
                <p>{vision.versetTexte}</p>
              </blockquote>
              <p className="form-pres-p">{vision.ouverture} {vision.but}</p>
            </div>
          </FadeSection>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── Le parcours ── */}
          <FadeSection>
            <h2 className="form-section-titre">Le <em>parcours</em></h2>
            <p className="form-pres-p">{parcours.description}</p>

            <div className="form-frise">
              <div className="form-frise-ligne" />
              {parcours.niveaux.map((niv, i) => (
                <div
                  key={niv.nom}
                  className="form-frise-point"
                  style={{ left: `${niv.position}%` }}
                >
                  <span className="form-frise-dot" />
                  <span className="form-frise-label">{niv.nom}</span>
                </div>
              ))}
              <span className="form-frise-duree">{parcours.dureeTotale}</span>
            </div>

            <div className="form-cards form-cards--3">
              <div className="form-card">
                <span className="form-card-icone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <span className="form-card-valeur">6 mois a 1 an</span>
                <span className="form-card-label">par niveau</span>
              </div>
              <div className="form-card">
                <span className="form-card-icone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="form-card-valeur">4h30</span>
                <span className="form-card-label">par semaine</span>
              </div>
              <div className="form-card">
                <span className="form-card-icone">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
                <span className="form-card-valeur">Stages</span>
                <span className="form-card-label">en eglise locale</span>
              </div>
            </div>

            <p className="form-pres-p form-pres-p--small">{parcours.pedagogie}</p>
          </FadeSection>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── Deux rythmes ── */}
          <FadeSection>
            <h2 className="form-section-titre">Deux <em>rythmes</em></h2>
            <p className="form-pres-p">{rythmes.intro}</p>

            <div className="form-cards form-cards--3">
              <div className="form-card form-card--groupe">
                <span className="form-card-type">{rythmes.groupeA1.type}</span>
                <span className="form-card-nom">{rythmes.groupeA1.nom}</span>
                <span className="form-card-desc">{rythmes.groupeA1.description}</span>
              </div>
              <div className="form-card form-card--groupe">
                <span className="form-card-type">{rythmes.groupeA2.type}</span>
                <span className="form-card-nom">{rythmes.groupeA2.nom}</span>
                <span className="form-card-desc">{rythmes.groupeA2.description}</span>
              </div>
              <div className="form-card form-card--groupe">
                <span className="form-card-type">{rythmes.groupeB.type}</span>
                <span className="form-card-nom">{rythmes.groupeB.nom}</span>
                <span className="form-card-desc">{rythmes.groupeB.description}</span>
              </div>
            </div>
          </FadeSection>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── Exigences (accordeon) ── */}
          <FadeSection>
            <h2 className="form-section-titre">Nos <em>exigences</em></h2>
            <div className="form-faq">
              {exigences.map((ex, i) => (
                <div className={`form-faq-item${openExigence === i ? ' open' : ''}`} key={i}>
                  <button className="form-faq-q" onClick={() => setOpenExigence(openExigence === i ? null : i)}>
                    <span>{ex.titre}</span>
                    <IconChevron open={openExigence === i} />
                  </button>
                  {openExigence === i && <div className="form-faq-a">{ex.contenu}</div>}
                </div>
              ))}
            </div>
          </FadeSection>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── Ce que la formation permet ── */}
          <FadeSection>
            <h2 className="form-section-titre">Ce que la formation <em>permet</em></h2>
            <ul className="form-objectifs">
              {objectifs.map((obj, i) => {
                const IconComp = iconsMap[obj.icone] || IconBible;
                return (
                  <li key={i} className="form-objectif">
                    <span className="form-objectif-icone"><IconComp /></span>
                    <span className="form-objectif-texte">{obj.texte}</span>
                  </li>
                );
              })}
            </ul>
          </FadeSection>

          <div className="form-sep"><span className="form-sep-line" /><span className="form-sep-diamond" /><span className="form-sep-line" /></div>

          {/* ── FAQ ── */}
          <FadeSection className="form-section--last">
            <h2 className="form-section-titre">Questions <em>frequentes</em></h2>
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
          </FadeSection>

        </div>
      </div>

      {/* ── Bandeau final ── */}
      <div className="form-cta">
        <div className="container">
          <p className="form-cta-phrase">{cloture.phrase}</p>
          <Link to="/formation/inscription" className="btn-or">
            {cloture.boutonLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
