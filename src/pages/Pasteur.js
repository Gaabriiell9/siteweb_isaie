import React from 'react';
import SectionHeader from '../components/SectionHeader';
import couplePng from '../assets/photo-couple.png';
import './Pasteur.css';


export default function Pasteur() {
  return (
    <div className="pasteur-wrap">
      <div className="pasteur-hero">
        <div className="pasteur-hero-inner">
          <div className="pasteur-texte">
            <p className="section-label">Notre Église</p>
            <h1 className="pasteur-titre">Le couple<br /><em>pastoral</em></h1>
            <p className="pasteur-role">Fondateurs · Église Temple de la Célébration · Temple Béthel</p>
            <p className="pasteur-devise">
              « Dieu par l'adoration<br />et la louange »
            </p>
          </div>
          <div className="pasteur-photo-col">
            <div className="pasteur-photo-frame">
              <img src={couplePng} alt="Couple pastoral" className="pasteur-photo-img" />
            </div>
            <div className="pasteur-photo-tag">Couple Pastoral</div>
          </div>
        </div>
      </div>

      <div className="pasteur-body">
        <div className="pasteur-body-inner">
          <div className="pasteur-vision">
            <div className="pasteur-vision-label">Notre<br />vision</div>
            <div className="pasteur-vision-texte">
              <p>Portés par la conviction profonde de glorifier Dieu à travers l'adoration et la louange, le couple pastoral conduit l'Église Temple de la Célébration et le Temple Béthel avec foi, amour et dévotion.</p>
              <p>Chaque culte, chaque cellule, chaque moment de prière est une expression de cette vision : rapprocher chaque âme de la présence de Dieu et bâtir une communauté fondée sur Sa Parole.</p>
            </div>
          </div>
          <div className="pasteur-contact">
            <h3>Prendre contact</h3>
            <a href="mailto:contact@etc-church.org" className="pasteur-contact-btn">
              Nous écrire →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
