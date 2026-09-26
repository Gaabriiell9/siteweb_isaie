import { supabase } from './client';

const FUNCTION_URL = process.env.REACT_APP_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1');

/**
 * Cree une session Stripe Checkout pour un eleve deja connecte
 * (paiement a reprendre ou nouvelle echeance)
 */
export async function createCheckoutSession() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { url: null, error: 'Non connecte' };
  }

  try {
    const response = await fetch(`${FUNCTION_URL}/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || 'Erreur serveur' };
    }

    return { url: data.url, error: null };
  } catch (err) {
    console.error('Erreur createCheckoutSession:', err);
    return { url: null, error: err.message || 'Erreur reseau' };
  }
}

/**
 * Cree une session Stripe Checkout pour une NOUVELLE inscription
 * Le compte sera cree apres paiement reussi via le webhook
 */
export async function createCheckoutSessionInscription(inscriptionData) {
  try {
    const response = await fetch(`${FUNCTION_URL}/create-checkout-session-inscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inscriptionData),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.error === 'EMAIL_EXISTS') {
        return { url: null, sessionId: null, error: 'EMAIL_EXISTS' };
      }
      return { url: null, sessionId: null, error: data.error || 'Erreur serveur' };
    }

    return { url: data.url, sessionId: data.session_id, error: null };
  } catch (err) {
    console.error('Erreur createCheckoutSessionInscription:', err);
    return { url: null, sessionId: null, error: err.message || 'Erreur reseau' };
  }
}
