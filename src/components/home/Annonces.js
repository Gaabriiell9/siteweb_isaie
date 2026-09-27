import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Annonces.css';

function formatDate(dateStr) {
  if (!dateStr) return { jour: '', mois: '', full: '' };
  const d = new Date(dateStr);
  const jour = d.getDate();
  const moisNoms = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const moisCourt = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  const mois = moisCourt[d.getMonth()];
  const full = `${jour} ${moisNoms[d.getMonth()]} ${d.getFullYear()}`;
  return { jour, mois, full };
}

function AnnonceCard({ annonce, index, onClick, isFirst = false }) {
  const { jour, mois } = formatDate(annonce.date_publi);
  const hasImage = annonce.image_url?.trim();
  const [imageError, setImageError] = useState(false);
  const showImage = hasImage && !imageError;

  return (
    <button
      type="button"
      className="annonce-card"
      onClick={() => onClick(index)}
      aria-label={`Voir l'annonce : ${annonce.titre}`}
    >
      <div className="annonce-card-visual">
        {showImage ? (
          <>
            <div
              className="annonce-card-bg"
              style={{ backgroundImage: `url(${annonce.image_url})` }}
              aria-hidden="true"
            />
            <div className="annonce-card-bg-overlay" aria-hidden="true" />
            <img
              src={annonce.image_url}
              alt={annonce.titre}
              className="annonce-card-img"
              loading={isFirst ? 'eager' : 'lazy'}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div className="annonce-card-date-placeholder">
            <span className="annonce-card-jour">{jour}</span>
            <span className="annonce-card-mois">{mois}</span>
          </div>
        )}
      </div>
      <div className="annonce-card-body">
        {annonce.pinned && <span className="annonce-badge">À la une</span>}
        <time className="annonce-card-date">{jour} {mois}</time>
        <h3 className="annonce-card-titre">{annonce.titre}</h3>
        {annonce.contenu && (
          <p className="annonce-card-extrait">{annonce.contenu}</p>
        )}
      </div>
    </button>
  );
}

function AnnonceModal({ annonces, currentIndex, onClose, onNavigate }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const annonce = annonces[currentIndex];
  const { full: dateFull } = formatDate(annonce?.date_publi);
  const [imageError, setImageError] = useState(false);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < annonces.length - 1;

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && hasPrev) {
      onNavigate(currentIndex - 1);
    } else if (e.key === 'ArrowRight' && hasNext) {
      onNavigate(currentIndex + 1);
    } else if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setImageError(false);
  }, [currentIndex]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!annonce) return null;

  const hasImage = annonce.image_url?.trim() && !imageError;

  return (
    <div
      className="annonce-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titre"
    >
      <div className="annonce-modal" ref={modalRef}>
        <div className="annonce-modal-header">
          <button
            ref={closeButtonRef}
            type="button"
            className="annonce-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="annonce-modal-content">
          {hasImage && (
            <div className="annonce-modal-visual">
              <div
                className="annonce-modal-bg"
                style={{ backgroundImage: `url(${annonce.image_url})` }}
                aria-hidden="true"
              />
              <div className="annonce-modal-bg-overlay" aria-hidden="true" />
              <img
                src={annonce.image_url}
                alt={annonce.titre}
                className="annonce-modal-img"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div className="annonce-modal-body">
            {annonce.pinned && <span className="annonce-badge">À la une</span>}
            <time className="annonce-modal-date">{dateFull}</time>
            <h2 id="modal-titre" className="annonce-modal-titre">{annonce.titre}</h2>
            {annonce.contenu && (
              <div className="annonce-modal-texte">{annonce.contenu}</div>
            )}
          </div>
        </div>

        {annonces.length > 1 && (
          <div className="annonce-modal-nav">
            <button
              type="button"
              className="annonce-modal-nav-btn"
              onClick={() => onNavigate(currentIndex - 1)}
              disabled={!hasPrev}
              aria-label="Annonce précédente"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="annonce-modal-counter">
              {currentIndex + 1} / {annonces.length}
            </span>
            <button
              type="button"
              className="annonce-modal-nav-btn"
              onClick={() => onNavigate(currentIndex + 1)}
              disabled={!hasNext}
              aria-label="Annonce suivante"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Annonces({ annonces = [], loading = false }) {
  const [modalIndex, setModalIndex] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const carouselRef = useRef(null);
  const triggerRef = useRef(null);

  const updateScrollState = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, annonces]);

  const scroll = (direction) => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.annonce-card')?.offsetWidth || 320;
    const gap = 24;
    const scrollAmount = cardWidth + gap;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  };

  const openModal = (index) => {
    triggerRef.current = document.activeElement;
    setModalIndex(index);
  };

  const closeModal = () => {
    setModalIndex(null);
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  if (loading) {
    return (
      <section className="annonces-section">
        <div className="annonces-container">
          <div className="annonces-skeleton">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        </div>
      </section>
    );
  }

  if (!annonces || annonces.length === 0) {
    return null;
  }

  const isSingle = annonces.length === 1;

  return (
    <section className="annonces-section" id="actualites">
      <div className="annonces-container">
        <h2 className="section-title">À la <em>une</em></h2>

        {isSingle ? (
          <div className="annonces-single">
            <AnnonceCard
              annonce={annonces[0]}
              index={0}
              onClick={openModal}
              isFirst={true}
            />
          </div>
        ) : (
          <div className="annonces-carousel-wrap">
            <button
              type="button"
              className="annonces-arrow annonces-arrow--left"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Annonces précédentes"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="annonces-carousel" ref={carouselRef}>
              {annonces.map((a, i) => (
                <AnnonceCard
                  key={a.id}
                  annonce={a}
                  index={i}
                  onClick={openModal}
                  isFirst={i === 0}
                />
              ))}
            </div>

            <button
              type="button"
              className="annonces-arrow annonces-arrow--right"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Annonces suivantes"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {modalIndex !== null && (
        <AnnonceModal
          annonces={annonces}
          currentIndex={modalIndex}
          onClose={closeModal}
          onNavigate={setModalIndex}
        />
      )}
    </section>
  );
}
