import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getEleveSession, getEleveProfil, signOutEleve, getMessagesNonLus, getMesSessionsLive, supabase, IS_MOCK } from '../lib/supabase';
import './Eleve.css';

// ─── Context partagé ──────────────────────────────────────────────
export const EleveContext = createContext(null);
export const useEleve = () => useContext(EleveContext);

// ─── Icônes SVG ───────────────────────────────────────────────────
const IcoHome    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcoModules = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoNotes   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoPay     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcoProfil  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoLogout  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoCours   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
const IcoMsg     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;

const NAV_LINKS = [
  { to: '/eleve/dashboard',   label: 'Tableau de bord', icon: <IcoHome /> },
  { to: '/eleve/modules',     label: 'Mes modules',     icon: <IcoModules /> },
  { to: '/eleve/cours',     label: 'Mes cours en live', icon: <IcoCours />, badgeKey: 'cours' },
  { to: '/eleve/messages',  label: 'Messages',           icon: <IcoMsg />,   badgeKey: 'messages' },
  { to: '/eleve/evaluations', label: 'Évaluations',     icon: <IcoNotes /> },
  { to: '/eleve/paiements',   label: 'Paiements',       icon: <IcoPay /> },
  { to: '/eleve/profil',      label: 'Mon profil',      icon: <IcoProfil /> },
];

export default function EleveLayout() {
  const [eleve, setEleve] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState({ messages: 0, cours: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    getEleveSession().then(session => {
      if (!session) { navigate('/eleve/login'); return; }
      getEleveProfil(session.user?.id).then(setEleve);
    });
  }, [navigate]);

  useEffect(() => {
    if (!eleve) return;
    // Charger les badges
    const loadBadges = async () => {
      const [msgs, sessions] = await Promise.all([
        getMessagesNonLus(eleve.id),
        getMesSessionsLive(eleve.id),
      ]);
      const now = Date.now();
      const coursProches = sessions.filter(s => {
        const d = new Date(s.date_session).getTime();
        return s.statut === 'programme' && d > now && d - now < 24 * 3600 * 1000;
      }).length;
      setBadges({ messages: msgs.length, cours: coursProches });
    };
    loadBadges();

    // Realtime pour les messages
    if (IS_MOCK) return;
    const channel = supabase
      .channel(`layout_messages_${eleve.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `destinataire_id=eq.${eleve.id}`,
      }, () => loadBadges())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [eleve]);

  const handleLogout = async () => {
    await signOutEleve();
    navigate('/eleve/login');
  };

  const prenom = eleve?.prenom || eleve?.nom?.split(' ')[0] || 'Étudiant';

  return (
    <EleveContext.Provider value={{ eleve, setEleve }}>
      <div className="eleve-layout">

        {/* ── Sidebar ── */}
        <aside className={`eleve-sidebar${mobileOpen ? ' open' : ''}`}>
          <div className="eleve-sb-header">
            <div className="eleve-sb-logo">E·T·C</div>
            <div className="eleve-sb-name">{eleve ? eleve.nom : '…'}</div>
            <div className="eleve-sb-sub">Formation Théologique</div>
          </div>

          <nav className="eleve-sb-nav">
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `eleve-sb-link${isActive ? ' active' : ''}`}
                onClick={() => setMobileOpen(false)}>
                {l.icon}
                <span>{l.label}</span>
                {l.badgeKey && badges[l.badgeKey] > 0 && (
                  <span className="eleve-sb-badge">{badges[l.badgeKey]}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="eleve-sb-footer">
            <button className="eleve-sb-logout" onClick={handleLogout}>
              <IcoLogout /> Déconnexion
            </button>
          </div>
        </aside>

        {/* ── Mobile header ── */}
        <header className="eleve-mobile-header">
          <button className="eleve-mobile-burger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <span className="eleve-mobile-title">Espace Élève</span>
          <span style={{ width: 36 }} />
        </header>
        {mobileOpen && <div className="eleve-mobile-overlay" onClick={() => setMobileOpen(false)} />}

        {/* ── Contenu ── */}
        <main className="eleve-content">
          <Outlet />
        </main>
      </div>
    </EleveContext.Provider>
  );
}
