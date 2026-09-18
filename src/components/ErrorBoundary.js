import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}>
            ⚠️
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--color-emerald, #1E3A34)',
            marginBottom: '12px',
          }}>
            Une erreur est survenue
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--texte-doux, #6B7280)',
            maxWidth: '400px',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}>
            Nous sommes desoles, quelque chose s'est mal passe. Veuillez rafraichir la page ou revenir a l'accueil.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                background: 'var(--color-gold, #C89B4A)',
                color: 'var(--color-ink, #1A1814)',
                cursor: 'pointer',
              }}
            >
              Rafraichir la page
            </button>
            <a
              href="/"
              style={{
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                fontSize: '12px',
                fontWeight: 600,
                padding: '12px 24px',
                border: '1px solid var(--color-border, #E5E7EB)',
                borderRadius: '6px',
                background: 'white',
                color: 'var(--color-emerald, #1E3A34)',
                textDecoration: 'none',
              }}
            >
              Retour a l'accueil
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
