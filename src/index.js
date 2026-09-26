import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// DEBUG: Capturer le hash AVANT que le SDK Supabase ne le nettoie
const initialHash = window.location.hash;
const initialHref = window.location.href;
sessionStorage.setItem('debug_initial_hash', initialHash);
sessionStorage.setItem('debug_initial_href', initialHref);
sessionStorage.setItem('debug_initial_timestamp', new Date().toISOString());

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
