/**
 * Textes de la page Formation — Institut TIEDO
 * Modifier ici sans toucher au JSX.
 */

// ─── Drapeau d'affichage durée et modules ─────────────────────────────────────
// Mettre à true pour réafficher la frise, les cartes de durée et le compteur de modules
export const SHOW_DUREE_ET_MODULES = false;

// ─── Le Dr. Asa Esaie ─────────────────────────────────────────────────────────

export const drAsaEsaie = {
  nom: 'Dr. Asa Esaie',
  // A VALIDER AVEC LE DR : orthographe exacte du nom
  titre: 'Doctorat en théologie biblique, option Exégèse Ancien et Nouveau Testament',
  institut: 'Institut de théologie biblique TIEDO',
  // A VALIDER AVEC LE DR : lien du Dr avec TIEDO (fondateur, directeur, enseignant ?)
  // A VALIDER AVEC LE DR : parcours et ministère
  bio: null,
};

// ─── Vision et mission ────────────────────────────────────────────────────────

export const vision = {
  mission:
    "L'Institut TIEDO répond à l'ordre missionnaire donné par Jésus-Christ. Il offre une formation diplômante pour équiper de façon pratique les serviteurs de Dieu, en vue d'un ministère efficace.",
  verset: 'Matthieu 28:18-20',
  versetTexte:
    '"Tout pouvoir m\'a été donné dans le ciel et sur la terre. Allez, faites de toutes les nations des disciples..."',
  ouverture: 'Ouvert depuis 2015.',
  but: "Une compréhension vivante de la Parole de Dieu et une relation profonde et dynamique avec Jésus-Christ.",
};

// ─── Le parcours ──────────────────────────────────────────────────────────────

export const parcours = {
  // Description sans mention de durée
  description:
    "Formation biblique et théologique avec des stages pratiques dans les églises locales des étudiants.",
  stages: 'Stages pratiques dans les églises locales',
  pedagogie:
    "Les enseignements insistent sur la dépendance à l'Esprit Saint, source de toute révélation, pour développer aptitudes et dons en vue du service et du ministère.",
  evaluation:
    "Évaluation par tests, examens et travaux de recherche. Lecture d'autres ouvrages recommandée. Organisation par modules, avec manuels de cours fournis.",
  sessionsSpeciales:
    "Sessions spéciales et séminaires possibles pour des groupes ou des églises locales.",
};

/* ══════════════════════════════════════════════════════════════════════════════
   MASQUE, A REMETTRE QUAND LA DUREE ET LE NOMBRE DE MODULES SERONT DECIDES

export const parcoursAvecDuree = {
  description:
    "Formation biblique et théologique de 3 ans, du Baccalauréat à la Maîtrise théologique, avec des stages pratiques dans les églises locales des étudiants.",
  // A VALIDER AVEC LE DR : niveaux intermédiaires entre Baccalauréat et Maîtrise
  niveaux: [
    { nom: 'Baccalauréat', position: 0 },
    { nom: 'Maîtrise', position: 100 },
  ],
  dureeTotale: '3 ans',
  // A VALIDER AVEC LE DR : durée exacte proposée sur ce site
  dureeNiveau: '6 mois à 1 an par niveau (jusqu\'à 2 ans pour les personnes à disponibilités restreintes)',
  volumeHoraire: '4h30 de cours par semaine',
  stages: 'Stages pratiques dans les églises locales',
};

export const exigenceValidation = {
  titre: 'Validation Baccalauréat',
  contenu: "24 semaines à valider, quel que soit le groupe (temps plein, week-end, temps partiel).",
};

   ══════════════════════════════════════════════════════════════════════════════ */

// ─── Rythmes et groupes ───────────────────────────────────────────────────────

export const rythmes = {
  intro: "Très flexible : aucune contrainte de temps, calendrier adapté à la disponibilité de chacun.",
  groupeA1: {
    nom: 'Groupe A1',
    description: 'Cours le lundi, mercredi et jeudi',
    type: 'Hebdomadaire',
  },
  groupeA2: {
    nom: 'Groupe A2',
    description: 'Cours le samedi',
    type: 'Week-end',
  },
  groupeB: {
    nom: 'Groupe B',
    description: 'Jours définis avec le responsable de la formation ou l\'enseignant',
    type: 'Temps partiel',
  },
};

// ─── Exigences ────────────────────────────────────────────────────────────────

export const exigences = [
  {
    titre: 'Assiduité',
    contenu:
      "Une semaine de cours doit être validée avant de passer à la suivante. En cas d'absence, la rattraper au plus vite avec l'enseignant.",
  },
];

// ─── Ce que la formation permet ───────────────────────────────────────────────

export const objectifs = [
  {
    texte: "Approfondir leur compréhension de la Bible (Ancien et Nouveau Testament)",
    icone: 'bible',
  },
  {
    texte: "Réfléchir aux grandes thématiques bibliques",
    icone: 'lightbulb',
  },
  {
    texte: "Développer leurs compétences pour la mission confiée par Jésus-Christ (Matthieu 28:18-20)",
    icone: 'mission',
  },
  {
    texte: "Faire des disciples à leur tour",
    icone: 'people',
  },
  {
    texte: "Exercer leur ministère comme pasteur ou responsable d'église",
    icone: 'church',
  },
];

// ─── Phrase de clôture ────────────────────────────────────────────────────────

export const cloture = {
  phrase: "N'hésitez plus, TIEDO est décidé à vous accompagner dans votre projet !",
  boutonLabel: "S'inscrire à la formation",
};

// ─── Meta SEO ─────────────────────────────────────────────────────────────────

export const meta = {
  title: 'Formation en Théologie Biblique | Institut TIEDO | E.T.C. Church',
  description:
    "Formation diplômante en théologie biblique. Horaires flexibles, stages pratiques, accompagnement pastoral. Institut TIEDO depuis 2015.",
};
