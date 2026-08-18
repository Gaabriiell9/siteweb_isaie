// ─── Stripe integration (préparation — fonctions à brancher ───────
// Toutes les fonctions sont des stubs. Le vrai Stripe sera activé
// via Supabase Edge Functions quand la configuration sera prête.

export async function createCheckoutSession(inscriptionId, formule) {
  // TODO: appeler une Supabase Edge Function qui crée une session Stripe Checkout
  // et retourne l'URL de redirection
  return { url: null, error: 'Stripe non configuré' };
}

export async function handleStripeWebhook(event) {
  // TODO: traiter les événements Stripe (payment_intent.succeeded, etc.)
}

export async function createSubscription(eleveId, plan) {
  // TODO: créer un abonnement Stripe pour le paiement échelonné
  return { subscriptionId: null, error: 'Stripe non configuré' };
}

export async function cancelSubscription(subscriptionId) {
  // TODO: annuler un abonnement Stripe
  return { error: 'Stripe non configuré' };
}

export async function getCustomerPortalUrl(eleveId) {
  // TODO: obtenir l'URL du portail client Stripe
  return { url: null, error: 'Stripe non configuré' };
}
