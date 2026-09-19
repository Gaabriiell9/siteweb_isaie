import React, { useState, useEffect, useCallback, useRef } from 'react';
import logoPng from '../assets/logoe-eglise.png';
import { signIn, signOut, getSession, checkIsAdmin } from '../lib/auth';
import { ADMIN_NAV, findItemByPath, getFirstAuthorizedItem, getAuthorizedNav } from './admin/nav';
import './admin/admin.css';
import './Admin.css';
import Icon from '../components/Icon';

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
        <p>Eglise Temple de la Celebration</p>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-login-field">
            <label className="admin-login-label" htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="admin-login-field">
            <label className="admin-login-label" htmlFor="admin-password">Mot de passe</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <div className="admin-error">{error}</div>}
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminNav({ userRole, activePath, onNavigate, isOpen, onClose, onLogout }) {
  const authorizedNav = getAuthorizedNav(userRole);
  const activeGroupId = activePath?.split('/')[0];
  const [openGroups, setOpenGroups] = useState(() => {
    return activeGroupId ? [activeGroupId] : [];
  });
  const navRef = useRef(null);
  const closeButtonRef = useRef(null);
  const firstFocusableRef = useRef(null);

  useEffect(() => {
    if (activeGroupId && !openGroups.includes(activeGroupId)) {
      setOpenGroups(prev => [...prev, activeGroupId]);
    }
  }, [activeGroupId]);

  // Focus trap et gestion du clavier
  useEffect(() => {
    if (!isOpen) return;

    // Focus le bouton de fermeture a l'ouverture
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    // Verrouiller le scroll de la page
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && navRef.current) {
        const focusables = navRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Gestion du bouton retour navigateur
  useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen, onClose]);

  const toggleGroup = (groupId) => {
    setOpenGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleGroupClick = (group) => {
    if (group.items.length === 1) {
      onNavigate(`${group.id}/${group.items[0].id}`);
    } else {
      toggleGroup(group.id);
    }
  };

  const handleItemClick = (groupId, itemId) => {
    onNavigate(`${groupId}/${itemId}`);
  };

  const roleLabel = userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Editeur';

  return (
    <nav
      ref={navRef}
      className={`admin-nav ${isOpen ? 'admin-nav--open' : ''}`}
      aria-label="Navigation administration"
      role="navigation"
    >
      {/* Bouton fermeture (mobile) */}
      <div className="admin-nav-close">
        <button
          ref={closeButtonRef}
          className="admin-nav-close-btn"
          onClick={onClose}
          aria-label="Fermer le menu"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Contenu navigation */}
      <div className="admin-nav-content">
        {authorizedNav.map(group => {
          const isActive = group.id === activeGroupId;
          const isGroupOpen = openGroups.includes(group.id);
          const isSingleItem = group.items.length === 1;

          return (
            <div key={group.id} className="admin-nav-group">
              <button
                className={`admin-nav-group-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleGroupClick(group)}
                aria-expanded={isSingleItem ? undefined : isGroupOpen}
                aria-controls={isSingleItem ? undefined : `nav-items-${group.id}`}
              >
                <Icon name={group.icon} size={18} />
                <span>{group.label}</span>
                {!isSingleItem && (
                  <Icon
                    name={isGroupOpen ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    className="admin-nav-chevron"
                  />
                )}
              </button>

              {!isSingleItem && isGroupOpen && (
                <div id={`nav-items-${group.id}`} className="admin-nav-items">
                  {group.items.map(item => {
                    const itemPath = `${group.id}/${item.id}`;
                    const isItemActive = activePath === itemPath;
                    return (
                      <button
                        key={item.id}
                        className={`admin-nav-item ${isItemActive ? 'active' : ''}`}
                        onClick={() => handleItemClick(group.id, item.id)}
                        aria-current={isItemActive ? 'page' : undefined}
                      >
                        <Icon name={item.icon} size={16} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pied du menu */}
      <div className="admin-nav-footer">
        <div className="admin-role-badge">{roleLabel}</div>
        <button className="admin-nav-logout" onClick={onLogout}>
          <Icon name="log-out" size={16} />
          Deconnexion
        </button>
      </div>
    </nav>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [adminInfo, setAdminInfo] = useState(undefined);
  const [activePath, setActivePath] = useState('');
  const [animKey, setAnimKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const userRole = adminInfo?.role || null;

  const getHashPath = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || null;
  }, []);

  const setHashPath = useCallback((path) => {
    window.location.hash = path;
  }, []);

  const navigate = useCallback((path) => {
    setHashPath(path);
    setActivePath(path);
    setAnimKey(k => k + 1);
    setMobileMenuOpen(false);
  }, [setHashPath]);

  const handleCloseMenu = useCallback(() => {
    setMobileMenuOpen(false);
    // Rendre le focus au bouton menu
    setTimeout(() => {
      menuButtonRef.current?.focus();
    }, 100);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    setSession(null);
  }, []);

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
    if (!userRole) return;

    const hashPath = getHashPath();
    const result = hashPath ? findItemByPath(hashPath, userRole) : null;

    if (result) {
      setActivePath(hashPath);
    } else {
      const firstPath = getFirstAuthorizedItem(userRole);
      if (firstPath) {
        setHashPath(firstPath);
        setActivePath(firstPath);
      }
    }

    const handleHashChange = () => {
      const newPath = getHashPath();
      const newResult = newPath ? findItemByPath(newPath, userRole) : null;
      if (newResult) {
        setActivePath(newPath);
        setAnimKey(k => k + 1);
      } else {
        const firstPath = getFirstAuthorizedItem(userRole);
        if (firstPath) {
          setHashPath(firstPath);
          setActivePath(firstPath);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [userRole, getHashPath, setHashPath]);

  if (session === undefined || (session && adminInfo === undefined)) {
    return <div className="admin-loading">Chargement...</div>;
  }

  if (!session || !adminInfo?.isAdmin) {
    return <LoginForm onLogin={async () => {
      const sess = await getSession();
      setSession(sess);
      const result = await checkIsAdmin();
      setAdminInfo(result);
    }} />;
  }

  const currentItem = activePath ? findItemByPath(activePath, userRole) : null;
  const CurrentComponent = currentItem?.item?.component;
  const pageTitle = currentItem?.item?.label || '';

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="admin-header-left">
          <button
            ref={menuButtonRef}
            className="admin-menu-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-nav"
          >
            <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={22} />
          </button>
          <div className="admin-header-brand">
            <img src={logoPng} alt="" aria-hidden="true" />
            <span>Administration</span>
          </div>
          {pageTitle && <span className="admin-header-title">{pageTitle}</span>}
        </div>
        <button className="admin-header-logout" onClick={handleLogout}>
          <Icon name="log-out" size={16} />
          Deconnexion
        </button>
      </header>

      <div className="admin-layout">
        {/* Voile assombri (mobile) */}
        <div
          className={`admin-nav-backdrop ${mobileMenuOpen ? 'admin-nav-backdrop--visible' : ''}`}
          onClick={handleCloseMenu}
          aria-hidden="true"
        />

        <AdminNav
          userRole={userRole}
          activePath={activePath}
          onNavigate={navigate}
          isOpen={mobileMenuOpen}
          onClose={handleCloseMenu}
          onLogout={handleLogout}
        />

        <main className="admin-content">
          {pageTitle && <h1 className="admin-page-title">{pageTitle}</h1>}
          <div key={animKey} style={{ animation: 'adminFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
            {CurrentComponent && <CurrentComponent />}
          </div>
        </main>
      </div>
    </div>
  );
}
