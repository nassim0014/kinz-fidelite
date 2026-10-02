// À relire par Nassim avant mise en ligne.
// Tounsi (Tunis) en arabizi : 3 = ع, 7 = ح, 9 = ق, 5 = خ, 8 = غ, 2 = ء. Tutoiement.
import type { Copy, ReminderArgs } from './fr';
import { plural } from './plural';

const stamps = (n: number) => plural('tn', n, { one: 'tampon', other: 'tampons' });
const pepins = (n: number) => plural('tn', n, { one: 'pépin', other: 'pépins' });

export const tn = {
  meta: { join: 'Odkhol', card: 'Carte mte3i' },
  switcher: 'Lougha',

  join: {
    heading: 'Carte fidélité mte3ek, fi telifounek',
    promises: [
      'Tampon kol marra tzourna ou techri b 40 TND walla akther',
      'Cadeauwet fil niveaux 2, 3, 5, 7, 11, 13… a3ref inti chnowa ba3d',
    ],
    journey: '50 niveau, w pépins yetdha3fou fi thnitek :',
    firstName: 'Ismek',
    phone: 'Noumrouk',
    birthday: 'Nhar 3id miledek',
    optional: '(ken t7eb)',
    birthdayHint: 'Dabber cadeauwet fi chhar 3id miledek. Ma3loumetek yab9aw 3and KINZ.',
    birthdayPlaceholder: 'jj/mm/aaaa',
    pickDate: '5tar mel calendrier',
    submit: 'A3mel carte mte3ek',
    submitting: '9a3din na3mlou fil carte…',
  },

  strip: {
    label: 'Marahel el thnia',
    caption: (stages: string) => `Mel badhra lel karmous el dhahbi : ${stages}.`,
    stageAt: (name: string, level: number) => `${name} fil niveau ${level}`,
    short: {
      1: 'Badhra',
      5: 'Nabta',
      8: 'Raquette',
      13: 'Nawwara',
      21: 'Karmousa',
      34: 'Chajra',
      50: 'Ostoura',
    },
  },

  card: {
    hello: (firstName: string) => `3aslema ${firstName}`,
    label: 'Carte KINZ mte3ek',
    stampsSr: ' tampons',
    qrLabel: 'QR code mta3 el carte mte3ek',
    present: 'Warri el code hedha fil comptoir ba3d ma techri b 40 TND wala akthar.',
    stampsLabel: 'Tampons',
    stamp: (n: number, got: boolean, reward: boolean) =>
      `Tampon ${n}${got ? ', 5dhitou' : ''}${reward ? ', fih cadeau' : ''}`,
    available: '{reward} tnajem te5dhou fil comptoir.',
    full: 'El carte 3ammret. Ste3mel el cadeau mte3ek fil ziyara el jeya.',
    next: (n: number) => `Ba9ilek ${n} ${stamps(n)} w te5ou {reward}.`,
    orContinue: (n: number) => `Wala kammel : ba9ilek ${n} ${stamps(n)} w te5ou {reward}.`,
    allRewards: 'El cadeauwet el kol mta3 el carte',
    finePrint:
      'Ki testa3mel cadeau, el carte tarja3 lel sfer. Ken el produits bel wa7ed (mouch packs, trios, duos, collections w coffrets). El produit el mahdi ma yfoutch 49 TND.',
    homeScreen: 'Zid el page hedhi 3al écran d’accueil bech tal9a el carte mte3ek fi ramchet 3in.',
  },

  level: {
    level: (n: number) => `Niveau ${n}`,
    golden: ' ✦ niveau dhahbi',
    boost: (x: number) => `Pépins ×${x}`,
    progressLabel: 'Ta9addom lel niveau el jey',
    progress: (total: number, missing: number, next: number) =>
      `${total} ${pepins(total)} el kol. Ba9ilek ${missing} ${pepins(missing)} 9bal el niveau ${next}.`,
    max: (total: number) => `${total} pépins el kol. Wsolt lel niveau el a5ir : inti Ostoura.`,
  },

  perksList: {
    heading: 'El avantages mte3i',
    none: 'Awel avantage mte3ek, échantillon bienvenue, yji fil niveau el jey.',
    levelShort: (n: number) => `Niv. ${n}`,
    levelLong: (n: number) => `Niveau ${n}`,
    nextAt: (n: number) => `Fil niveau ${n} : `,
  },

  how: {
    heading: 'Kifech temchi ?',
    items: [
      {
        term: 'El tampons',
        text: 'Tampon men 40 TND chri, 2 men 120 TND, 3 men 300 TND. Ziyara wa7da fil nhar t7asseb.',
      },
      {
        term: 'El cadeauwet',
        text: 'Fil carte, fi 3, 5, 7, 11 w 13 tampons. Ste3mel wa7ed tawa, wala stanna elli ba3dou, a7sen. W famma cadeauwet o5rin fil niveaux.',
      },
      {
        term: 'El pépins',
        text: 'Kol 40 TND te5ou pépin. El pépins ma yetfas5ouch w ytal3ou niveau mte3ek : bech tet3adda lel niveau el jey, lazmek 9ad niveau mte3ek tawa men pépins.',
      },
      {
        term: 'El multiplicateurs',
        text: 'Fil niveaux 13, 21 w 34, pépins mte3ek yetdha3fou fi 2, ba3d 3, ba3d 5.',
      },
    ],
  },

  birthday: {
    month: '3id miled mabrouk ! −20 % 3la chrayetek 3and KINZ 7atta l5ir chhar.',
    day: '3id miled mabrouk ! Elyoum, el tampons mte3ek doubles, w −20 % 3la chrayetek.',
  },

  address: {
    heading: 'Inti Chajra',
    intro: 'Win nab3thoulek el nouveautés 9bal ma to5rej ?',
    label: 'Adresse el livraison',
    save: 'Sajjel el adresse',
    saving: '9a3din nsajjlou…',
  },

  notFound: {
    heading: 'Carte mouch mawjouda',
    text: 'El lien hedha ma yetla3 3la 7atta carte. Otlob mel comptoir yab3thoulek el carte mte3ek bel WhatsApp wala SMS.',
    create: 'A3mel carte',
  },

  errors: {
    INVALID_PHONE: 'Noumrouk 8alet (8 nwemer twensa)',
    PHONE_TAKEN: 'El noumrou hedha 3andou carte. Otlob mel comptoir yab3thoulek.',
    INVALID_ADDRESS: 'Adresse 8alta',
    NOT_FOUND: 'Client mouch mawjoud',
    BAD_REQUEST: 'Ma3loumet 8alta',
    NETWORK: 'Ma najjamnech net3addaw. Thabbet fil connexion w 3awed.',
    INVALID_BIRTHDAY: 'Date 8alta (jj/mm/aaaa)',
    UNKNOWN: 'Famma mochkla',
  },

  titles: {
    1: 'Badhra',
    5: 'Nabta',
    8: 'Raquette',
    13: 'Nawwara',
    21: 'Karmousa',
    34: 'Chajrat el karmous',
    50: 'Ostourat el karmous el dhahbi',
  },

  stops: {
    3: '−20 % 3la produit',
    5: '−50 % 3la produit',
    7: '−50 % 3la 2 produits',
    11: 'Produit hdiya (≤ 49 TND) + 11 pépins',
    13: 'Produit hdiya (≤ 49 TND) + −50 % 3al theni + 13 pépins',
  },

  perks: {
    2: 'Échantillon bienvenue',
    3: 'Échantillon hdiya',
    5: 'Zit el hindi 10 ml hdiya',
    7: '−20 % fi chhar 3id miledek',
    11: 'Emballage cadeau hdiya',
    13: 'Pépins ×2, wallit Nawwara',
    17: 'El carte mte3ek tabda men tampon',
    19: 'Tampons doubles nhar 3id miledek',
    21: 'Pépins ×3, wallit Karmousa',
    23: 'El carte mte3ek tabda men 2 tampons',
    29: 'Livraison bleche 3la kinzoils.com',
    31: 'Sawwet 3al produit el jey',
    34: 'Kol nouveauté twaslek bleche 9bal ma to5rej',
    37: 'Carte cadeau t3addiha l 7ad 3aziz 3lik',
    41: 'Coffret hdiya kol 3am',
    43: 'Ziyara lel atelier w tet3arref 3al fondateurs',
    47: '−10 % dima',
    50: 'Ismek 3al Mur des Légendes + édition limitée na3mlouha m3ak',
  } as Record<number, string>,

  reminders: {
    reward_waiting: (a: ReminderArgs) =>
      `3aslema ${a.firstName}, el cadeau mte3ek 3and KINZ yestannek : ${a.reward}. 3addi 5oudhou fil boutique. El carte mte3ek : ${a.cardUrl}`,
    one_stamp_away: (a: ReminderArgs) =>
      `3aslema ${a.firstName}, ba9ilek tampon wa7ed w te5ou ${a.next} 3al carte KINZ mte3ek. Netlaw9aw fil boutique ! ${a.cardUrl}`,
    birthday_month: (a: ReminderArgs) =>
      `3id miled mabrouk ${a.firstName} ! −20 % 3and KINZ chhar el kol. El carte mte3ek : ${a.cardUrl}`,
    dormant: (a: ReminderArgs) =>
      `3aslema ${a.firstName}, twa7achnek ! El pépins mte3ek yestannewk 3and KINZ. El carte mte3ek : ${a.cardUrl}`,
  },
  resend: (cardUrl: string) => `Carte fidélité KINZ mte3ek : ${cardUrl}`,
} satisfies Copy;
