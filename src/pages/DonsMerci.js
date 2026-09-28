import React from 'react';
import { Link } from 'react-router-dom';
import SectionHeader from '../components/SectionHeader';
import './DonsMerci.css';

export default function DonsMerci() {
  return (
    <div>
      <SectionHeader
        label="Soutien"
        title="Merci pour"
        titleEm="ton don"
      />

      <div className="dons-merci-page">
        <div className="dons-merci-content">
          <p className="dons-merci-text">
            Ton soutien contribue a la vie et au ministere de l'Eglise Temple de la Celebration.
            Que Dieu te benisse pour ta generosite.
          </p>

          <Link to="/" className="dons-merci-link">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
