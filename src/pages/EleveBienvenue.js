import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/client';
import './EleveLogin.css';

export default function EleveBienvenue() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // DEBUG: Etats pour le diagnostic
  const [debugInfo, setDebugInfo] = useState({
    initialHash: '',
    initialHref: '',
    initialTimestamp: '',
    hashAtMount: '',
    authEvents: [],
    sessionInfo: null
  });

  useEffect(() => {
    // DEBUG: Recuperer les infos capturees avant le rendu
    const initialHash = sessionStorage.getItem('debug_initial_hash') || '(non capture)';
    const initialHref = sessionStorage.getItem('debug_initial_href') || '(non capture)';
    const initialTimestamp = sessionStorage.getItem('debug_initial_timestamp') || '';
    const hashAtMount = window.location.hash || '(vide)';
    const authEvents = JSON.parse(sessionStorage.getItem('debug_auth_events') || '[]');

    setDebugInfo(prev => ({
      ...prev,
      initialHash,
      initialHref,
      initialTimestamp,
      hashAtMount,
      authEvents
    }));

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // DEBUG: Logger les infos de session
      const sessionInfo = session ? {
        hasSession: true,
        email: session.user?.email,
        appMetadata: JSON.stringify(session.user?.app_metadata || {}),
        userMetadata: JSON.stringify(session.user?.user_metadata || {}),
        aal: session.aal,
        amr: JSON.stringify(session.amr || [])
      } : { hasSession: false };

      setDebugInfo(prev => ({ ...prev, sessionInfo }));

      if (session) {
        setSessionReady(true);
      } else {
        setError('Ce lien n\'est plus valide. Contacte l\'administration pour recevoir une nouvelle invitation.');
      }
    };
    checkSession();

    // DEBUG: Ecouter les evenements auth sur cette page aussi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setDebugInfo(prev => {
        const newEvents = [...prev.authEvents, {
          time: new Date().toISOString(),
          source: 'EleveBienvenue',
          event: event,
          hasSession: session ? 'session presente' : 'aucune session'
        }].slice(-10);
        sessionStorage.setItem('debug_auth_events', JSON.stringify(newEvents));
        return { ...prev, authEvents: newEvents };
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === passwordConfirm;
  const canSubmit = passwordValid && passwordsMatch && sessionReady;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setLoading(false);
      if (updateError.message?.includes('expired') || updateError.message?.includes('invalid')) {
        setError('Ce lien n\'est plus valide. Demande a l\'administration de te renvoyer une invitation.');
      } else if (updateError.message?.includes('weak') || updateError.message?.includes('short')) {
        setError('Le mot de passe est trop faible. Utilise au moins 8 caracteres.');
      } else {
        setError(updateError.message || 'Une erreur est survenue. Reessaie.');
      }
      return;
    }

    navigate('/eleve');
  };

  return (
    <div className="el-login-wrap">
      {/* DEBUG: Encart de diagnostic */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'var(--or-pale)',
        border: '1px solid var(--or)',
        padding: '12px 16px',
        fontSize: '11px',
        fontFamily: 'monospace',
        maxHeight: '40vh',
        overflow: 'auto',
        zIndex: 9999
      }}>
        <strong style={{ color: 'var(--bordeaux)' }}>DEBUG TEMPORAIRE</strong>
        <div style={{ marginTop: '8px' }}>
          <div><strong>Hash initial (index.js):</strong> {debugInfo.initialHash}</div>
          <div><strong>Timestamp capture:</strong> {debugInfo.initialTimestamp}</div>
          <div><strong>Hash au mount EleveBienvenue:</strong> {debugInfo.hashAtMount}</div>
          <div style={{ wordBreak: 'break-all' }}><strong>URL initiale:</strong> {debugInfo.initialHref}</div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <strong>Session (getSession):</strong>
          {debugInfo.sessionInfo && (
            <div style={{ marginLeft: '8px' }}>
              <div>hasSession: {debugInfo.sessionInfo.hasSession ? 'OUI' : 'NON'}</div>
              {debugInfo.sessionInfo.hasSession && (
                <>
                  <div>email: {debugInfo.sessionInfo.email}</div>
                  <div>app_metadata: {debugInfo.sessionInfo.appMetadata}</div>
                  <div>user_metadata: {debugInfo.sessionInfo.userMetadata}</div>
                  <div>aal: {debugInfo.sessionInfo.aal}</div>
                  <div>amr: {debugInfo.sessionInfo.amr}</div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: '12px' }}>
          <strong>Evenements auth ({debugInfo.authEvents.length}):</strong>
          {debugInfo.authEvents.map((evt, i) => (
            <div key={i} style={{ marginLeft: '8px', marginTop: '4px', padding: '4px', background: 'rgba(255,255,255,0.5)' }}>
              <div>{evt.time}</div>
              <div>source: {evt.source} | event: <strong style={{ color: 'var(--bordeaux)' }}>{evt.event}</strong> | {evt.hasSession}</div>
              {evt.hash && <div>hash: {evt.hash}</div>}
            </div>
          ))}
          {debugInfo.authEvents.length === 0 && <div style={{ marginLeft: '8px' }}>(aucun evenement)</div>}
        </div>
      </div>

      <div className="el-login-card" style={{ marginTop: '45vh' }}>
        <div className="el-login-card-top" />

        <div className="el-login-logo">ETC</div>

        <h1 className="el-login-titre">Bienvenue</h1>
        <p className="el-login-sub">Cree ton mot de passe</p>

        {error && (
          <div className="el-login-error" style={{
            background: 'rgba(192,57,43,0.08)',
            border: '1px solid rgba(192,57,43,0.2)',
            color: 'var(--statut-erreur)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            lineHeight: '1.5',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form className="el-login-form" onSubmit={handleSubmit}>
          <div className="el-login-field">
            <label className="el-login-label">Nouveau mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caracteres"
              autoComplete="new-password"
              disabled={!sessionReady}
            />
            {password && !passwordValid && (
              <span style={{ fontSize: '12px', color: 'var(--statut-erreur)', marginTop: '4px' }}>
                Le mot de passe doit contenir au moins 8 caracteres
              </span>
            )}
          </div>

          <div className="el-login-field">
            <label className="el-login-label">Confirmer le mot de passe</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Repete ton mot de passe"
              autoComplete="new-password"
              disabled={!sessionReady}
            />
            {passwordConfirm && !passwordsMatch && (
              <span style={{ fontSize: '12px', color: 'var(--statut-erreur)', marginTop: '4px' }}>
                Les mots de passe ne correspondent pas
              </span>
            )}
          </div>

          <button
            type="submit"
            className="el-login-btn"
            disabled={!canSubmit || loading}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Creation en cours...' : 'Creer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
