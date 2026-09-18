import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import logoPng from '../assets/logoe-eglise.png';
import { signIn, signOut, getSession, checkIsAdmin } from '../lib/auth';
import { TabAnnonces, TabServices, TabCellules, TabSettings, TabDons, TabVideos, TabPriere, TabFormation } from './admin';
import './Admin.css';
import Icon from '../components/Icon';

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: err } = await signIn(email, password);
    if (err) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }

    const isAdmin = await checkIsAdmin();
    if (!isAdmin) {
      await signOut();
      setError('Ce compte n\'a pas les droits administrateur.');
      setLoading(false);
      return;
    }

    onLogin();
    setLoading(false);
  };

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-card">
        <div className="admin-login-logo">E-T-C</div>
        <h2>Espace Administration</h2>
        <p>Église Temple de la Célébration</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="email" placeholder="Email administrateur"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input
            type="password" placeholder="Mot de passe"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          {error && <div className="admin-error">{error}</div>}
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3,1 13,7 3,13" fill="currentColor" stroke="none" />
  </svg>
);
const IconCroix = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="7" y1="1" x2="7" y2="13" />
    <line x1="1" y1="5" x2="13" y2="5" />
  </svg>
);
const IconCal = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="2" width="12" height="11" rx="1" />
    <line x1="1" y1="6" x2="13" y2="6" />
    <line x1="4" y1="1" x2="4" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="4" y1="9" x2="4" y2="9" strokeWidth="2" strokeLinecap="round" />
    <line x1="7" y1="9" x2="7" y2="9" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="9" x2="10" y2="9" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconFormation = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1L13 4.5V7" />
    <path d="M1 4.5L7 1L13 4.5L7 8L1 4.5Z" />
    <path d="M3 6v3.5l4 2 4-2V6" />
  </svg>
);

const IconAnnonce = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 5v4a1 1 0 001 1h2l4 3V2L4 5H2a1 1 0 00-1 1z" />
    <path d="M11 5a3 3 0 010 4" />
  </svg>
);
const IconSettings = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="2" />
    <path d="M12 7a5 5 0 01-.5 2.2l1 1.3-1.5 1.5-1.3-1a5 5 0 01-4.4 0l-1.3 1L2.5 10.5l1-1.3A5 5 0 013 7a5 5 0 01.5-2.2l-1-1.3L4 2l1.3 1a5 5 0 014.4 0l1.3-1L12.5 3.5l-1 1.3A5 5 0 0112 7z" />
  </svg>
);
const IconDons = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 12.5c3.5-2.5 5.5-5 5.5-7.5A3 3 0 009.5 2 3 3 0 007 3.5 3 3 0 004.5 2 3 3 0 001.5 5c0 2.5 2 5 5.5 7.5z" />
  </svg>
);

const TABS = [
  { id: 'annonces',  label: 'Annonces',           icon: <IconAnnonce />,   roles: ['editor', 'admin', 'super_admin'] },
  { id: 'services',  label: 'Services',           icon: <IconCal />,       roles: ['editor', 'admin', 'super_admin'] },
  { id: 'cellules',  label: 'Cellules',           icon: <IconCroix />,     roles: ['editor', 'admin', 'super_admin'] },
  { id: 'videos',    label: 'Videos',             icon: <IconPlay />,      roles: ['editor', 'admin', 'super_admin'] },
  { id: 'priere',    label: 'Messages priere',    icon: <IconCroix />,     roles: ['editor', 'admin', 'super_admin'] },
  { id: 'settings',  label: 'Reglages',           icon: <IconSettings />,  roles: ['editor', 'admin', 'super_admin'] },
  { id: 'dons',      label: 'Dons',               icon: <IconDons />,      roles: ['admin', 'super_admin'] },
  { id: 'formation', label: 'Formation',          icon: <IconFormation />, roles: ['admin', 'super_admin'] },
];

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [adminInfo, setAdminInfo] = useState(undefined);
  const [activeTab, setActiveTab] = useState('annonces');
  const [animKey, setAnimKey] = useState(0);
  const switchTab = (tab) => { setActiveTab(tab); setAnimKey(k => k + 1); };

  const userRole = adminInfo?.role || null;
  const visibleTabs = TABS.filter(t => t.roles.includes(userRole));

  useEffect(() => {
    const checkAuth = async () => {
      const sess = await getSession();
      setSession(sess);
      if (sess) {
        const result = await checkIsAdmin();
        setAdminInfo(result);
        if (!result.isAdmin) {
          await signOut();
          setSession(null);
        }
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  if (session === undefined || (session && adminInfo === undefined)) {
    return <div className="admin-loading">Chargement…</div>;
  }
  if (!session || !adminInfo?.isAdmin) {
    return <LoginForm onLogin={async () => {
      const sess = await getSession();
      setSession(sess);
      const result = await checkIsAdmin();
      setAdminInfo(result);
    }} />;
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <div className="admin-header-brand">
          <img src={logoPng} alt="E-T-C" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <span>Administration</span>
        </div>
        <button className="admin-btn-secondary" onClick={async () => { await signOut(); setSession(null); }}>
          Déconnexion
        </button>
      </div>

      <div className="admin-layout">
        <nav className="admin-nav">
          {visibleTabs.map(t => (
            <button key={t.id} className={`admin-nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => switchTab(t.id)}>
              {t.icon}
              {t.label}
            </button>
          ))}
          {userRole && (
            <div className="admin-role-badge">{userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Editeur'}</div>
          )}
        </nav>

        <div className="admin-content">
          <div key={animKey} style={{ animation: 'adminFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
            {activeTab === 'annonces'  && <TabAnnonces />}
            {activeTab === 'services'  && <TabServices />}
            {activeTab === 'cellules'  && <TabCellules />}
            {activeTab === 'videos'    && <TabVideos />}
            {activeTab === 'priere'    && <TabPriere />}
            {activeTab === 'settings'  && <TabSettings />}
            {activeTab === 'dons'      && <TabDons />}
            {activeTab === 'formation' && <TabFormation />}
          </div>
        </div>
      </div>
    </div>
  );
}
