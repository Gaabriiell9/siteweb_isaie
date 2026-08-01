import React from 'react';
import { Link } from 'react-router-dom';

const SOCIAL_LINKS = [
  {
    name: 'Facebook',
    url: '#', // TODO: Remplacer par le lien Facebook de l'église
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    url: '#', // TODO: Remplacer par le lien YouTube de l'église
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  // Ajouter d'autres réseaux ici si nécessaire (Instagram, Twitter, etc.)
];

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--noir)',
      borderTop: '1px solid rgba(200,134,10,0.15)',
      padding: '40px 24px 32px',
      textAlign: 'center',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:16 }}>
        <div style={{ flex:1, maxWidth:60, height:1, background:'linear-gradient(90deg,transparent,rgba(200,134,10,0.3))' }}/>
        <div style={{ width:6, height:6, border:'1px solid var(--or)', transform:'rotate(45deg)' }}/>
        <div style={{ flex:1, maxWidth:60, height:1, background:'linear-gradient(90deg,rgba(200,134,10,0.3),transparent)' }}/>
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontStyle:'italic', color:'var(--or-clair)', marginBottom:8 }}>
        Église Temple de la Célébration
      </div>
      <div style={{ fontSize:9, letterSpacing:3, textTransform:'uppercase', color:'rgba(255,248,240,0.25)', fontWeight:400 }}>
        E · T · C &nbsp;·&nbsp; Dieu par l'adoration et la louange
      </div>

      {/* Réseaux sociaux */}
      <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:20 }}>
        {SOCIAL_LINKS.map(social => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            title={social.name}
            style={{
              color: 'rgba(255,248,240,0.35)',
              transition: 'color 0.2s, transform 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(200,134,10,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--or-clair)';
              e.currentTarget.style.borderColor = 'var(--or)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,248,240,0.35)';
              e.currentTarget.style.borderColor = 'rgba(200,134,10,0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {social.icon}
          </a>
        ))}
      </div>

      <div style={{ marginTop:20, fontSize:11, color:'rgba(255,248,240,0.15)' }}>
        © {new Date().getFullYear()} Église Temple de la Célébration
      </div>
      <div style={{ marginTop:16, borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:14 }}>
        <Link to="/eleve/login" style={{
          fontFamily:'var(--font-ui)', fontSize:9, letterSpacing:'2px',
          textTransform:'uppercase', color:'rgba(255,248,240,0.2)',
          textDecoration:'none', transition:'color 0.2s',
        }}
          onMouseEnter={e => e.target.style.color='rgba(255,248,240,0.5)'}
          onMouseLeave={e => e.target.style.color='rgba(255,248,240,0.2)'}
        >
          Espace élève
        </Link>
      </div>
    </footer>
  );
}
