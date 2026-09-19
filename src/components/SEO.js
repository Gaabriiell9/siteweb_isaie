import { useEffect, useState } from 'react';
import { getSiteSettings } from '../lib/public';

export default function SEO() {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const sameAs = [
      settings.facebook_url,
      settings.youtube_url,
      settings.instagram_url,
    ].filter(Boolean);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Church',
      name: settings.nom_eglise || 'Église Temple de la Célébration',
      alternateName: 'E.T.C',
      description: 'Dieu par l\'adoration et la louange. Cultes en ligne, montagne de prière, cellules de quartier et formation biblique.',
      url: window.location.origin,
      logo: `${window.location.origin}/logoe-eglise.png`,
      image: `${window.location.origin}/pr_img.png`,
      email: settings.email_contact || undefined,
      telephone: settings.telephone || undefined,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
    };

    let script = document.getElementById('church-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'church-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      if (script) script.remove();
    };
  }, [settings]);

  return null;
}
