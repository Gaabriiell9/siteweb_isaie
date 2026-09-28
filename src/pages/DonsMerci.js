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
            Ton soutien contribue à la vie et au ministère de l'Église Temple de la Célébration.
            Que Dieu te bénisse pour ta générosité.
          </p>

          <Link to="/" className="dons-merci-link">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
