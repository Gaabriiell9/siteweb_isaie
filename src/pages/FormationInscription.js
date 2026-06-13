import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  createInscriptionAutoSave,
  finalizeInscription,
  IS_MOCK,
} from '../lib/supabase';
import './FormationInscription.css';
import Icon from '../components/Icon';

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
  { code: '+33',  country: 'FR 🇫🇷' },
  { code: '+32',  country: 'BE 🇧🇪' },
  { code: '+41',  country: 'CH 🇨🇭' },
  { code: '+1',   country: 'US/CA 🇺🇸' },
  { code: '+44',  country: 'GB 🇬🇧' },
  { code: '+49',  country: 'DE 🇩🇪' },
  { code: '+34',  country: 'ES 🇪🇸' },
  { code: '+39',  country: 'IT 🇮🇹' },
  { code: '+351', country: 'PT 🇵🇹' },
  { code: '+237', country: 'CM 🇨🇲' },
  { code: '+243', country: 'CD 🇨🇩' },
  { code: '+242', country: 'CG 🇨🇬' },
  { code: '+225', country: "CI 🇨🇮" },
  { code: '+221', country: 'SN 🇸🇳' },
  { code: '+229', country: 'BJ 🇧🇯' },
  { code: '+223', country: 'ML 🇲🇱' },
  { code: '+228', country: 'TG 🇹🇬' },
  { code: '+234', country: 'NG 🇳🇬' },
  { code: '+254', country: 'KE 🇰🇪' },
  { code: '+27',  country: 'ZA 🇿🇦' },
  { code: '+250', country: 'RW 🇷🇼' },
  { code: '+509', country: 'HT 🇭🇹' },
  { code: '+55',  country: 'BR 🇧🇷' },
  { code: '+57',  country: 'CO 🇨🇴' },
];

const EMPTY_FORM = {
  formule: '',
  prenom: '', nom: '',
  email: '', phone_code: '+33', telephone: '',
  date_naissance: '', pays: '', ville: '',
  eglise: '', pasteur_referent: '',
  niveau_biblique: '', motivation: '',
  password: '', password_confirm: '',
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

function PasswordStrength({ password }) {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    digit:     /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', '#27ae60'];
  const levels = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'];
  return (
    <div className="fi2-pwd-strength">
      <div className="fi2-pwd-bars">
        {[1,2,3,4].map(i => (
          <div key={i} className="fi2-pwd-bar"
            style={{ background: i <= score ? colors[score] : '#e0d8ce' }} />
        ))}
      </div>
      {password && (
        <span className="fi2-pwd-level" style={{ color: colors[score] }}>
          {levels[score]}
        </span>
      )}
      <div className="fi2-pwd-criteria">
        {[
          { key: 'length',    label: '8 caractères min' },
          { key: 'uppercase', label: '1 majuscule' },
          { key: 'digit',     label: '1 chiffre' },
          { key: 'special',   label: '1 caractère spécial' },
        ].map(c => (
          <span key={c.key} className={`fi2-pwd-crit ${checks[c.key] ? 'fi2-pwd-crit--ok' : ''}`}>
            {checks[c.key] ? <Icon name="check" size={14} style={{marginRight:5}} /> : <Icon name="circle" size={14} style={{marginRight:5}} />}{c.label}
          </span>
        ))}
      </div>
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
  const choose = (f) => {
    setFormData(d => ({ ...d, formule: f }));
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, formule: f }));
  };

  return (
    <div className="fi2-step">
      <h2 className="fi2-step-title">Choisissez votre formule</h2>
      <p className="fi2-step-sub">Vous pouvez modifier ce choix en contactant l'administration.</p>

      <div className="fi2-formule-cards">
        {/* Intégral */}
        <div className={`fi2-formule-card ${formData.formule === 'integral' ? 'fi2-formule-card--active' : ''}`}
          onClick={() => choose('integral')}>
          <div className="fi2-formule-badge-recommande">Recommandé</div>
          <div className="fi2-formule-top">
            <div className={`fi2-radio-dot ${formData.formule === 'integral' ? 'fi2-radio-dot--on' : ''}`} />
            <div className="fi2-formule-price">450 €</div>
          </div>
          <div className="fi2-formule-name">Paiement intégral</div>
          <ul className="fi2-formule-points">
            <li>Paiement unique</li>
            <li>Accès immédiat à tous les modules</li>
            <li>10 % de réduction</li>
          </ul>
        </div>

        {/* Échelonné */}
        <div className={`fi2-formule-card ${formData.formule === 'echelonne' ? 'fi2-formule-card--active' : ''}`}
          onClick={() => choose('echelonne')}>
          <div className="fi2-formule-top">
            <div className={`fi2-radio-dot ${formData.formule === 'echelonne' ? 'fi2-radio-dot--on' : ''}`} />
            <div className="fi2-formule-price">50 € <span className="fi2-formule-mois">/mois</span></div>
          </div>
          <div className="fi2-formule-name">Paiement échelonné</div>
          <ul className="fi2-formule-points">
            <li>10 mensualités</li>
            <li>500 € au total</li>
            <li>Déblocage progressif des modules</li>
          </ul>
        </div>
      </div>

      <button className="fi2-btn fi2-btn--primary fi2-btn--full" onClick={onNext}
        disabled={!formData.formule}>
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
            onChange={set('prenom')} onBlur={validate} placeholder="Jean" />
          {errors.prenom && <span className="fi2-error">{errors.prenom}</span>}
        </div>
        <div className="fi2-field">
          <label className="fi2-label">Nom *</label>
          <input className={errors.nom ? 'fi2-input--error' : ''} value={formData.nom}
            onChange={set('nom')} onBlur={validate} placeholder="Dupont" />
          {errors.nom && <span className="fi2-error">{errors.nom}</span>}
        </div>
        <div className="fi2-field fi2-field--full">
          <label className="fi2-label">Adresse email *</label>
          <input type="email" className={errors.email ? 'fi2-input--error' : ''}
            value={formData.email} onChange={set('email')} onBlur={validate}
            placeholder="jean.dupont@email.com" />
          {errors.email && <span className="fi2-error">{errors.email}</span>}
        </div>
        <div className="fi2-field fi2-field--full">
          <label className="fi2-label">Téléphone</label>
          <div className="fi2-phone-wrap">
            <select className="fi2-phone-code" value={formData.phone_code}
              onChange={e => set('phone_code')(e.target.value)}>
              {PHONE_CODES.map(p => (
                <option key={p.code} value={p.code}>{p.code} {p.country}</option>
              ))}
            </select>
            <input className="fi2-phone-input" type="tel" value={formData.telephone}
              onChange={set('telephone')} placeholder="6 00 00 00 00" />
          </div>
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
            onChange={set('ville')} onBlur={validate} placeholder="Paris" />
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

// ─── Étape 4 — Compte ────────────────────────────────────────────────────────

function Step4({ formData, setFormData, onSubmit, onBack, submitting, error }) {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(d => ({ ...d, [field]: value }));
  };

  const pwdOk = formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[0-9]/.test(formData.password) &&
    /[^A-Za-z0-9]/.test(formData.password);
  const pwdMatch = formData.password && formData.password === formData.password_confirm;
  const canSubmit = pwdOk && pwdMatch && formData.accept_conditions && formData.accept_engagement;

  const EyeIcon = ({ visible }) => visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div className="fi2-step">
      <h2 className="fi2-step-title">Créez votre compte</h2>
      <div className="fi2-email-recap">
        Vous êtes sur le point de créer votre compte avec l'email :<br />
        <strong>{formData.email}</strong>
      </div>

      <div className="fi2-field fi2-field--full">
        <label className="fi2-label">Mot de passe *</label>
        <div className="fi2-pwd-wrap">
          <input type={showPwd ? 'text' : 'password'} value={formData.password}
            onChange={set('password')} placeholder="Minimum 8 caractères" />
          <button type="button" className="fi2-pwd-toggle" onClick={() => setShowPwd(v => !v)}>
            <EyeIcon visible={showPwd} />
          </button>
        </div>
        <PasswordStrength password={formData.password} />
      </div>

      <div className="fi2-field fi2-field--full">
        <label className="fi2-label">Confirmer le mot de passe *</label>
        <div className="fi2-pwd-wrap">
          <input type={showConfirm ? 'text' : 'password'} value={formData.password_confirm}
            onChange={set('password_confirm')}
            className={formData.password_confirm && !pwdMatch ? 'fi2-input--error' : ''}
            placeholder="Répétez votre mot de passe" />
          <button type="button" className="fi2-pwd-toggle" onClick={() => setShowConfirm(v => !v)}>
            <EyeIcon visible={showConfirm} />
          </button>
        </div>
        {formData.password_confirm && !pwdMatch && (
          <span className="fi2-error">Les mots de passe ne correspondent pas</span>
        )}
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
          <span>Je m'engage à suivre la formation <strong>sérieusement et assidûment</strong> *</span>
        </label>
        <label className="fi2-check">
          <input type="checkbox" checked={formData.communications_ok} onChange={set('communications_ok')} />
          <span className="fi2-check-box" />
          <span>J'accepte de recevoir les communications de l'église <span className="fi2-optional">(optionnel)</span></span>
        </label>
      </div>

      {error && error !== 'EMAIL_EXISTS' && (
        <div className="fi2-error-box">{error}</div>
      )}
      {error === 'EMAIL_EXISTS' && (
        <div className="fi2-error-box fi2-error-box--email">
          <strong>Un compte existe déjà avec l'adresse {formData.email}.</strong>
          <br />
          <span>Connectez-vous ou utilisez une autre adresse email.</span>
          <div style={{ marginTop: 10 }}>
            <a href="/eleve/login" className="fi2-login-link">Se connecter →</a>
          </div>
        </div>
      )}

      <div className="fi2-step-nav fi2-step-nav--submit">
        <button className="fi2-btn fi2-btn--secondary" onClick={onBack} disabled={submitting}>
          ← Retour
        </button>
        <button className="fi2-btn fi2-btn--submit" onClick={onSubmit}
          disabled={!canSubmit || submitting}>
          {submitting ? <><span className="fi2-spinner" /> Création…</> : 'Créer mon compte →'}
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function FormationInscription() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const params = new URLSearchParams(location.search);
    const urlFormule = params.get('formule');
    // On démarre toujours vierge — pas de restauration du draft au chargement
    return {
      ...EMPTY_FORM,
      formule: urlFormule === 'echelonne' ? 'echelonne'
             : urlFormule === 'integral'  ? 'integral'
             : '',
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Vider le draft à chaque visite de la page
  useEffect(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  const goTo = (s) => {
    setStep(s);
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, step: s }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!IS_MOCK) {
      createInscriptionAutoSave({
        ...formData,
        step_completed: s - 1,
        draft: true,
      }).catch(console.error);
    }
  };

  const handleSubmit = async () => {
    // Guard contre double-clic
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const fullPhone = formData.telephone
      ? `${formData.phone_code} ${formData.telephone}`
      : null;

    const result = await finalizeInscription({
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email,
      telephone: fullPhone,
      date_naissance: formData.date_naissance || null,
      pays: formData.pays || null,
      ville: formData.ville || null,
      eglise: formData.eglise || null,
      pasteur_referent: formData.pasteur_referent || null,
      niveau_biblique: formData.niveau_biblique || null,
      motivation: formData.motivation || null,
      formule: formData.formule,
      communications_ok: formData.communications_ok,
      password: formData.password,
    });

    setSubmitting(false);

    if (!result.success) {
      const error = result.error || {};
      if (error.code === 'EMAIL_EXISTS') {
        setSubmitError('EMAIL_EXISTS');
      } else {
        setSubmitError(error.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
      return;
    }

    // Succès !
    localStorage.removeItem(DRAFT_KEY);
    localStorage.setItem('etc_inscription_success', JSON.stringify({
      email: formData.email,
      formule: formData.formule,
      prenom: formData.prenom,
    }));
    navigate('/formation/paiement');
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
          <p className="fi2-main-sub">Théologie Biblique — 6 modules · 12 mois</p>
          <button className="fi2-reset-btn" onClick={handleReset} title="Recommencer l'inscription">
            Recommencer
          </button>
        </div>

        <ProgressBar step={step} />

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
