/**
 * Textes de la page Formation — Institut TIEDO
 * Modifier ici sans toucher au JSX.
 */

// ─── Le Dr. Asa Esaie ─────────────────────────────────────────────────────────

export const drAsaEsaie = {
  nom: 'Dr. Asa Esaie',
  // A VALIDER AVEC LE DR : orthographe exacte du nom
  titre: 'Doctorat en theologie biblique, option Exegese Ancien et Nouveau Testament',
  institut: 'Institut de theologie biblique TIEDO',
  // A VALIDER AVEC LE DR : lien du Dr avec TIEDO (fondateur, directeur, enseignant ?)
  // A VALIDER AVEC LE DR : parcours et ministere
  bio: null,
};

// ─── Vision et mission ────────────────────────────────────────────────────────

export const vision = {
  mission:
    "L'Institut TIEDO repond a l'ordre missionnaire donne par Jesus-Christ. Il offre une formation diplomante pour equiper de facon pratique les serviteurs de Dieu, en vue d'un ministere efficace.",
  verset: 'Matthieu 28:18-20',
  versetTexte:
    '"Tout pouvoir m\'a ete donne dans le ciel et sur la terre. Allez, faites de toutes les nations des disciples..."',
  ouverture: 'Ouvert depuis 2015.',
  but: "Une comprehension vivante de la Parole de Dieu et une relation profonde et dynamique avec Jesus-Christ.",
};

// ─── Le parcours ──────────────────────────────────────────────────────────────

export const parcours = {
  description:
    "Formation biblique et theologique de 3 ans, du Baccalaureat a la Maitrise theologique, avec des stages pratiques dans les eglises locales des etudiants.",
  // A VALIDER AVEC LE DR : niveaux intermediaires entre Baccalaureat et Maitrise
  niveaux: [
    { nom: 'Baccalaureat', position: 0 },
    { nom: 'Maitrise', position: 100 },
  ],
  dureeTotale: '3 ans',
  // A VALIDER AVEC LE DR : duree exacte proposee sur ce site
  dureeNiveau: '6 mois a 1 an par niveau (jusqu\'a 2 ans pour les personnes a disponibilites restreintes)',
  volumeHoraire: '4h30 de cours par semaine',
  stages: 'Stages pratiques dans les eglises locales',
  pedagogie:
    "Les enseignements insistent sur la dependance a l'Esprit Saint, source de toute revelation, pour developper aptitudes et dons en vue du service et du ministere.",
  evaluation:
    "Evaluation par tests, examens et travaux de recherche. Lecture d'autres ouvrages recommandee. Organisation par modules, avec manuels de cours fournis.",
  sessionsSpeciales:
    "Sessions speciales et seminaires possibles pour des groupes ou des eglises locales.",
};

// ─── Rythmes et groupes ───────────────────────────────────────────────────────

export const rythmes = {
  intro: "Tres flexible : aucune contrainte de temps, calendrier adapte a la disponibilite de chacun.",
  groupeA1: {
    nom: 'Groupe A1',
    description: 'Cours le lundi, mercredi et jeudi',
    type: 'Hebdomadaire',
  },
  groupeA2: {
    nom: 'Groupe A2',
    description: 'Cours le samedi (meme volume horaire, realise en une journee)',
    type: 'Week-end',
  },
  groupeB: {
    nom: 'Groupe B',
    description: 'Semaine variable selon la disponibilite, jours definis avec le responsable de la formation ou l\'enseignant',
    type: 'Temps partiel',
  },
};

// ─── Exigences ────────────────────────────────────────────────────────────────

export const exigences = [
  {
    titre: 'Assiduite',
    contenu:
      "Une semaine de cours doit etre validee avant de passer a la suivante. En cas d'absence, la rattraper au plus vite avec l'enseignant.",
  },
  {
    titre: 'Validation Baccalaureat',
    contenu:
      "24 semaines a valider, quel que soit le groupe (temps plein, week-end, temps partiel).",
  },
];

// ─── Ce que la formation permet ───────────────────────────────────────────────

export const objectifs = [
  {
    texte: "Approfondir leur comprehension de la Bible (Ancien et Nouveau Testament)",
    icone: 'bible',
  },
  {
    texte: "Reflechir aux grandes thematiques bibliques",
    icone: 'lightbulb',
  },
  {
    texte: "Developper leurs competences pour la mission confiee par Jesus-Christ (Matthieu 28:18-20)",
    icone: 'mission',
  },
  {
    texte: "Faire des disciples a leur tour",
    icone: 'people',
  },
  {
    texte: "Exercer leur ministere comme pasteur ou responsable d'eglise",
    icone: 'church',
  },
];

// ─── Phrase de cloture ────────────────────────────────────────────────────────

export const cloture = {
  phrase: "N'hesitez plus, TIEDO est decide a vous accompagner dans votre projet !",
  boutonLabel: "S'inscrire a la formation",
};

// ─── Meta SEO ─────────────────────────────────────────────────────────────────

export const meta = {
  title: 'Formation en Theologie Biblique | Institut TIEDO | E.T.C. Church',
  description:
    "Formation diplomante de 3 ans du Baccalaureat a la Maitrise theologique. Horaires flexibles, stages pratiques, accompagnement pastoral. Institut TIEDO depuis 2015.",
};
