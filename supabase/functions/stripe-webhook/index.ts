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

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("Signature manquante", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Signature invalide:", err.message);
    return new Response(`Signature invalide: ${err.message}`, { status: 400 });
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
        const eleveId = session.client_reference_id || session.metadata?.eleve_id;

        if (!eleveId) {
          console.error("checkout.session.completed: eleve_id manquant");
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

        if (!invoice.subscription) {
          console.log("invoice.paid sans subscription, ignore");
          break;
        }

        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

        let eleveData: { id: string; formule_nombre_echeances: number | null } | null = null;

        const { data: eleveBySubscription } = await supabase
          .from("eleves")
          .select("id, formule_nombre_echeances")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (eleveBySubscription) {
          eleveData = eleveBySubscription;
        } else {
          const customerId = typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

          const { data: eleveByCustomer } = await supabase
            .from("eleves")
            .select("id, formule_nombre_echeances")
            .eq("stripe_customer_id", customerId)
            .single();

          if (!eleveByCustomer) {
            console.error(`invoice.paid: eleve non trouve pour subscription ${subscriptionId}`);
            break;
          }
          eleveData = eleveByCustomer;
        }

        if (!eleveData) break;

        const { count } = await supabase
          .from("paiements")
          .select("*", { count: "exact", head: true })
          .eq("eleve_id", eleveData.id)
          .eq("type_paiement", "mensualite")
          .eq("statut", "reussi");

        const echeanceNumero = (count || 0) + 1;

        const paymentIntentId = typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id;

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
            await stripe.subscriptions.cancel(subscriptionId);
            console.log(`Abonnement ${subscriptionId} annule apres ${echeanceNumero} echeances`);
          } catch (cancelError) {
            console.error(`Erreur annulation abonnement ${subscriptionId}:`, cancelError);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (!invoice.subscription) break;

        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

        const { data: eleve } = await supabase
          .from("eleves")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (!eleve) {
          console.error(`invoice.payment_failed: eleve non trouve pour subscription ${subscriptionId}`);
          break;
        }

        const { count } = await supabase
          .from("paiements")
          .select("*", { count: "exact", head: true })
          .eq("eleve_id", eleve.id)
          .eq("type_paiement", "mensualite");

        const echeanceNumero = (count || 0) + 1;

        const paymentIntentId = typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id;

        await supabase.from("paiements").insert({
          eleve_id: eleve.id,
          montant_cents: invoice.amount_due,
          type_paiement: "mensualite",
          echeance_numero: echeanceNumero,
          statut: "echec",
          stripe_payment_intent_id: paymentIntentId,
          date_paiement: new Date().toISOString(),
        });

        console.log(`Echec paiement echeance ${echeanceNumero} pour eleve ${eleve.id}`);
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
