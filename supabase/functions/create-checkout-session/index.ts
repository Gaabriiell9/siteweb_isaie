import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token d'authentification requis" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token invalide ou expire" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: eleve, error: eleveError } = await supabaseClient
      .from("eleves")
      .select("id, email, prenom, nom, formule, formule_prix_total_cents, formule_nombre_echeances, formule_montant_echeance_cents, stripe_customer_id, stripe_subscription_id")
      .eq("auth_user_id", user.id)
      .single();

    if (eleveError || !eleve) {
      return new Response(
        JSON.stringify({ error: "Aucune fiche eleve trouvee pour cet utilisateur" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!eleve.formule_prix_total_cents || eleve.formule_prix_total_cents <= 0) {
      return new Response(
        JSON.stringify({ error: "Montant de la formule invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let customerId = eleve.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: eleve.email,
        name: `${eleve.prenom} ${eleve.nom}`.trim() || eleve.email,
        metadata: {
          app: "etc-church",
          eleve_id: eleve.id,
        },
      });
      customerId = customer.id;

      await supabaseClient
        .from("eleves")
        .update({ stripe_customer_id: customerId })
        .eq("id", eleve.id);
    }

    const baseUrl = req.headers.get("origin") || "https://eglise-temple-celebration.vercel.app";

    if (eleve.formule === "integral") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: eleve.formule_prix_total_cents,
              product_data: {
                name: "Formation theologique - Formule integrale",
                description: "Acces complet a tous les modules de formation",
              },
            },
            quantity: 1,
          },
        ],
        client_reference_id: eleve.id,
        metadata: {
          app: "etc-church",
          eleve_id: eleve.id,
          type_paiement: "integral",
        },
        success_url: `${baseUrl}/eleve/paiements?succes=1`,
        cancel_url: `${baseUrl}/eleve/paiements?annule=1`,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (eleve.formule === "echelonne") {
      if (eleve.stripe_subscription_id) {
        return new Response(
          JSON.stringify({ error: "Un abonnement est deja en cours pour cet eleve" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!eleve.formule_montant_echeance_cents || eleve.formule_montant_echeance_cents <= 0) {
        return new Response(
          JSON.stringify({ error: "Montant de l'echeance invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!eleve.formule_nombre_echeances || eleve.formule_nombre_echeances < 1) {
        return new Response(
          JSON.stringify({ error: "Nombre d'echeances invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: eleve.formule_montant_echeance_cents,
        recurring: {
          interval: "month",
        },
        product_data: {
          name: "Formation theologique - Echeance mensuelle",
          metadata: {
            app: "etc-church",
          },
        },
        metadata: {
          app: "etc-church",
          eleve_id: eleve.id,
        },
      });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            app: "etc-church",
            eleve_id: eleve.id,
            type_paiement: "mensualite",
            nombre_echeances: String(eleve.formule_nombre_echeances),
          },
        },
        client_reference_id: eleve.id,
        metadata: {
          app: "etc-church",
          eleve_id: eleve.id,
          type_paiement: "mensualite",
        },
        success_url: `${baseUrl}/eleve/paiements?succes=1`,
        cancel_url: `${baseUrl}/eleve/paiements?annule=1`,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Type de formule inconnu: ${eleve.formule}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erreur create-checkout-session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
