import React from 'react';

export default function SectionHeader({ label, title, titleEm, subtitle, dark = false, actions }) {
  return (
    <div style={{
      background: dark ? 'var(--bordeaux)' : 'var(--creme)',
      padding: '60px 24px 48px',
      textAlign: 'center',
      borderBottom: dark ? '1px solid rgba(200,134,10,0.15)' : '1px solid rgba(200,134,10,0.1)',
      position: 'relative',
    }}>
      {actions && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {actions}
        </div>
      )}
      {label && (
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase',
          color: dark ? 'var(--or-clair)' : 'var(--bordeaux)', fontWeight: 500, marginBottom: 12,
          opacity: 1,
        }}>{label}</p>
      )}
      <h2 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 'clamp(28px, 4vw, 42px)',
        fontWeight: 400, lineHeight: 1.15,
        color: dark ? 'var(--creme)' : 'var(--bordeaux-clair)',
        maxWidth: 600, margin: '0 auto',
        letterSpacing: '-0.5px',
      }}>
        {title}{titleEm && <> <em style={{ fontStyle: 'italic', color: 'var(--or-clair)', fontWeight: 400 }}>{titleEm}</em></>}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
          color: dark ? 'rgba(255,248,240,0.78)' : 'var(--texte-doux)',
          marginTop: 16, fontWeight: 400,
        }}>{subtitle}</p>
      )}
    </div>
  );
}
