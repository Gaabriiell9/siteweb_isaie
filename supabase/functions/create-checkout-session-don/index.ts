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

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 60;
const MONTANT_MIN_CENTS = 100;
const MONTANT_MAX_CENTS = 500000;

function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }
  return "unknown";
}

function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function truncate(str: string | undefined | null, maxLen: number): string {
  if (!str) return "";
  return str.slice(0, maxLen);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const clientIp = getClientIp(req);

  try {
    // Rate limiting: reutilise inscription_rate_limit
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from("inscription_rate_limit")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Erreur verification rate limit:", countError);
    }

    if (count !== null && count >= RATE_LIMIT_MAX) {
      console.warn(`Rate limit atteint pour IP ${clientIp}: ${count} appels`);
      return new Response(
        JSON.stringify({ error: "Trop de tentatives, reessaie plus tard" }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "3600"
          }
        }
      );
    }

    // Enregistrer cet appel pour le rate limiting
    await supabase
      .from("inscription_rate_limit")
      .insert({ ip_address: clientIp });

    const body = await req.json();

    // Extraction et validation du montant
    let montantCents: number;

    if (typeof body.montant_cents === "number") {
      montantCents = Math.round(body.montant_cents);
    } else if (typeof body.montant_euros === "number") {
      // Convertir euros en centimes, arrondir au centime le plus proche
      montantCents = Math.round(body.montant_euros * 100);
    } else {
      return new Response(
        JSON.stringify({ error: "Montant requis (montant_euros ou montant_cents)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation stricte du montant
    if (!Number.isInteger(montantCents)) {
      return new Response(
        JSON.stringify({ error: "Le montant doit etre un nombre valide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (montantCents < MONTANT_MIN_CENTS) {
      return new Response(
        JSON.stringify({ error: "Le montant minimum est de 1 EUR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (montantCents > MONTANT_MAX_CENTS) {
      return new Response(
        JSON.stringify({ error: "Le montant maximum est de 5000 EUR" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extraction et validation des champs facultatifs
    const nom = truncate(body.nom, 100);
    const message = truncate(body.message, 280);
    let email: string | undefined;

    if (body.email && typeof body.email === "string") {
      const trimmedEmail = body.email.trim();
      if (isValidEmail(trimmedEmail)) {
        email = trimmedEmail;
      }
    }

    const baseUrl = req.headers.get("origin") || "https://siteweb-isaie.vercel.app";

    // Metadata pour Stripe (limite 500 caracteres par valeur)
    const metadata = {
      app: "etc-church",
      type: "don",
      nom: truncate(nom, 500),
      message: truncate(message, 500),
    };

    // Creer la session Stripe Checkout
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: montantCents,
            product_data: {
              name: "Don, Temple de la Celebration",
            },
          },
          quantity: 1,
        },
      ],
      metadata,
      payment_intent_data: {
        description: "Don",
        metadata,
      },
      success_url: `${baseUrl}/dons/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dons?annule=1`,
    };

    // Ajouter l'email client si fourni
    if (email) {
      sessionConfig.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Erreur create-checkout-session-don:", error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
