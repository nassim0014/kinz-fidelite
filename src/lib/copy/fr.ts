import { plural } from './plural';

const stamps = (n: number) => plural('fr', n, { one: 'tampon', other: 'tampons' });
const pepins = (n: number) => plural('fr', n, { one: 'pépin', other: 'pépins' });

/**
 * Reference dictionary for the customer screens. The other languages must have exactly this shape.
 * `{reward}` in a template marks where the bold reward label goes.
 */
export const fr = {
  meta: { join: 'Rejoindre', card: 'Ma carte' },
  switcher: 'Langue',

  join: {
    heading: 'Votre carte de fidélité, dans votre téléphone',
    promises: [
      'Un tampon à chaque visite, dès 40 TND d’achat',
      'Des récompenses aux niveaux 2, 3, 5, 7, 11, 13… à vous de deviner la suite',
    ],
    journey: '50 niveaux, et des pépins qui se multiplient en chemin :',
    firstName: 'Prénom',
    phone: 'Téléphone',
    birthday: 'Date d’anniversaire',
    optional: '(facultatif)',
    birthdayHint:
      'Elle débloque des cadeaux le mois de votre anniversaire. Vos données restent chez KINZ.',
    birthdayPlaceholder: 'jj/mm/aaaa',
    pickDate: 'Choisir dans le calendrier',
    submit: 'Créer ma carte',
    submitting: 'Création de la carte…',
  },

  strip: {
    label: 'Les étapes du parcours',
    caption: (stages: string) => `De la graine au figuier d’or : ${stages}.`,
    stageAt: (name: string, level: number) => `${name} au niveau ${level}`,
    /** Short names for the strip, where the full Légende title does not fit. */
    short: {
      1: 'Graine',
      5: 'Pousse',
      8: 'Raquette',
      13: 'Fleur',
      21: 'Figue',
      34: 'Figuier',
      50: 'Légende',
    },
  },

  card: {
    hello: (firstName: string) => `Bonjour ${firstName}`,
    label: 'Ma carte KINZ',
    stampsSr: ' tampons',
    qrLabel: 'QR code de votre carte',
    present: 'Présentez ce code au comptoir après un achat d’au moins 40 TND.',
    stampsLabel: 'Tampons',
    stamp: (n: number, got: boolean, reward: boolean) =>
      `Tampon ${n}${got ? ', obtenu' : ''}${reward ? ', récompense' : ''}`,
    available: '{reward} à utiliser au comptoir.',
    full: 'Carte pleine. Utilisez votre récompense lors de votre visite.',
    next: (n: number) => `Encore ${n} ${stamps(n)} pour {reward}.`,
    orContinue: (n: number) => `Ou continuez : encore ${n} ${stamps(n)} pour {reward}.`,
    allRewards: 'Toutes les récompenses de la carte',
    finePrint:
      'Utiliser une récompense remet la carte à zéro. Produits à l’unité uniquement (hors packs, trios, duos, collections et coffrets). Produit offert d’une valeur maximale de 49 TND.',
    homeScreen:
      'Ajoutez cette page à votre écran d’accueil pour retrouver votre carte en un geste.',
  },

  level: {
    level: (n: number) => `Niveau ${n}`,
    golden: ' ✦ niveau d’or',
    boost: (x: number) => `Pépins ×${x}`,
    progressLabel: 'Progression vers le niveau suivant',
    progress: (total: number, missing: number, next: number) =>
      `${total} ${pepins(total)} au total. Encore ${missing} ${pepins(missing)} avant le niveau ${next}.`,
    max: (total: number) =>
      `${total} pépins au total. Niveau maximal atteint : vous êtes une Légende.`,
  },

  perksList: {
    heading: 'Mes avantages',
    none: 'Votre premier avantage, un échantillon de bienvenue, arrive au prochain niveau.',
    levelShort: (n: number) => `Niv. ${n}`,
    levelLong: (n: number) => `Niveau ${n}`,
    nextAt: (n: number) => `Au niveau ${n} : `,
  },

  how: {
    heading: 'Comment ça marche ?',
    items: [
      {
        term: 'Les tampons',
        text: '1 tampon dès 40 TND d’achat, 2 dès 120 TND, 3 dès 300 TND. Une visite tamponnée par jour.',
      },
      {
        term: 'Les récompenses',
        text: 'Sur la carte, à 3, 5, 7, 11 et 13 tampons. Utilisez-en une tout de suite, ou attendez la suivante, plus généreuse. D’autres vous attendent au fil des niveaux.',
      },
      {
        term: 'Les pépins',
        text: 'Chaque tranche de 40 TND vous rapporte 1 pépin. Les pépins ne s’effacent jamais et font monter votre niveau : passer au niveau suivant coûte autant de pépins que votre niveau actuel.',
      },
      {
        term: 'Les multiplicateurs',
        text: 'Aux niveaux 13, 21 et 34, vos pépins sont multipliés par 2, 3 puis 5.',
      },
    ],
  },

  birthday: {
    month: 'Joyeux mois d’anniversaire ! −20 % sur vos achats chez KINZ jusqu’à la fin du mois.',
    day: 'Joyeux anniversaire ! Aujourd’hui, vos tampons sont doublés, et −20 % sur vos achats.',
  },

  address: {
    heading: 'Vous êtes Figuier',
    intro: 'Où devons-nous livrer vos nouveautés en avant-première ?',
    label: 'Adresse de livraison',
    save: 'Enregistrer l’adresse',
    saving: 'Enregistrement…',
  },

  notFound: {
    heading: 'Carte introuvable',
    text: 'Ce lien ne correspond à aucune carte. Demandez au comptoir de vous renvoyer la vôtre par WhatsApp ou SMS.',
    create: 'Créer une carte',
  },

  errors: {
    INVALID_PHONE: 'Numéro de téléphone invalide (8 chiffres tunisiens)',
    PHONE_TAKEN: 'Ce numéro a déjà une carte. Demandez au comptoir de vous la renvoyer.',
    INVALID_ADDRESS: 'Adresse invalide',
    NOT_FOUND: 'Client introuvable',
    BAD_REQUEST: 'Données invalides',
    NETWORK: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
    INVALID_BIRTHDAY: 'Date invalide (jj/mm/aaaa)',
    UNKNOWN: 'Erreur',
  },

  titles: {
    1: 'Graine',
    5: 'Pousse',
    8: 'Raquette',
    13: 'Fleur',
    21: 'Figue',
    34: 'Figuier',
    50: 'Légende du Figuier d’Or',
  },

  stops: {
    3: '−20 % sur 1 produit',
    5: '−50 % sur 1 produit',
    7: '−50 % sur 2 produits',
    11: '1 produit offert (≤ 49 TND) + 11 pépins',
    13: '1 produit offert (≤ 49 TND) + −50 % sur un 2e + 13 pépins',
  },

  perks: {
    2: 'Échantillon de bienvenue',
    3: 'Un échantillon offert',
    5: 'Huile de figue de barbarie 10 ml offerte',
    7: '−20 % pendant le mois de votre anniversaire',
    11: 'Emballage cadeau offert',
    13: 'Pépins ×2, vous devenez Fleur',
    17: 'Votre carte redémarre à 1 tampon',
    19: 'Tampons doublés le jour de votre anniversaire',
    21: 'Pépins ×3, vous devenez Figue',
    23: 'Votre carte redémarre à 2 tampons',
    29: 'Livraison offerte sur kinzoils.com',
    31: 'Votez pour le prochain produit',
    34: 'Chaque nouveauté livrée gratuitement avant sa sortie',
    37: 'Une carte cadeau à offrir à un proche',
    41: 'Un coffret offert chaque année',
    43: "Visite de l'atelier et rencontre avec les fondateurs",
    47: '−10 % permanent',
    50: 'Votre nom sur le Mur des Légendes + une édition limitée co-créée',
  } as Record<number, string>,

  reminders: {
    reward_waiting: (a: ReminderArgs) =>
      `Bonjour ${a.firstName}, votre récompense KINZ vous attend : ${a.reward}. Passez la récupérer en boutique. Votre carte : ${a.cardUrl}`,
    one_stamp_away: (a: ReminderArgs) =>
      `Bonjour ${a.firstName}, plus qu’un tampon avant ${a.next} sur votre carte KINZ. À bientôt en boutique ! ${a.cardUrl}`,
    birthday_month: (a: ReminderArgs) =>
      `Joyeux mois d’anniversaire ${a.firstName} ! Profitez de −20 % chez KINZ tout ce mois-ci. Votre carte : ${a.cardUrl}`,
    dormant: (a: ReminderArgs) =>
      `Bonjour ${a.firstName}, ça fait un moment ! Vos pépins vous attendent chez KINZ. Votre carte : ${a.cardUrl}`,
  },
  resend: (cardUrl: string) => `Votre carte de fidélité KINZ : ${cardUrl}`,
};

export interface ReminderArgs {
  firstName: string;
  reward?: string;
  next?: string;
  cardUrl: string;
}

export type Copy = typeof fr;
