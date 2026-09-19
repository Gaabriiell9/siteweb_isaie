/**
 * Tabs - Barre d'onglets responsive avec scroll horizontal
 */

import React, { useRef, useEffect } from 'react';
import './Tabs.css';

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}) {
  const containerRef = useRef(null);
  const activeButtonRef = useRef(null);

  useEffect(() => {
    if (activeButtonRef.current && containerRef.current) {
      const container = containerRef.current;
      const button = activeButtonRef.current;

      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      const scrollLeft = button.offsetLeft - (containerRect.width / 2) + (buttonRect.width / 2);

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeTab]);

  return (
    <div className={`admin-tabs ${className}`}>
      <div className="admin-tabs-container" ref={containerRef}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            ref={tab.id === activeTab ? activeButtonRef : undefined}
            type="button"
            className={`admin-tabs-btn ${tab.id === activeTab ? 'admin-tabs-btn--active' : ''}`}
            onClick={() => onChange(tab.id)}
            aria-selected={tab.id === activeTab}
            role="tab"
          >
            <span className="admin-tabs-btn-label">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="admin-tabs-btn-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TabPanel({ children, className = '' }) {
  return (
    <div className={`admin-tab-panel ${className}`} role="tabpanel">
      {children}
    </div>
  );
}
