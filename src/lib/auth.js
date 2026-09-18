import { supabase } from './client';

// ─── Auth eleve ───────────────────────────────────────────────────────────

export async function signInEleve(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('email not confirmed')) {
      return {
        data: null,
        error: { message: 'Veuillez confirmer votre email avant de vous connecter. Verifiez votre boite de reception.' }
      };
    }
    if (msg.includes('invalid login credentials')) {
      return {
        data: null,
        error: { message: 'Email ou mot de passe incorrect.' }
      };
    }
  }

  if (data?.user) {
    supabase.rpc('update_ma_derniere_connexion').then(() => {}).catch(() => {});
  }

  return { data: data?.session ? data : { user: data?.user }, error };
}

export async function signOutEleve() {
  await supabase.auth.signOut();
}

export async function getEleveSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Auth admin ───────────────────────────────────────────────────────────

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Verifie si l'utilisateur connecte est admin et retourne son role
 * @returns {Promise<{isAdmin: boolean, role: string|null}>}
 */
export async function checkIsAdmin() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user?.id) return { isAdmin: false, role: null };

  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, role')
    .eq('auth_user_id', data.session.user.id)
    .maybeSingle();

  if (error) {
    console.error('[checkIsAdmin] Error:', error);
    return { isAdmin: false, role: null };
  }

  return {
    isAdmin: !!admin,
    role: admin?.role || null
  };
}

// ─── Inscription eleve (via signUp avec metadata) ─────────────────────────

/**
 * Finalise l'inscription d'un eleve via supabase.auth.signUp
 * Le trigger serveur cree automatiquement la fiche eleve
 */
export async function finalizeInscription(data) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        inscription_type: 'formation',
        prenom: data.prenom || '',
        nom: data.nom || 'Inconnu',
        telephone: data.telephone || null,
        date_naissance: data.date_naissance || null,
        pays: data.pays || null,
        ville: data.ville || null,
        eglise: data.eglise || null,
        pasteur_referent: data.pasteur_referent || null,
        niveau_biblique: data.niveau_biblique || null,
        motivation: data.motivation || null,
        communications_ok: data.communications_ok || false,
        formule_id: data.formule_id || null,
      },
    },
  });

  if (authData?.user?.id) {
    return { success: true, user: authData.user };
  }

  if (authError) {
    const msg = authError.message?.toLowerCase() || '';

    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return { success: false, error: { code: 'EMAIL_EXISTS', message: 'Un compte existe deja avec cet email.' } };
    }

    if (msg.includes('email') || msg.includes('sending') || msg.includes('confirmation')) {
      console.error('[finalizeInscription] Email error sans user cree:', authError);
      return { success: false, error: { code: 'EMAIL_ERROR', message: 'Erreur de configuration email. Contactez l\'administration.' } };
    }

    console.error('[finalizeInscription] Error:', authError);
    return { success: false, error: authError };
  }

  console.error('[finalizeInscription] No user, no error - authData:', authData);
  return { success: false, error: { message: 'Erreur inattendue. Veuillez reessayer.' } };
}
