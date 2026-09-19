/**
 * DataList - Liste de donnees responsive
 * Tableau au-dessus de 768px, cartes en dessous
 */

import React from 'react';
import './DataList.css';

export function DataList({
  columns,
  rows,
  onRowClick,
  actions,
  emptyMessage = 'Aucune donnee',
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className="admin-datalist-loading">
        <div className="admin-datalist-skeleton" />
        <div className="admin-datalist-skeleton" />
        <div className="admin-datalist-skeleton" />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="admin-datalist-empty">{emptyMessage}</div>;
  }

  const primaryColumn = columns.find(c => c.primary) || columns[0];
  const visibleOnPhone = columns.filter(c => !c.hideOnPhone);

  return (
    <div className={`admin-datalist ${className}`}>
      {/* Vue tableau (desktop) */}
      <div className="admin-datalist-table-wrap">
        <table className="admin-datalist-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.hideOnPhone ? 'hide-on-phone' : ''}>
                  {col.label}
                </th>
              ))}
              {actions && <th className="admin-datalist-actions-col">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'admin-datalist-row-clickable' : ''}
              >
                {columns.map(col => (
                  <td key={col.key} className={col.hideOnPhone ? 'hide-on-phone' : ''}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="admin-datalist-actions-cell" onClick={e => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue cartes (mobile) */}
      <div className="admin-datalist-cards">
        {rows.map((row, idx) => (
          <div
            key={row.id || idx}
            className={`admin-datalist-card ${onRowClick ? 'admin-datalist-card-clickable' : ''}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="admin-datalist-card-header">
              <div className="admin-datalist-card-title">
                {primaryColumn.render
                  ? primaryColumn.render(row[primaryColumn.key], row)
                  : row[primaryColumn.key]}
              </div>
            </div>

            <div className="admin-datalist-card-body">
              {visibleOnPhone.slice(1, 4).map(col => {
                const value = col.render ? col.render(row[col.key], row) : row[col.key];
                if (value === null || value === undefined || value === '') return null;
                return (
                  <div key={col.key} className="admin-datalist-card-row">
                    <span className="admin-datalist-card-label">{col.label}</span>
                    <span className="admin-datalist-card-value">{value}</span>
                  </div>
                );
              })}
            </div>

            {actions && (
              <div className="admin-datalist-card-actions" onClick={e => e.stopPropagation()}>
                {actions(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataListActions({ children }) {
  const childArray = React.Children.toArray(children);

  if (childArray.length <= 2) {
    return <div className="admin-datalist-actions">{children}</div>;
  }

  return (
    <div className="admin-datalist-actions admin-datalist-actions--overflow">
      {childArray.slice(0, 1)}
      <DataListActionsMenu>{childArray.slice(1)}</DataListActionsMenu>
    </div>
  );
}

function DataListActionsMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="admin-datalist-menu" ref={menuRef}>
      <button
        type="button"
        className="admin-datalist-menu-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Plus d'actions"
      >
        ...
      </button>
      {open && (
        <div className="admin-datalist-menu-dropdown">
          {React.Children.map(children, child => (
            <div
              className="admin-datalist-menu-item"
              onClick={() => setOpen(false)}
            >
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}) {
  return (
    <button
      type="button"
      className={`admin-action-btn admin-action-btn--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
