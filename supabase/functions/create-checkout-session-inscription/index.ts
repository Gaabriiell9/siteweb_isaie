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
    const body = await req.json();

    const {
      email,
      prenom,
      nom,
      telephone,
      date_naissance,
      pays,
      ville,
      eglise,
      pasteur_referent,
      niveau_biblique,
      motivation,
      communications_ok,
      formule_id,
    } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!formule_id) {
      return new Response(
        JSON.stringify({ error: "Formule requise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verifier que la formule existe et est active
    const { data: formule, error: formuleError } = await supabase
      .from("formules_paiement")
      .select("id, nom, type, prix_total_cents, montant_echeance_cents, nombre_echeances, actif")
      .eq("id", formule_id)
      .eq("actif", true)
      .single();

    if (formuleError || !formule) {
      console.error("Formule non trouvee ou inactive:", formule_id, formuleError);
      return new Response(
        JSON.stringify({ error: "Formule invalide ou inactive" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verifier que l'email n'est pas deja utilise (insensible a la casse)
    const { data: existingUser } = await supabase
      .from("eleves")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "EMAIL_EXISTS", message: "Un compte existe deja avec cet email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = req.headers.get("origin") || "https://eglise-temple-celebration.vercel.app";

    let session: Stripe.Checkout.Session;

    if (formule.type === "integral") {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: formule.prix_total_cents,
              product_data: {
                name: `Formation theologique - ${formule.nom}`,
                description: "Acces complet a tous les modules de formation",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          app: "etc-church",
          type: "inscription",
          type_paiement: "integral",
          email: email,
          formule_id: formule.id,
        },
        success_url: `${baseUrl}/formation/inscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/formation/inscription?annule=1`,
      });
    } else if (formule.type === "echelonne") {
      if (!formule.montant_echeance_cents || formule.montant_echeance_cents <= 0) {
        return new Response(
          JSON.stringify({ error: "Configuration de formule echelonnee invalide" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: formule.montant_echeance_cents,
        recurring: {
          interval: "month",
        },
        product_data: {
          name: `Formation theologique - ${formule.nom}`,
          metadata: { app: "etc-church" },
        },
      });

      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: email,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            app: "etc-church",
            type: "inscription",
            type_paiement: "mensualite",
            nombre_echeances: String(formule.nombre_echeances || 10),
            formule_id: formule.id,
          },
        },
        metadata: {
          app: "etc-church",
          type: "inscription",
          type_paiement: "mensualite",
          email: email,
          formule_id: formule.id,
        },
        success_url: `${baseUrl}/formation/inscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/formation/inscription?annule=1`,
      });
    } else {
      return new Response(
        JSON.stringify({ error: `Type de formule inconnu: ${formule.type}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const raw_meta = {
      inscription_type: "formation",
      prenom: prenom || "",
      nom: nom || "Inconnu",
      telephone: telephone || null,
      date_naissance: date_naissance || null,
      pays: pays || null,
      ville: ville || null,
      eglise: eglise || null,
      pasteur_referent: pasteur_referent || null,
      niveau_biblique: niveau_biblique || null,
      motivation: motivation || null,
      communications_ok: communications_ok || false,
      formule_id: formule.id,
    };

    const { error: insertError } = await supabase
      .from("inscriptions_stripe_pending")
      .insert({
        stripe_session_id: session.id,
        email,
        raw_meta,
      });

    if (insertError) {
      console.error("Erreur insertion inscriptions_stripe_pending:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur serveur lors de la sauvegarde" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erreur create-checkout-session-inscription:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
