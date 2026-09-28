import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getFormulesPaiement } from '../lib/public';
import { createCheckoutSessionInscription } from '../lib/stripe';
import './FormationInscription.css';
import Icon from '../components/Icon';
import 'flag-icons/css/flag-icons.min.css';

// ─── Données ────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'etc_inscription_draft';

const PAYS = [
  'Afghanistan','Afrique du Sud','Albanie','Algérie','Allemagne','Angola','Arabie Saoudite',
  'Argentine','Arménie','Australie','Autriche','Azerbaïdjan','Bahreïn','Bangladesh','Belgique',
  'Bénin','Biélorussie','Bolivie','Bosnie-Herzégovine','Botswana','Brésil','Bulgarie',
  'Burkina Faso','Burundi','Cambodge','Cameroun','Canada','Chili','Chine','Chypre','Colombie',
  'Congo (Brazzaville)','Congo (RDC)','Corée du Sud','Costa Rica',"Côte d'Ivoire",'Croatie',
  'Cuba','Danemark','Djibouti','Égypte','Émirats arabes unis','Équateur','Érythrée','Espagne',
  'Estonie','Éthiopie','États-Unis','Finlande','France','Gabon','Gambie','Géorgie','Ghana',
  'Grèce','Guatemala','Guinée','Guinée équatoriale','Haïti','Honduras','Hongrie','Inde',
  'Indonésie','Irak','Iran','Irlande','Islande','Israël','Italie','Jamaïque','Japon','Jordanie',
  'Kazakhstan','Kenya','Kosovo','Koweït','Laos','Liban','Liberia','Libye','Lituanie','Luxembourg',
  'Macédoine du Nord','Madagascar','Malawi','Mali','Maroc','Mauritanie','Maurice','Mexique',
  'Moldavie','Mongolie','Mozambique','Myanmar','Namibie','Népal','Nicaragua','Niger','Nigeria',
  'Norvège','Nouvelle-Zélande','Ouganda','Pakistan','Palestine','Panama','Paraguay','Pays-Bas',
  'Pérou','Philippines','Pologne','Portugal','Qatar','Roumanie','Royaume-Uni','Russie','Rwanda',
  'Sénégal','Serbie','Sierra Leone','Singapour','Slovaquie','Slovénie','Somalie','Soudan',
  'Sri Lanka','Suède','Suisse','Syrie','Taïwan','Tanzanie','Tchad','Thaïlande','Togo','Tunisie',
  'Turquie','Ukraine','Uruguay','Venezuela','Vietnam','Yémen','Zambie','Zimbabwe','Autre',
];

const PHONE_CODES = [
  { code: '+33',  iso: 'fr', label: 'France' },
  { code: '+32',  iso: 'be', label: 'Belgique' },
  { code: '+41',  iso: 'ch', label: 'Suisse' },
  { code: '+1',   iso: 'us', label: 'USA/Canada' },
  { code: '+44',  iso: 'gb', label: 'Royaume-Uni' },
  { code: '+49',  iso: 'de', label: 'Allemagne' },
  { code: '+34',  iso: 'es', label: 'Espagne' },
  { code: '+39',  iso: 'it', label: 'Italie' },
  { code: '+351', iso: 'pt', label: 'Portugal' },
  { code: '+237', iso: 'cm', label: 'Cameroun' },
  { code: '+243', iso: 'cd', label: 'RD Congo' },
  { code: '+242', iso: 'cg', label: 'Congo' },
  { code: '+225', iso: 'ci', label: "Côte d'Ivoire" },
  { code: '+221', iso: 'sn', label: 'Sénégal' },
  { code: '+229', iso: 'bj', label: 'Bénin' },
  { code: '+223', iso: 'ml', label: 'Mali' },
  { code: '+228', iso: 'tg', label: 'Togo' },
  { code: '+234', iso: 'ng', label: 'Nigeria' },
  { code: '+254', iso: 'ke', label: 'Kenya' },
  { code: '+27',  iso: 'za', label: 'Afrique du Sud' },
  { code: '+250', iso: 'rw', label: 'Rwanda' },
  { code: '+509', iso: 'ht', label: 'Haïti' },
  { code: '+55',  iso: 'br', label: 'Brésil' },
  { code: '+57',  iso: 'co', label: 'Colombie' },
];

function Flag({ iso, size = 16 }) {
  return (
    <span
      className={`fi fi-${iso}`}
      style={{
        display: 'inline-block',
        width: size,
        height: Math.round(size * 0.75),
        backgroundSize: 'cover',
        borderRadius: 2,
        flexShrink: 0,
      }}
    />
  );
}

function PhoneCodeSelect({ value, onChange, telephone, onTelChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = PHONE_CODES.find(p => p.code === value) || PHONE_CODES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fi2-phone-wrap" ref={ref}>
      <button
        type="button"
        className="fi2-phone-code-btn"
        onClick={() => setOpen(!open)}
      >
        <Flag iso={selected.iso} size={18} />
        <span>{selected.code}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ marginLeft: 4 }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="fi2-phone-dropdown">
          {PHONE_CODES.map(p => (
            <button
              key={p.code}
              type="button"
              className={`fi2-phone-option ${p.code === value ? 'fi2-phone-option--active' : ''}`}
              onClick={() => { onChange(p.code); setOpen(false); }}
            >
              <Flag iso={p.iso} size={18} />
              <span className="fi2-phone-option-label">{p.label}</span>
              <span className="fi2-phone-option-code">{p.code}</span>
            </button>
          ))}
        </div>
      )}
      <input
        className="fi2-phone-input"
        type="tel"
        value={telephone}
        onChange={e => onTelChange(e)}
        placeholder="6 00 00 00 00"
      />
    </div>
  );
}

const EMPTY_FORM = {
  formule: '',
  formule_id: null,
  prenom: '', nom: '',
  email: '', phone_code: '+33', telephone: '',
  date_naissance: '', pays: '', ville: '',
  eglise: '', pasteur_referent: '',
  niveau_biblique: '', motivation: '',
  accept_conditions: false, accept_engagement: false, communications_ok: false,
};

// ─── Composants utilitaires ──────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <polyline points="2,7 5.5,11 12,3" stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressBar({ step }) {
  const steps = ['Formule', 'Identité', 'Parcours', 'Compte'];
  return (
    <div className="fi2-progress">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <React.Fragment key={num}>
            {i > 0 && (
              <div className={`fi2-progress-line ${done ? 'fi2-progress-line--done' : ''}`} />
            )}
            <div className="fi2-progress-step">
              <div className={[
                'fi2-progress-circle',
                done   ? 'fi2-progress-circle--done'   : '',
                active ? 'fi2-progress-circle--active' : '',
              ].join(' ')}>
                {done ? <CheckIcon /> : num}
              </div>
              <span className={`fi2-progress-label ${active ? 'fi2-progress-label--active' : ''}`}>
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SearchableSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fi2-select-wrap" ref={ref}>
      <div className={`fi2-select-trigger ${open ? 'fi2-select-trigger--open' : ''}`}
        onClick={() => setOpen(v => !v)}>
        <span className={value ? '' : 'fi2-select-placeholder'}>{value || placeholder}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : '', transition: '0.2s', flexShrink: 0 }}>
          <polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {open && (
        <div className="fi2-select-dropdown">
          <input className="fi2-select-search" placeholder="Rechercher un pays…"
            value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          <div className="fi2-select-options">
            {filtered.map(o => (
              <div key={o}
                className={`fi2-select-option ${o === value ? 'fi2-select-option--active' : ''}`}
                onClick={() => { onChange(o); setOpen(false); setSearch(''); }}>
                {o}
              </div>
            ))}
            {filtered.length === 0 && <div className="fi2-select-empty">Aucun résultat</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Étape 1 — Formule ───────────────────────────────────────────────────────

function Step1({ formData, setFormData, onNext }) {
  const [formules, setFormules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFormulesPaiement().then(data => {
      setFormules(data);
      setLoading(false);
    });
  }, []);

  const choose = (formule) => {
    // Stocker tous les details de la formule pour les figer a l'inscription
    const formuleDetails = {
      formule: formule.type,
      formule_id: formule.id,
      formule_nom: formule.nom,
      formule_prix_total_cents: formule.prix_total_cents,
      formule_nombre_echeances: formule.nombre_echeances,
      formule_montant_echeance_cents: formule.montant_echeance_cents,
      formule_avantages: Array.isArray(formule.avantages) ? formule.avantages : [],
    };
    setFormData(d => ({ ...d, ...formuleDetails }));
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, ...formuleDetails }));
    // Sauvegarder aussi pour le recapitulatif
    localStorage.setItem('etc_formule_selectionnee', JSON.stringify({
      id: formule.id,
      type: formule.type,
      nom: formule.nom,
      prix_total_cents: formule.prix_total_cents,
      montant_echeance_cents: formule.montant_echeance_cents,
      nombre_echeances: formule.nombre_echeances,
      avantages: formule.avantages || [],
    }));
  };

  const formatEuros = (cents) => {
    if (!cents && cents !== 0) return '—';
    return (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
  };

  const formuleIntegral = formules.find(f => f.type === 'integral');
  const formuleEchelonne = formules.find(f => f.type === 'echelonne');

  return (
    <div className="fi2-step">
      <h2 className="fi2-step-title">Choisissez votre formule</h2>
      <p className="fi2-step-sub">Vous pouvez modifier ce choix en contactant l'administration.</p>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--texte-doux)', padding: '40px 0' }}>Chargement des formules…</p>
      ) : (
        <div className="fi2-formule-cards">
          {formules.map((formule, index) => {
            const isSelected = formData.formule_id === formule.id || formData.formule === formule.type;
            const isFirst = index === 0;
            const avantages = Array.isArray(formule.avantages) ? formule.avantages : [];

            return (
              <div
                key={formule.id}
                className={`fi2-formule-card ${isSelected ? 'fi2-formule-card--active' : ''}`}
                onClick={() => choose(formule)}
              >
                {isFirst && <div className="fi2-formule-badge-recommande">Recommandé</div>}
                <div className="fi2-formule-top">
                  <div className={`fi2-radio-dot ${isSelected ? 'fi2-radio-dot--on' : ''}`} />
                  <div className="fi2-formule-price">
                    {formule.type === 'echelonne'
                      ? <>{formatEuros(formule.montant_echeance_cents)} <span className="fi2-formule-mois">/mois</span></>
                      : formatEuros(formule.prix_total_cents)
                    }
                  </div>
                </div>
                <div className="fi2-formule-name">{formule.nom}</div>
                <ul className="fi2-formule-points">
                  {avantages.map((av, i) => (
                    <li key={i}>{av}</li>
                  ))}
                  {formule.type === 'echelonne' && (
                    <li>{formatEuros(formule.prix_total_cents)} au total</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <button className="fi2-btn fi2-btn--primary fi2-btn--full" onClick={onNext}
        disabled={!formData.formule && !formData.formule_id}>
        Continuer →
      </button>
    </div>
  );
}

// ─── Étape 2 — Identité ──────────────────────────────────────────────────────

function Step2({ formData, setFormData, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    const value = typeof e === 'string' ? e : e.target.value;
    setFormData(d => {
      const nd = { ...d, [field]: value };
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, [field]: value }));
      return nd;
    });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validate = () => {
    const e = {};
    if (!formData.prenom.trim()) e.prenom = 'Requis';
    if (!formData.nom.trim()) e.nom = 'Requis';
    if (!formData.email.trim()) e.email = 'Requis';
    else if (!validateEmail(formData.email)) e.email = 'Format invalide (ex: jean@email.com)';
    if (!formData.pays) e.pays = 'Requis';
    if (!formData.ville.trim()) e.ville = 'Requis';
    if (formData.date_naissance) {
      const age = (new Date() - new Date(formData.date_naissance)) / (365.25 * 24 * 3600 * 1000);
      if (age < 16) e.date_naissance = 'Âge minimum : 16 ans';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="fi2-step">
      <h2 className="fi2-step-title">Informations personnelles</h2>
      <p className="fi2-step-sub">Ces informations serviront à établir votre dossier d'inscription.</p>

      <div className="fi2-grid-2">
        <div className="fi2-field">
          <label className="fi2-label">Prénom *</label>
          <input className={errors.prenom ? 'fi2-input--error' : ''} value={formData.prenom}
            onChange={set('prenom')} onBlur={validate} placeholder="Votre prénom" />
          {errors.prenom && <span className="fi2-error">{errors.prenom}</span>}
        </div>
        <div className="fi2-field">
          <label className="fi2-label">Nom *</label>
          <input className={errors.nom ? 'fi2-input--error' : ''} value={formData.nom}
            onChange={set('nom')} onBlur={validate} placeholder="Votre nom" />
          {errors.nom && <span className="fi2-error">{errors.nom}</span>}
        </div>
        <div className="fi2-field fi2-field--full">
          <label className="fi2-label">Adresse email *</label>
          <input type="email" className={errors.email ? 'fi2-input--error' : ''}
            value={formData.email} onChange={set('email')} onBlur={validate}
            placeholder="votre@email.com" />
          {errors.email && <span className="fi2-error">{errors.email}</span>}
        </div>
        <div className="fi2-field fi2-field--full">
          <label className="fi2-label">Téléphone</label>
          <PhoneCodeSelect
            value={formData.phone_code}
            onChange={val => set('phone_code')(val)}
            telephone={formData.telephone}
            onTelChange={set('telephone')}
          />
        </div>
        <div className="fi2-field">
          <label className="fi2-label">Date de naissance</label>
          <input type="date" className={errors.date_naissance ? 'fi2-input--error' : ''}
            value={formData.date_naissance} onChange={set('date_naissance')} />
          {errors.date_naissance && <span className="fi2-error">{errors.date_naissance}</span>}
        </div>
        <div className="fi2-field">
          <label className="fi2-label">Pays *</label>
          <SearchableSelect value={formData.pays} onChange={set('pays')}
            options={PAYS} placeholder="— Sélectionnez votre pays —" />
          {errors.pays && <span className="fi2-error">{errors.pays}</span>}
        </div>
        <div className="fi2-field">
          <label className="fi2-label">Ville *</label>
          <input className={errors.ville ? 'fi2-input--error' : ''} value={formData.ville}
            onChange={set('ville')} onBlur={validate} placeholder="Votre ville" />
          {errors.ville && <span className="fi2-error">{errors.ville}</span>}
        </div>
      </div>

      <div className="fi2-step-nav">
        <button className="fi2-btn fi2-btn--secondary" onClick={onBack}>← Retour</button>
        <button className="fi2-btn fi2-btn--primary" onClick={() => { if (validate()) onNext(); }}>
          Continuer →
        </button>
      </div>
    </div>
  );
}

// ─── Étape 3 — Parcours ──────────────────────────────────────────────────────

function Step3({ formData, setFormData, onNext, onBack }) {
  const motLen = formData.motivation.length;

  const set = (field) => (e) => {
    const value = e.target.value;
    setFormData(d => {
      const nd = { ...d, [field]: value };
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, [field]: value }));
      return nd;
    });
  };

  const setNiveau = (n) => {
    setFormData(d => {
      const nd = { ...d, niveau_biblique: n };
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, niveau_biblique: n }));
      return nd;
    });
  };

  const NIVEAUX = [
    { id: 'debutant',      label: 'Débutant',       desc: 'Je découvre la Bible' },
    { id: 'intermediaire', label: 'Intermédiaire',  desc: 'Je connais les bases' },
    { id: 'avance',        label: 'Avancé',          desc: "J'ai déjà suivi des formations" },
  ];

  return (
    <div className="fi2-step">
      <h2 className="fi2-step-title">Votre parcours spirituel</h2>
      <p className="fi2-step-sub">Ces informations nous aident à personnaliser votre accompagnement.</p>

      <div className="fi2-grid-2">
        <div className="fi2-field">
          <label className="fi2-label">Église actuelle</label>
          <input value={formData.eglise} onChange={set('eglise')} placeholder="Nom de votre église" />
        </div>
        <div className="fi2-field">
          <label className="fi2-label">Pasteur référent <span className="fi2-optional">(optionnel)</span></label>
          <input value={formData.pasteur_referent} onChange={set('pasteur_referent')} placeholder="Nom du pasteur" />
        </div>
      </div>

      <div className="fi2-field fi2-field--full" style={{ marginTop: 20 }}>
        <label className="fi2-label">Niveau d'étude biblique</label>
        <div className="fi2-niveau-cards">
          {NIVEAUX.map(n => (
            <div key={n.id}
              className={`fi2-niveau-card ${formData.niveau_biblique === n.id ? 'fi2-niveau-card--active' : ''}`}
              onClick={() => setNiveau(n.id)}>
              <div className={`fi2-radio-dot fi2-radio-dot--sm ${formData.niveau_biblique === n.id ? 'fi2-radio-dot--on' : ''}`} />
              <div>
                <div className="fi2-niveau-label">{n.label}</div>
                <div className="fi2-niveau-desc">{n.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fi2-field fi2-field--full" style={{ marginTop: 20 }}>
        <label className="fi2-label">Motivation *</label>
        <div className="fi2-textarea-wrap">
          <textarea rows={6} maxLength={500} value={formData.motivation} onChange={set('motivation')}
            placeholder="Pourquoi souhaitez-vous suivre cette formation ? Quels sont vos objectifs ?" />
          <span className={`fi2-textarea-count ${motLen > 450 ? 'fi2-textarea-count--warn' : ''}`}>
            {motLen}/500
          </span>
        </div>
      </div>

      <div className="fi2-step-nav">
        <button className="fi2-btn fi2-btn--secondary" onClick={onBack}>← Retour</button>
        <button className="fi2-btn fi2-btn--primary" onClick={onNext}
          disabled={!formData.motivation.trim()}>
          Continuer →
        </button>
      </div>
    </div>
  );
}

// ─── Etape 4 - Confirmation ──────────────────────────────────────────────────

function Step4({ formData, setFormData, onSubmit, onBack, submitting, error }) {
  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(d => ({ ...d, [field]: value }));
  };

  const canSubmit = formData.accept_conditions && formData.accept_engagement;

  return (
    <div className="fi2-step">
      <h2 className="fi2-step-title">Confirmation</h2>
      <div className="fi2-email-recap">
        Votre compte sera cree avec l'adresse :<br />
        <strong>{formData.email}</strong>
      </div>

      <div className="fi2-info-notice">
        <Icon name="envelope" size={20} />
        <span>Apres le paiement, vous recevrez un email pour choisir votre mot de passe et acceder a votre espace eleve.</span>
      </div>

      <div className="fi2-checkboxes">
        <label className="fi2-check">
          <input type="checkbox" checked={formData.accept_conditions} onChange={set('accept_conditions')} />
          <span className="fi2-check-box" />
          <span>J'accepte les <strong>conditions de la formation</strong> et sa politique de remboursement *</span>
        </label>
        <label className="fi2-check">
          <input type="checkbox" checked={formData.accept_engagement} onChange={set('accept_engagement')} />
          <span className="fi2-check-box" />
          <span>Je m'engage a suivre la formation <strong>serieusement et assidument</strong> *</span>
        </label>
        <label className="fi2-check">
          <input type="checkbox" checked={formData.communications_ok} onChange={set('communications_ok')} />
          <span className="fi2-check-box" />
          <span>J'accepte de recevoir les communications de l'eglise <span className="fi2-optional">(optionnel)</span></span>
        </label>
      </div>

      {error && error !== 'EMAIL_EXISTS' && (
        <div className="fi2-error-box">{error}</div>
      )}
      {error === 'EMAIL_EXISTS' && (
        <div className="fi2-error-box fi2-error-box--email">
          <strong>Un compte existe deja avec l'adresse {formData.email}.</strong>
          <br />
          <span>Connectez-vous ou utilisez une autre adresse email.</span>
          <div style={{ marginTop: 10 }}>
            <a href="/eleve/login" className="fi2-login-link">Se connecter</a>
          </div>
        </div>
      )}

      <div className="fi2-step-nav fi2-step-nav--submit">
        <button className="fi2-btn fi2-btn--secondary" onClick={onBack} disabled={submitting}>
          Retour
        </button>
        <button className="fi2-btn fi2-btn--submit" onClick={onSubmit}
          disabled={!canSubmit || submitting}>
          {submitting ? <><span className="fi2-spinner" /> Redirection...</> : 'Proceder au paiement'}
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function FormationInscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const annule = searchParams.get('annule') === '1';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(location.search);
    const urlFormule = params.get('formule');
    return {
      ...EMPTY_FORM,
      formule: urlFormule === 'echelonne' ? 'echelonne'
             : urlFormule === 'integral'  ? 'integral'
             : '',
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const goTo = (s) => {
    setStep(s);
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, step: s }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');

    const fullPhone = formData.telephone
      ? `${formData.phone_code} ${formData.telephone}`
      : null;

    const { url, error } = await createCheckoutSessionInscription({
      email: formData.email,
      prenom: formData.prenom,
      nom: formData.nom,
      telephone: fullPhone,
      date_naissance: formData.date_naissance || null,
      pays: formData.pays || null,
      ville: formData.ville || null,
      eglise: formData.eglise || null,
      pasteur_referent: formData.pasteur_referent || null,
      niveau_biblique: formData.niveau_biblique || null,
      motivation: formData.motivation || null,
      communications_ok: formData.communications_ok,
      formule: formData.formule,
      formule_id: formData.formule_id || null,
      formule_nom: formData.formule_nom || null,
      formule_prix_total_cents: formData.formule_prix_total_cents || null,
      formule_nombre_echeances: formData.formule_nombre_echeances || null,
      formule_montant_echeance_cents: formData.formule_montant_echeance_cents || null,
      formule_avantages: formData.formule_avantages || [],
    });

    if (error) {
      setSubmitting(false);
      if (error === 'EMAIL_EXISTS') {
        setSubmitError('EMAIL_EXISTS');
      } else {
        setSubmitError(error);
      }
      return;
    }

    if (url) {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem('etc_inscription_pending', JSON.stringify({
        email: formData.email,
        prenom: formData.prenom,
        formule: formData.formule,
        formule_nom: formData.formule_nom,
        formule_prix_total_cents: formData.formule_prix_total_cents,
      }));
      window.location.href = url;
    } else {
      setSubmitting(false);
      setSubmitError('URL de paiement non recue');
    }
  };

  const handleReset = () => {
    if (!window.confirm('Recommencer l\'inscription ? Toutes les données saisies seront effacées.')) return;
    localStorage.removeItem(DRAFT_KEY);
    window.location.reload();
  };

  return (
    <div className="fi2-wrap">
      <div className="fi2-container">
        <div className="fi2-header">
          <h1 className="fi2-main-title">
            Inscription à la <em>Formation</em>
          </h1>
          <p className="fi2-main-sub">Théologie Biblique — Institut TIEDO</p>
          <button className="fi2-reset-btn" onClick={handleReset} title="Recommencer l'inscription">
            Recommencer
          </button>
        </div>

        <ProgressBar step={step} />

        {annule && (
          <div className="fi2-error-box" style={{ marginBottom: 20, background: 'rgba(200,134,10,0.08)', borderColor: 'rgba(200,134,10,0.3)' }}>
            <strong style={{ color: 'var(--or)' }}>Paiement annule</strong>
            <p style={{ marginTop: 4 }}>Vous pouvez reprendre l'inscription a tout moment. Vos donnees ont ete conservees.</p>
          </div>
        )}

        <div className="fi2-card">
          <div className="fi2-step-anim" key={step}>
            {step === 1 && (
              <Step1 formData={formData} setFormData={setFormData}
                onNext={() => goTo(2)} />
            )}
            {step === 2 && (
              <Step2 formData={formData} setFormData={setFormData}
                onNext={() => goTo(3)} onBack={() => goTo(1)} />
            )}
            {step === 3 && (
              <Step3 formData={formData} setFormData={setFormData}
                onNext={() => goTo(4)} onBack={() => goTo(2)} />
            )}
            {step === 4 && (
              <Step4 formData={formData} setFormData={setFormData}
                onSubmit={handleSubmit} onBack={() => goTo(3)}
                submitting={submitting} error={submitError} />
            )}
          </div>
        </div>

        {step > 1 && (
          <p className="fi2-draft-notice">
            <Icon name="check" size={13} style={{marginRight:4}} />Votre progression est sauvegardée automatiquement
          </p>
        )}
      </div>
    </div>
  );
}
