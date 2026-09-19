import React, { useState, useEffect, useCallback } from 'react';
import logoPng from '../assets/logoe-eglise.png';
import { signIn, signOut, getSession, checkIsAdmin } from '../lib/auth';
import { ADMIN_NAV, findItemByPath, getFirstAuthorizedItem, getAuthorizedNav } from './admin/nav';
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminNav({ userRole, activePath, onNavigate, mobileOpen, onMobileClose }) {
  const authorizedNav = getAuthorizedNav(userRole);
  const activeGroupId = activePath?.split('/')[0];
  const [openGroups, setOpenGroups] = useState(() => {
    return activeGroupId ? [activeGroupId] : [];
  });

  useEffect(() => {
    if (activeGroupId && !openGroups.includes(activeGroupId)) {
      setOpenGroups(prev => [...prev, activeGroupId]);
    }
  }, [activeGroupId]);

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
    if (mobileOpen) onMobileClose();
  };

  return (
    <nav className={`admin-nav ${mobileOpen ? 'admin-nav--open' : ''}`}>
      {authorizedNav.map(group => {
        const isActive = group.id === activeGroupId;
        const isOpen = openGroups.includes(group.id);
        const isSingleItem = group.items.length === 1;

        return (
          <div key={group.id} className="admin-nav-group">
            <button
              className={`admin-nav-group-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleGroupClick(group)}
              aria-expanded={isOpen}
            >
              <Icon name={group.icon} size={16} />
              <span>{group.label}</span>
              {!isSingleItem && (
                <Icon
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  className="admin-nav-chevron"
                />
              )}
            </button>

            {!isSingleItem && isOpen && (
              <div className="admin-nav-items">
                {group.items.map(item => {
                  const itemPath = `${group.id}/${item.id}`;
                  const isItemActive = activePath === itemPath;
                  return (
                    <button
                      key={item.id}
                      className={`admin-nav-item ${isItemActive ? 'active' : ''}`}
                      onClick={() => handleItemClick(group.id, item.id)}
                    >
                      <Icon name={item.icon} size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="admin-role-badge">
        {userRole === 'super_admin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Editeur'}
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
      <div className="admin-header">
        <div className="admin-header-left">
          <button
            className="admin-menu-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="admin-header-brand">
            <img src={logoPng} alt="E-T-C" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
            <span>Administration</span>
          </div>
        </div>
        <button className="admin-btn-secondary" onClick={async () => { await signOut(); setSession(null); }}>
          Deconnexion
        </button>
      </div>

      <div className="admin-layout">
        {mobileMenuOpen && (
          <div className="admin-nav-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}

        <AdminNav
          userRole={userRole}
          activePath={activePath}
          onNavigate={navigate}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="admin-content">
          {pageTitle && <h2 className="admin-page-title">{pageTitle}</h2>}
          <div key={animKey} style={{ animation: 'adminFadeIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
            {CurrentComponent && <CurrentComponent />}
          </div>
        </div>
      </div>
    </div>
  );
}
