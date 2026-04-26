import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/logoe-eglise.png';
import './Navbar.css';

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/cultes', label: 'Cultes' },
  { to: '/montagne-priere', label: 'Montagne de Prière' },
  { to: '/predication', label: 'Prédication' },
  { to: '/cellule', label: 'Cellule Bethel' },
  { to: '/formation', label: 'Formation' },
  { to: '/dons', label: 'Dons' },
  { to: '/pasteur', label: 'Pasteur' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-brand">
        <NavLink to="/" className="navbar-monogram">
        <img src={logo} alt="ETC" />
      </NavLink>
        <span className="navbar-name">Temple de la Célébration</span>
      </div>
      <button className="burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
        <span /><span /><span />
      </button>
      <div className={`navbar-links ${open ? 'open' : ''}`}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
