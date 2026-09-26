import { supabase } from './client';

const FUNCTION_URL = process.env.REACT_APP_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1');

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
