import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PendingInscription {
  id: string;
  email: string;
  raw_meta: Record<string, unknown>;
  stripe_session_id: string;
}

interface Eleve {
  id: string;
  formule_nombre_echeances?: number | null;
}

// deno-lint-ignore no-explicit-any
async function handleNewInscription(
  supabase: any,
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const sessionId = session.id;

  const { data: pending, error: pendingError } = await supabase
    .from("inscriptions_stripe_pending")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .single();

  if (pendingError || !pending) {
    console.error(`Inscription pending non trouvee pour session ${sessionId}:`, pendingError);
    return null;
  }

  const typedPending = pending as unknown as PendingInscription;
  const { email, raw_meta } = typedPending;

  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      data: raw_meta,
      redirectTo: "https://siteweb-isaie.vercel.app/eleve/bienvenue",
    }
  );

  if (authError) {
    if (authError.message?.includes("already been registered")) {
      console.log(`Compte deja existant pour ${email}, on continue`);
      const { data: existingEleve } = await supabase
        .from("eleves")
        .select("id")
        .ilike("email", email)
        .single();

      if (existingEleve) {
        const typedExisting = existingEleve as unknown as Eleve;
        await supabase.from("inscriptions_stripe_pending").delete().eq("id", typedPending.id);
        return typedExisting.id;
      }
    }
    console.error("Erreur creation compte auth:", authError);
    return null;
  }

  const authUserId = authData?.user?.id;
  if (!authUserId) {
    console.error("Pas d'user ID retourne par inviteUserByEmail");
    return null;
  }

  // Le trigger handle_new_user_formation cree automatiquement la fiche eleve
  // On attend un court instant pour laisser le trigger s'executer
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { data: eleve } = await supabase
    .from("eleves")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (!eleve) {
    console.error(`Fiche eleve non trouvee apres creation auth pour ${email}`);
    return null;
  }

  const typedEleve = eleve as unknown as Eleve;

  // Mettre a jour les infos Stripe sur la fiche eleve
  const customerId = typeof session.customer === "string"
    ? session.customer
    : session.customer?.id || null;

  const subscriptionId = session.mode === "subscription"
    ? (typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null)
    : null;

  if (customerId || subscriptionId) {
    await supabase
      .from("eleves")
      .update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq("id", typedEleve.id);
  }

  await supabase.from("inscriptions_stripe_pending").delete().eq("id", typedPending.id);

  console.log(`Inscription finalisee pour ${email}, eleve_id: ${typedEleve.id}`);
  return typedEleve.id;
}

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("Signature manquante", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Signature invalide:", message);
    return new Response(`Signature invalide: ${message}`, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { error: idempotenceError } = await supabase
    .from("stripe_webhook_events")
    .insert({ id: event.id, type: event.type });

  if (idempotenceError) {
    if (idempotenceError.code === "23505") {
      console.log(`Evenement deja traite: ${event.id}`);
      return new Response("OK", { status: 200 });
    }
    console.error("Erreur idempotence:", idempotenceError);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // ─── Branche DON ───────────────────────────────────────────────────
        if (session.metadata?.type === "don") {
          if (session.payment_status !== "paid") {
            console.log(`Don session ${session.id} pas encore paye (status: ${session.payment_status})`);
            break;
          }

          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null;

          const nomDonateur = session.metadata?.nom || session.customer_details?.name || null;
          const emailDonateur = session.customer_details?.email || session.customer_email || null;
          const messageDon = session.metadata?.message || null;
          const devise = (session.currency || "eur").toUpperCase();

          const { error: insertError } = await supabase
            .from("donations")
            .upsert({
              nom_donateur: nomDonateur,
              email: emailDonateur,
              montant_cents: session.amount_total,
              devise,
              stripe_payment_intent_id: paymentIntentId,
              stripe_session_id: session.id,
              statut: "succeeded",
              message: messageDon,
              date_don: new Date().toISOString(),
            }, { onConflict: "stripe_session_id", ignoreDuplicates: true });

          if (insertError) {
            console.error(`Erreur insertion don pour session ${session.id}:`, insertError);
          } else {
            console.log(`Don enregistre: ${session.amount_total} cents, session ${session.id}`);
          }

          break;
        }

        // ─── Branche INSCRIPTION ───────────────────────────────────────────
        const isInscription = session.metadata?.type === "inscription";

        if (isInscription) {
          const eleveId = await handleNewInscription(supabase, session);

          if (!eleveId) {
            console.error("Echec finalisation inscription");
            break;
          }

          if (session.mode === "payment") {
            const paymentIntentId = typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

            await supabase.from("paiements").insert({
              eleve_id: eleveId,
              montant_cents: session.amount_total,
              type_paiement: "integral",
              statut: "reussi",
              stripe_payment_intent_id: paymentIntentId,
              date_paiement: new Date().toISOString(),
            });

            await supabase
              .from("progression_eleve")
              .update({
                debloque: true,
                date_debloque: new Date().toISOString(),
              })
              .eq("eleve_id", eleveId)
              .eq("debloque", false);

            console.log(`Inscription integrale finalisee, tous modules debloques pour ${eleveId}`);
          }

          if (session.mode === "subscription") {
            console.log(`Inscription echelonnee finalisee pour ${eleveId}`);
          }
          break;
        }

        const eleveId = session.client_reference_id || session.metadata?.eleve_id;

        if (!eleveId) {
          console.log("checkout.session.completed: pas d'eleve_id ni inscription, ignore");
          break;
        }

        if (session.mode === "payment") {
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;

          await supabase.from("paiements").insert({
            eleve_id: eleveId,
            montant_cents: session.amount_total,
            type_paiement: "integral",
            statut: "reussi",
            stripe_payment_intent_id: paymentIntentId,
            date_paiement: new Date().toISOString(),
          });

          await supabase
            .from("progression_eleve")
            .update({
              debloque: true,
              date_debloque: new Date().toISOString(),
            })
            .eq("eleve_id", eleveId)
            .eq("debloque", false);

          console.log(`Paiement integral reussi pour eleve ${eleveId}, tous modules debloques`);
        }

        if (session.mode === "subscription") {
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

          if (subscriptionId) {
            await supabase
              .from("eleves")
              .update({ stripe_subscription_id: subscriptionId })
              .eq("id", eleveId);

            console.log(`Abonnement ${subscriptionId} enregistre pour eleve ${eleveId}`);
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;

        // Compatible API 2026-03-25.dahlia : subscription dans parent.subscription_details
        // @ts-ignore - parent.subscription_details peut ne pas exister dans les types
        const subscriptionId = invoice.parent?.subscription_details?.subscription
          || (typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id);

        if (!subscriptionId) {
          console.log("invoice.paid sans subscription, ignore");
          break;
        }

        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

        // Retry jusqu'a 4 fois pour laisser le temps a checkout.session.completed de finir
        let eleveData: Eleve | null = null;
        for (let attempt = 1; attempt <= 4; attempt++) {
          const { data: eleveBySubscription } = await supabase
            .from("eleves")
            .select("id, formule_nombre_echeances")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (eleveBySubscription) {
            eleveData = eleveBySubscription as Eleve;
            break;
          }

          const { data: eleveByCustomer } = await supabase
            .from("eleves")
            .select("id, formule_nombre_echeances")
            .eq("stripe_customer_id", customerId)
            .single();

          if (eleveByCustomer) {
            eleveData = eleveByCustomer as Eleve;
            break;
          }

          if (attempt < 4) {
            console.log(`invoice.paid: eleve non trouve, tentative ${attempt}/4, attente 1s...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!eleveData) {
          console.error(`invoice.paid: eleve non trouve apres 4 tentatives pour subscription ${subscriptionId}`);
          break;
        }

        const { count } = await supabase
          .from("paiements")
          .select("*", { count: "exact", head: true })
          .eq("eleve_id", eleveData.id)
          .eq("type_paiement", "mensualite")
          .eq("statut", "reussi");

        const echeanceNumero = (count || 0) + 1;

        // Compatible API 2026-03-25.dahlia : payment_intent peut ne plus exister
        const paymentIntentId = (typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id) || invoice.id;

        await supabase.from("paiements").insert({
          eleve_id: eleveData.id,
          montant_cents: invoice.amount_paid,
          type_paiement: "mensualite",
          echeance_numero: echeanceNumero,
          statut: "reussi",
          stripe_payment_intent_id: paymentIntentId,
          date_paiement: new Date().toISOString(),
        });

        console.log(`Echeance ${echeanceNumero} payee pour eleve ${eleveData.id}`);

        if (eleveData.formule_nombre_echeances && echeanceNumero >= eleveData.formule_nombre_echeances) {
          try {
            await stripe.subscriptions.cancel(subscriptionId!);
            console.log(`Abonnement ${subscriptionId} annule apres ${echeanceNumero} echeances`);
          } catch (cancelError) {
            console.error(`Erreur annulation abonnement ${subscriptionId}:`, cancelError);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        // Compatible API 2026-03-25.dahlia : subscription dans parent.subscription_details
        // @ts-ignore - parent.subscription_details peut ne pas exister dans les types
        const subscriptionId = invoice.parent?.subscription_details?.subscription
          || (typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id);

        if (!subscriptionId) break;

        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;

        // Retry jusqu'a 4 fois pour laisser le temps a checkout.session.completed de finir
        let eleveData: Eleve | null = null;
        for (let attempt = 1; attempt <= 4; attempt++) {
          const { data: eleveBySubscription } = await supabase
            .from("eleves")
            .select("id")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (eleveBySubscription) {
            eleveData = eleveBySubscription as unknown as Eleve;
            break;
          }

          const { data: eleveByCustomer } = await supabase
            .from("eleves")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (eleveByCustomer) {
            eleveData = eleveByCustomer as unknown as Eleve;
            break;
          }

          if (attempt < 4) {
            console.log(`invoice.payment_failed: eleve non trouve, tentative ${attempt}/4, attente 1s...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!eleveData) {
          console.error(`invoice.payment_failed: eleve non trouve apres 4 tentatives pour subscription ${subscriptionId}`);
          break;
        }

        const typedEleve = eleveData;

        const { count } = await supabase
          .from("paiements")
          .select("*", { count: "exact", head: true })
          .eq("eleve_id", typedEleve.id)
          .eq("type_paiement", "mensualite");

        const echeanceNumero = (count || 0) + 1;

        // Compatible API 2026-03-25.dahlia : payment_intent peut ne plus exister
        const paymentIntentId = (typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id) || invoice.id;

        await supabase.from("paiements").insert({
          eleve_id: typedEleve.id,
          montant_cents: invoice.amount_due,
          type_paiement: "mensualite",
          echeance_numero: echeanceNumero,
          statut: "echec",
          stripe_payment_intent_id: paymentIntentId,
          date_paiement: new Date().toISOString(),
        });

        console.log(`Echec paiement echeance ${echeanceNumero} pour eleve ${typedEleve.id}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabase
          .from("eleves")
          .update({ stripe_subscription_id: null })
          .eq("stripe_subscription_id", subscription.id);

        console.log(`Abonnement ${subscription.id} termine/supprime`);
        break;
      }

      default:
        console.log(`Evenement non gere: ${event.type}`);
    }
  } catch (error) {
    console.error(`Erreur traitement ${event.type}:`, error);
  }

  return new Response("OK", { status: 200 });
});
