const FUNCTION_URL = process.env.REACT_APP_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1');

/**
 * Cree une session Stripe Checkout pour un DON
 * Aucune ecriture en base, le webhook s'en charge apres paiement
 */
export async function createCheckoutSessionDon(donData) {
  try {
    const response = await fetch(`${FUNCTION_URL}/create-checkout-session-don`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donData),
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || 'Erreur serveur', status: response.status };
    }

    return { url: data.url, error: null, status: response.status };
  } catch (err) {
    console.error('Erreur createCheckoutSessionDon:', err);
    return { url: null, error: err.message || 'Erreur reseau', status: 0 };
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
