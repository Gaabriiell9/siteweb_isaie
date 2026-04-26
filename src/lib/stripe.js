// ─── Stripe integration (préparation — fonctions à brancher ───────
// Toutes les fonctions sont des stubs. Le vrai Stripe sera activé
// via Supabase Edge Functions quand la configuration sera prête.

export async function createCheckoutSession(inscriptionId, formule) {
  // TODO: appeler une Supabase Edge Function qui crée une session Stripe Checkout
  // et retourne l'URL de redirection
  console.log('[Stripe] createCheckoutSession', { inscriptionId, formule });
  return { url: null, error: 'Stripe non configuré' };
}

export async function handleStripeWebhook(event) {
  // TODO: traiter les événements Stripe (payment_intent.succeeded, etc.)
  console.log('[Stripe] webhook event', event.type);
}

export async function createSubscription(eleveId, plan) {
  // TODO: créer un abonnement Stripe pour le paiement échelonné
  console.log('[Stripe] createSubscription', { eleveId, plan });
  return { subscriptionId: null, error: 'Stripe non configuré' };
}

export async function cancelSubscription(subscriptionId) {
  // TODO: annuler un abonnement Stripe
  console.log('[Stripe] cancelSubscription', subscriptionId);
  return { error: 'Stripe non configuré' };
}

export async function getCustomerPortalUrl(eleveId) {
  // TODO: obtenir l'URL du portail client Stripe
  console.log('[Stripe] getCustomerPortalUrl', eleveId);
  return { url: null, error: 'Stripe non configuré' };
}
