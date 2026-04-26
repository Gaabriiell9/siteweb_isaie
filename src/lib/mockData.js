// ─── Données fictives pour le mode hors-connexion ─────────────────────────────

export const MOCK_VIDEOS = [
  {
    id: 1,
    titre: "Marche dans la foi, non par la vue",
    legende: "Dimanche 5 janvier 2026 • Pasteur Isaac Morel",
    description:
      "Une prédication puissante sur la foi qui nous invite à avancer même lorsque le chemin semble obscur. S'appuyant sur 2 Corinthiens 5:7, le pasteur nous rappelle que Dieu voit ce que nous ne voyons pas encore.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_publi: "2026-01-05",
    is_live: false,
    visible: true,
  },
  {
    id: 2,
    titre: "L'Esprit Saint, notre consolateur",
    legende: "Dimanche 12 janvier 2026 • Pasteur Isaac Morel",
    description:
      "Jean 14:26 nous révèle que l'Esprit Saint est envoyé pour nous enseigner et nous consoler. Cette prédication explore comment accueillir pleinement sa présence dans notre quotidien.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_publi: "2026-01-12",
    is_live: false,
    visible: true,
  },
  {
    id: 3,
    titre: "Guéris et libéré par sa grâce",
    legende: "Dimanche 19 janvier 2026 • Pasteur Isaac Morel",
    description:
      "Esaïe 53:5 proclame que c'est par ses blessures que nous sommes guéris. Une parole d'espérance pour tous ceux qui traversent des épreuves physiques ou spirituelles.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_publi: "2026-01-19",
    is_live: false,
    visible: true,
  },
  {
    id: 4,
    titre: "Dieu pourvoit : la fidélité de Jéhovah Jiré",
    legende: "Dimanche 26 janvier 2026 • Pasteur Isaac Morel",
    description:
      "À travers le sacrifice d'Abraham (Genèse 22), nous découvrons un Dieu qui pourvoit à nos besoins avant même que nous les exprimions. Une parole de confiance et d'abandon.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    date_publi: "2026-01-26",
    is_live: false,
    visible: true,
  },
];

// ─── Les 12 fils de Jacob – messages de prière ────────────────────────────────
// Semaine 1 : Ruben(Lun) Siméon(Mar) Lévi(Mer) Juda(Jeu) Dan(Ven) Nephtali(Sam) Gad(Dim)
// Semaine 2 : Aser(Lun)  Issacar(Mar) Zabulon(Mer) Joseph(Jeu) Benjamin(Ven)

export const MOCK_MESSAGES_PRIERE = [
  // ── Semaine 1 ──────────────────────────────────────────────────────────────
  {
    id: 1,
    fils: "Ruben",
    jour_semaine: "Lundi",
    semaine: 1,
    titre: "Ruben – Premier-né, revêtu de dignité",
    contenu: `Seigneur, tu as dit que Ruben est le commencement de ma force, la première de ma vigueur (Genèse 49:3). Aujourd'hui, je m'appuie sur cette parole pour toi.

Je te demande, Père, de restaurer tout ce qui a été perdu dans ma vie. Là où j'ai trébuché, relève-moi comme tu as relevé Israël. Fais que mon premier amour pour toi soit renouvelé ce matin.

Je proclame que ton Esprit de grâce et de supplication repose sur ta famille. Que chaque premier geste de la journée soit consacré à ta gloire. Que la dignité que tu as placée en nous ne soit ni compromise ni gaspillée.

Seigneur, garde-nous de l'instabilité. Que ta parole soit l'ancre de notre âme. En ce début de semaine, nous te dédions notre premier fruit : notre temps, notre force, notre volonté.

Que toute œuvre commencée en ton nom porte du fruit au centuple. Benis l'Église en ce lundi, qu'elle se lève avec la vigueur du premier matin.

Au nom de Jésus-Christ. Amen.`,
    visible: true,
  },
  {
    id: 2,
    fils: "Siméon",
    jour_semaine: "Mardi",
    semaine: 1,
    titre: "Siméon – Réconciliation et miséricorde",
    contenu: `Père céleste, tu es le Dieu des réconciliations. Tu as pris Siméon — celui dont le nom signifie « Dieu a entendu » — et tu en as fait un témoignage de ta miséricorde.

En ce mardi, je te prie d'ouvrir nos oreilles spirituelles. Que nous entendions ta voix plus clairement que le bruit du monde. Que nous soyons sensibles aux gémissements de l'Esprit en nous.

Je te supplie de réconcilier toute relation brisée dans nos familles, nos couples, nos amitiés. Là où la colère a semé des ruines, que ta paix surpasse tout entendement (Philippiens 4:7).

Seigneur, pardonne-nous toute dureté de cœur. Que nous ne gardions pas rancune, mais que nous pratiquions le pardon comme tu nous as pardonné en Christ (Éphésiens 4:32).

Que ta grâce soit plus puissante que nos erreurs. Transforme les blessures en ponts de guérison. Fais de ton Église un lieu où la réconciliation est possible.

Au nom de Jésus. Amen.`,
    visible: true,
  },
  {
    id: 3,
    fils: "Lévi",
    jour_semaine: "Mercredi",
    semaine: 1,
    titre: "Lévi – La tribu du service sacré",
    contenu: `Seigneur, tu as choisi Lévi pour ton service. Tu as dit : « Ils enseigneront tes ordonnances à Jacob et ta loi à Israël » (Deutéronome 33:10). Aujourd'hui, nous embrassons cet appel au service.

Père, suscite en chacun de nous un cœur de serviteur. Que nous ne cherchions pas à être servis mais à servir, à l'exemple de Jésus qui a lavé les pieds de ses disciples (Jean 13:14).

Je prie pour tous les serviteurs de l'Église : pasteurs, anciens, diacres, responsables de ministères. Garde-les de l'épuisement et de la désillusion. Renouvelle leur force chaque matin.

Que l'autel de la prière soit toujours allumé parmi nous. Que notre louange s'élève comme l'encens parfumé devant ton trône (Psaume 141:2).

Seigneur, que ce mercredi soit un jour d'offrande : offrande de nos corps comme sacrifices vivants (Romains 12:1), offrande de nos lèvres qui te célèbrent.

Au nom de Jésus-Christ, notre Grand Prêtre éternel. Amen.`,
    visible: true,
  },
  {
    id: 4,
    fils: "Juda",
    jour_semaine: "Jeudi",
    semaine: 1,
    titre: "Juda – Le Lion rugit sur nos ennemis",
    contenu: `Père, de Juda est sorti le Lion de la tribu de Juda (Apocalypse 5:5), notre Seigneur Jésus-Christ. En lui nous triomphons de toute puissance ennemie.

En ce jeudi, je proclame la victoire sur tout ce qui s'oppose à ton règne dans nos vies. Que le Lion de Juda rugisse contre la maladie, contre la pauvreté, contre l'oppression spirituelle !

Seigneur, fais que ta louange soit toujours sur nos lèvres. Car « Juda » signifie « je louerai l'Éternel ». Que nous soyons un peuple de louange qui déroute l'ennemi (2 Chroniques 20:22).

Je déclare que le sceptre ne se retirera pas de Juda (Genèse 49:10). L'autorité de Christ règne dans nos maisons, nos familles, nos lieux de travail.

Fais de nous des adorateurs en esprit et en vérité. Que notre adoration renverse les murs de Jéricho et ouvre des portes qui semblaient fermées.

Gloire à Jésus, le vainqueur ! Amen.`,
    visible: true,
  },
  {
    id: 5,
    fils: "Dan",
    jour_semaine: "Vendredi",
    semaine: 1,
    titre: "Dan – Justice et discernement de Dieu",
    contenu: `Seigneur, tu as dit que Dan jugera son peuple (Genèse 49:16). Mais nous savons que le vrai juge est toi seul. Aujourd'hui, nous nous soumettons à ta justice parfaite.

En ce vendredi, accorde-nous le discernement spirituel. Que nous sachions distinguer ce qui vient de toi de ce qui vient de l'ennemi. Que nous ne soyons pas trompés par les faux esprits (1 Jean 4:1).

Père, que ta justice règne dans nos communautés. Là où des innocents souffrent, interviens. Là où des décisions injustes ont été prises contre nous, tu es notre avocat (1 Jean 2:1).

Nous attendons ton salut, comme le dit Jacob : « J'attends ta délivrance, ô Éternel ! » (Genèse 49:18). Apprends-nous à patienter dans la confiance.

Que ce vendredi soit un jour de rétablissement de la justice dans nos vies. Que tout ce qui a été volé soit restitué, que tout ce qui a été tordu soit redressé.

En Jésus, juste juge des vivants et des morts. Amen.`,
    visible: true,
  },
  {
    id: 6,
    fils: "Nephtali",
    jour_semaine: "Samedi",
    semaine: 1,
    titre: "Nephtali – Liberté et beauté de la parole",
    contenu: `Père, Jacob a béni Nephtali en disant : « Nephtali est une biche élancée, il prononce de belles paroles » (Genèse 49:21). Que ta parole dans nos bouches soit belle, puissante et libératrice.

En ce samedi de préparation, libère nos cœurs de tout fardeau. Que nous entrions demain dans ta maison légers et joyeux. Prépare nos cœurs à recevoir ta Parole avec humilité.

Je prie pour les pasteurs et prédicateurs qui préparent leurs messages. Que l'Esprit Saint soit leur souffle, leur inspiration, leur force. Que chaque mot prononcé dimanche touche exactement le cœur qu'il doit toucher.

Seigneur, libère ceux qui sont encore liés. Que les chaînes de la honte, de l'addiction, de la dépression soient brisées par ta Parole vivante (Hébreux 4:12).

Que nous courions vers toi comme la biche court vers les eaux vives (Psaume 42:2). Que notre âme soupire après ta présence.

Au nom de Jésus. Amen.`,
    visible: true,
  },
  {
    id: 7,
    fils: "Gad",
    jour_semaine: "Dimanche",
    semaine: 1,
    titre: "Gad – Victoire sur toute adversité",
    contenu: `Seigneur, tu as dit de Gad : « Des troupes fondront sur lui, mais il fondra sur leurs talons » (Genèse 49:19). En ce dimanche, nous déclarons que nous ne nous laisserons pas vaincre !

Père, bénis notre assemblée aujourd'hui. Que chaque personne qui franchira la porte de notre maison de prière soit touchée par ton Esprit. Que les malades soient guéris, les captifs libérés, les découragés relevés.

Je proclame que l'ennemi vient contre nous par un chemin, mais il fuira par sept chemins (Deutéronome 28:7). Aucune arme forgée contre nous ne prospérera (Ésaïe 54:17).

Que nos cultes soient des champs de bataille spirituels où tu déploies ta puissance. Que ta gloire descende de manière tangible sur ton peuple assemblé.

Seigneur, fais de ce dimanche un tournant. Que des familles soient restaurées, que des âmes soient sauvées, que des miracles soient accomplis à ta gloire.

Nous entrons dans la semaine avec la victoire de Gad ! Au nom de Jésus-Christ. Amen.`,
    visible: true,
  },

  // ── Semaine 2 ──────────────────────────────────────────────────────────────
  {
    id: 8,
    fils: "Aser",
    jour_semaine: "Lundi",
    semaine: 2,
    titre: "Aser – Abondance et bénédictions royales",
    contenu: `Père, tu as dit d'Aser : « Aser a une nourriture excellente, et il fournira des délices aux rois » (Genèse 49:20). Que l'abondance que tu promets soit manifeste dans nos vies ce lundi.

Seigneur, tu es Jéhovah Jiré, celui qui pourvoit. Nous refusons la mentalité de disette. Nous choisissons de croire que tu es capable de subvenir à tous nos besoins selon tes richesses en gloire en Jésus-Christ (Philippiens 4:19).

Bénis le travail de nos mains. Que chaque projet lancé cette semaine soit couronné de succès. Que les portes d'opportunités s'ouvrent là où elles semblaient fermées.

Je déclare que nous sommes la tête et non la queue (Deutéronome 28:13). Que la faveur de Dieu marche devant nous dans chaque réunion, chaque entretien, chaque démarche.

Que l'huile de la joie remplace le deuil dans nos maisons. Que nos tables soient chargées de ta bonté. Que nous soyons des canaux de bénédiction pour tous ceux que nous rencontrons.

Au nom de Jésus. Amen.`,
    visible: true,
  },
  {
    id: 9,
    fils: "Issacar",
    jour_semaine: "Mardi",
    semaine: 2,
    titre: "Issacar – Sagesse pour comprendre les temps",
    contenu: `Seigneur, les fils d'Issacar étaient « des hommes qui avaient l'intelligence des temps, pour savoir ce qu'Israël devait faire » (1 Chroniques 12:32). Accorde-nous cette sagesse précieuse.

Père, dans un monde qui change si vite, nous avons besoin de discernement. Que ton Esprit nous révèle les saisons spirituelles. Que nous sachions quand avancer et quand attendre.

Je prie pour les leaders de l'Église et de nos nations. Accorde-leur une vision claire et une sagesse céleste pour gouverner avec intégrité. Que ceux qui te craignent soient élevés en autorité.

Seigneur, que nous ne soyons pas dépassés par notre époque, mais qu'en toi nous ayons l'intelligence des temps. Que nous saisissions les opportunités que tu places devant nous.

Accorde-nous en ce mardi la sagesse de Salomon pour résoudre les problèmes complexes que nous affrontons. Que ta lumière brille sur notre chemin (Psaume 119:105).

Au nom de Jésus. Amen.`,
    visible: true,
  },
  {
    id: 10,
    fils: "Zabulon",
    jour_semaine: "Mercredi",
    semaine: 2,
    titre: "Zabulon – Mission et témoignage aux nations",
    contenu: `Père, tu as placé Zabulon au bord de la mer, ouvert sur les nations. « Il habitera vers la mer, et son rivage atteindra Sidon » (Genèse 49:13). Que nous soyons un peuple tourné vers les nations.

En ce mercredi, je prie pour la mission. Seigneur, suscite des missionnaires au sein de notre Église. Que le feu de l'évangélisation consume nos cœurs. Que nous ne gardions pas ta bonne nouvelle pour nous seuls.

Ouvre nos yeux sur les personnes autour de nous qui ont besoin de Jésus. Que chaque croyant soit un témoin là où il se trouve : au bureau, à l'école, dans le voisinage.

Père, protège nos frères et sœurs qui servent dans des pays difficiles. Que ta main les couvre et que ta Parole avance rapidement (2 Thessaloniciens 3:1).

Que des nations entières viennent à la lumière de ta gloire (Ésaïe 60:3). Que l'Évangile de ton Royaume soit prêché dans tout le monde en témoignage à toutes les nations.

Maranatha ! Viens, Seigneur Jésus. Amen.`,
    visible: true,
  },
  {
    id: 11,
    fils: "Joseph",
    jour_semaine: "Jeudi",
    semaine: 2,
    titre: "Joseph – Restauration et destin préservé",
    contenu: `Seigneur, l'histoire de Joseph est l'histoire de ta fidélité dans l'épreuve. Vendu, emprisonné, oublié — et pourtant élevé à la droite du pharaon. Tu savais ce que ses frères ne savaient pas : tu avais un plan.

En ce jeudi, je prie pour tous ceux qui traversent une période de fosse ou de prison injuste. Père, ce que l'ennemi a planifié pour leur mal, tourne-le en bien (Genèse 50:20).

Que ceux qui ont été trahis par des proches trouvent en toi leur consolation et leur force. Que le pardon jaillisse de leurs cœurs comme il a jailli du cœur de Joseph.

Je proclame que nos rêves ne mourront pas ! Les rêves que tu as déposés en nous, tu les accompliras en ton temps. Aucune fosse, aucune prison ne peut enterrer ce que tu as prophétisé.

Élève ceux que tu as préparés. Fais de nos épreuves passées les fondations de notre ministère futur. Que la gloire de la fin soit plus grande que le début.

En Jésus, qui est mort et ressuscité pour notre restauration totale. Amen.`,
    visible: true,
  },
  {
    id: 12,
    fils: "Benjamin",
    jour_semaine: "Vendredi",
    semaine: 2,
    titre: "Benjamin – Guerrier bien-aimé du Père",
    contenu: `Père, Benjamin est le fils de la main droite, le bien-aimé (Deutéronome 33:12). Tu as dit : « Qu'il soit en sécurité auprès de l'Éternel ! Qu'il demeure toujours sous sa protection ! » Cette promesse est pour nous aussi.

En ce vendredi, je reçois ta protection sur ma vie et sur ma famille. Que tes anges campent autour de nous (Psaume 34:8). Que rien de mauvais ne nous atteigne.

Seigneur, fais de nous des guerriers courageux. Benjamin était « un loup qui déchire » (Genèse 49:27). Donne à ton Église le courage de déchirer les filets de l'ennemi, d'intercéder avec ferveur, d'avancer sans reculer.

Que nous terminions cette semaine en force. Que les batailles de la semaine ne nous aient pas épuisés mais renforcés. Que nous entrions dans le week-end avec la conscience d'avoir bien combattu.

Père, nous sommes tes bien-aimés. Tu te réjouis sur nous avec chants (Sophonie 3:17). Que nous reposions en ton amour ce soir.

Merci pour cette semaine de prière. En Jésus, notre tout. Amen.`,
    visible: true,
  },
];

// ─── Cultes du dimanche à venir ───────────────────────────────────────────────
export const MOCK_CULTES = [
  {
    id: 1,
    type: "culte",
    titre: "Culte du dimanche matin",
    description: "Venez vivre un temps de louange, d'adoration et de Parole. Tous sont les bienvenus !",
    date_culte: "2026-04-19",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lieu: "Temple ETC – Salle principale",
    predicateur: "Pasteur Isaac Morel",
    theme: "Marcher dans la nouveauté de vie",
    visible: true,
  },
  {
    id: 2,
    type: "culte",
    titre: "Culte du dimanche matin",
    description: "Un culte centré sur la prière et la guérison divine. Venez avec vos besoins.",
    date_culte: "2026-04-26",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lieu: "Temple ETC – Salle principale",
    predicateur: "Pasteur Isaac Morel",
    theme: "Jésus-Christ, le même hier, aujourd'hui et éternellement",
    visible: true,
  },
  {
    id: 3,
    type: "culte",
    titre: "Culte du 1er Mai – Fête du travail",
    description: "Culte spécial pour consacrer notre travail et nos mains à la gloire de Dieu.",
    date_culte: "2026-05-03",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lieu: "Temple ETC – Salle principale",
    predicateur: "Pasteur Isaac Morel",
    theme: "Tout ce que tu fais, fais-le de tout ton cœur",
    visible: true,
  },
  {
    id: 4,
    type: "culte",
    titre: "Culte du dimanche matin",
    description: "Prédication de la Parole et temps de communion fraternelle.",
    date_culte: "2026-05-10",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lieu: "Temple ETC – Salle principale",
    predicateur: "Pasteur Isaac Morel",
    theme: "La puissance de l'Esprit Saint dans notre quotidien",
    visible: true,
  },
  {
    id: 5,
    type: "culte",
    titre: "Culte de Pentecôte",
    description: "Culte spécial en mémoire de l'effusion de l'Esprit Saint sur l'Église primitive.",
    date_culte: "2026-05-17",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lieu: "Temple ETC – Grande salle",
    predicateur: "Pasteur Isaac Morel",
    theme: "Soyez remplis de l'Esprit !",
    visible: true,
  },
  {
    id: 6,
    type: "culte",
    titre: "Culte du dimanche matin",
    description: "Culte avec baptêmes et célébration des nouveaux membres de l'Église.",
    date_culte: "2026-05-24",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lieu: "Temple ETC – Salle principale",
    predicateur: "Pasteur Isaac Morel",
    theme: "Allez, faites de toutes les nations des disciples",
    visible: true,
  },
];

// ─── Anciens cultes (passés avec replay) ──────────────────────────────────────
export const MOCK_ANCIENS_CULTES = [
  {
    id: 101,
    type: "culte",
    titre: "Culte du Dimanche – Résurrection",
    date_culte: "2026-04-06",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lien_live: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    visible: true,
  },
  {
    id: 102,
    type: "culte",
    titre: "Culte du Dimanche – Semaine Sainte",
    date_culte: "2026-03-30",
    heure_debut: "10:00",
    heure_fin: "11:30",
    lien_live: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    visible: true,
  },
];

// ─── Espace élève ─────────────────────────────────────────────────────────────
export const MOCK_ELEVE = {
  id: 'mock-eleve-1',
  auth_user_id: 'mock-auth-1',
  nom: 'Jean-Baptiste Kouassi',
  email: 'eleve@etc.com',
  telephone: '+33 6 12 34 56 78',
  pays: 'France',
  ville: 'Paris',
  date_naissance: '1990-05-15',
  eglise: 'Église Temple de la Célébration',
  formule: 'echelonne',
  statut: 'actif',
  progression_pct: 33,
  date_inscription: '2026-01-15T00:00:00Z',
};

export const MOCK_MODULES_PROGRESSION = [
  { id: 'm1', numero: 1, titre: 'Introduction à la Bible', description: 'Canon, inspiration, herméneutique et méthodes d\'étude de l\'Écriture.', debloque: true, complete: true, date_debloque: '2026-01-20', date_complete: '2026-02-28' },
  { id: 'm2', numero: 2, titre: 'Ancien Testament', description: 'Pentateuque, livres historiques, prophètes et écrits sapientiaux.', debloque: true, complete: false, date_debloque: '2026-03-01', date_complete: null },
  { id: 'm3', numero: 3, titre: 'Nouveau Testament', description: 'Évangiles, Actes, épîtres pauliniennes et littérature johannique.', debloque: false, complete: false, date_debloque: null, date_complete: null },
  { id: 'm4', numero: 4, titre: 'Théologie systématique', description: 'Doctrine de Dieu, christologie, pneumatologie et eschatologie.', debloque: false, complete: false, date_debloque: null, date_complete: null },
  { id: 'm5', numero: 5, titre: 'Histoire de l\'Église', description: 'Des apôtres aux mouvements évangéliques contemporains.', debloque: false, complete: false, date_debloque: null, date_complete: null },
  { id: 'm6', numero: 6, titre: 'Vie chrétienne et ministère', description: 'Spiritualité, leadership serviteur, éthique et appel au service.', debloque: false, complete: false, date_debloque: null, date_complete: null },
];

export const MOCK_EVALUATIONS = [
  { id: 'ev1', module_titre: 'Introduction à la Bible', type: 'partiel', titre: 'Examen mi-module', note: 16.5, note_max: 20, date_eval: '2026-02-10T00:00:00Z', commentaire: 'Très bonne maîtrise des concepts fondamentaux.' },
  { id: 'ev2', module_titre: 'Introduction à la Bible', type: 'final', titre: 'Examen final — Module 1', note: 17, note_max: 20, date_eval: '2026-02-28T00:00:00Z', commentaire: 'Excellent travail, bonne compréhension du canon biblique.' },
  { id: 'ev3', module_titre: 'Ancien Testament', type: 'devoir', titre: 'Devoir : Pentateuque', note: 15, note_max: 20, date_eval: '2026-03-20T00:00:00Z', commentaire: 'Bon devoir, quelques lacunes sur les prophètes mineurs.' },
];

export const MOCK_PAIEMENTS = [
  { id: 'p1', montant: 50, devise: 'EUR', type_paiement: 'mensualite', statut: 'reussi', methode: 'Virement bancaire', reference: 'ETC-2026-001', date_paiement: '2026-01-15T10:00:00Z' },
  { id: 'p2', montant: 50, devise: 'EUR', type_paiement: 'mensualite', statut: 'reussi', methode: 'Virement bancaire', reference: 'ETC-2026-002', date_paiement: '2026-02-15T10:00:00Z' },
  { id: 'p3', montant: 50, devise: 'EUR', type_paiement: 'mensualite', statut: 'reussi', methode: 'Virement bancaire', reference: 'ETC-2026-003', date_paiement: '2026-03-15T10:00:00Z' },
  { id: 'p4', montant: 50, devise: 'EUR', type_paiement: 'mensualite', statut: 'en_attente', methode: 'Virement bancaire', reference: 'ETC-2026-004', date_paiement: '2026-04-15T10:00:00Z' },
];

// ─── Cellules ─────────────────────────────────────────────────────────────────
export const MOCK_CELLULES = [
  {
    id: 10,
    type: "cellule",
    titre: "Cellule Centre-Ville",
    description:
      "Réunion de cellule au cœur de la ville pour les habitants du centre et alentours. Étude de la Parole, partage et prière en petits groupes.",
    date_culte: "2026-04-22",
    heure_debut: "19:00",
    heure_fin: "20:30",
    lieu: "12 rue des Acacias – Salle communautaire",
    predicateur: "Responsable : Frère Emmanuel Diallo",
    theme: "La prière qui déplace les montagnes",
    visible: true,
  },
  {
    id: 11,
    type: "cellule",
    titre: "Cellule Nord – Quartier des Fleurs",
    description:
      "Cellule pour les familles du quartier Nord. Un temps convivial d'étude biblique et d'intercession pour le voisinage.",
    date_culte: "2026-04-23",
    heure_debut: "19:30",
    heure_fin: "21:00",
    lieu: "8 avenue des Rosiers – Domicile de la famille Kouassi",
    predicateur: "Responsable : Sœur Marie-Hélène Kouassi",
    theme: "Construire sa maison sur le Roc",
    visible: true,
  },
  {
    id: 12,
    type: "cellule",
    titre: "Cellule Jeunes Adultes",
    description:
      "Cellule dédiée aux 18-35 ans. Adoration contemporaine, étude des Écritures et témoignages. Un espace pour grandir dans la foi avec sa génération.",
    date_culte: "2026-04-24",
    heure_debut: "20:00",
    heure_fin: "21:30",
    lieu: "Temple ETC – Salle annexe",
    predicateur: "Responsable : Frère Joël Mensah",
    theme: "Être sel et lumière dans notre génération",
    visible: true,
  },
];
